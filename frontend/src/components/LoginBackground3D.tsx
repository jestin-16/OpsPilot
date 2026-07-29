import React from 'react';

function Cube({ className }: { className: string }) {
  return (
    <div className={`login-3d-cube ${className}`}>
      <div className="login-3d-cube-inner">
        <div className="login-3d-cube-face login-3d-cube-face--front" />
        <div className="login-3d-cube-face login-3d-cube-face--back" />
        <div className="login-3d-cube-face login-3d-cube-face--right" />
        <div className="login-3d-cube-face login-3d-cube-face--left" />
        <div className="login-3d-cube-face login-3d-cube-face--top" />
        <div className="login-3d-cube-face login-3d-cube-face--bottom" />
      </div>
    </div>
  );
}

export const LoginBackground3D: React.FC = () => {
  return (
    <div className="login-3d-scene" aria-hidden>
      <div className="login-3d-glow login-3d-glow--accent" />
      <div className="login-3d-glow login-3d-glow--rose" />
      <div className="login-3d-scene-inner">
        <div className="login-3d-floor-wrap">
          <div className="login-3d-floor" />
        </div>
        <div className="login-3d-cube-stage">
          <Cube className="login-3d-cube--1" />
          <Cube className="login-3d-cube--2" />
          <Cube className="login-3d-cube--3" />
        </div>
      </div>
      <div className="login-3d-vignette" />
    </div>
  );
};
