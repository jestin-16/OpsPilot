import React from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { DeploymentsView } from '../components/views/DeploymentsView';

export const DeploymentsPage: React.FC = () => {
  return (
    <SidebarLayout>
      <div className="p-6 max-w-[1500px] mx-auto space-y-6 animate-fade-in-up">
        <DeploymentsView />
      </div>
    </SidebarLayout>
  );
};
