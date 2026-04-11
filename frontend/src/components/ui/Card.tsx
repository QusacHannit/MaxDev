import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className, hover, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl border border-slate-100 shadow-sm p-6',
        hover && 'hover:shadow-md hover:border-violet-200 transition-all duration-200 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;
