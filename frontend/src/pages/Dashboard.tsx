import React, { useEffect, useState } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';
import { api, type Project } from '../services/api';
import { Link } from 'react-router-dom';
import { FolderGit2, Rocket, Container, Activity, Plus, Shield, ArrowRight, BookOpen, Globe, Boxes } from 'lucide-react';

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
      <div className="p-8 max-w-[1500px] mx-auto space-y-8 animate-fade-in-up">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-cyan-500">{user?.name || 'Developer'}</span>
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-2">
              Internal Developer Platform overview and system metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/guide"
              className="px-5 py-2.5 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>Platform Guide</span>
            </Link>
            <Link
              to="/projects"
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md hover:shadow-indigo-500/30"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel rounded-2xl p-6 shadow-sm flex items-center justify-between hover:-translate-y-1 transition-transform duration-300">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Projects</div>
              <div className="text-3xl font-black text-slate-800 mt-2">{loading ? '...' : projects.length}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <FolderGit2 className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 shadow-sm flex items-center justify-between hover:-translate-y-1 transition-transform duration-300">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deployments</div>
              <div className="text-3xl font-black text-slate-800 mt-2">Active</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Rocket className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 shadow-sm flex items-center justify-between hover:-translate-y-1 transition-transform duration-300">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Docker Containers</div>
              <div className="text-3xl font-black text-slate-800 mt-2">Healthy</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Container className="w-6 h-6" />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6 shadow-sm flex items-center justify-between hover:-translate-y-1 transition-transform duration-300">
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Role</div>
              <div className="text-3xl font-black text-slate-800 mt-2 capitalize">{user?.roles?.[0] || 'Developer'}</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Shield className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Recent Projects Section */}
          <div className="lg:col-span-2 glass-panel rounded-2xl p-6 shadow-sm hover:-translate-y-1 transition-transform duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">Recent Projects</h2>
              <Link to="/projects" className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-400 text-sm font-medium animate-pulse">Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-4 font-medium">No microservice projects created yet.</p>
                <Link
                  to="/projects"
                  className="inline-flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Create First Project
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 3).map((project) => (
                  <div
                    key={project.id}
                    className="p-5 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-indigo-300 hover:shadow-md transition-all group"
                  >
                    <div>
                      <div className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">{project.projectName}</div>
                      <div className="text-xs font-medium text-slate-500 mt-1">{project.description}</div>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      {project.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side Panel: Platform Status */}
          <div className="glass-panel rounded-2xl p-6 shadow-sm hover:-translate-y-1 transition-transform duration-300 space-y-6">
            <h2 className="text-lg font-bold text-slate-800">Platform Status</h2>
            <div className="space-y-4 text-sm font-medium">
              
              <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                <span className="text-slate-600 font-bold flex items-center gap-2"><Globe className="w-4 h-4 text-slate-400" /> API Gateway</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ONLINE
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                <span className="text-slate-600 font-bold flex items-center gap-2"><Container className="w-4 h-4 text-slate-400" /> Docker Engine</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> ACTIVE
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                <span className="text-slate-600 font-bold flex items-center gap-2"><Boxes className="w-4 h-4 text-slate-400" /> Kubernetes</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> MINIKUBE
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                <span className="text-slate-600 font-bold flex items-center gap-2"><Activity className="w-4 h-4 text-slate-400" /> Trace Collector</span>
                <span className="text-indigo-600 font-bold flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> LISTENING
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};
