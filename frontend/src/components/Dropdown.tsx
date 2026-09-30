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
          className={`absolute z-50 mt-2 min-w-[220px] rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl animate-fade-in-up overflow-hidden ${align === 'right' ? 'right-0' : 'left-0'}`}
          role="menu"
        >
          <div className="p-2 flex flex-col gap-1 max-h-80 overflow-y-auto">
            {items.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-all duration-200 group ${
                  item.danger 
                    ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                }`}
                role="menuitem"
              >
                {item.icon && <span className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${item.danger ? 'text-rose-500' : 'text-indigo-500 dark:text-indigo-400'}`}>{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
