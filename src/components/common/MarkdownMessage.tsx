import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Image as ImageIcon, Maximize2, X } from 'lucide-react';

interface MarkdownMessageProps {
  content: string;
  primaryColor?: string;
  isUser?: boolean;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({
  content,
  primaryColor = '#00f0ff',
  isUser = false
}) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Helper to parse inline styles (bold, italic, code, links)
  const parseInline = (text: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // 1. Inline code: `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        nodes.push(
          <code
            key={`code-${keyIdx++}`}
            className="inline-code-badge"
            style={{
              background: 'rgba(0, 240, 255, 0.12)',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              color: primaryColor,
              padding: '1px 5px',
              borderRadius: '3px',
              fontSize: '0.85em',
              fontFamily: 'monospace'
            }}
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // 2. Bold text: **bold**
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        nodes.push(
          <strong
            key={`bold-${keyIdx++}`}
            style={{
              color: '#ffffff',
              fontWeight: 700,
              letterSpacing: '0.01em'
            }}
          >
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // 3. Italic text: *italic* or _italic_
      const italicMatch = remaining.match(/^(\*|_)([^*_]+)\1/);
      if (italicMatch) {
        nodes.push(
          <em key={`italic-${keyIdx++}`} style={{ color: '#cbd5e1', fontStyle: 'italic' }}>
            {italicMatch[2]}
          </em>
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // 4. Markdown Links: [text](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        nodes.push(
          <a
            key={`link-${keyIdx++}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: primaryColor,
              textDecoration: 'none',
              borderBottom: `1px dashed ${primaryColor}60`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            <span>{linkMatch[1]}</span>
            <ExternalLink size={10} style={{ opacity: 0.8 }} />
          </a>
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // Regular text slice up to next token
      const nextSpecial = remaining.search(/[`*_[\]]/);
      if (nextSpecial === -1) {
        nodes.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        nodes.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        nodes.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return nodes;
  };

  // Render message body blocks
  const renderBlocks = () => {
    const rawLines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let codeBlockCount = 0;

    while (i < rawLines.length) {
      const line = rawLines[i];
      const trimmed = line.trim();

      // Empty line
      if (!trimmed) {
        i++;
        continue;
      }

      // 1. Code Blocks (```lang ... ```)
      if (trimmed.startsWith('```')) {
        const lang = trimmed.slice(3).trim() || 'code';
        const codeLines: string[] = [];
        i++;
        while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
          codeLines.push(rawLines[i]);
          i++;
        }
        i++; // skip closing ```

        const fullCode = codeLines.join('\n');
        const cIndex = codeBlockCount++;

        elements.push(
          <div
            key={`code-block-${cIndex}`}
            style={{
              margin: '8px 0',
              borderRadius: '6px',
              overflow: 'hidden',
              background: 'rgba(5, 12, 22, 0.9)',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 10px',
                background: 'rgba(0, 240, 255, 0.08)',
                borderBottom: '1px solid rgba(0, 240, 255, 0.15)',
                fontSize: '10px',
                fontFamily: 'monospace',
                color: 'rgba(255, 255, 255, 0.6)'
              }}
            >
              <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: primaryColor }}>
                {lang}
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(fullCode, cIndex)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'transparent',
                  border: 'none',
                  color: copiedCodeIndex === cIndex ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '3px'
                }}
                title="Copy code"
              >
                {copiedCodeIndex === cIndex ? (
                  <>
                    <Check size={11} />
                    <span>COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} />
                    <span>COPY</span>
                  </>
                )}
              </button>
            </div>
            <pre
              style={{
                margin: 0,
                padding: '10px 12px',
                overflowX: 'auto',
                fontSize: '11.5px',
                lineHeight: 1.45,
                color: '#e2e8f0',
                fontFamily: "'Fira Code', 'Consolas', monospace"
              }}
            >
              <code>{fullCode}</code>
            </pre>
          </div>
        );
        continue;
      }

      // 2. Images: ![alt](url)
      const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imgMatch) {
        const altText = imgMatch[1] || 'Image';
        const imgUrl = imgMatch[2];
        const currentGroup = [{ alt: altText, url: imgUrl }];

        // Check if consecutive lines are also images to render as a gallery grid
        let nextIdx = i + 1;
        while (nextIdx < rawLines.length) {
          const nextTrimmed = rawLines[nextIdx].trim();
          if (!nextTrimmed) {
            nextIdx++;
            continue;
          }
          const nextImg = nextTrimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
          if (nextImg) {
            currentGroup.push({ alt: nextImg[1] || 'Image', url: nextImg[2] });
            nextIdx++;
          } else {
            break;
          }
        }
        i = nextIdx;

        elements.push(
          <div
            key={`img-group-${i}`}
            style={{
              display: 'grid',
              gridTemplateColumns: currentGroup.length === 1 ? '1fr' : currentGroup.length === 2 ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '10px',
              margin: '12px 0'
            }}
          >
            {currentGroup.map((img, imgIdx) => (
              <div
                key={imgIdx}
                style={{
                  position: 'relative',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(0, 240, 255, 0.25)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 240, 255, 0.1)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
                onClick={() => setLightboxImg(img.url)}
                title="Click to view full image"
              >
                <img
                  src={img.url}
                  alt={img.alt}
                  loading="lazy"
                  style={{
                    width: '100%',
                    maxHeight: currentGroup.length === 1 ? '340px' : '220px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={(e) => {
                    // Gracefully hide broken image
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '4px 8px',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '9.5px',
                    color: '#e2e8f0',
                    fontFamily: 'monospace'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {img.alt || 'Visual Dossier Asset'}
                  </span>
                  <Maximize2 size={10} style={{ color: primaryColor, flexShrink: 0 }} />
                </div>
              </div>
            ))}
          </div>
        );
        continue;
      }

      // 3. Headers: #, ##, ###
      if (trimmed.startsWith('#')) {
        const headerLevel = trimmed.match(/^#+/)?.[0].length || 1;
        const headerText = trimmed.replace(/^#+\s*/, '');

        if (headerLevel === 1) {
          elements.push(
            <h1
              key={`h1-${i}`}
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: '#ffffff',
                margin: '14px 0 6px 0',
                letterSpacing: '0.02em',
                borderBottom: `1px solid ${primaryColor}40`,
                paddingBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {parseInline(headerText)}
            </h1>
          );
        } else if (headerLevel === 2) {
          elements.push(
            <h2
              key={`h2-${i}`}
              style={{
                fontSize: '1.02rem',
                fontWeight: 700,
                color: '#f8fafc',
                margin: '12px 0 6px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {parseInline(headerText)}
            </h2>
          );
        } else {
          // Level 3 (###) with stylish badge styling and gradient bar
          elements.push(
            <div
              key={`h3-block-${i}`}
              style={{
                margin: '12px 0 6px 0',
                paddingTop: '2px'
              }}
            >
              <h3
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: primaryColor,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  letterSpacing: '0.01em'
                }}
              >
                {parseInline(headerText)}
              </h3>
              <div
                style={{
                  height: '1px',
                  background: `linear-gradient(to right, ${primaryColor}80, ${primaryColor}10, transparent)`,
                  marginTop: '4px',
                  marginBottom: '6px'
                }}
              />
            </div>
          );
        }
        i++;
        continue;
      }

      // 4. Horizontal Dividers: --- or ***
      if (/^(\-\-\-|\*\*\*|___)$/.test(trimmed)) {
        elements.push(
          <div
            key={`hr-${i}`}
            style={{
              height: '1px',
              background: 'rgba(255, 255, 255, 0.1)',
              margin: '12px 0'
            }}
          />
        );
        i++;
        continue;
      }

      // 5. Blockquotes: > quote
      if (trimmed.startsWith('>')) {
        const quoteText = trimmed.replace(/^>\s*/, '');
        elements.push(
          <div
            key={`quote-${i}`}
            style={{
              margin: '6px 0',
              padding: '6px 12px',
              borderLeft: `3px solid ${primaryColor}`,
              background: 'rgba(0, 240, 255, 0.05)',
              borderRadius: '0 4px 4px 0',
              color: '#cbd5e1',
              fontSize: '0.85rem',
              fontStyle: 'italic'
            }}
          >
            {parseInline(quoteText)}
          </div>
        );
        i++;
        continue;
      }

      // 6. Bullet Lists: * item or - item
      if (/^[\*\-]\s+/.test(trimmed)) {
        const listItems: string[] = [];
        while (i < rawLines.length && /^[\*\-]\s+/.test(rawLines[i].trim())) {
          listItems.push(rawLines[i].trim().replace(/^[\*\-]\s+/, ''));
          i++;
        }

        elements.push(
          <div
            key={`bullet-list-${i}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              margin: '6px 0 8px 4px'
            }}
          >
            {listItems.map((item, lIdx) => (
              <div
                key={lIdx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '7px',
                  fontSize: '0.86rem',
                  lineHeight: 1.55,
                  color: '#e2e8f0'
                }}
              >
                <span
                  style={{
                    color: primaryColor,
                    fontSize: '11px',
                    lineHeight: '1.5rem',
                    flexShrink: 0
                  }}
                >
                  ◆
                </span>
                <div style={{ flex: 1 }}>{parseInline(item)}</div>
              </div>
            ))}
          </div>
        );
        continue;
      }

      // 7. Numbered Lists: 1. item, 2. item
      if (/^\d+\.\s+/.test(trimmed)) {
        const numItems: { num: string; text: string }[] = [];
        while (i < rawLines.length && /^\d+\.\s+/.test(rawLines[i].trim())) {
          const m = rawLines[i].trim().match(/^(\d+)\.\s+(.*)$/);
          if (m) {
            numItems.push({ num: m[1], text: m[2] });
          }
          i++;
        }

        elements.push(
          <div
            key={`num-list-${i}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              margin: '6px 0 8px 4px'
            }}
          >
            {numItems.map((item, lIdx) => (
              <div
                key={lIdx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '0.86rem',
                  lineHeight: 1.55,
                  color: '#e2e8f0'
                }}
              >
                <span
                  style={{
                    background: 'rgba(0, 240, 255, 0.12)',
                    border: `1px solid ${primaryColor}40`,
                    color: primaryColor,
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: '2px',
                    fontFamily: 'monospace'
                  }}
                >
                  {item.num}
                </span>
                <div style={{ flex: 1 }}>{parseInline(item.text)}</div>
              </div>
            ))}
          </div>
        );
        continue;
      }

      // 8. Standard Paragraph
      elements.push(
        <p
          key={`p-${i}`}
          style={{
            margin: '4px 0 6px 0',
            fontSize: isUser ? '0.88rem' : '0.86rem',
            lineHeight: 1.6,
            color: isUser ? '#ffffff' : '#f1f5f9',
            wordBreak: 'break-word',
            letterSpacing: '0.01em'
          }}
        >
          {parseInline(trimmed)}
        </p>
      );
      i++;
    }

    return elements;
  };

  return (
    <div
      className="markdown-rich-container"
      style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
      }}
    >
      {renderBlocks()}

      {/* Lightbox Modal for Zooming Images */}
      {lightboxImg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setLightboxImg(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 0 40px rgba(0, 240, 255, 0.3)',
              border: `1.5px solid ${primaryColor}`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImg(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#ffffff',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              <X size={16} />
            </button>
            <img
              src={lightboxImg}
              alt="Preview"
              style={{
                maxWidth: '85vw',
                maxHeight: '85vh',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
