import React from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { DockerView } from '../components/views/DockerView';

export const DockerPage: React.FC = () => {
  return (
    <SidebarLayout>
      <div className="p-6 max-w-[1500px] mx-auto space-y-6 animate-fade-in-up">
        <DockerView />
      </div>
    </SidebarLayout>
  );
};
