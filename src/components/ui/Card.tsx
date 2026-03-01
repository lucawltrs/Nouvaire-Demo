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
      className={`bg-card rounded-lg border border-border ${
        glow ? 'shadow-md' : 'shadow-sm'
      } ${
        hover ? 'transition-all duration-200 hover:border-brand-500 hover:shadow-lg' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
