import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

interface DropdownItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface DropdownProps {
  items: DropdownItem[];
  trigger?: React.ReactNode;
  align?: 'left' | 'right';
}

export const Dropdown: React.FC<DropdownProps> = ({ items, trigger, align = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer flex items-center justify-center">
        {trigger || (
          <button className="p-2 rounded-lg text-op-muted hover:bg-op-raised hover:text-op-fg transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className={`absolute z-50 mt-2 min-w-[220px] rounded-2xl bg-op-surface dark:bg-slate-900 border border-op-border dark:border-slate-800 shadow-2xl shadow-black/10 dark:shadow-black/40 backdrop-blur-xl overflow-hidden transition-all duration-150 animate-in fade-in zoom-in-95 ${align === 'right' ? 'right-0' : 'left-0'}`}
          role="menu"
        >
          <div className="p-1.5 flex flex-col gap-0.5 max-h-80 overflow-y-auto">
            {items.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors duration-150 group ${
                  item.danger 
                    ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10' 
                    : 'text-op-fg hover:bg-op-raised hover:text-op-accent'
                }`}
                role="menuitem"
              >
                {item.icon && <span className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 group-hover:scale-110 ${item.danger ? 'text-rose-500' : 'text-op-muted group-hover:text-op-accent'}`}>{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
