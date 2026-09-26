import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTabId?: string;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTabId, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultTabId || tabs[0]?.id);

  const activeContent = tabs.find(t => t.id === activeTab)?.content;

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex space-x-1 border-b border-op-border overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-op-accent text-op-accent'
                : 'border-transparent text-op-muted hover:text-op-fg hover:border-op-border-strong'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-6">
        {activeContent}
      </div>
    </div>
  );
};
