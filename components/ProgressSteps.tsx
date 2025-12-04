/**
 * ProgressSteps Component
 * Shows the current progress of deck generation
 */

import React from 'react';
import clsx from 'clsx';
import { ProgressStep } from '@/lib/types';

interface Step {
  id: ProgressStep;
  label: string;
}

const STEPS: Step[] = [
  { id: 'fetching-profile', label: 'Fetching company profile' },
  { id: 'fetching-financials', label: 'Fetching financials' },
  { id: 'fetching-peers', label: 'Loading peer data' },
  { id: 'building-charts', label: 'Building charts' },
  { id: 'generating-pptx', label: 'Generating PowerPoint' },
  { id: 'complete', label: 'Complete' },
];

interface ProgressStepsProps {
  currentStep: ProgressStep;
  error?: string;
}

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  currentStep,
  error,
}) => {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="space-y-3">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = step.id === currentStep && currentStep !== 'error';
          const isPending = index > currentIndex;
          const isError = currentStep === 'error' && index === currentIndex;

          return (
            <div
              key={step.id}
              className={clsx(
                'flex items-center gap-3 py-2 px-3 rounded-lg transition-all duration-300',
                isCompleted && 'bg-green-50',
                isActive && 'bg-blue-50',
                isError && 'bg-red-50',
                isPending && 'opacity-50'
              )}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {isCompleted && (
                  <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {isActive && (
                  <div className="h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                )}
                {isError && (
                  <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                {isPending && (
                  <div className="h-6 w-6 rounded-full border-2 border-lazard-silver" />
                )}
              </div>

              {/* Label */}
              <span
                className={clsx(
                  'text-sm font-medium',
                  isCompleted && 'text-green-700',
                  isActive && 'text-blue-700',
                  isError && 'text-red-700',
                  isPending && 'text-lazard-silver'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ProgressSteps;





