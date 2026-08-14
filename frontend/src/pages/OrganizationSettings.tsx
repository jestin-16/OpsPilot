import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { api } from '../services/api';
import type { IntegrationSettings } from '../services/api';
import { Settings, Cloud, Database, Save, CheckCircle } from 'lucide-react';

export const OrganizationSettings: React.FC = () => {
  const [integrations, setIntegrations] = useState<IntegrationSettings[]>([]);
  const [activeTab, setActiveTab] = useState('AWS');
  const [configValue, setConfigValue] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const fetchIntegrations = async () => {
      try {
        const data = await api.getIntegrations();
        setIntegrations(data);
        const current = data.find(i => i.providerType === activeTab);
        if (current) {
          setConfigValue(current.configJson);
        } else {
          setConfigValue('');
        }
      } catch (err) {
        console.error("Failed to load integrations", err);
      }
    };
    fetchIntegrations();
  }, [activeTab]);

  const handleSave = async () => {
    try {
      const payload: IntegrationSettings = {
        providerType: activeTab,
        name: `Production ${activeTab}`,
        configJson: configValue,
        active: true
      };
      await api.saveIntegration(payload);
      setStatusMsg(`Successfully saved ${activeTab} integration.`);
      setTimeout(() => setStatusMsg(''), 3000);
      
      const data = await api.getIntegrations();
      setIntegrations(data);
    } catch (err) {
      console.error("Failed to save integration", err);
      setStatusMsg("Error saving integration");
    }
  };

  const getPlaceholder = (provider: string) => {
    if (provider === 'AWS') return '{\n  "region": "us-east-1",\n  "accessKey": "AKIA...",\n  "secretKey": "..."\n}';
    if (provider === 'LOKI') return '{\n  "endpointUrl": "http://loki:3100"\n}';
    return '{}';
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-[1000px] mx-auto space-y-8 font-sans">
        
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-indigo-500" /> Organization Settings
          </h1>
          <p className="text-slate-500 mt-2">
            Configure global integrations for your organization. These tools will automatically stream data to all connected projects.
          </p>
        </div>

        <div className="flex gap-6">
          {/* Tabs */}
          <div className="w-64 shrink-0 flex flex-col gap-2">
            <div className="text-xs font-bold text-slate-500 uppercase mb-2">Cloud Providers</div>
            <button 
              onClick={() => setActiveTab('AWS')}
              className={`flex items-center gap-3 p-3 rounded-xl border font-bold transition-all ${
                activeTab === 'AWS' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Cloud className="w-5 h-5" /> AWS
              {integrations.find(i => i.providerType === 'AWS') && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />}
            </button>

            <div className="text-xs font-bold text-slate-500 uppercase mt-4 mb-2">Observability</div>
            <button 
              onClick={() => setActiveTab('LOKI')}
              className={`flex items-center gap-3 p-3 rounded-xl border font-bold transition-all ${
                activeTab === 'LOKI' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Database className="w-5 h-5" /> Grafana Loki
              {integrations.find(i => i.providerType === 'LOKI') && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />}
            </button>
          </div>

          {/* Config Editor */}
          <div className="flex-1 glass-panel p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 mb-4">{activeTab} Configuration</h2>
            
            <p className="text-sm text-slate-600 mb-4">
              Enter the JSON configuration required to authenticate OpsPilot with {activeTab}.
            </p>

            <div className="flex-1 min-h-[300px]">
              <textarea
                value={configValue}
                onChange={(e) => setConfigValue(e.target.value)}
                placeholder={getPlaceholder(activeTab)}
                className="w-full h-full bg-slate-900 text-indigo-300 font-mono text-sm p-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                spellCheck={false}
              />
            </div>

            <div className="mt-6 flex items-center justify-between">
               <div className="text-sm font-bold text-emerald-600">{statusMsg}</div>
               <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors"
                >
                 <Save className="w-4 h-4" /> Save Integration
               </button>
            </div>
          </div>
        </div>

      </div>
    </SidebarLayout>
  );
};
