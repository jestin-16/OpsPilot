import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import { api, type Project } from '../services/api';
import { FolderGit2, Rocket, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProjects()
      .then(setProjects)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const roleName = user?.roles?.[0] || 'Developer';

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#F8FAFC]">Welcome, {user?.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30">
                {roleName}
              </span>
            </div>
            <p className="text-sm text-[#94A3B8]">OpsPilot Developer Dashboard & Governance Portal</p>
          </div>
          <Link
            to="/projects"
            className="px-4 py-2 bg-[#38BDF8] hover:bg-[#38BDF8]/90 text-[#060B18] font-semibold text-sm rounded-lg flex items-center gap-2 transition-colors"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Total Projects</div>
              <div className="text-2xl font-bold text-[#F8FAFC] mt-1">{projects.length}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#1E2D45] flex items-center justify-center text-[#38BDF8]">
              <FolderGit2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Deployments</div>
              <div className="text-2xl font-bold text-[#F8FAFC] mt-1">Active Pipeline</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#1E2D45] flex items-center justify-center text-[#38BDF8]">
              <Rocket className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Environments</div>
              <div className="text-2xl font-bold text-[#F8FAFC] mt-1">Dev / Stg / Prod</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#1E2D45] flex items-center justify-center text-[#38BDF8]">
              <Cpu className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">RBAC Status</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">Enforced</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#1E2D45] flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Recent Projects Section */}
        <div className="bg-[#0F1B2E] border border-[#1E2D45] rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-[#F8FAFC]">Your Projects</h2>
            <Link to="/projects" className="text-xs font-semibold text-[#38BDF8] hover:underline">
              Manage Projects →
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-[#94A3B8] text-sm">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="py-8 text-center text-[#94A3B8] text-sm border border-dashed border-[#1E2D45] rounded-lg">
              No projects created yet. Go to <Link to="/projects" className="text-[#38BDF8] underline">Projects</Link> to create your first application.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((proj) => (
                <div key={proj.id} className="p-4 bg-[#060B18] border border-[#1E2D45] rounded-lg flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-[#F8FAFC] text-base">{proj.projectName}</h3>
                      <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-semibold rounded bg-[#1E2D45] text-[#38BDF8]">
                        {proj.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] line-clamp-2 mb-3">{proj.description || 'No description'}</p>
                  </div>
                  <div className="pt-3 border-t border-[#1E2D45] flex justify-between items-center text-xs text-[#94A3B8]">
                    <span>Owner: {proj.ownerName}</span>
                    <Link to="/projects" className="text-[#38BDF8] hover:underline">
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};
