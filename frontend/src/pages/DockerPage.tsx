import React from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { DockerView } from '../components/views/DockerView';

export const DockerPage: React.FC = () => {
  return (
    <SidebarLayout>
      <div className="docker-canvas -m-2 min-h-full p-6 md:p-8">
        <DockerView />
      </div>
    </SidebarLayout>
  );
};
