"""
JARVIS v2.0 — Knowledge Base API (RAG)
Document ingestion, semantic search, and context retrieval using FAISS.
Supports PDF, DOCX, TXT file uploads.
"""
import os
import json
import logging
import hashlib
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from pydantic import BaseModel

logger = logging.getLogger("jarvis.api.knowledge")

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


class KnowledgeQueryRequest(BaseModel):
    query: str
    top_k: int = 5


class KnowledgeDeleteRequest(BaseModel):
    doc_id: str


def _get_rag_engine():
    """Lazy import to avoid startup failures if dependencies missing."""
    try:
        from backend.knowledge.rag_engine import rag_engine
        return rag_engine
    except ImportError as e:
        logger.warning(f"RAG engine not available: {e}")
        return None


@router.get("/status")
async def get_knowledge_status():
    """Get knowledge base status and document count."""
    engine = _get_rag_engine()
    if not engine:
        return {
            "status": "unavailable",
            "message": "RAG engine not initialized. Install: pip install faiss-cpu sentence-transformers",
            "document_count": 0,
            "chunk_count": 0
        }
    
    info = engine.get_status()
    return {
        "status": "ready",
        "document_count": info.get("document_count", 0),
        "chunk_count": info.get("chunk_count", 0),
        "index_size_mb": info.get("index_size_mb", 0),
        "supported_formats": ["PDF", "DOCX", "TXT", "MD"],
        "last_updated": info.get("last_updated")
    }


@router.get("/documents")
async def list_documents():
    """List all indexed documents."""
    engine = _get_rag_engine()
    if not engine:
        return {"documents": [], "total": 0}
    
    docs = engine.list_documents()
    return {"documents": docs, "total": len(docs)}


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload and index a document into the knowledge base.
    Supports: .txt, .md, .pdf (if pypdf installed), .docx (if python-docx installed)
    """
    engine = _get_rag_engine()
    
    # Even without full engine, we can do basic TXT/MD ingestion
    filename = file.filename or "unknown"
    ext = Path(filename).suffix.lower()
    
    if ext not in [".txt", ".md", ".pdf", ".docx"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Supported: .txt, .md, .pdf, .docx"
        )
    
    # Read content
    raw_bytes = await file.read()
    if len(raw_bytes) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=413, detail="File too large. Maximum 10MB.")
    
    # Extract text
    text_content = ""
    try:
        if ext in [".txt", ".md"]:
            text_content = raw_bytes.decode("utf-8", errors="replace")
        elif ext == ".pdf":
            try:
                import io
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
                text_content = "\n".join(page.extract_text() or "" for page in reader.pages)
            except ImportError:
                raise HTTPException(
                    status_code=422,
                    detail="PDF support requires: pip install pypdf. TXT/MD files work without it."
                )
        elif ext == ".docx":
            try:
                import io
                import docx
                doc = docx.Document(io.BytesIO(raw_bytes))
                text_content = "\n".join(p.text for p in doc.paragraphs)
            except ImportError:
                raise HTTPException(
                    status_code=422,
                    detail="DOCX support requires: pip install python-docx. TXT/MD files work without it."
                )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {e}")
    
    if not text_content.strip():
        raise HTTPException(status_code=422, detail="Document appears to be empty or unreadable.")
    
    # Generate doc ID
    doc_id = hashlib.md5(f"{filename}:{len(raw_bytes)}".encode()).hexdigest()[:12]
    
    if engine:
        result = engine.ingest_document(
            doc_id=doc_id,
            filename=filename,
            content=text_content,
            file_size_bytes=len(raw_bytes)
        )
        return {
            "status": "success",
            "doc_id": doc_id,
            "filename": filename,
            "chunks_created": result.get("chunks_created", 0),
            "char_count": len(text_content),
            "message": f"Document '{filename}' successfully indexed with {result.get('chunks_created', 0)} semantic chunks."
        }
    else:
        # Fallback: save to data dir as plaintext
        from backend.config import DATA_DIR
        kb_dir = DATA_DIR / "knowledge_base"
        kb_dir.mkdir(exist_ok=True)
        
        doc_file = kb_dir / f"{doc_id}.json"
        doc_data = {
            "doc_id": doc_id,
            "filename": filename,
            "content": text_content,
            "indexed_at": datetime.now().isoformat(),
            "char_count": len(text_content)
        }
        with open(doc_file, "w", encoding="utf-8") as f:
            json.dump(doc_data, f, ensure_ascii=False, indent=2)
        
        return {
            "status": "success",
            "doc_id": doc_id,
            "filename": filename,
            "chunks_created": 1,
            "char_count": len(text_content),
            "message": f"Document '{filename}' saved (basic mode). Install faiss-cpu for semantic search."
        }


@router.post("/query")
async def query_knowledge_base(req: KnowledgeQueryRequest):
    """
    Semantic search across indexed documents.
    Returns relevant text chunks with source references.
    """
    engine = _get_rag_engine()
    
    if engine:
        results = engine.query(req.query, top_k=req.top_k)
        return {
            "query": req.query,
            "results": results,
            "total": len(results)
        }
    else:
        # Fallback: keyword search in saved documents
        from backend.config import DATA_DIR
        kb_dir = DATA_DIR / "knowledge_base"
        if not kb_dir.exists():
            return {"query": req.query, "results": [], "total": 0}
        
        results = []
        query_lower = req.query.lower()
        
        for doc_file in kb_dir.glob("*.json"):
            try:
                with open(doc_file, "r", encoding="utf-8") as f:
                    doc = json.load(f)
                
                content = doc.get("content", "")
                if query_lower in content.lower():
                    # Find relevant paragraph
                    paragraphs = content.split("\n\n")
                    relevant = [p.strip() for p in paragraphs if query_lower in p.lower()][:2]
                    
                    if relevant:
                        results.append({
                            "doc_id": doc.get("doc_id"),
                            "filename": doc.get("filename"),
                            "chunk": " ".join(relevant)[:500],
                            "relevance_score": 0.75,
                            "source": f"Document: {doc.get('filename')}"
                        })
            except Exception:
                pass
        
        results = results[:req.top_k]
        return {
            "query": req.query,
            "results": results,
            "total": len(results),
            "note": "Basic keyword search (install faiss-cpu for semantic search)"
        }


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Remove a document from the knowledge base."""
    engine = _get_rag_engine()
    
    if engine:
        success = engine.delete_document(doc_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found.")
        return {"status": "success", "deleted": doc_id}
    else:
        from backend.config import DATA_DIR
        doc_file = DATA_DIR / "knowledge_base" / f"{doc_id}.json"
        if not doc_file.exists():
            raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found.")
        doc_file.unlink()
        return {"status": "success", "deleted": doc_id}


@router.delete("/documents")
async def clear_all_documents():
    """Clear entire knowledge base."""
    engine = _get_rag_engine()
    
    if engine:
        engine.clear_all()
    else:
        from backend.config import DATA_DIR
        kb_dir = DATA_DIR / "knowledge_base"
        if kb_dir.exists():
            import shutil
            shutil.rmtree(kb_dir)
            kb_dir.mkdir(exist_ok=True)
    
    return {"status": "success", "message": "Knowledge base cleared."}
