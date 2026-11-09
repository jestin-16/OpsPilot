import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Play,
  Code2,
  Layers,
  BarChart3,
  Rocket,
  Activity,
  LayoutDashboard,
  FolderGit2,
  Server,
  Bell,
  Settings,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Info,
  User,
} from 'lucide-react';
import '../styles/hero.css';

export function LandingHero() {
  const navigate = useNavigate();

  return (
    <section className="op-hero-section" aria-labelledby="op-hero-title">
      <div className="op-hero-container">
        <div className="op-hero-grid">
          {/* =========================================================================
              LEFT COLUMN — EDITORIAL TYPOGRAPHY & ACTIONS
             ========================================================================= */}
          <div className="op-hero-left">
            {/* Eyebrow Pill */}
            <div className="op-eyebrow-pill">
              <span className="op-eyebrow-badge">
                <span className="op-eyebrow-dot" />
                <span>DEVELOPER CONTROL PLANE</span>
              </span>
              <span className="op-eyebrow-divider">—</span>
              <span className="op-eyebrow-label">One Project. Every Signal.</span>
            </div>

            {/* 3-Line Editorial Headline */}
            <h1 id="op-hero-title" className="op-hero-headline">
              <span className="op-headline-row">Less noise.</span>
              <span className="op-headline-row">More clarity.</span>
              <span className="op-headline-row op-headline-forest">Built for scale.</span>
            </h1>

            {/* Supporting Description */}
            <p className="op-hero-description">
              Connect your projects, automate deployments and monitor your infrastructure
              through one unified developer control plane.
            </p>

            {/* CTA Buttons */}
            <div className="op-hero-actions">
              <button
                type="button"
                className="op-btn-primary"
                onClick={() => navigate('/signup')}
              >
                <span>Get started</span>
                <ArrowUpRight size={17} strokeWidth={2} />
              </button>
              <button
                type="button"
                className="op-btn-secondary"
                onClick={() => {
                  const target = document.getElementById('platform');
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    navigate('/dashboard');
                  }
                }}
              >
                <span className="op-play-glyph-circle" aria-hidden="true">
                  <Play size={11} fill="#171918" className="translate-x-[1px]" />
                </span>
                <span>Explore OpsPilot</span>
              </button>
            </div>

            {/* 3-Column Capability Section */}
            <div className="op-capability-section">
              <div className="op-capability-col">
                <div className="op-capability-icon">
                  <Code2 size={22} strokeWidth={1.8} />
                </div>
                <div className="op-capability-info">
                  <h3 className="op-capability-title">Connect your stack</h3>
                  <p className="op-capability-subtitle">Projects Connected</p>
                </div>
              </div>

              <div className="op-capability-separator" aria-hidden="true" />

              <div className="op-capability-col">
                <div className="op-capability-icon">
                  <Layers size={22} strokeWidth={1.8} />
                </div>
                <div className="op-capability-info">
                  <h3 className="op-capability-title">Track every release</h3>
                  <p className="op-capability-subtitle">Deployments Managed</p>
                </div>
              </div>

              <div className="op-capability-separator" aria-hidden="true" />

              <div className="op-capability-col">
                <div className="op-capability-icon">
                  <BarChart3 size={22} strokeWidth={1.8} />
                </div>
                <div className="op-capability-info">
                  <h3 className="op-capability-title">See service health</h3>
                  <p className="op-capability-subtitle">Infrastructure Visibility</p>
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              RIGHT COLUMN — LAPTOP SHOWCASE & SCENIC COMPOSITION
             ========================================================================= */}
          <div className="op-hero-right">
            {/* Hand-drawn curly doodle arrow */}
            <svg
              className="op-doodle-arrow"
              width="76"
              height="84"
              viewBox="0 0 76 84"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M16 10C28 4 48 8 46 25C44 38 24 40 25 53C26 60 36 63 46 65"
                stroke="#171918"
                strokeWidth="1.9"
                strokeLinecap="round"
              />
              <path
                d="M38 66L47 65L44 57"
                stroke="#171918"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Dark Forest Green Background Circle */}
            <div className="op-forest-circle" aria-hidden="true" />

            {/* Botanical Plant Leaves */}
            <div className="op-botanical-leaves" aria-hidden="true">
              <img
                src="/hero-botanical-clean.png"
                alt=""
                className="op-botanical-img"
                loading="eager"
              />
            </div>

            {/* Botanical Planter Pot (Sitting on floor right behind pedestal) */}
            <div className="op-botanical-pot" aria-hidden="true">
              <div className="op-pot-cylinder">
                <div className="op-pot-rim" />
                <div className="op-pot-body" />
              </div>
            </div>

            {/* Architectural Stone / Concrete Pedestal */}
            <div className="op-pedestal-container" aria-hidden="true">
              <div className="op-pedestal-block">
                <div className="op-pedestal-top-surface" />
                <div className="op-pedestal-front-face" />
                <div className="op-pedestal-ambient-shadow" />
              </div>
            </div>

            {/* Tilted 3D Laptop Mockup displaying OpsPilot Dashboard */}
            <div className="op-laptop-wrapper">
              <div className="op-laptop-3d">
                {/* Screen Lid */}
                <div className="op-laptop-lid">
                  {/* Outer Bezel Rim */}
                  <div className="op-laptop-rim">
                    {/* Top Webcam Dot */}
                    <div className="op-laptop-webcam" />

                    {/* High-Resolution Screen Surface */}
                    <div className="op-screen-surface">
                      {/* Subtle Screen Glass Sheen */}
                      <div className="op-screen-glare" />

                      {/* Inside Dashboard Content */}
                      <div className="op-dash-preview">
                        {/* Topbar */}
                        <div className="op-dash-topbar">
                          <div className="op-dash-brand">
                            <div className="op-dash-logo-icon">
                              <svg width="15" height="15" viewBox="0 0 36 36" fill="none">
                                <rect width="36" height="36" rx="8" fill="#183B32" />
                                <path
                                  d="M10 24.5L18 11.5L26 24.5"
                                  stroke="#FFFFFF"
                                  strokeWidth="3.4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                            <div className="op-dash-brand-labels">
                              <span className="op-dash-brand-main">OPS/PILOT</span>
                              <span className="op-dash-brand-sub">CONTROL PLANE</span>
                            </div>
                          </div>

                          <div className="op-dash-topbar-right">
                            <span className="op-dash-preview-badge">
                              <span>Product preview</span>
                              <Info size={10} className="text-[#858585]" />
                            </span>
                            <div className="op-dash-topbar-action">
                              <Bell size={11} className="text-[#555555]" />
                            </div>
                            <div className="op-dash-topbar-avatar">
                              <User size={11} className="text-[#555555]" />
                            </div>
                          </div>
                        </div>

                        {/* Body Layout */}
                        <div className="op-dash-layout">
                          {/* Left Navigation Sidebar */}
                          <div className="op-dash-nav-sidebar">
                            <div className="op-nav-link active">
                              <LayoutDashboard size={11} />
                              <span>Overview</span>
                            </div>
                            <div className="op-nav-link">
                              <FolderGit2 size={11} />
                              <span>Projects</span>
                            </div>
                            <div className="op-nav-link">
                              <Rocket size={11} />
                              <span>Deployments</span>
                              <ChevronRight size={9} className="op-nav-arrow" />
                            </div>
                            <div className="op-nav-link">
                              <Server size={11} />
                              <span>Infrastructure</span>
                              <ChevronDown size={9} className="op-nav-arrow" />
                            </div>
                            <div className="op-nav-link">
                              <Activity size={11} />
                              <span>Observability</span>
                              <ChevronDown size={9} className="op-nav-arrow" />
                            </div>
                            <div className="op-nav-link">
                              <Bell size={11} />
                              <span>Alerts</span>
                            </div>
                            <div className="op-nav-link">
                              <Settings size={11} />
                              <span>Settings</span>
                            </div>
                          </div>

                          {/* Main Operations Area */}
                          <div className="op-dash-main-area">
                            {/* Overview Header */}
                            <div className="op-dash-area-header">
                              <div>
                                <h4 className="op-dash-area-title">Overview</h4>
                                <p className="op-dash-area-subtitle">Your operations at a glance</p>
                              </div>
                              <div className="op-dash-date-filter">
                                <span>This Week</span>
                                <ChevronDown size={10} />
                              </div>
                            </div>

                            {/* 3 Quick Navigation Tiles */}
                            <div className="op-dash-tiles-row">
                              <div className="op-dash-mini-tile">
                                <FolderGit2 size={11} className="text-[#171918]" />
                                <span>Projects</span>
                                <ChevronRight size={9} className="text-[#858585] ml-auto" />
                              </div>
                              <div className="op-dash-mini-tile">
                                <Rocket size={11} className="text-[#171918]" />
                                <span>Deployments</span>
                                <ChevronRight size={9} className="text-[#858585] ml-auto" />
                              </div>
                              <div className="op-dash-mini-tile">
                                <Layers size={11} className="text-[#171918]" />
                                <span>Services</span>
                                <ChevronRight size={9} className="text-[#858585] ml-auto" />
                              </div>
                            </div>

                            {/* Split Activity & Health Row */}
                            <div className="op-dash-split-grid">
                              {/* Left Panel: Recent Activity */}
                              <div className="op-dash-card op-card-recent-activity">
                                <div className="op-dash-card-header">
                                  <span className="op-card-heading">Recent Activity</span>
                                  <span className="op-card-header-link">View all →</span>
                                </div>
                                <div className="op-activity-stream">
                                  <div className="op-activity-row">
                                    <CheckCircle2 size={11} className="text-[#10B981] shrink-0" />
                                    <div className="op-activity-detail">
                                      <span className="op-activity-name">API Service</span>
                                      <span className="op-activity-action">— Deployed</span>
                                    </div>
                                    <span className="op-activity-time">12 min ago</span>
                                  </div>
                                  <div className="op-activity-row">
                                    <CheckCircle2 size={11} className="text-[#10B981] shrink-0" />
                                    <div className="op-activity-detail">
                                      <span className="op-activity-name">Worker Service</span>
                                      <span className="op-activity-action">— Updated</span>
                                    </div>
                                    <span className="op-activity-time">28 min ago</span>
                                  </div>
                                  <div className="op-activity-row">
                                    <CheckCircle2 size={11} className="text-[#10B981] shrink-0" />
                                    <div className="op-activity-detail">
                                      <span className="op-activity-name">Web App</span>
                                      <span className="op-activity-action">— Redeployed</span>
                                    </div>
                                    <span className="op-activity-time">1 hr ago</span>
                                  </div>
                                  <div className="op-activity-row">
                                    <CheckCircle2 size={11} className="text-[#10B981] shrink-0" />
                                    <div className="op-activity-detail">
                                      <span className="op-activity-name">Gateway</span>
                                      <span className="op-activity-action">— Synced</span>
                                    </div>
                                    <span className="op-activity-time">2 hr ago</span>
                                  </div>
                                </div>
                              </div>

                              {/* Right Panel: Service Health */}
                              <div className="op-dash-card op-card-service-health">
                                <div className="op-dash-card-header">
                                  <span className="op-card-heading">Service Health</span>
                                </div>
                                <div className="op-health-container">
                                  <div className="op-health-donut">
                                    <svg width="48" height="48" viewBox="0 0 48 48">
                                      <circle
                                        cx="24"
                                        cy="24"
                                        r="18"
                                        fill="none"
                                        stroke="#E8EEE9"
                                        strokeWidth="5"
                                      />
                                      <circle
                                        cx="24"
                                        cy="24"
                                        r="18"
                                        fill="none"
                                        stroke="#10B981"
                                        strokeWidth="5"
                                        strokeDasharray="113.1"
                                        strokeDashoffset="11"
                                        strokeLinecap="round"
                                        transform="rotate(-90 24 24)"
                                      />
                                    </svg>
                                  </div>
                                  <div className="op-health-meta">
                                    <span className="op-health-label">Healthy</span>
                                    <span className="op-health-sub">All systems operational</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Laptop Base (Keyboard Deck & Aluminum Lip) */}
                <div className="op-laptop-base-deck">
                  <div className="op-laptop-hinge" />
                  <div className="op-laptop-aluminum-lip">
                    <div className="op-laptop-thumb-notch" />
                  </div>
                </div>
              </div>
            </div>

            {/* =========================================================================
                3 FLOATING INFORMATION CARDS
               ========================================================================= */}

            {/* CARD 1 — DEPLOYMENT */}
            <div className="op-float-card op-card-deployment">
              <div className="op-card-icon-wrapper">
                <Rocket size={17} className="text-[#171918]" />
              </div>
              <div className="op-card-content">
                <span className="op-card-eyebrow">Deployment</span>
                <h4 className="op-card-main-title">API Service</h4>
                <div className="op-card-status-line">
                  <span className="op-status-dots-pair">
                    <span className="op-dot" />
                    <span className="op-dot" />
                  </span>
                  <span>Deployment successful</span>
                </div>
              </div>
            </div>

            {/* CARD 2 — INFRASTRUCTURE */}
            <div className="op-float-card op-card-infrastructure">
              <div className="op-card-icon-wrapper op-card-icon-k8s">
                {/* Kubernetes Logo */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L3.5 7V17L12 22L20.5 17V7L12 2Z"
                    stroke="#326CE5"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" stroke="#326CE5" strokeWidth="1.8" />
                  <path
                    d="M12 9V5M12 15V19M9.5 10.5L6 8.5M14.5 13.5L18 15.5M9.5 13.5L6 15.5M14.5 10.5L18 8.5"
                    stroke="#326CE5"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <div className="op-card-content">
                <span className="op-card-eyebrow">Infrastructure</span>
                <h4 className="op-card-main-title">Kubernetes</h4>
                <div className="op-card-status-line">
                  <span>Cluster connected</span>
                  <span className="op-dot op-dot-right" />
                </div>
              </div>
            </div>

            {/* CARD 3 — OBSERVABILITY */}
            <div className="op-float-card op-card-observability">
              <div className="op-card-icon-wrapper">
                <Activity size={17} className="text-[#171918]" />
              </div>
              <div className="op-card-content">
                <span className="op-card-eyebrow">Observability</span>
                <h4 className="op-card-main-title">Application Health</h4>
                <div className="op-card-status-line">
                  <span>All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
