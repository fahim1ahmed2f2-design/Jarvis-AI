import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen, Upload, Search, Trash2, X, FileText, File, 
  CheckCircle, AlertCircle, Loader, Database, Sparkles,
  ChevronDown, ChevronUp, ExternalLink
} from 'lucide-react';
import { KnowledgeDocument, KnowledgeQueryResult } from '../../types/jarvis';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryColor: string;
}

const BASE_URL = 'http://localhost:8000/api';

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  primaryColor
}) => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [queryText, setQueryText] = useState('');
  const [queryResults, setQueryResults] = useState<KnowledgeQueryResult[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'search'>('documents');
  const [expandedResult, setExpandedResult] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statusRes, docsRes] = await Promise.all([
        fetch(`${BASE_URL}/knowledge/status`),
        fetch(`${BASE_URL}/knowledge/documents`)
      ]);
      if (statusRes.ok) setStatus(await statusRes.json());
      if (docsRes.ok) {
        const data = await docsRes.json();
        setDocuments(data.documents || []);
      }
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${BASE_URL}/knowledge/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (res.ok) {
        setUploadMessage({ type: 'success', text: data.message || `'${file.name}' indexed successfully.` });
        fetchData();
      } else {
        setUploadMessage({ type: 'error', text: data.detail || 'Upload failed.' });
      }
    } catch (err: any) {
      setUploadMessage({ type: 'error', text: `Error: ${err.message}` });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleQuery = async () => {
    if (!queryText.trim()) return;
    setIsQuerying(true);
    setQueryResults([]);
    try {
      const res = await fetch(`${BASE_URL}/knowledge/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText.trim(), top_k: 6 })
      });
      const data = await res.json();
      setQueryResults(data.results || []);
    } catch { /* non-fatal */ }
    finally { setIsQuerying(false); }
  };

  const handleDeleteDoc = async (docId: string, filename: string) => {
    if (!confirm(`Delete "${filename}" from knowledge base?`)) return;
    try {
      await fetch(`${BASE_URL}/knowledge/documents/${docId}`, { method: 'DELETE' });
      setDocuments(prev => prev.filter(d => d.doc_id !== docId));
    } catch { /* non-fatal */ }
  };

  if (!isOpen) return null;

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <File size={14} color="#ef4444" />;
    if (ext === 'docx') return <File size={14} color="#3b82f6" />;
    if (ext === 'md') return <File size={14} color={primaryColor} />;
    return <FileText size={14} color="rgba(255,255,255,0.6)" />;
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 5000,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: '700px', maxWidth: '95vw',
        maxHeight: '88vh',
        background: 'linear-gradient(135deg, rgba(3, 10, 24, 0.97) 0%, rgba(6, 18, 36, 0.97) 100%)',
        border: `1px solid ${primaryColor}40`,
        borderRadius: '12px',
        boxShadow: `0 0 60px ${primaryColor}25, 0 24px 60px rgba(0,0,0,0.7)`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid rgba(255,255,255,0.08)`,
          background: `linear-gradient(90deg, ${primaryColor}10, transparent)`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={18} color={primaryColor} />
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: primaryColor, letterSpacing: '0.1em' }}>
                KNOWLEDGE BASE
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '9.5px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginTop: '1px' }}>
                RAG INTELLIGENCE LIBRARY // {status?.document_count ?? 0} DOCS // {status?.chunk_count ?? 0} CHUNKS
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Status badge */}
            <div style={{
              fontFamily: 'monospace', fontSize: '9px', fontWeight: 700,
              padding: '3px 8px', borderRadius: '4px',
              border: `1px solid ${status?.status === 'ready' ? '#10b98140' : '#f59e0b40'}`,
              color: status?.status === 'ready' ? '#10b981' : '#f59e0b',
              background: status?.status === 'ready' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)'
            }}>
              {status?.search_mode?.toUpperCase() || 'KEYWORD'} SEARCH
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {(['documents', 'search'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '10px 20px',
                fontFamily: 'monospace', fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: activeTab === tab ? primaryColor : 'rgba(255,255,255,0.4)',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeTab === tab ? `2px solid ${primaryColor}` : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {tab === 'documents' ? <><Database size={11} style={{ marginRight: 5 }} /> Documents</> : <><Search size={11} style={{ marginRight: 5 }} /> Search</>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              {/* Upload Section */}
              <div style={{
                padding: '14px',
                border: `1px dashed ${primaryColor}40`,
                borderRadius: '8px',
                marginBottom: '16px',
                background: `${primaryColor}05`,
                textAlign: 'center'
              }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="kb-file-upload"
                  accept=".txt,.md,.pdf,.docx"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <label htmlFor="kb-file-upload" style={{ cursor: 'pointer', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  {isUploading ? (
                    <Loader size={24} color={primaryColor} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <Upload size={24} color={primaryColor} />
                  )}
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: primaryColor }}>
                    {isUploading ? 'INDEXING DOCUMENT...' : 'CLICK TO UPLOAD DOCUMENT'}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>
                    Supports: .txt, .md, .pdf, .docx — Max 10MB
                  </span>
                </label>

                {uploadMessage && (
                  <div style={{
                    marginTop: '10px', padding: '8px 12px', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    fontFamily: 'monospace', fontSize: '10px',
                    color: uploadMessage.type === 'success' ? '#10b981' : '#ef4444',
                    background: uploadMessage.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${uploadMessage.type === 'success' ? '#10b98130' : '#ef444430'}`
                  }}>
                    {uploadMessage.type === 'success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                    {uploadMessage.text}
                  </div>
                )}
              </div>

              {/* Document List */}
              {documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                  <BookOpen size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: 12, margin: '0 auto 12px' }} />
                  <div>No documents indexed yet.</div>
                  <div style={{ marginTop: 6, fontSize: '10px' }}>Upload a document above to begin.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {documents.map(doc => (
                    <div key={doc.doc_id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.03)',
                      border: `1px solid rgba(255,255,255,0.07)`,
                      borderRadius: '8px',
                      transition: 'border-color 0.2s'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {getFileIcon(doc.filename)}
                        <div>
                          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                            {doc.filename}
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                            {doc.chunk_count} chunks · {new Date(doc.indexed_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDoc(doc.doc_id, doc.filename)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.5)', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                        title="Remove document"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div>
              {/* Query Input */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="text"
                  value={queryText}
                  onChange={e => setQueryText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleQuery()}
                  placeholder="Ask a question or enter search terms..."
                  style={{
                    flex: 1, background: 'rgba(0, 20, 40, 0.8)',
                    border: `1px solid ${primaryColor}40`,
                    borderRadius: '8px', padding: '10px 14px',
                    fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.85)',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleQuery}
                  disabled={isQuerying || !queryText.trim()}
                  style={{
                    padding: '10px 18px', borderRadius: '8px',
                    background: primaryColor, color: '#030712',
                    fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    opacity: isQuerying || !queryText.trim() ? 0.5 : 1
                  }}
                >
                  {isQuerying ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={13} />}
                  SEARCH
                </button>
              </div>

              {/* Results */}
              {isQuerying && (
                <div style={{ textAlign: 'center', padding: '30px', fontFamily: 'monospace', fontSize: '11px', color: primaryColor }}>
                  <Sparkles size={20} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px', animation: 'pulse 1.5s infinite' }} />
                  Searching knowledge base...
                </div>
              )}

              {!isQuerying && queryResults.length === 0 && queryText && (
                <div style={{ textAlign: 'center', padding: '30px', fontFamily: 'monospace', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                  No results found for "{queryText}". Try different keywords.
                </div>
              )}

              {queryResults.map((result, idx) => (
                <div key={idx} style={{
                  marginBottom: '10px', padding: '12px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${primaryColor}20`,
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: primaryColor, fontWeight: 700 }}>
                      {result.source}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontFamily: 'monospace', fontSize: '9px',
                        padding: '2px 6px', borderRadius: '4px',
                        background: `${primaryColor}15`, color: primaryColor,
                        border: `1px solid ${primaryColor}30`
                      }}>
                        {(result.relevance_score * 100).toFixed(0)}%
                      </span>
                      <button
                        onClick={() => setExpandedResult(expandedResult === idx ? null : idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
                      >
                        {expandedResult === idx ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'monospace', fontSize: '10.5px', color: 'rgba(255,255,255,0.7)',
                    lineHeight: '1.5',
                    maxHeight: expandedResult === idx ? '300px' : '60px',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease'
                  }}>
                    {result.chunk}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.25)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span>JARVIS RAG ENGINE v2.0 // {status?.search_mode === 'semantic' ? 'FAISS SEMANTIC' : 'KEYWORD'} MODE</span>
          <span>{status?.index_size_mb ? `${status.index_size_mb} MB` : 'INDEX READY'}</span>
        </div>
      </div>
    </div>
  );
};
