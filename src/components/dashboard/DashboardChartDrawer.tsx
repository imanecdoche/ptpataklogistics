import React, { useState, useMemo } from 'react';
import { DispatchTransaction } from '@/types/database';

interface DashboardChartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: DispatchTransaction[];
  hideMargin?: boolean;
}

type ChartCategory = 'ritase' | 'financial';
type RitaseMetric = 'trips' | 'volumeDt' | 'volumeTon';
type FinancialMetric = 'revenue' | 'profit';

export function DashboardChartDrawer({
  isOpen,
  onClose,
  transactions,
  hideMargin = false
}: DashboardChartDrawerProps): React.JSX.Element | null {
  const [activeCategory, setActiveCategory] = useState<ChartCategory>('ritase');
  const [ritaseMetric, setRitaseMetric] = useState<RitaseMetric>('trips');
  const [financialMetric, setFinancialMetric] = useState<FinancialMetric>('revenue');
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    label: string;
    val: number;
    formatted: string;
    x: number;
    y: number;
  } | null>(null);

  // Agregasi transaksi per tanggal (diurutkan tanggal kronologis)
  const chartData = useMemo(() => {
    const map = new Map<
      string,
      {
        date: string;
        trips: number;
        volumeDt: number;
        volumeTon: number;
        revenue: number;
        profit: number;
      }
    >();

    transactions.forEach(t => {
      const d = t.deliveryDate || t.createdAt?.slice(0, 10) || 'Unknown';
      const existing = map.get(d) || {
        date: d,
        trips: 0,
        volumeDt: 0,
        volumeTon: 0,
        revenue: 0,
        profit: 0
      };

      existing.trips += 1;
      const qty = Number(t.quantity) || 0;
      if (t.unit === 'Ton') {
        existing.volumeTon += qty;
      } else {
        existing.volumeDt += qty;
      }
      existing.revenue += Number(t.totalRevenue) || 0;
      existing.profit += Number(t.netProfit) || 0;

      map.set(d, existing);
    });

    const sorted = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Jika data kosong, sediakan 1 dummy titik hari ini
    if (sorted.length === 0) {
      const today = new Date().toISOString().slice(0, 10);
      return [
        {
          date: today,
          trips: 0,
          volumeDt: 0,
          volumeTon: 0,
          revenue: 0,
          profit: 0
        }
      ];
    }

    return sorted;
  }, [transactions]);

  // Format Helper
  const formatRupiah = (val: number): string => {
    return 'Rp ' + Math.round(val).toLocaleString('id-ID');
  };

  const pointsData = useMemo(() => {
    return chartData.map(d => {
      let val = 0;
      let label = '';
      let formatted = '';

      if (activeCategory === 'ritase') {
        if (ritaseMetric === 'trips') {
          val = d.trips;
          label = 'Jumlah Ritase';
          formatted = `${val} Trip`;
        } else if (ritaseMetric === 'volumeDt') {
          val = Math.round(d.volumeDt);
          label = 'Volume DT';
          formatted = `${val} DT`;
        } else {
          val = Number(d.volumeTon.toFixed(1));
          label = 'Volume Ton';
          formatted = `${val} Ton`;
        }
      } else {
        if (financialMetric === 'revenue') {
          val = d.revenue;
          label = 'Omzet Penjualan';
          formatted = formatRupiah(val);
        } else {
          val = d.profit;
          label = 'Estimasi Laba Bersih';
          formatted = formatRupiah(val);
        }
      }

      return {
        date: d.date,
        val,
        label,
        formatted
      };
    });
  }, [chartData, activeCategory, ritaseMetric, financialMetric]);

  // Kalkulasi Statistik Ringkasan (Puncak, Rata-rata, Total)
  const stats = useMemo(() => {
    if (pointsData.length === 0) return { peak: '0', avg: '0', total: '0' };
    const values = pointsData.map(p => p.val);
    const max = Math.max(...values, 0);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / values.length);

    const isMoney = activeCategory === 'financial';
    return {
      peak: isMoney ? formatRupiah(max) : `${max}`,
      avg: isMoney ? formatRupiah(avg) : `${avg}`,
      total: isMoney ? formatRupiah(sum) : `${sum}`
    };
  }, [pointsData, activeCategory]);

  if (!isOpen) return null;

  // SVG Drawing Dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const maxVal = Math.max(...pointsData.map(p => p.val), 1);
  const minVal = 0;

  // Koordinat titik SVG
  const coords = pointsData.map((p, idx) => {
    const x =
      pointsData.length === 1
        ? paddingX + chartW / 2
        : paddingX + (idx / (pointsData.length - 1)) * chartW;
    const y = paddingY + chartH - ((p.val - minVal) / (maxVal - minVal)) * chartH;
    return { ...p, x, y };
  });

  // Buat path garis SVG
  const linePath = coords.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Buat path gradien area di bawah garis
  const firstPt = coords[0];
  const lastPt = coords[coords.length - 1];
  const areaPath =
    coords.length > 0 && firstPt && lastPt
      ? `${linePath} L ${lastPt.x} ${paddingY + chartH} L ${firstPt.x} ${paddingY + chartH} Z`
      : '';

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel Bottom Sheet */}
      <div className="relative z-10 bg-white rounded-t-[18px] border-t border-[#eaeaea] shadow-2xl max-h-[90vh] flex flex-col w-full max-w-3xl mx-auto overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Handle Bar */}
        <div className="pt-3 pb-1 flex flex-col items-center cursor-pointer select-none" onClick={onClose}>
          <div className="w-9 h-1.5 rounded-full bg-[#d5d5d5] mb-2" />
        </div>

        {/* Drawer Header */}
        <div className="px-5 pb-3 border-b border-[#f0f0f0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/icons/chart-line.png" alt="" className="w-5 h-5 object-contain" />
            <div>
              <h2 className="text-sm font-bold text-[#111111] tracking-tight">Grafik Tren Garis</h2>
              <p className="text-[11px] text-[#777777]">Visualisasi performa logistik & ritase armada</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#888888] hover:text-[#111111] p-1 rounded-md transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Sub-Tab Category Switcher */}
        <div className="px-5 pt-3 pb-2 flex items-center gap-2 border-b border-[#f0f0f0] bg-[#fafafa]">
          <button
            type="button"
            onClick={() => setActiveCategory('ritase')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-colors ${
              activeCategory === 'ritase'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'text-[#666666] hover:bg-[#eaeaea]'
            }`}
          >
            Tren Ritase & Volume
          </button>
          {!hideMargin && (
            <button
              type="button"
              onClick={() => setActiveCategory('financial')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-colors ${
                activeCategory === 'financial'
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'text-[#666666] hover:bg-[#eaeaea]'
              }`}
            >
              Tren Finansial
            </button>
          )}
        </div>

        {/* Metric Selector Pills */}
        <div className="px-5 pt-3 pb-1 flex items-center gap-2 overflow-x-auto text-xs">
          {activeCategory === 'ritase' ? (
            <>
              {[
                { id: 'trips', label: 'Jumlah Trip Ritase' },
                { id: 'volumeDt', label: 'Volume (DT)' },
                { id: 'volumeTon', label: 'Volume (Ton)' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setRitaseMetric(m.id as RitaseMetric)}
                  className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border transition-colors ${
                    ritaseMetric === m.id
                      ? 'bg-[#e5e5e5] text-[#111111] border-[#cccccc]'
                      : 'bg-white text-[#777777] border-[#e5e5e5] hover:bg-[#f5f5f5]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </>
          ) : (
            <>
              {[
                { id: 'revenue', label: 'Omzet Penjualan' },
                { id: 'profit', label: 'Estimasi Laba Bersih' }
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setFinancialMetric(m.id as FinancialMetric)}
                  className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border transition-colors ${
                    financialMetric === m.id
                      ? 'bg-[#e5e5e5] text-[#111111] border-[#cccccc]'
                      : 'bg-white text-[#777777] border-[#e5e5e5] hover:bg-[#f5f5f5]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Chart Viewport & Tooltip Area */}
        <div className="p-5 flex-1 overflow-y-auto">
          <div className="relative w-full bg-[#fafafa] rounded-[10px] border border-[#eaeaea] p-2 flex flex-col items-center">
            {/* SVG Line Chart */}
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-48 sm:h-56 select-none overflow-visible"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#111111" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#111111" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = paddingY + chartH * (1 - ratio);
                return (
                  <line
                    key={i}
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="#eaeaea"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Area Under Curve */}
              {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

              {/* Line Curve */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#111111"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Dots */}
              {coords.map((pt, idx) => (
                <g key={idx}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.date === pt.date ? 6 : 4}
                    fill={hoveredPoint?.date === pt.date ? '#0e9f6e' : '#111111'}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onClick={() => setHoveredPoint(pt)}
                  />
                  {/* Invisible hit target for easy touch */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={16}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onClick={() => setHoveredPoint(pt)}
                  />
                </g>
              ))}
            </svg>

            {/* X-Axis Date Labels */}
            <div className="w-full flex justify-between px-6 pt-1 text-[10px] text-[#888888] font-mono">
              <span>{coords[0]?.date || ''}</span>
              {coords.length > 2 && (
                <span>{coords[Math.floor(coords.length / 2)]?.date || ''}</span>
              )}
              <span>{coords[coords.length - 1]?.date || ''}</span>
            </div>

            {/* Floating Tooltip Box */}
            {hoveredPoint && (
              <div className="mt-2.5 p-2 bg-[#111111] text-white rounded-[6px] shadow-lg text-[11px] flex items-center gap-2 animate-in fade-in duration-150">
                <span className="text-emerald-400 font-bold">●</span>
                <span className="font-mono text-zinc-300">{hoveredPoint.date}:</span>
                <span className="font-bold">{hoveredPoint.formatted}</span>
              </div>
            )}
          </div>

          {/* Quick Statistics Summary Cards */}
          <div className="grid grid-cols-3 gap-2.5 mt-4">
            <div className="p-3 bg-white rounded-[8px] border border-[#eaeaea] text-center">
              <span className="text-[10px] text-[#777777] font-medium block">Puncak Tertinggi</span>
              <span className="text-xs sm:text-sm font-bold text-[#111111] truncate block mt-0.5">
                {stats.peak}
              </span>
            </div>
            <div className="p-3 bg-white rounded-[8px] border border-[#eaeaea] text-center">
              <span className="text-[10px] text-[#777777] font-medium block">Rata-rata Harian</span>
              <span className="text-xs sm:text-sm font-bold text-[#111111] truncate block mt-0.5">
                {stats.avg}
              </span>
            </div>
            <div className="p-3 bg-white rounded-[8px] border border-[#eaeaea] text-center">
              <span className="text-[10px] text-[#777777] font-medium block">Akumulasi Total</span>
              <span className="text-xs sm:text-sm font-bold text-[#111111] truncate block mt-0.5">
                {stats.total}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
