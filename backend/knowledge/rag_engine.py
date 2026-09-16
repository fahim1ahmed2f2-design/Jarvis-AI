"""
JARVIS v2.0 — RAG (Retrieval Augmented Generation) Engine
FAISS-based local vector store for document indexing and semantic search.
Falls back to keyword search if faiss/sentence-transformers not installed.
"""
import os
import json
import logging
import hashlib
import math
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger("jarvis.knowledge.rag")


class SimpleRAGEngine:
    """
    A lightweight RAG engine that works in two modes:
    1. FAISS mode (if faiss-cpu + sentence-transformers installed): Full semantic search
    2. TF-IDF fallback mode: Keyword-based chunked search (always available)
    
    No internet or cloud dependencies — 100% local.
    """

    def __init__(self, data_dir: Path, eager_load: bool = False):
        self.data_dir = data_dir
        self.kb_dir = data_dir / "knowledge_base"
        self.kb_dir.mkdir(exist_ok=True, parents=True)
        self.index_file = self.kb_dir / "faiss.index"
        self.meta_file = self.kb_dir / "metadata.json"
        
        self._faiss_available = False
        self._model = None
        self._index = None
        self._chunks_meta: List[Dict[str, Any]] = []
        self._faiss_checked = False
        
        self._load_metadata()
        if eager_load:
            self._ensure_faiss()

    def _ensure_faiss(self):
        """Ensure FAISS and sentence transformers are loaded on demand."""
        if self._faiss_checked:
            return
        self._faiss_checked = True
        self._try_init_faiss()

    def _try_init_faiss(self):
        """Attempt to load FAISS and SentenceTransformers."""
        try:
            import faiss  # type: ignore
            from sentence_transformers import SentenceTransformer  # type: ignore
            
            self._faiss = faiss
            self._model = SentenceTransformer("all-MiniLM-L6-v2")
            
            # Load existing index
            if self.index_file.exists() and self._chunks_meta:
                try:
                    self._index = self._faiss.read_index(str(self.index_file))
                    logger.info(f"[RAG] FAISS index loaded: {len(self._chunks_meta)} chunks")
                except Exception as idx_err:
                    logger.warning(f"[RAG] Could not read existing index ({idx_err}), creating fresh index.")
                    self._index = self._faiss.IndexFlatIP(384)
            else:
                # Create empty index (384 dims for MiniLM)
                self._index = self._faiss.IndexFlatIP(384)
            
            self._faiss_available = True
            logger.info("[RAG] FAISS semantic search: ACTIVE")
        except Exception as e:
            logger.info(f"[RAG] FAISS/SentenceTransformer not available ({e}), using TF-IDF keyword fallback.")
            self._faiss_available = False
            self._model = None
            self._index = None

    def _load_metadata(self):
        """Load chunk metadata from disk."""
        if self.meta_file.exists():
            try:
                with open(self.meta_file, "r", encoding="utf-8") as f:
                    self._chunks_meta = json.load(f)
            except Exception:
                self._chunks_meta = []
        else:
            self._chunks_meta = []

    def _save_metadata(self):
        """Save chunk metadata to disk."""
        with open(self.meta_file, "w", encoding="utf-8") as f:
            json.dump(self._chunks_meta, f, ensure_ascii=False, indent=2)

    def _chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 80) -> List[str]:
        """Split text into overlapping chunks for better retrieval."""
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk_words = words[i:i + chunk_size]
            if len(chunk_words) < 30:  # skip tiny trailing chunks
                break
            chunks.append(" ".join(chunk_words))
        
        return chunks if chunks else [text[:2000]]

    def ingest_document(
        self,
        doc_id: str,
        filename: str,
        content: str,
        file_size_bytes: int = 0
    ) -> Dict[str, Any]:
        """Index a document into the knowledge base."""
        self._ensure_faiss()
        # Remove existing chunks for this doc_id (re-index)
        self._chunks_meta = [c for c in self._chunks_meta if c.get("doc_id") != doc_id]
        
        # Split into chunks
        chunks = self._chunk_text(content)
        new_chunks = []
        
        for i, chunk_text in enumerate(chunks):
            chunk_id = f"{doc_id}_chunk_{i}"
            new_chunks.append({
                "chunk_id": chunk_id,
                "doc_id": doc_id,
                "filename": filename,
                "chunk_index": i,
                "text": chunk_text,
                "char_count": len(chunk_text),
                "indexed_at": datetime.now().isoformat()
            })
        
        if self._faiss_available and self._model is not None and self._index is not None:
            try:
                import numpy as np  # type: ignore
                # Encode and add to FAISS
                texts = [c["text"] for c in new_chunks]
                embeddings = self._model.encode(texts, normalize_embeddings=True)
                if not isinstance(embeddings, np.ndarray):
                    embeddings = np.array(embeddings, dtype=np.float32)
                elif embeddings.dtype != np.float32:
                    embeddings = embeddings.astype(np.float32)
                
                self._index.add(embeddings)
                self._faiss.write_index(self._index, str(self.index_file))
            except Exception as e:
                logger.warning(f"[RAG] Failed to add embeddings to FAISS: {e}")
        
        self._chunks_meta.extend(new_chunks)
        
        # Save document content separately
        doc_content_file = self.kb_dir / f"{doc_id}.json"
        with open(doc_content_file, "w", encoding="utf-8") as f:
            json.dump({
                "doc_id": doc_id,
                "filename": filename,
                "file_size_bytes": file_size_bytes,
                "chunk_count": len(new_chunks),
                "indexed_at": datetime.now().isoformat()
            }, f, indent=2)
        
        self._save_metadata()
        
        return {
            "doc_id": doc_id,
            "filename": filename,
            "chunks_created": len(new_chunks)
        }

    def query(self, query_text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Semantic or keyword search across indexed documents."""
        if not self._chunks_meta:
            return []
        
        self._ensure_faiss()
        if self._faiss_available and self._model is not None and self._index is not None:
            try:
                return self._faiss_query(query_text, top_k)
            except Exception as e:
                logger.warning(f"[RAG] FAISS query failed ({e}), falling back to keyword search.")
                return self._keyword_query(query_text, top_k)
        else:
            return self._keyword_query(query_text, top_k)

    def _faiss_query(self, query_text: str, top_k: int) -> List[Dict[str, Any]]:
        """FAISS semantic search with safe fallback."""
        if self._model is None or self._index is None or not self._faiss_available:
            return self._keyword_query(query_text, top_k)
        
        import numpy as np  # type: ignore
        query_vec = self._model.encode([query_text], normalize_embeddings=True)
        if not isinstance(query_vec, np.ndarray):
            query_vec = np.array(query_vec, dtype=np.float32)
        elif query_vec.dtype != np.float32:
            query_vec = query_vec.astype(np.float32)
        
        k = min(top_k, len(self._chunks_meta))
        scores, indices = self._index.search(query_vec, k)
        
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0 or idx >= len(self._chunks_meta):
                continue
            meta = self._chunks_meta[idx]
            results.append({
                "doc_id": meta["doc_id"],
                "filename": meta["filename"],
                "chunk": meta["text"][:600],
                "relevance_score": float(score),
                "source": f"Document: {meta['filename']} (chunk {meta['chunk_index'] + 1})",
                "search_type": "semantic"
            })
        
        return results

    def _keyword_query(self, query_text: str, top_k: int) -> List[Dict[str, Any]]:
        """TF-IDF inspired keyword search fallback."""
        query_words = set(query_text.lower().split())
        scored = []
        
        for chunk in self._chunks_meta:
            text_lower = chunk["text"].lower()
            text_words = text_lower.split()
            text_word_set = set(text_words)
            
            # TF-like score: fraction of query words found
            matches = query_words.intersection(text_word_set)
            if not matches:
                continue
            
            tf_score = len(matches) / len(query_words)
            
            # Boost for exact phrase match
            phrase_bonus = 1.5 if query_text.lower() in text_lower else 1.0
            
            score = tf_score * phrase_bonus
            scored.append((score, chunk))
        
        scored.sort(key=lambda x: x[0], reverse=True)
        
        results = []
        for score, meta in scored[:top_k]:
            results.append({
                "doc_id": meta["doc_id"],
                "filename": meta["filename"],
                "chunk": meta["text"][:600],
                "relevance_score": round(score, 3),
                "source": f"Document: {meta['filename']}",
                "search_type": "keyword"
            })
        
        return results

    def list_documents(self) -> List[Dict[str, Any]]:
        """List all unique indexed documents."""
        seen = {}
        for chunk in self._chunks_meta:
            doc_id = chunk["doc_id"]
            if doc_id not in seen:
                seen[doc_id] = {
                    "doc_id": doc_id,
                    "filename": chunk["filename"],
                    "chunk_count": 0,
                    "indexed_at": chunk.get("indexed_at", "")
                }
            seen[doc_id]["chunk_count"] += 1
        
        return list(seen.values())

    def delete_document(self, doc_id: str) -> bool:
        """Remove a document from the knowledge base."""
        initial_count = len(self._chunks_meta)
        self._chunks_meta = [c for c in self._chunks_meta if c.get("doc_id") != doc_id]
        
        if len(self._chunks_meta) == initial_count:
            return False  # Nothing deleted
        
        # Delete content file
        doc_file = self.kb_dir / f"{doc_id}.json"
        if doc_file.exists():
            doc_file.unlink()
        
        # Rebuild FAISS index from scratch
        if self._faiss_available and self._model is not None and self._index is not None:
            try:
                import numpy as np  # type: ignore
                self._index = self._faiss.IndexFlatIP(384)
                if self._chunks_meta:
                    texts = [c["text"] for c in self._chunks_meta]
                    embeddings = self._model.encode(texts, normalize_embeddings=True)
                    if not isinstance(embeddings, np.ndarray):
                        embeddings = np.array(embeddings, dtype=np.float32)
                    elif embeddings.dtype != np.float32:
                        embeddings = embeddings.astype(np.float32)
                    self._index.add(embeddings)
                self._faiss.write_index(self._index, str(self.index_file))
            except Exception as e:
                logger.warning(f"[RAG] Failed to rebuild FAISS index: {e}")
        
        self._save_metadata()
        return True

    def clear_all(self):
        """Clear entire knowledge base."""
        self._chunks_meta = []
        
        if self._faiss_available and self._model is not None and self._faiss is not None:
            try:
                self._index = self._faiss.IndexFlatIP(384)
            except Exception:
                self._index = None
            if self.index_file.exists():
                try:
                    self.index_file.unlink()
                except Exception:
                    pass
        
        # Remove all doc files
        for f in self.kb_dir.glob("*.json"):
            f.unlink()
        
        self._save_metadata()

    def get_status(self) -> Dict[str, Any]:
        """Get knowledge base statistics."""
        docs = self.list_documents()
        index_size_mb = 0.0
        
        if self.index_file.exists():
            index_size_mb = round(self.index_file.stat().st_size / (1024 * 1024), 2)
        
        return {
            "document_count": len(docs),
            "chunk_count": len(self._chunks_meta),
            "index_size_mb": index_size_mb,
            "search_mode": "semantic" if self._faiss_available else "keyword",
            "last_updated": self._chunks_meta[-1].get("indexed_at") if self._chunks_meta else None
        }


# Singleton instance
def _create_rag_engine():
    from backend.config import DATA_DIR
    return SimpleRAGEngine(data_dir=DATA_DIR)


try:
    rag_engine = _create_rag_engine()
except Exception as e:
    logger.warning(f"[RAG] Could not initialize: {e}")
    rag_engine = None
