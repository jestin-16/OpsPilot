import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Terminal, 
  ShieldCheck, 
  Bot, 
  Globe, 
  Server,
  ArrowRight,
  MonitorPlay
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-[#4F46E5] selection:text-white font-sans overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#4F46E5] opacity-10 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#06B6D4] opacity-10 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] rounded-xl flex items-center justify-center shadow-lg shadow-[#4F46E5]/20">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">OpsPilot</span>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign in
          </button>
          <button 
            onClick={() => navigate('/signup')}
            className="px-5 py-2.5 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-slate-900/10"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-600 mb-8 backdrop-blur-md shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-[#10B981] animate-ping"></span>
          v1.0 Now Live
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight text-slate-900">
          The Intelligent <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] via-[#818CF8] to-[#06B6D4]">
            Developer Platform
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-12 leading-relaxed">
          Unify your microservices, automate root-cause analysis, and deploy with extreme confidence. Built for modern DevOps teams.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={() => navigate('/signup')}
            className="px-8 py-4 text-base font-bold bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] text-white rounded-xl hover:shadow-xl hover:shadow-[#4F46E5]/30 transition-all hover:-translate-y-1 group flex items-center gap-2"
          >
            Start Monitoring Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="px-8 py-4 text-base font-bold bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <Terminal className="w-5 h-5 text-slate-400" />
            View Documentation
          </button>
        </div>
      </main>

      {/* Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-8 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <FeatureCard 
            icon={<MonitorPlay className="w-6 h-6 text-[#06B6D4]" />}
            title="Blackbox Probing"
            description="Continuous simulated traffic, geo-latency mapping, and headless browser rendering to guarantee user experience."
          />
          
          <FeatureCard 
            icon={<Server className="w-6 h-6 text-[#4F46E5]" />}
            title="Whitebox Telemetry"
            description="Deep JVM insights, live CPU/Memory scraping, and actuator integration for absolute internal observability."
          />
          
          <FeatureCard 
            icon={<Bot className="w-6 h-6 text-[#8B5CF6]" />}
            title="AI Root Cause Analysis"
            description="Instant correlation of deployment timestamps with crash logs to automatically diagnose and remediate failures."
          />

          <FeatureCard 
            icon={<ShieldCheck className="w-6 h-6 text-[#10B981]" />}
            title="Security Scanning"
            description="Automated port scanning, SQL injection testing, and header inspection on every deployment."
          />

          <FeatureCard 
            icon={<Globe className="w-6 h-6 text-[#F59E0B]" />}
            title="Global DNS & TLS"
            description="Advanced DNS chain verification, IPv6 support mapping, and SSL certificate validation."
          />

          <FeatureCard 
            icon={<Activity className="w-6 h-6 text-[#F43F5E]" />}
            title="Distributed Tracing"
            description="Track requests across microservice boundaries with full Zipkin and Prometheus integration."
          />

        </div>
      </section>

      {/* Footer border */}
      <div className="border-t border-slate-200 relative z-10 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-8 flex items-center justify-between text-slate-500 text-sm">
          <p>© 2026 OpsPilot. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-slate-900 cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-slate-900 cursor-pointer transition-colors">GitHub</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeatureCard: React.FC<{icon: React.ReactNode, title: string, description: string}> = ({ icon, title, description }) => (
  <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 group cursor-default shadow-sm">
    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3 text-slate-800">{title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed">
      {description}
    </p>
  </div>
);
