import React, { useState } from 'react';
import { resolveIcon, availableIcons } from '../../utils/iconResolver';

const IconPicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);

  const SelectedIcon = resolveIcon(value);

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center gap-2 border rounded px-3 py-2 hover:bg-gray-50">
        {SelectedIcon && <SelectedIcon className="w-5 h-5" />}
        <span className="text-sm">{value || 'Select icon'}</span>
      </button>
      {open && (
        <div className="absolute z-50 top-full mt-1 bg-white border rounded-lg shadow-lg p-3 grid grid-cols-6 gap-2 w-64">
          {availableIcons.map(name => {
            const Icon = resolveIcon(name);
            return (
              <button key={name} type="button" title={name}
                onClick={() => { onChange(name); setOpen(false); }}
                className={`p-2 rounded hover:bg-blue-50 ${value === name ? 'bg-blue-100 ring-2 ring-blue-500' : ''}`}>
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IconPicker;
