import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Grid,
  FileText,
  Award,
  Database,
  Bell,
  MessageSquare,
  Moon,
  Settings,
  LogOut,
  Search,
  MoreVertical,
  ChevronDown,
  Clock,
  CheckCircle,
  FileEdit,
  ArrowUpRight,
  Sparkles,
  PlayCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

// Mock Data for Charts
const areaData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 5500 },
  { name: 'Jul', value: 7000 },
];

const pieData = [
  { name: 'Courses', value: 45, color: '#F5821F' },
  { name: 'Exams', value: 25, color: '#3B82F6' },
  { name: 'Assignments', value: 20, color: '#8B5CF6' },
  { name: 'Discussion', value: 10, color: '#EC4899' },
];

const sparklineData = [
  { value: 10 }, { value: 15 }, { value: 8 }, { value: 20 }, { value: 18 }, { value: 25 }, { value: 30 }
];

const tableData = [
  { id: 1, task: 'Cloud Architecture Quiz', due: 'Today, 5:00 PM', type: 'Exam', status: 'Pending', priority: 'High' },
  { id: 2, task: 'React Module Project', due: 'Tomorrow, 11:59 PM', type: 'Assignment', status: 'In Progress', priority: 'Medium' },
  { id: 3, task: 'Weekly Feedback form', due: 'Oct 12, 2026', type: 'Feedback', status: 'Not Started', priority: 'Low' },
  { id: 4, task: 'Database Optimization', due: 'Oct 15, 2026', type: 'Assignment', status: 'In Progress', priority: 'High' },
];

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [assignmentsOpen, setAssignmentsOpen] = useState(true);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-orange-100 text-orange-700';
      case 'In Progress': return 'bg-green-100 text-green-700';
      case 'Not Started': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] flex font-sans text-slate-800">
      {/* Sidebar */}
      <aside className="w-[220px] bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 z-10">
        <div className="p-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#F5821F] flex items-center justify-center rotate-12">
            <div className="w-3 h-3 bg-white rounded-sm -rotate-12"></div>
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">OpsPilot</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {[
            { name: 'Dashboard', icon: LayoutDashboard },
            { name: 'Courses/Projects', icon: BookOpen },
            { name: 'Categories', icon: Grid },
          ].map(item => (
            <button
              key={item.name}
              onClick={() => setActiveNav(item.name)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeNav === item.name 
                  ? 'bg-orange-50 text-[#F5821F] relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-[#F5821F] before:rounded-r-md' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </button>
          ))}

          {/* Collapsible Assignments */}
          <div>
            <button
              onClick={() => { setActiveNav('Assignments'); setAssignmentsOpen(!assignmentsOpen); }}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeNav === 'Assignments' ? 'text-[#F5821F]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" />
                Assignments
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${assignmentsOpen ? 'rotate-180' : ''}`} />
            </button>
            {assignmentsOpen && (
              <div className="pl-11 pr-3 py-1 space-y-1">
                {['Pending', 'Submitted', 'Feedback'].map(sub => (
                  <button key={sub} className="w-full text-left py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900">
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>

          {[
            { name: 'Exams', icon: Award },
            { name: 'Resources', icon: Database },
          ].map(item => (
            <button
              key={item.name}
              onClick={() => setActiveNav(item.name)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </button>
          ))}
          
          <button
            onClick={() => setActiveNav('Notifications')}
            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <div className="flex items-center gap-3"><Bell className="w-5 h-5" /> Notifications</div>
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
          </button>
          
          <button
            onClick={() => setActiveNav('Discussion')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <MessageSquare className="w-5 h-5" /> Discussion
          </button>
        </nav>

        <div className="p-4 space-y-4">
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100/50">
            <h4 className="text-sm font-bold text-slate-900">Upgrade to Pro</h4>
            <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Trial limits</span>
              <span className="text-orange-600 font-bold">12 days left</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-orange-200/50 rounded-full overflow-hidden">
              <div className="h-full bg-[#F5821F] w-[60%] rounded-full"></div>
            </div>
            <button className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-lg transition-colors">
              Upgrade Now
            </button>
          </div>

          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
              <Moon className="w-4 h-4" /> Dark Mode
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
              <Settings className="w-4 h-4" /> Settings
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-red-600 transition-colors">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[220px] p-8 max-w-[1400px]">
        {/* Topbar */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome Back {user?.name || 'Administrator'}!</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Here is what's happening with your projects today.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all w-64 shadow-sm"
              />
            </div>
            <button className="relative p-2 text-slate-500 hover:text-slate-900 transition-colors bg-white border border-slate-200 rounded-full shadow-sm">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            <button className="p-2 text-slate-500 hover:text-slate-900 transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Highlights Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[
            { label: 'Courses Enrolled', value: '12', trend: '+14%', icon: BookOpen },
            { label: 'Projects Completed', value: '48', trend: '+5%', icon: CheckCircle },
            { label: 'Hours Spent', value: '164h', trend: '+22%', icon: Clock },
            { label: 'Average Score', value: '92%', trend: '+2%', icon: Award },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F5821F] flex items-center justify-center">
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" /> {stat.trend}
                </span>
              </div>
              <h3 className="text-slate-500 font-medium text-sm mt-4">{stat.label}</h3>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              
              <div className="absolute -bottom-2 -right-2 w-24 h-12 opacity-30 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sparklineData}>
                    <Line type="monotone" dataKey="value" stroke="#F5821F" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex-1 lg:w-[65%]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900">Progress Overview</h3>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                  All Courses <ChevronDown className="w-3 h-3" />
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                  This Year <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F5821F" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F5821F" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#F5821F', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#F5821F" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:w-[35%] flex flex-col">
            <h3 className="font-bold text-slate-900 mb-6">Weekly Activity Split</h3>
            <div className="relative flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-900">42</span>
                <span className="text-xs font-medium text-slate-500">Total Hours</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-xs font-medium text-slate-600">{item.name}</span>
                  <span className="text-xs font-bold text-slate-900 ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex-1 overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-900">Upcoming Deadlines</h3>
              <div className="flex gap-2">
                <button className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-lg"><Search className="w-4 h-4" /></button>
                <button className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 rounded-lg"><Settings className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-medium">
                    <th className="pb-3 font-medium">Task</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Due Date</th>
                    <th className="pb-3 font-medium">Priority</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tableData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-semibold text-slate-900">{row.task}</td>
                      <td className="py-3 text-slate-500">{row.type}</td>
                      <td className="py-3 text-slate-600">{row.due}</td>
                      <td className="py-3">
                        <span className={`text-xs font-bold ${row.priority === 'High' ? 'text-red-600' : row.priority === 'Medium' ? 'text-orange-500' : 'text-blue-500'}`}>
                          {row.priority}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:w-[30%] flex flex-col">
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#F5821F]" /> Quick Review
            </h3>
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Use AI-assisted lookup to quickly review concepts or find answers across all your courses and resources.
            </p>
            <div className="relative mb-5">
              <input 
                type="text" 
                placeholder="Ask a concept..." 
                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-inner"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center hover:bg-slate-800 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex gap-2 mb-6">
              <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                <BookOpen className="w-3.5 h-3.5" /> Notes
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                <FileEdit className="w-3.5 h-3.5" /> Practice
              </button>
            </div>

            <button className="mt-auto w-full flex items-center justify-center gap-2 py-3.5 bg-[#F5821F] hover:bg-[#e07119] text-white text-sm font-bold rounded-xl shadow-md shadow-orange-500/20 transition-all hover:-translate-y-0.5">
              <PlayCircle className="w-5 h-5" /> Start Quick Quiz
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
