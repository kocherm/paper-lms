import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function CrossCourseWarningDialog({ issues, onGoBack, onSaveAnyway }) {
  if (!issues || issues.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-center w-10 h-10 bg-amber-100 rounded-full shrink-0">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cross-Course References Detected</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              This content contains links or images that reference other courses. Students enrolled only in this course may not be able to access them.
            </p>
          </div>
          <button type="button" onClick={onGoBack} className="ml-auto text-gray-400 hover:text-gray-600 shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 max-h-60 overflow-y-auto">
          <ul className="space-y-2">
            {issues.map((issue, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="inline-block mt-0.5 w-2 h-2 bg-amber-400 rounded-full shrink-0" />
                <div>
                  <div className="text-gray-700">
                    <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{issue.element}</code>
                    {' '}references course <strong className="text-amber-700">#{issue.referencedCourseId}</strong>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 break-all">{issue.url}</div>
                  {issue.text && issue.text !== issue.url && (
                    <div className="text-xs text-gray-500 mt-0.5 italic truncate">"{issue.text}"</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onGoBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={onSaveAnyway}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700"
          >
            Save Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
