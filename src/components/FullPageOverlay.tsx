import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface FullPageOverlayProps {
  children: ReactNode;
  className?: string;
}

export default function FullPageOverlay({ children, className = '' }: FullPageOverlayProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return createPortal(
    <div className={`fixed inset-0 z-[200] overflow-y-auto flex flex-col ${className}`}>
      {children}
    </div>,
    document.body,
  );
}
