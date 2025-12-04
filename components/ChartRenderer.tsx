/**
 * ChartRenderer Component
 * Renders Chart.js charts and exports them as dataURLs for PPTX embedding
 */

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartConfiguration,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { ChartExportResult, ChartType } from '@/lib/chartHelpers';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartRendererProps {
  priceConfig: ChartConfiguration<'line'> | null;
  revenueConfig: ChartConfiguration | null;
  marketShareConfig: ChartConfiguration<'pie'> | null;
  enabledCharts: {
    pricePerformance: boolean;
    revenueGrowth: boolean;
    marketShare: boolean;
  };
  onChartsReady: (charts: ChartExportResult[]) => void;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  priceConfig,
  revenueConfig,
  marketShareConfig,
  enabledCharts,
  onChartsReady,
}) => {
  const priceChartRef = useRef<ChartJS<'line'>>(null);
  const revenueChartRef = useRef<ChartJS<'bar'>>(null);
  const marketShareChartRef = useRef<ChartJS<'pie'>>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  // Export charts to dataURLs
  const exportCharts = useCallback(async () => {
    if (isExporting || exportComplete) return;
    
    setIsExporting(true);
    const results: ChartExportResult[] = [];

    // Wait for charts to fully render
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      // Export Price Performance chart
      if (enabledCharts.pricePerformance && priceChartRef.current) {
        const canvas = priceChartRef.current.canvas;
        if (canvas) {
          const dataURL = canvas.toDataURL('image/png', 1.0);
          results.push({
            type: 'pricePerformance',
            dataURL,
            title: 'Stock Price Performance',
          });
        }
      }

      // Export Revenue Growth chart
      if (enabledCharts.revenueGrowth && revenueChartRef.current) {
        const canvas = revenueChartRef.current.canvas;
        if (canvas) {
          const dataURL = canvas.toDataURL('image/png', 1.0);
          results.push({
            type: 'revenueGrowth',
            dataURL,
            title: 'Revenue & Growth',
          });
        }
      }

      // Export Market Share chart
      if (enabledCharts.marketShare && marketShareChartRef.current) {
        const canvas = marketShareChartRef.current.canvas;
        if (canvas) {
          const dataURL = canvas.toDataURL('image/png', 1.0);
          results.push({
            type: 'marketShare',
            dataURL,
            title: 'Market Share',
          });
        }
      }

      setExportComplete(true);
      onChartsReady(results);
    } catch (error) {
      console.error('Error exporting charts:', error);
      onChartsReady([]);
    } finally {
      setIsExporting(false);
    }
  }, [enabledCharts, isExporting, exportComplete, onChartsReady]);

  // Trigger export after charts are rendered
  useEffect(() => {
    const hasCharts = 
      (enabledCharts.pricePerformance && priceConfig) ||
      (enabledCharts.revenueGrowth && revenueConfig) ||
      (enabledCharts.marketShare && marketShareConfig);

    if (hasCharts && !exportComplete) {
      const timer = setTimeout(exportCharts, 1000);
      return () => clearTimeout(timer);
    }
  }, [priceConfig, revenueConfig, marketShareConfig, enabledCharts, exportCharts, exportComplete]);

  // If no charts enabled, call onChartsReady with empty array
  useEffect(() => {
    if (!enabledCharts.pricePerformance && !enabledCharts.revenueGrowth && !enabledCharts.marketShare) {
      onChartsReady([]);
    }
  }, [enabledCharts, onChartsReady]);

  return (
    <div className="space-y-6">
      {/* Price Performance Chart */}
      {enabledCharts.pricePerformance && priceConfig && (
        <div className="bg-white p-4 rounded-lg border border-lazard-light">
          <h3 className="text-sm font-semibold text-lazard-gray mb-3">
            Price Performance Chart
          </h3>
          <div className="w-full h-64">
            <Line
              ref={priceChartRef}
              data={priceConfig.data}
              options={priceConfig.options}
            />
          </div>
        </div>
      )}

      {/* Revenue Growth Chart */}
      {enabledCharts.revenueGrowth && revenueConfig && (
        <div className="bg-white p-4 rounded-lg border border-lazard-light">
          <h3 className="text-sm font-semibold text-lazard-gray mb-3">
            Revenue & Growth Chart
          </h3>
          <div className="w-full h-64">
            <Bar
              ref={revenueChartRef}
              data={revenueConfig.data as any}
              options={revenueConfig.options as any}
            />
          </div>
        </div>
      )}

      {/* Market Share Chart */}
      {enabledCharts.marketShare && marketShareConfig && (
        <div className="bg-white p-4 rounded-lg border border-lazard-light">
          <h3 className="text-sm font-semibold text-lazard-gray mb-3">
            Market Share Chart
          </h3>
          <div className="w-full h-64 flex justify-center">
            <div className="w-80">
              <Pie
                ref={marketShareChartRef}
                data={marketShareConfig.data}
                options={marketShareConfig.options}
              />
            </div>
          </div>
        </div>
      )}

      {/* Export status */}
      {isExporting && (
        <div className="text-center py-2">
          <p className="text-sm text-lazard-gray animate-pulse">
            Exporting charts...
          </p>
        </div>
      )}

      {exportComplete && (
        <div className="text-center py-2">
          <p className="text-sm text-green-600 flex items-center justify-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Charts ready for export
          </p>
        </div>
      )}
    </div>
  );
};

export default ChartRenderer;





