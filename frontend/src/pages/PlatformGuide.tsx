import React from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import {
  BookOpen,
  PlusCircle,
  FolderGit2,
  Terminal,
  FileCode,
  Boxes,
  GitBranch,
  Bot,
  Activity,
  CheckCircle2,
  Layers
} from 'lucide-react';

export const PlatformGuide: React.FC = () => {
  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8 bg-[#F8FAFC]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E2E8F0] pb-6">
          <div>
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-[#4F46E5]" />
              <h1 className="text-2xl font-bold text-[#0F172A]">Platform guide & project setup note</h1>
            </div>
            <p className="text-sm text-[#64748B] mt-1">
              Complete reference on how OpsPilot works, how to register new projects, and repository setup guidelines
            </p>
          </div>
          <span className="px-3.5 py-1.5 bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] rounded-lg text-xs font-semibold">
            Documentation v1.0
          </span>
        </div>

        {/* Section 1: How OpsPilot Works */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">1. How OpsPilot works</h2>
              <p className="text-xs text-[#64748B]">Unified Internal Developer Platform workflow architecture</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#4F46E5] uppercase tracking-wider">
                <FolderGit2 className="w-4 h-4" />
                <span>Phase 1 & 2: Core Platform</span>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed">
                Registers microservice projects, enforces RBAC, and manages deployment lifecycles (`Draft` → `Building` → `Deploying` → `Running`), automatically provisioning Docker containers and Minikube Kubernetes pods.
              </p>
            </div>

            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0284C7] uppercase tracking-wider">
                <Activity className="w-4 h-4" />
                <span>Phase 3 & 4: Observability & CI/CD</span>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed">
                Aggregates Actuator system metrics (CPU, Memory, Requests), ingests structured JSON logs, delivers real-time Kafka notifications, and processes GitHub Actions webhook events.
              </p>
            </div>

            <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#7C3AED] uppercase tracking-wider">
                <Bot className="w-4 h-4" />
                <span>Phase 5: AI Diagnostic Engine</span>
              </div>
              <p className="text-xs text-[#475569] leading-relaxed">
                Uses a timestamp proximity correlation algorithm to match deployment timestamps against container error logs, producing high-confidence root-cause diagnoses and remediation steps.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: How to Add a New Project */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">2. How to add a new project</h2>
              <p className="text-xs text-[#64748B]">Step-by-step instructions for registering microservices in the platform</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="w-6 h-6 rounded-full bg-[#4F46E5] text-[#FFFFFF] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <div>
                <h3 className="text-xs font-bold text-[#0F172A]">Navigate to Projects page</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Click on **Projects** in the left sidebar menu (or go to URL `/projects`).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="w-6 h-6 rounded-full bg-[#4F46E5] text-[#FFFFFF] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <div>
                <h3 className="text-xs font-bold text-[#0F172A]">Click "+ New project"</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Click the **`+ New project`** button at the top right of the Projects header.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="w-6 h-6 rounded-full bg-[#4F46E5] text-[#FFFFFF] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <div>
                <h3 className="text-xs font-bold text-[#0F172A]">Fill in project metadata</h3>
                <div className="mt-2 space-y-1.5 text-xs text-[#334155] font-mono bg-[#FFFFFF] p-3 rounded border border-[#CBD5E1]">
                  <div>• <strong>Project Name</strong>: e.g. <span className="text-[#4F46E5]">Order Gateway</span> or <span className="text-[#4F46E5]">Payment Engine</span></div>
                  <div>• <strong>Repository URL</strong>: e.g. <span className="text-[#0284C7]">https://github.com/opspilot/order-gateway</span></div>
                  <div>• <strong>Description</strong>: Short summary of application functionality</div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="w-6 h-6 rounded-full bg-[#4F46E5] text-[#FFFFFF] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <div>
                <h3 className="text-xs font-bold text-[#0F172A]">Trigger deployment pipeline</h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Once created, click **`Trigger deployment`** on your project card, choose environment (`Production` or `Staging`), enter version tag (`v1.0.0`), and launch!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: What Should Be Included in That Project */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">3. What should be included in the project repository</h2>
              <p className="text-xs text-[#64748B]">Required repository structure and configuration manifests</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0F172A]">
                <FileCode className="w-4 h-4 text-[#4F46E5]" />
                <span>1. Application Source Code</span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Standard microservice application (Java/Spring Boot, Node.js, Python, Go, etc.) implementing core business APIs.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0F172A]">
                <Terminal className="w-4 h-4 text-[#0284C7]" />
                <span>2. Dockerfile</span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Container build specification. OpsPilot automatically tags and tracks built images following the naming convention:<br />
                <code className="text-[11px] font-mono text-[#0284C7] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#E2E8F0] block mt-1">
                  opspilot/&lt;project-name-slug&gt;:&lt;version&gt;
                </code>
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0F172A]">
                <Boxes className="w-4 h-4 text-[#4F46E5]" />
                <span>3. Kubernetes Manifests (`k8s.yaml`)</span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Pod resource requests & limits specs for Minikube cluster scheduling:<br />
                • <strong>CPU</strong>: Request `125m`, Limit `250m`<br />
                • <strong>Memory</strong>: Request `256Mi`, Limit `512Mi`
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0F172A]">
                <GitBranch className="w-4 h-4 text-[#7C3AED]" />
                <span>4. GitHub Actions Webhook</span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Webhook URL in GitHub Repo Settings → Webhooks:<br />
                <code className="text-[11px] font-mono text-[#7C3AED] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#E2E8F0] block mt-1">
                  http://&lt;opspilot-host&gt;:8080/api/webhooks/github
                </code>
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#4F46E5] shrink-0 mt-0.5" />
            <div className="text-xs text-[#3730A3] leading-relaxed">
              <strong>Structured JSON Logging Rule:</strong> Ensure your application logs severity levels (`INFO`, `WARN`, `ERROR`). When an error occurs, the <strong>OpsPilot AI Assistant</strong> correlates error timestamps with deployment execution times to generate automated root-cause diagnoses.
            </div>
          </div>
        </div>

        {/* Section 4: Whitebox Monitoring */}
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-4">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">4. Whitebox Monitoring</h2>
              <p className="text-xs text-[#64748B]">Internal system metrics, application performance, and diagnostic tracing</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0F172A]">
                <Activity className="w-4 h-4 text-[#4F46E5]" />
                <span>1. Spring Boot Actuator Metrics</span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Applications expose internal state via `/actuator/metrics`. OpsPilot continuously polls this to track memory usage, CPU load, and thread pools to detect resource exhaustion before it causes a crash.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0F172A]">
                <Layers className="w-4 h-4 text-[#0284C7]" />
                <span>2. Distributed Tracing</span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                By integrating Micrometer and Zipkin, trace IDs are propagated across microservice boundaries. This allows you to track a single request from the API Gateway all the way down to database queries.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0F172A]">
                <Terminal className="w-4 h-4 text-[#4F46E5]" />
                <span>3. Log Aggregation</span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Application logs are ingested centrally. OpsPilot correlates log severity spikes with deployment events and utilizes AI to determine root causes for unhandled exceptions.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-[#0F172A]">
                <CheckCircle2 className="w-4 h-4 text-[#7C3AED]" />
                <span>4. Health Endpoints</span>
              </div>
              <p className="text-xs text-[#64748B] leading-relaxed">
                The `/actuator/health` endpoint provides readiness and liveness probes for Kubernetes. OpsPilot leverages this to understand if dependencies (like Databases or Kafka) are down.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
};
