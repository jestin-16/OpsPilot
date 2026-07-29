import React, { useRef, useState, useCallback } from 'react';

interface LoginTiltPanelProps {
  children: React.ReactNode;
  className?: string;
}

const MAX_TILT = 14;

export const LoginTiltPanel: React.FC<LoginTiltPanelProps> = ({ children, className = '' }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('rotateX(0deg) rotateY(0deg)');

  const handleMove = useCallback((clientX: number, clientY: number) => {
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width - 0.5;
    const py = (clientY - rect.top) / rect.height - 0.5;
    setTransform(`rotateX(${(-py * MAX_TILT).toFixed(2)}deg) rotateY(${(px * MAX_TILT).toFixed(2)}deg)`);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseLeave = () => {
    setTransform('rotateX(0deg) rotateY(0deg)');
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) handleMove(touch.clientX, touch.clientY);
  };

  return (
    <div
      className={`login-perspective w-full max-w-md ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseLeave}
    >
      <div
        ref={panelRef}
        className="login-tilt-panel"
        style={{ transform }}
      >
        <div className="login-tilt-panel-surface [transform-style:preserve-3d]">
          <div className="login-tilt-shine" />
          {children}
        </div>
      </div>
    </div>
  );
};
