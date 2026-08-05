import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import { api, type Project } from '../services/api';
import { Link } from 'react-router-dom';
import { FolderGit2, Rocket, Container, Activity, Plus, Shield, ArrowRight, BookOpen } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await api.getProjects();
        setProjects(data);
      } catch (err) {
        console.error('Failed to fetch dashboard projects', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#F8FAFC]">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E2E8F0] pb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">
              Welcome back, {user?.name || 'Developer'}
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Internal Developer Platform overview and system metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/guide"
              className="px-4 py-2 bg-[#EEF2FF] border border-[#C7D2FE] hover:bg-[#E0E7FF] text-[#4F46E5] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Platform guide</span>
            </Link>
            <Link
              to="/projects"
              className="px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-[#FFFFFF] text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New project</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Active projects</div>
              <div className="text-2xl font-bold text-[#0F172A] mt-1">{loading ? '...' : projects.length}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
              <FolderGit2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Deployments</div>
              <div className="text-2xl font-bold text-[#0F172A] mt-1">Active</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
              <Rocket className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Docker containers</div>
              <div className="text-2xl font-bold text-[#0F172A] mt-1">Healthy</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Container className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Platform role</div>
              <div className="text-2xl font-bold text-[#7C3AED] mt-1">{user?.roles?.[0] || 'Developer'}</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center text-[#7C3AED]">
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Recent Projects Section */}
          <div className="lg:col-span-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-bold text-[#0F172A]">Recent projects</h2>
              <Link to="/projects" className="text-xs font-bold text-[#4F46E5] hover:underline flex items-center gap-1">
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-12 text-[#64748B] text-sm">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[#E2E8F0] rounded-lg">
                <FolderGit2 className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                <p className="text-xs text-[#64748B]">No microservice projects created yet.</p>
                <Link
                  to="/projects"
                  className="inline-block mt-3 px-3.5 py-1.5 bg-[#4F46E5] text-[#FFFFFF] text-xs font-semibold rounded-md shadow-sm"
                >
                  Create first project
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-between hover:border-[#CBD5E1] transition-colors"
                  >
                    <div>
                      <div className="font-bold text-xs text-[#0F172A]">{project.projectName}</div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">{project.description}</div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold">
                      {project.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side Panel: Platform Status */}
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-6">
            <h2 className="text-base font-bold text-[#0F172A]">Platform status</h2>
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[#64748B]">API Gateway</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[#64748B]">Docker Engine</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[#64748B]">Kubernetes Cluster</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Minikube
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                <span className="text-[#64748B]">AI Engine</span>
                <span className="text-[#7C3AED] font-semibold flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};
