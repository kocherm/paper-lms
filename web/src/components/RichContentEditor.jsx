import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link, Image, Table, Calculator,
  Play, Shield, Code, Type, RemoveFormatting, X, Check, ChevronDown
} from 'lucide-react';

/* --- Helpers ------------------------------------------------------------ */

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const modKey = isMac ? '\u2318' : 'Ctrl';

function cx(...args) {
  return args.filter(Boolean).join(' ');
}

/* --- Toolbar Button ----------------------------------------------------- */

function ToolbarButton({ icon: Icon, label, shortcut, active, disabled, onClick, className }) {
  return (
    <button
      type="button"
      className={cx(
        'relative flex items-center justify-center w-8 h-8 rounded transition-colors',
        'hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1',
        active && 'bg-blue-100 text-blue-700',
        disabled && 'opacity-40 pointer-events-none',
        !active && !disabled && 'text-gray-600',
        className,
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick?.();
      }}
      aria-label={label}
      aria-pressed={active || undefined}
      title={shortcut ? `${label} (${shortcut})` : label}
      tabIndex={-1}
      disabled={disabled}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );
}

function Separator() {
  return <div className="w-px h-6 bg-gray-300 mx-1 self-center shrink-0" />;
}

/* --- Popover shell ------------------------------------------------------ */

function Popover({ open, onClose, children, className }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cx(
        'absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3',
        'before:absolute before:-top-1.5 before:left-4 before:w-3 before:h-3',
        'before:bg-white before:border-l before:border-t before:border-gray-200 before:rotate-45',
        className,
      )}
    >
      {children}
    </div>
  );
}

/* --- Link Popover ------------------------------------------------------- */

function LinkPopover({ open, onClose, onInsert }) {
  const [url, setUrl] = useState('https://');
  const [text, setText] = useState('');
  const urlRef = useRef(null);

  useEffect(() => {
    if (open && urlRef.current) urlRef.current.focus();
  }, [open]);

  const handleInsert = () => {
    if (!url || url === 'https://') return;
    onInsert(url, text);
    setUrl('https://');
    setText('');
    onClose();
  };

  return (
    <Popover open={open} onClose={onClose} className="w-72">
      <label className="block text-xs font-medium text-gray-700 mb-1">URL</label>
      <input
        ref={urlRef}
        type="url"
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none mb-2"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleInsert(); }}
        placeholder="https://example.com"
      />
      <label className="block text-xs font-medium text-gray-700 mb-1">Display text (optional)</label>
      <input
        type="text"
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none mb-3"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleInsert(); }}
        placeholder="Link text"
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
        <button type="button" onClick={handleInsert} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Insert Link</button>
      </div>
    </Popover>
  );
}

/* --- Image Popover ------------------------------------------------------ */

function ImagePopover({ open, onClose, onInsert }) {
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const urlRef = useRef(null);

  useEffect(() => {
    if (open && urlRef.current) urlRef.current.focus();
  }, [open]);

  const handleInsert = () => {
    if (!url) return;
    onInsert(url, alt);
    setUrl('');
    setAlt('');
    onClose();
  };

  return (
    <Popover open={open} onClose={onClose} className="w-72">
      <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
      <input
        ref={urlRef}
        type="url"
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none mb-2"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleInsert(); }}
        placeholder="https://example.com/image.png"
      />
      <label className="block text-xs font-medium text-gray-700 mb-1">Alt text (for accessibility)</label>
      <input
        type="text"
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none mb-3"
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleInsert(); }}
        placeholder="Describe the image"
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
        <button type="button" onClick={handleInsert} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Insert Image</button>
      </div>
    </Popover>
  );
}

/* --- Table Grid Selector ------------------------------------------------ */

function TablePopover({ open, onClose, onInsert }) {
  const [hover, setHover] = useState({ r: 0, c: 0 });
  const maxRows = 6;
  const maxCols = 6;

  const handleSelect = (r, c) => {
    onInsert(r + 1, c + 1);
    onClose();
  };

  return (
    <Popover open={open} onClose={onClose} className="w-auto">
      <p className="text-xs text-gray-500 mb-2 text-center">
        {hover.r + 1} &times; {hover.c + 1} table
      </p>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${maxCols}, 1fr)` }}>
        {Array.from({ length: maxRows }).map((_, r) =>
          Array.from({ length: maxCols }).map((_, c) => (
            <div
              key={`${r}-${c}`}
              className={cx(
                'w-5 h-5 border rounded-sm cursor-pointer transition-colors',
                r <= hover.r && c <= hover.c
                  ? 'bg-blue-200 border-blue-400'
                  : 'bg-gray-50 border-gray-300',
              )}
              onMouseEnter={() => setHover({ r, c })}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(r, c);
              }}
            />
          ))
        )}
      </div>
    </Popover>
  );
}

/* --- Equation Editor Popover -------------------------------------------- */

const EQUATION_SHORTCUTS = [
  { label: '\\frac{a}{b}', display: 'a/b', title: 'Fraction' },
  { label: '\\sqrt{x}', display: '\u221Ax', title: 'Square root' },
  { label: 'x^{n}', display: 'x\u207F', title: 'Exponent' },
  { label: 'x_{n}', display: 'x\u2099', title: 'Subscript' },
  { label: '\\sum_{i=0}^{n}', display: '\u03A3', title: 'Sum' },
  { label: '\\int_{a}^{b}', display: '\u222B', title: 'Integral' },
];

function EquationPopover({ open, onClose, onInsert }) {
  const [latex, setLatex] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const handleInsert = () => {
    if (!latex.trim()) return;
    onInsert(latex.trim());
    setLatex('');
    onClose();
  };

  return (
    <Popover open={open} onClose={onClose} className="w-80">
      <label className="block text-xs font-medium text-gray-700 mb-1">LaTeX expression</label>
      <input
        ref={inputRef}
        type="text"
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:ring-2 focus:ring-blue-400 focus:outline-none mb-2"
        value={latex}
        onChange={(e) => setLatex(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleInsert(); }}
        placeholder="e.g. \\frac{1}{2}"
      />
      <div className="flex flex-wrap gap-1 mb-3">
        {EQUATION_SHORTCUTS.map((s) => (
          <button
            key={s.label}
            type="button"
            className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 font-mono"
            title={s.title}
            onMouseDown={(e) => {
              e.preventDefault();
              setLatex((prev) => prev + s.label);
              inputRef.current?.focus();
            }}
          >
            {s.display}
          </button>
        ))}
      </div>
      {latex.trim() && (
        <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200 text-center">
          <span className="math-tex text-sm italic text-gray-800">{latex}</span>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
        <button type="button" onClick={handleInsert} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Insert Equation</button>
      </div>
    </Popover>
  );
}

/* --- Media Embed Popover ------------------------------------------------ */

function parseMediaUrl(url) {
  let match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) return { type: 'youtube', id: match[1] };
  match = url.match(/vimeo\.com\/(\d+)/);
  if (match) return { type: 'vimeo', id: match[1] };
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) return { type: 'video', url };
  if (/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(url)) return { type: 'audio', url };
  return null;
}

function MediaPopover({ open, onClose, onInsert }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const urlRef = useRef(null);

  useEffect(() => {
    if (open && urlRef.current) urlRef.current.focus();
  }, [open]);

  const handleInsert = () => {
    const parsed = parseMediaUrl(url);
    if (!parsed) {
      setError('Unsupported URL. Use YouTube, Vimeo, or direct video/audio URL.');
      return;
    }
    onInsert(parsed);
    setUrl('');
    setError('');
    onClose();
  };

  return (
    <Popover open={open} onClose={onClose} className="w-80">
      <label className="block text-xs font-medium text-gray-700 mb-1">Media URL</label>
      <input
        ref={urlRef}
        type="url"
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none mb-1"
        value={url}
        onChange={(e) => { setUrl(e.target.value); setError(''); }}
        onKeyDown={(e) => { if (e.key === 'Enter') handleInsert(); }}
        placeholder="https://youtube.com/watch?v=..."
      />
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <p className="text-xs text-gray-400 mb-3">Supports YouTube, Vimeo, .mp4, .webm, .mp3, .wav</p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
        <button type="button" onClick={handleInsert} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Embed</button>
      </div>
    </Popover>
  );
}

/* --- Accessibility Checker ---------------------------------------------- */

function runAccessibilityCheck(html) {
  const issues = [];
  const container = document.createElement('div');
  container.innerHTML = html;

  container.querySelectorAll('img').forEach((img, i) => {
    if (!img.getAttribute('alt')?.trim()) {
      issues.push({ type: 'error', message: `Image ${i + 1} is missing alt text`, suggestion: 'Add descriptive alt text to the image.' });
    }
  });

  container.querySelectorAll('a').forEach((a, i) => {
    if (!a.textContent?.trim() && !a.querySelector('img')) {
      issues.push({ type: 'error', message: `Link ${i + 1} has no text`, suggestion: 'Add visible text or an aria-label to the link.' });
    }
  });

  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let lastLevel = 0;
  headings.forEach((h) => {
    const level = parseInt(h.tagName[1], 10);
    if (lastLevel && level > lastLevel + 1) {
      issues.push({
        type: 'warning',
        message: `Heading hierarchy skips from H${lastLevel} to H${level}`,
        suggestion: `Use an H${lastLevel + 1} instead, or restructure your headings.`,
      });
    }
    lastLevel = level;
  });

  container.querySelectorAll('[style]').forEach((el) => {
    const style = el.getAttribute('style') || '';
    if (/color\s*:/i.test(style) && !/background/i.test(style)) {
      issues.push({
        type: 'warning',
        message: 'Inline text color detected without background color',
        suggestion: 'Ensure sufficient contrast between text and background colors (WCAG 4.5:1 ratio).',
      });
    }
  });

  return issues;
}

function AccessibilityPanel({ open, onClose, issues }) {
  if (!open) return null;

  return (
    <Popover open={open} onClose={onClose} className="w-80 max-h-64 overflow-y-auto right-0 left-auto">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-800">Accessibility Check</h3>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={14} />
        </button>
      </div>
      {issues.length === 0 ? (
        <div className="flex items-center gap-2 text-green-700 text-sm py-2">
          <Check size={16} /> No issues found
        </div>
      ) : (
        <ul className="space-y-2">
          {issues.map((issue, i) => (
            <li key={i} className="text-xs">
              <div className={cx(
                'font-medium',
                issue.type === 'error' ? 'text-red-700' : 'text-amber-700',
              )}>
                {issue.type === 'error' ? 'Error' : 'Warning'}: {issue.message}
              </div>
              <div className="text-gray-500 mt-0.5">{issue.suggestion}</div>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  );
}

/* --- Main Rich Content Editor ------------------------------------------- */

export default function RichContentEditor({
  value = '',
  onChange,
  placeholder = 'Start typing...',
  minHeight = '200px',
  disabled = false,
  id,
  ariaLabel = 'Rich content editor',
}) {
  const editorRef = useRef(null);
  const [sourceView, setSourceView] = useState(false);
  const [sourceHtml, setSourceHtml] = useState(value);
  const [charCount, setCharCount] = useState(0);
  const [activeFormats, setActiveFormats] = useState({});

  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [equationOpen, setEquationOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [a11yOpen, setA11yOpen] = useState(false);
  const [a11yIssues, setA11yIssues] = useState([]);

  const savedSelectionRef = useRef(null);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedSelectionRef.current);
    }
  }, []);

  useEffect(() => {
    if (editorRef.current && !sourceView) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
      updateCharCount();
    }
  }, [value, sourceView]);

  const updateCharCount = useCallback(() => {
    if (editorRef.current) {
      setCharCount(editorRef.current.textContent?.length || 0);
    }
  }, []);

  const updateActiveFormats = useCallback(() => {
    const formats = {};
    try {
      formats.bold = document.queryCommandState('bold');
      formats.italic = document.queryCommandState('italic');
      formats.underline = document.queryCommandState('underline');
      formats.strikeThrough = document.queryCommandState('strikeThrough');
      formats.insertUnorderedList = document.queryCommandState('insertUnorderedList');
      formats.insertOrderedList = document.queryCommandState('insertOrderedList');
      const val = document.queryCommandValue('formatBlock');
      formats.h2 = val === 'h2';
      formats.h3 = val === 'h3';
      formats.blockquote = val === 'blockquote';
    } catch (_e) {
      // queryCommandState may throw in some browsers
    }
    setActiveFormats(formats);
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange?.(html);
      updateCharCount();
      updateActiveFormats();
    }
  }, [onChange, updateCharCount, updateActiveFormats]);

  const handleSelectionChange = useCallback(() => {
    updateActiveFormats();
  }, [updateActiveFormats]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  const exec = useCallback((command, val) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val === undefined ? null : val);
    handleInput();
  }, [handleInput]);

  const toggleBold = useCallback(() => exec('bold'), [exec]);
  const toggleItalic = useCallback(() => exec('italic'), [exec]);
  const toggleUnderline = useCallback(() => exec('underline'), [exec]);
  const toggleStrikethrough = useCallback(() => exec('strikeThrough'), [exec]);

  const toggleH2 = useCallback(() => {
    const current = document.queryCommandValue('formatBlock');
    exec('formatBlock', current === 'h2' ? 'p' : 'h2');
  }, [exec]);

  const toggleH3 = useCallback(() => {
    const current = document.queryCommandValue('formatBlock');
    exec('formatBlock', current === 'h3' ? 'p' : 'h3');
  }, [exec]);

  const toggleBulletList = useCallback(() => exec('insertUnorderedList'), [exec]);
  const toggleNumberedList = useCallback(() => exec('insertOrderedList'), [exec]);

  const toggleBlockquote = useCallback(() => {
    const current = document.queryCommandValue('formatBlock');
    exec('formatBlock', current === 'blockquote' ? 'p' : 'blockquote');
  }, [exec]);

  const insertHR = useCallback(() => exec('insertHorizontalRule'), [exec]);
  const clearFormatting = useCallback(() => exec('removeFormat'), [exec]);

  const handleInsertLink = useCallback((url, text) => {
    restoreSelection();
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const selectedText = range.toString();
      if (selectedText) {
        document.execCommand('createLink', false, url);
      } else {
        const displayText = text || url;
        const safeUrl = url.replace(/"/g, '&quot;');
        const safeText = displayText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        document.execCommand('insertHTML', false, '<a href="' + safeUrl + '">' + safeText + '</a>');
      }
    }
    handleInput();
  }, [restoreSelection, handleInput]);

  const handleInsertImage = useCallback((url, alt) => {
    restoreSelection();
    editorRef.current?.focus();
    const safeUrl = url.replace(/"/g, '&quot;');
    const safeAlt = (alt || '').replace(/"/g, '&quot;');
    const imgHtml = '<img src="' + safeUrl + '" alt="' + safeAlt + '" style="max-width:100%;height:auto;" />';
    document.execCommand('insertHTML', false, imgHtml);
    handleInput();
  }, [restoreSelection, handleInput]);

  const handleInsertTable = useCallback((rows, cols) => {
    restoreSelection();
    editorRef.current?.focus();
    let html = '<table style="border-collapse:collapse;width:100%;">';
    html += '<thead><tr>';
    for (let c = 0; c < cols; c++) {
      html += '<th style="border:1px solid #ccc;padding:8px;background:#f3f4f6;text-align:left;">Header</th>';
    }
    html += '</tr></thead><tbody>';
    for (let r = 1; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        html += '<td style="border:1px solid #ccc;padding:8px;">&nbsp;</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table><p><br></p>';
    document.execCommand('insertHTML', false, html);
    handleInput();
  }, [restoreSelection, handleInput]);

  const handleInsertEquation = useCallback((latex) => {
    restoreSelection();
    editorRef.current?.focus();
    const safeTex = latex.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const eqHtml = '<span class="math-tex" contenteditable="false" style="display:inline-block;padding:2px 6px;background:#f8f9fa;border:1px solid #e5e7eb;border-radius:4px;font-family:serif;font-style:italic;color:#1f2937;">' + safeTex + '</span>&nbsp;';
    document.execCommand('insertHTML', false, eqHtml);
    handleInput();
  }, [restoreSelection, handleInput]);

  const handleInsertMedia = useCallback((parsed) => {
    restoreSelection();
    editorRef.current?.focus();
    let html = '';
    if (parsed.type === 'youtube') {
      html = '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:16px 0;"><iframe src="https://www.youtube.com/embed/' + parsed.id + '" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen title="YouTube video"></iframe></div>';
    } else if (parsed.type === 'vimeo') {
      html = '<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;max-width:100%;margin:16px 0;"><iframe src="https://player.vimeo.com/video/' + parsed.id + '" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen title="Vimeo video"></iframe></div>';
    } else if (parsed.type === 'video') {
      const safeUrl = parsed.url.replace(/"/g, '&quot;');
      html = '<video controls style="max-width:100%;margin:16px 0;" src="' + safeUrl + '">Your browser does not support the video tag.</video>';
    } else if (parsed.type === 'audio') {
      const safeUrl = parsed.url.replace(/"/g, '&quot;');
      html = '<audio controls style="width:100%;margin:16px 0;" src="' + safeUrl + '">Your browser does not support the audio tag.</audio>';
    }
    if (html) {
      document.execCommand('insertHTML', false, html + '<p><br></p>');
    }
    handleInput();
  }, [restoreSelection, handleInput]);

  const handleA11yCheck = useCallback(() => {
    const html = editorRef.current?.innerHTML || '';
    const issues = runAccessibilityCheck(html);
    setA11yIssues(issues);
    setA11yOpen(true);
  }, []);

  const handleToggleSource = useCallback(() => {
    if (sourceView) {
      if (editorRef.current) {
        editorRef.current.innerHTML = sourceHtml;
      }
      onChange?.(sourceHtml);
    } else {
      setSourceHtml(editorRef.current?.innerHTML || '');
    }
    setSourceView((prev) => !prev);
  }, [sourceView, sourceHtml, onChange]);

  const handleSourceChange = useCallback((e) => {
    const html = e.target.value;
    setSourceHtml(html);
    onChange?.(html);
    setCharCount(html.replace(/<[^>]*>/g, '').length);
  }, [onChange]);

  const handleKeyDown = useCallback((e) => {
    const mod = isMac ? e.metaKey : e.ctrlKey;

    if (mod && e.key === 'b') {
      e.preventDefault();
      toggleBold();
    } else if (mod && e.key === 'i') {
      e.preventDefault();
      toggleItalic();
    } else if (mod && e.key === 'u') {
      e.preventDefault();
      toggleUnderline();
    } else if (mod && e.key === 'k') {
      e.preventDefault();
      saveSelection();
      setLinkOpen(true);
    } else if (mod && e.shiftKey && (e.key === 'x' || e.key === 'X')) {
      e.preventDefault();
      toggleStrikethrough();
    } else if (e.key === 'Tab') {
      const inList = document.queryCommandState('insertUnorderedList') || document.queryCommandState('insertOrderedList');
      if (inList) {
        e.preventDefault();
        if (e.shiftKey) {
          exec('outdent');
        } else {
          exec('indent');
        }
      }
    }
  }, [exec, saveSelection, toggleBold, toggleItalic, toggleUnderline, toggleStrikethrough]);

  const closeAllPopovers = useCallback(() => {
    setLinkOpen(false);
    setImageOpen(false);
    setTableOpen(false);
    setEquationOpen(false);
    setMediaOpen(false);
    setA11yOpen(false);
  }, []);

  const openPopover = useCallback((setter) => {
    closeAllPopovers();
    saveSelection();
    setter(true);
  }, [closeAllPopovers, saveSelection]);

  return (
    <div
      className={cx(
        'border border-gray-300 rounded-lg overflow-hidden bg-white',
        disabled && 'opacity-60 pointer-events-none',
      )}
    >
      {/* Toolbar */}
      <div
        role="toolbar"
        aria-label="Formatting toolbar"
        className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200"
      >
        <ToolbarButton icon={Bold} label="Bold" shortcut={modKey + '+B'} active={activeFormats.bold} onClick={toggleBold} disabled={disabled} />
        <ToolbarButton icon={Italic} label="Italic" shortcut={modKey + '+I'} active={activeFormats.italic} onClick={toggleItalic} disabled={disabled} />
        <ToolbarButton icon={Underline} label="Underline" shortcut={modKey + '+U'} active={activeFormats.underline} onClick={toggleUnderline} disabled={disabled} />
        <ToolbarButton icon={Strikethrough} label="Strikethrough" shortcut={modKey + '+Shift+X'} active={activeFormats.strikeThrough} onClick={toggleStrikethrough} disabled={disabled} />

        <Separator />

        <ToolbarButton icon={Heading2} label="Heading 2" active={activeFormats.h2} onClick={toggleH2} disabled={disabled} />
        <ToolbarButton icon={Heading3} label="Heading 3" active={activeFormats.h3} onClick={toggleH3} disabled={disabled} />

        <Separator />

        <ToolbarButton icon={List} label="Bulleted list" active={activeFormats.insertUnorderedList} onClick={toggleBulletList} disabled={disabled} />
        <ToolbarButton icon={ListOrdered} label="Numbered list" active={activeFormats.insertOrderedList} onClick={toggleNumberedList} disabled={disabled} />
        <ToolbarButton icon={Quote} label="Blockquote" active={activeFormats.blockquote} onClick={toggleBlockquote} disabled={disabled} />

        <Separator />

        <ToolbarButton icon={Minus} label="Horizontal rule" onClick={insertHR} disabled={disabled} />
        <ToolbarButton icon={RemoveFormatting} label="Clear formatting" onClick={clearFormatting} disabled={disabled} />

        <Separator />

        <div className="relative">
          <ToolbarButton icon={Link} label="Insert link" shortcut={modKey + '+K'} onClick={() => openPopover(setLinkOpen)} disabled={disabled} />
          <LinkPopover open={linkOpen} onClose={() => setLinkOpen(false)} onInsert={handleInsertLink} />
        </div>
        <div className="relative">
          <ToolbarButton icon={Image} label="Insert image" onClick={() => openPopover(setImageOpen)} disabled={disabled} />
          <ImagePopover open={imageOpen} onClose={() => setImageOpen(false)} onInsert={handleInsertImage} />
        </div>
        <div className="relative">
          <ToolbarButton icon={Table} label="Insert table" onClick={() => openPopover(setTableOpen)} disabled={disabled} />
          <TablePopover open={tableOpen} onClose={() => setTableOpen(false)} onInsert={handleInsertTable} />
        </div>
        <div className="relative">
          <ToolbarButton icon={Calculator} label="Insert equation" onClick={() => openPopover(setEquationOpen)} disabled={disabled} />
          <EquationPopover open={equationOpen} onClose={() => setEquationOpen(false)} onInsert={handleInsertEquation} />
        </div>
        <div className="relative">
          <ToolbarButton icon={Play} label="Embed media" onClick={() => openPopover(setMediaOpen)} disabled={disabled} />
          <MediaPopover open={mediaOpen} onClose={() => setMediaOpen(false)} onInsert={handleInsertMedia} />
        </div>

        <Separator />

        <div className="relative">
          <ToolbarButton icon={Shield} label="Accessibility checker" onClick={handleA11yCheck} disabled={disabled} />
          <AccessibilityPanel open={a11yOpen} onClose={() => setA11yOpen(false)} issues={a11yIssues} />
        </div>
        <ToolbarButton
          icon={Code}
          label={sourceView ? 'Visual editor' : 'HTML source'}
          active={sourceView}
          onClick={handleToggleSource}
          disabled={disabled}
        />
      </div>

      {/* Editor Surface */}
      {sourceView ? (
        <textarea
          className="w-full p-4 font-mono text-sm text-gray-800 bg-gray-50 focus:outline-none resize-y"
          style={{ minHeight }}
          value={sourceHtml}
          onChange={handleSourceChange}
          spellCheck={false}
          aria-label="HTML source editor"
        />
      ) : (
        <div
          ref={editorRef}
          id={id}
          contentEditable={!disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={ariaLabel}
          className={cx(
            'w-full p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400',
            'prose prose-sm max-w-none',
            'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none',
          )}
          style={{ minHeight }}
          data-placeholder={placeholder}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={updateActiveFormats}
          onMouseUp={updateActiveFormats}
        />
      )}

      {/* Bottom Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        <span>{charCount} character{charCount !== 1 ? 's' : ''}</span>
        <span className="text-gray-400">
          {sourceView ? 'HTML source mode' : 'Visual editor'}
        </span>
      </div>
    </div>
  );
}
