import React from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { DeploymentsView } from '../components/views/DeploymentsView';

export const DeploymentsPage: React.FC = () => {
  return (
    <SidebarLayout>
      <div className="deployment-canvas -m-2 min-h-full p-6 md:p-8">
        <DeploymentsView />
      </div>
    </SidebarLayout>
  );
};
