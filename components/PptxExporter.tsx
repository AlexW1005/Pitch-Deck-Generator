/**
 * PptxExporter Component
 * Handles the PPTX generation and download
 */

'use client';

import React, { useState } from 'react';
import { CompanyData, FormData } from '@/lib/types';
import { ChartExportResult } from '@/lib/chartHelpers';
import { generatePitchDeck } from '@/lib/pptxTemplates';
import { LoadingSpinner } from './LoadingSpinner';

interface PptxExporterProps {
  companyData: CompanyData;
  formData: FormData;
  charts: ChartExportResult[];
  disabled?: boolean;
}

export const PptxExporter: React.FC<PptxExporterProps> = ({
  companyData,
  formData,
  charts,
  disabled = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);

    try {
      console.log('Starting PPTX generation...');
      console.log('Company data:', companyData);
      console.log('Form data:', formData);
      console.log('Charts:', charts.length);
      
      // Generate the PPTX
      const blob = await generatePitchDeck(companyData, formData, charts);
      
      console.log('PPTX generated, blob size:', blob.size);

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formData.outputFilename || 'stock-pitch'}.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setExportError(`Failed to generate PowerPoint: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={disabled || isExporting}
        className="btn-accent w-full flex items-center justify-center gap-3 py-4"
        style={{ backgroundColor: formData.themeColor }}
      >
        {isExporting ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Generating PowerPoint...</span>
          </>
        ) : exportSuccess ? (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Downloaded!</span>
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Download PPTX</span>
          </>
        )}
      </button>

      {/* Error message */}
      {exportError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{exportError}</p>
          <button
            onClick={() => setExportError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success message */}
      {exportSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
          <p className="text-sm text-green-700 flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            PowerPoint downloaded successfully!
          </p>
        </div>
      )}

      {/* Info text */}
      <div className="text-xs text-center text-lazard-gray space-y-1">
        <p>
          <strong>{companyData.profile?.companyName}</strong> ({companyData.profile?.symbol})
        </p>
        <p>
          {charts.length} chart{charts.length !== 1 ? 's' : ''} •{' '}
          16 slides • 16:9 format
        </p>
      </div>

      {/* Disclaimer */}
      <div className="p-3 bg-lazard-cream rounded-lg border border-lazard-light">
        <p className="text-xs text-lazard-gray leading-relaxed">
          <strong>Note:</strong> Data fetched from Financial Modeling Prep (FMP). 
          Verify all data and assumptions before using for investment decisions. 
          This is not investment advice.
        </p>
      </div>
    </div>
  );
};

export default PptxExporter;





