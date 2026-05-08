import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

/**
 * @typedef {Object} MathInputDialogProps
 * @property {boolean} open
 * @property {() => void} onClose
 * @property {(latex: string) => void} onInsert
 */

let _katexPromise = null;
/**
 * Lazily import KaTeX (and its CSS) on demand.
 * Mirrors the lazy-loading pattern from RichContentViewer.
 */
function loadKatex() {
  if (!_katexPromise) {
    _katexPromise = Promise.all([
      import('katex'),
      import('katex/dist/katex.min.css'),
    ]).then(([mod]) => mod.default || mod);
  }
  return _katexPromise;
}

/**
 * Math equation entry with live KaTeX preview.
 * @param {MathInputDialogProps} props
 */
export default function MathInputDialog({ open, onClose, onInsert }) {
  const [latex, setLatex] = useState('');
  const [error, setError] = useState(null);
  const [katex, setKatex] = useState(null);
  const previewRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setLatex('');
    setError(null);
    loadKatex().then(setKatex).catch((e) => setError(e?.message || 'KaTeX failed to load'));
  }, [open]);

  useEffect(() => {
    if (!previewRef.current || !katex) return;
    if (!latex.trim()) {
      previewRef.current.textContent = '';
      setError(null);
      return;
    }
    try {
      katex.render(latex, previewRef.current, { throwOnError: false, displayMode: true });
      setError(null);
    } catch (e) {
      setError(e?.message || 'Invalid LaTeX');
    }
  }, [latex, katex]);

  const submit = () => {
    if (!latex.trim()) return;
    onInsert(latex.trim());
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Insert math equation</DialogTitle>
          <DialogDescription>
            Enter LaTeX. Example: <code>E = mc^2</code>
          </DialogDescription>
        </DialogHeader>

        <Input
          autoFocus
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          placeholder="\\frac{a}{b}"
          aria-label="LaTeX source"
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
        />

        <div className="rounded border bg-muted/30 p-3 min-h-[60px]" aria-label="Equation preview">
          {!katex && <span className="text-sm text-muted-foreground">Loading KaTeX…</span>}
          <div ref={previewRef} />
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={submit} disabled={!latex.trim()}>Insert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
