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
          className={`absolute z-50 mt-2 w-48 rounded-xl bg-op-surface border border-op-border shadow-lg animate-fade-in-up ${align === 'right' ? 'right-0' : 'left-0'}`}
          role="menu"
        >
          <div className="py-1">
            {items.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
                  item.danger 
                    ? 'text-rose-600 hover:bg-rose-50' 
                    : 'text-op-fg hover:bg-op-raised'
                }`}
                role="menuitem"
              >
                {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
