import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function Card({ children, className = '', hover = false, glow = false }: CardProps) {
  return (
    <div
      className={`bg-gray-800 rounded-lg border border-gray-700 ${
        glow ? 'shadow-lg shadow-cyan-500/10' : ''
      } ${
        hover ? 'transition-all duration-200 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
