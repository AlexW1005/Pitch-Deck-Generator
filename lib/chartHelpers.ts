/**
 * Chart.js Helper Functions
 * Configuration factories and canvas-to-dataURL utilities
 */

import { ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
import { FMPHistoricalPrice, FMPIncomeStatement, PeerData } from './types';

// ============================================
// Theme Colors
// ============================================

export const CHART_COLORS = {
  primary: '#1a2744',
  secondary: '#3d4f5f',
  accent: '#2563eb',
  gray: '#6b7c8a',
  lightGray: '#9ca8b3',
  gridColor: 'rgba(107, 124, 138, 0.1)',
  positive: '#16a34a',
  negative: '#dc2626',
  bars: [
    '#1a2744',
    '#2563eb',
    '#3d4f5f',
    '#6b7c8a',
    '#9ca8b3',
    '#b8860b',
  ],
};

// ============================================
// Base Chart Options
// ============================================

export const baseChartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  animation: false, // Disable for export
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 11,
        },
        color: CHART_COLORS.gray,
        padding: 15,
        usePointStyle: true,
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: CHART_COLORS.primary,
      titleFont: {
        family: 'Inter, system-ui, sans-serif',
        size: 12,
      },
      bodyFont: {
        family: 'Inter, system-ui, sans-serif',
        size: 11,
      },
      padding: 10,
      cornerRadius: 4,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 10,
        },
        color: CHART_COLORS.gray,
      },
    },
    y: {
      grid: {
        color: CHART_COLORS.gridColor,
      },
      ticks: {
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 10,
        },
        color: CHART_COLORS.gray,
      },
    },
  },
};

// ============================================
// Price Performance Chart
// ============================================

export interface PriceChartData {
  labels: string[];
  prices: number[];
  normalizedPrices: number[];
}

/**
 * Process historical prices for chart
 * Normalizes to 100 at start date for easy comparison
 */
export function processPriceData(
  historicalPrices: FMPHistoricalPrice[],
  maxPoints: number = 250
): PriceChartData {
  // Sort by date ascending
  const sorted = [...historicalPrices].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Sample to reduce data points
  const step = Math.max(1, Math.floor(sorted.length / maxPoints));
  const sampled = sorted.filter((_, index) => index % step === 0);

  // Normalize prices to 100 at start
  const startPrice = sampled[0]?.close || 1;
  const normalizedPrices = sampled.map((p) => (p.close / startPrice) * 100);

  return {
    labels: sampled.map((p) => {
      const date = new Date(p.date);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }),
    prices: sampled.map((p) => p.close),
    normalizedPrices,
  };
}

/**
 * Create Price Performance chart configuration
 */
export function createPricePerformanceConfig(
  data: PriceChartData,
  companyName: string,
  themeColor: string = CHART_COLORS.accent
): ChartConfiguration<'line'> {
  return {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: `${companyName} (Normalized)`,
          data: data.normalizedPrices,
          borderColor: themeColor,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.1,
          fill: false,
        },
      ],
    },
    options: {
      ...baseChartOptions,
      plugins: {
        ...baseChartOptions.plugins,
        title: {
          display: true,
          text: 'Stock Price Performance (5Y, Normalized to 100)',
          font: {
            family: 'Crimson Pro, Georgia, serif',
            size: 14,
            weight: 'bold',
          },
          color: CHART_COLORS.primary,
          padding: { bottom: 15 },
        },
      },
      scales: {
        ...baseChartOptions.scales,
        y: {
          ...baseChartOptions.scales?.y,
          title: {
            display: true,
            text: 'Indexed Price',
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 10,
            },
            color: CHART_COLORS.gray,
          },
        },
      },
    } as ChartOptions<'line'>,
  };
}

// ============================================
// Revenue & Growth Chart
// ============================================

export interface RevenueChartData {
  labels: string[];
  revenues: number[];
  growthRates: (number | null)[];
}

/**
 * Process income statements for revenue chart
 */
export function processRevenueData(incomeStatements: FMPIncomeStatement[]): RevenueChartData {
  // Sort by year ascending
  const sorted = [...incomeStatements].sort(
    (a, b) => parseInt(a.calendarYear) - parseInt(b.calendarYear)
  );

  const revenues = sorted.map((s) => s.revenue / 1e9); // Convert to billions
  const growthRates: (number | null)[] = [null]; // First year has no growth rate

  for (let i = 1; i < sorted.length; i++) {
    const prevRevenue = sorted[i - 1].revenue;
    const currRevenue = sorted[i].revenue;
    if (prevRevenue > 0) {
      growthRates.push(((currRevenue - prevRevenue) / prevRevenue) * 100);
    } else {
      growthRates.push(null);
    }
  }

  return {
    labels: sorted.map((s) => s.calendarYear),
    revenues,
    growthRates,
  };
}

/**
 * Create Revenue & Growth combo chart configuration
 */
export function createRevenueGrowthConfig(
  data: RevenueChartData,
  themeColor: string = CHART_COLORS.accent
): ChartConfiguration<'bar' | 'line'> {
  return {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
        {
          type: 'bar',
          label: 'Revenue ($B)',
          data: data.revenues,
          backgroundColor: CHART_COLORS.primary,
          borderColor: CHART_COLORS.primary,
          borderWidth: 0,
          borderRadius: 4,
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: 'YoY Growth (%)',
          data: data.growthRates as number[],
          borderColor: themeColor,
          backgroundColor: themeColor,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: themeColor,
          tension: 0.2,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      ...baseChartOptions,
      plugins: {
        ...baseChartOptions.plugins,
        title: {
          display: true,
          text: 'Revenue & Year-over-Year Growth',
          font: {
            family: 'Crimson Pro, Georgia, serif',
            size: 14,
            weight: 'bold',
          },
          color: CHART_COLORS.primary,
          padding: { bottom: 15 },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 10,
            },
            color: CHART_COLORS.gray,
          },
        },
        y: {
          type: 'linear',
          position: 'left',
          grid: {
            color: CHART_COLORS.gridColor,
          },
          ticks: {
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 10,
            },
            color: CHART_COLORS.gray,
            callback: (value) => `$${value}B`,
          },
          title: {
            display: true,
            text: 'Revenue ($B)',
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 10,
            },
            color: CHART_COLORS.gray,
          },
        },
        y1: {
          type: 'linear',
          position: 'right',
          grid: {
            display: false,
          },
          ticks: {
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 10,
            },
            color: themeColor,
            callback: (value) => `${value}%`,
          },
          title: {
            display: true,
            text: 'Growth (%)',
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 10,
            },
            color: themeColor,
          },
        },
      },
    } as ChartOptions,
  } as ChartConfiguration<'bar' | 'line'>;
}

// ============================================
// Market Share Chart
// ============================================

export interface MarketShareData {
  labels: string[];
  values: number[];
  percentages: number[];
}

/**
 * Calculate market share from company and peer revenues
 */
export function calculateMarketShare(
  companyRevenue: number,
  companyName: string,
  peersData: PeerData[],
  peerRevenues: Map<string, number>
): MarketShareData {
  const companies: { name: string; revenue: number }[] = [
    { name: companyName, revenue: companyRevenue },
  ];

  // Add peers with known revenues
  peersData.forEach((peer) => {
    const revenue = peerRevenues.get(peer.symbol);
    if (revenue && revenue > 0) {
      companies.push({ name: peer.companyName, revenue });
    }
  });

  // Sort by revenue descending and take top 6
  const sorted = companies.sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  const total = sorted.reduce((sum, c) => sum + c.revenue, 0);

  return {
    labels: sorted.map((c) => c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name),
    values: sorted.map((c) => c.revenue),
    percentages: sorted.map((c) => (c.revenue / total) * 100),
  };
}

/**
 * Create Market Share pie chart configuration
 */
export function createMarketShareConfig(
  data: MarketShareData,
  themeColor: string = CHART_COLORS.accent
): ChartConfiguration<'pie'> {
  const colors = [themeColor, ...CHART_COLORS.bars.slice(1)];

  return {
    type: 'pie',
    data: {
      labels: data.labels,
      datasets: [
        {
          data: data.percentages,
          backgroundColor: colors.slice(0, data.labels.length),
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            font: {
              family: 'Inter, system-ui, sans-serif',
              size: 10,
            },
            color: CHART_COLORS.gray,
            padding: 10,
            usePointStyle: true,
          },
        },
        title: {
          display: true,
          text: 'Market Share (by Revenue)',
          font: {
            family: 'Crimson Pro, Georgia, serif',
            size: 14,
            weight: 'bold',
          },
          color: CHART_COLORS.primary,
          padding: { bottom: 15 },
        },
        tooltip: {
          enabled: true,
          backgroundColor: CHART_COLORS.primary,
          callbacks: {
            label: (context) => {
              const value = context.parsed;
              return `${context.label}: ${value.toFixed(1)}%`;
            },
          },
        },
      },
    },
  };
}

// ============================================
// Canvas to DataURL Export
// ============================================

/**
 * Render a Chart.js chart to a canvas and export as dataURL
 * This is used client-side to generate images for PPTX export
 */
export async function renderChartToDataURL(
  config: ChartConfiguration,
  width: number = 800,
  height: number = 400
): Promise<string> {
  // This function should be called client-side where Chart.js is available
  // It creates an offscreen canvas, renders the chart, and exports as PNG
  
  if (typeof window === 'undefined') {
    throw new Error('renderChartToDataURL must be called client-side');
  }

  const { Chart, registerables } = await import('chart.js');
  Chart.register(...registerables);

  // Create offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Create and render chart
  const chart = new Chart(ctx, config);

  // Wait for rendering
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Export as PNG dataURL
  const dataURL = canvas.toDataURL('image/png', 1.0);

  // Cleanup
  chart.destroy();

  return dataURL;
}

// ============================================
// Export Chart Configurations
// ============================================

export type ChartType = 'pricePerformance' | 'revenueGrowth' | 'marketShare';

export interface ChartExportResult {
  type: ChartType;
  dataURL: string;
  title: string;
}

/**
 * Generate all charts as dataURLs for export
 */
export async function generateAllCharts(
  priceData: PriceChartData | null,
  revenueData: RevenueChartData | null,
  marketShareData: MarketShareData | null,
  companyName: string,
  themeColor: string,
  enabledCharts: { pricePerformance: boolean; revenueGrowth: boolean; marketShare: boolean }
): Promise<ChartExportResult[]> {
  const results: ChartExportResult[] = [];

  if (enabledCharts.pricePerformance && priceData && priceData.prices.length > 0) {
    const config = createPricePerformanceConfig(priceData, companyName, themeColor);
    const dataURL = await renderChartToDataURL(config, 900, 450);
    results.push({
      type: 'pricePerformance',
      dataURL,
      title: 'Stock Price Performance',
    });
  }

  if (enabledCharts.revenueGrowth && revenueData && revenueData.revenues.length > 0) {
    const config = createRevenueGrowthConfig(revenueData, themeColor);
    const dataURL = await renderChartToDataURL(config as ChartConfiguration, 900, 450);
    results.push({
      type: 'revenueGrowth',
      dataURL,
      title: 'Revenue & Growth',
    });
  }

  if (enabledCharts.marketShare && marketShareData && marketShareData.values.length > 1) {
    const config = createMarketShareConfig(marketShareData, themeColor);
    const dataURL = await renderChartToDataURL(config, 800, 500);
    results.push({
      type: 'marketShare',
      dataURL,
      title: 'Market Share',
    });
  }

  return results;
}





