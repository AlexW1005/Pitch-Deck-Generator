/**
 * LoadingSpinner Component
 * Displays a professional loading spinner with optional message
 */

import React from 'react';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className={clsx('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={clsx(
          'animate-spin rounded-full border-lazard-light border-t-lazard-accent',
          sizeClasses[size]
        )}
        style={{ borderTopColor: 'var(--theme-accent, #2563eb)' }}
      />
      {message && (
        <p className="text-sm text-lazard-gray animate-pulse">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;





