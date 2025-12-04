/**
 * ErrorBox Component
 * Displays error messages with helpful suggestions
 */

import React from 'react';
import clsx from 'clsx';

interface ErrorBoxProps {
  title?: string;
  message: string;
  suggestion?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorBox: React.FC<ErrorBoxProps> = ({
  title = 'Error',
  message,
  suggestion,
  onRetry,
  onDismiss,
  className,
}) => {
  return (
    <div
      className={clsx(
        'bg-red-50 border border-red-200 rounded-lg p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Error Icon */}
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800">{title}</h3>
          <p className="mt-1 text-sm text-red-700">{message}</p>
          {suggestion && (
            <p className="mt-2 text-sm text-red-600 italic">{suggestion}</p>
          )}

          {/* Actions */}
          {(onRetry || onDismiss) && (
            <div className="mt-3 flex gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1.5 text-sm font-medium text-red-800 bg-red-100 
                           rounded hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 
                           hover:text-red-800 transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * WarningBox Component
 * For non-critical warnings
 */
export const WarningBox: React.FC<Omit<ErrorBoxProps, 'onRetry'>> = ({
  title = 'Warning',
  message,
  suggestion,
  onDismiss,
  className,
}) => {
  return (
    <div
      className={clsx(
        'bg-amber-50 border border-amber-200 rounded-lg p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-amber-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-800">{title}</h3>
          <p className="mt-1 text-sm text-amber-700">{message}</p>
          {suggestion && (
            <p className="mt-2 text-sm text-amber-600 italic">{suggestion}</p>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="mt-2 text-sm font-medium text-amber-600 
                       hover:text-amber-800 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * InfoBox Component
 * For informational messages
 */
export const InfoBox: React.FC<Omit<ErrorBoxProps, 'onRetry'>> = ({
  title = 'Information',
  message,
  suggestion,
  onDismiss,
  className,
}) => {
  return (
    <div
      className={clsx(
        'bg-blue-50 border border-blue-200 rounded-lg p-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-blue-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-800">{title}</h3>
          <p className="mt-1 text-sm text-blue-700">{message}</p>
          {suggestion && (
            <p className="mt-2 text-sm text-blue-600">{suggestion}</p>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="mt-2 text-sm font-medium text-blue-600 
                       hover:text-blue-800 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorBox;





