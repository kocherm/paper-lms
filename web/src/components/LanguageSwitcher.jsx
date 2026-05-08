import React, { useState, useRef, useCallback } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useDismissable from '../hooks/useDismissable';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const close = useCallback(() => setOpen(false), []);
  useDismissable(ref, open, close);

  return (
    <div className="relative" ref={ref}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setOpen(!open)}
            aria-label="Language"
            className="relative flex items-center justify-center w-10 h-10 rounded-md text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Globe className="w-5 h-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Language</TooltipContent>
      </Tooltip>

      {open && (
        <div className="absolute left-full ml-2 bottom-0 w-36 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { i18n.changeLanguage(lang.code); setOpen(false); }}
              className={`block w-full text-left px-4 py-2 text-sm ${
                i18n.language === lang.code || i18n.language?.startsWith(lang.code + '-')
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
