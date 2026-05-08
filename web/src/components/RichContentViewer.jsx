import React, { useMemo, useEffect, useRef, useState, useCallback, useContext } from 'react';
import DOMPurify from 'dompurify';
import katex from 'katex';
import { Volume2, Square } from 'lucide-react';
import { ReadingPrefsContext } from '../contexts/ReadingPrefsContext';

/* --- DOMPurify Configuration ---------------------------------------------- */

const purifyConfig = {
  ALLOWED_TAGS: ['p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'div', 'span', 'sub', 'sup', 'del', 's', 'figure', 'figcaption', 'video', 'audio', 'source', 'iframe', 'caption'],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel', 'style', 'width', 'height', 'colspan', 'rowspan', 'controls', 'allowfullscreen', 'frameborder', 'scope', 'aria-label', 'role', 'data-*', 'contenteditable', 'data-latex'],
  ALLOW_DATA_ATTR: true,
  ADD_ATTR: ['target'],
};

/**
 * Sanitize an HTML string using DOMPurify.
 * Exported for use in other components that need to sanitize HTML
 * before passing it to dangerouslySetInnerHTML.
 */
export function sanitizeHTML(dirty) {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, purifyConfig);
}

/* --- Rich Content Viewer ------------------------------------------------ */

/**
 * Render all math-tex spans inside a container element using KaTeX.
 * Looks for elements with class "math-tex" and renders their LaTeX content.
 * Also detects inline LaTeX delimiters: \( ... \) and $$ ... $$
 */
function renderMathInElement(container) {
  if (!container) return;

  // Render explicit math-tex spans (from our RCE)
  const mathSpans = container.querySelectorAll('.math-tex');
  mathSpans.forEach((span) => {
    const latex = span.getAttribute('data-latex') || span.textContent;
    if (!latex) return;
    try {
      katex.render(latex, span, { throwOnError: false, displayMode: false });
    } catch {
      // Leave as-is if rendering fails
    }
  });

  // Also process LaTeX delimiters \( ... \), \[ ... \], and $$ ... $$ in text nodes
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (/\\\(.*?\\\)|\\\[.*?\\\]|\$\$.*?\$\$/s.test(node.textContent)) {
      textNodes.push(node);
    }
  }

  textNodes.forEach((textNode) => {
    const text = textNode.textContent;
    const parts = text.split(/(\\\(.*?\\\)|\\\[.*?\\\]|\$\$.*?\$\$)/s);
    if (parts.length <= 1) return;

    const fragment = document.createDocumentFragment();
    parts.forEach((part) => {
      let match;
      if ((match = part.match(/^\\\((.*?)\\\)$/s))) {
        const span = document.createElement('span');
        try {
          katex.render(match[1], span, { throwOnError: false, displayMode: false });
        } catch {
          span.textContent = part;
        }
        fragment.appendChild(span);
      } else if ((match = part.match(/^\\\[(.*?)\\\]$/s))) {
        const div = document.createElement('div');
        div.style.textAlign = 'center';
        div.style.margin = '0.5em 0';
        try {
          katex.render(match[1], div, { throwOnError: false, displayMode: true });
        } catch {
          div.textContent = part;
        }
        fragment.appendChild(div);
      } else if ((match = part.match(/^\$\$(.*?)\$\$$/s))) {
        const div = document.createElement('div');
        try {
          katex.render(match[1], div, { throwOnError: false, displayMode: true });
        } catch {
          div.textContent = part;
        }
        fragment.appendChild(div);
      } else if (part) {
        fragment.appendChild(document.createTextNode(part));
      }
    });
    textNode.parentNode.replaceChild(fragment, textNode);
  });
}

/* --- Read-aloud (browser SpeechSynthesis) --------------------------------- */

function ReadAloudButton({ text }) {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  useEffect(() => () => stop(), [stop]);

  const speak = useCallback(() => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.rate = 0.95;
    utter.pitch = 1;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  }, [supported, text]);

  if (!supported || !text) return null;

  const Icon = speaking ? Square : Volume2;
  return (
    <button
      type="button"
      onClick={speaking ? stop : speak}
      aria-label={speaking ? 'Stop reading aloud' : 'Read aloud'}
      className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Icon className="h-3.5 w-3.5" />
      {speaking ? 'Stop' : 'Read aloud'}
    </button>
  );
}

/** Strip HTML to plain text for TTS. */
function htmlToPlainText(html) {
  if (!html) return '';
  if (typeof document === 'undefined') return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
}

export default function RichContentViewer({ content, className }) {
  const sanitized = useMemo(() => sanitizeHTML(content), [content]);
  const plainText = useMemo(() => htmlToPlainText(sanitized), [sanitized]);
  const containerRef = useRef(null);
  // Tolerate use outside <ReadingPrefsProvider> (e.g. tests) — useContext returns null safely.
  const readingCtx = useContext(ReadingPrefsContext);
  const prefs = readingCtx?.prefs ?? null;

  useEffect(() => {
    if (containerRef.current && sanitized) {
      renderMathInElement(containerRef.current);
    }
  }, [sanitized]);

  if (!sanitized) return null;

  const showTTS = prefs?.ttsEnabled === true;

  return (
    <div className="reading-surface">
      {showTTS && (
        <div className="mb-2 flex justify-end">
          <ReadAloudButton text={plainText} />
        </div>
      )}
      <div
        ref={containerRef}
        className={[
          // Tailwind prose for beautiful typography
          'prose prose-sm sm:prose-base max-w-none',
          // Headings
          'prose-headings:font-semibold prose-headings:text-gray-900',
          // Links
          'prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-800',
          // Images
          'prose-img:rounded-lg prose-img:shadow-sm',
          // Tables
          'prose-table:border-collapse',
          'prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-sm prose-th:font-medium prose-th:text-gray-700',
          'prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-2 prose-td:text-sm',
          // Blockquotes
          'prose-blockquote:border-l-4 prose-blockquote:border-blue-300 prose-blockquote:bg-blue-50 prose-blockquote:py-1 prose-blockquote:pl-4 prose-blockquote:not-italic',
          // Code
          'prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono',
          // HR
          'prose-hr:border-gray-300',
          // Custom class
          className,
        ].filter(Boolean).join(' ')}
        dangerouslySetInnerHTML={{ __html: sanitized }}
        style={{
          /* Embedded video responsive wrappers */
          '--tw-prose-body': '#374151',
        }}
      />
    </div>
  );
}

export { ReadAloudButton, htmlToPlainText };

export { renderMathInElement };

/**
 * Legacy alias for backward compatibility.
 * New code should use sanitizeHTML instead.
 */
export const sanitizeHtml = sanitizeHTML;
