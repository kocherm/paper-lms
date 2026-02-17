import React, { useMemo } from 'react';

/* --- HTML Sanitizer ----------------------------------------------------- */

/**
 * Lightweight regex-based HTML sanitizer.
 * Not a full DOMPurify replacement, but catches the most common XSS vectors:
 *   - <script> tags
 *   - Event handler attributes (onclick, onerror, onload, etc.)
 *   - javascript: protocol in href/src
 *   - data: protocol in src (except images)
 *   - <iframe> srcdoc with scripts
 */
function sanitizeHtml(html) {
  if (!html) return '';

  let clean = html;

  // Remove <script> tags and their content
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove <style> tags and their content (can be used for CSS-based attacks)
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove event handler attributes (on*)
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

  // Remove javascript: protocol from href, src, action, formaction
  clean = clean.replace(/(href|src|action|formaction)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '$1=""');

  // Remove data: protocol from src (except for images which may use data URIs)
  // We allow data:image/* but block other data: URIs
  clean = clean.replace(/src\s*=\s*"data:(?!image\/)[^"]*"/gi, 'src=""');
  clean = clean.replace(/src\s*=\s*'data:(?!image\/)[^']*'/gi, "src=''");

  // Remove <object>, <embed>, <applet>, <form> tags
  clean = clean.replace(/<\/?(object|embed|applet|form|meta|link)\b[^>]*>/gi, '');

  // Remove srcdoc attribute from iframes (can contain scripts)
  clean = clean.replace(/\s+srcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '');

  // Remove expression() from inline styles (IE CSS exploit)
  clean = clean.replace(/expression\s*\(/gi, 'blocked(');

  // Remove -moz-binding (Firefox CSS exploit)
  clean = clean.replace(/-moz-binding\s*:/gi, 'blocked:');

  // Remove @import in inline styles
  clean = clean.replace(/@import\b/gi, 'blocked-import');

  return clean;
}

/* --- Rich Content Viewer ------------------------------------------------ */

export default function RichContentViewer({ content, className }) {
  const sanitized = useMemo(() => sanitizeHtml(content), [content]);

  if (!sanitized) return null;

  return (
    <div
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
  );
}

/**
 * Export the sanitizer for use in other components if needed
 */
export { sanitizeHtml };
