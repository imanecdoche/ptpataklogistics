import React, { useState, useMemo } from 'react';
import { DispatchTransaction } from '@/types/database';

interface DashboardInlineChartProps {
  transactions: DispatchTransaction[];
  hideMargin?: boolean;
}

type ChartCategory = 'ritase' | 'financial';
type RitaseMetric = 'trips' | 'volumeDt' | 'volumeTon';
type FinancialMetric = 'revenue' | 'profit';

export function DashboardInlineChart({
  transactions,
  hideMargin = false
}: DashboardInlineChartProps): React.JSX.Element {
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
          label = 'Ritase';
          formatted = `${val} Trip`;
        } else if (ritaseMetric === 'volumeDt') {
          val = d.volumeDt;
          label = 'Volume DT';
          formatted = `${val.toLocaleString('id-ID')} DT`;
        } else {
          val = d.volumeTon;
          label = 'Volume Ton';
          formatted = `${val.toLocaleString('id-ID')} Ton`;
        }
      } else {
        if (financialMetric === 'revenue') {
          val = d.revenue;
          label = 'Omzet';
          formatted = formatRupiah(val);
        } else {
          val = d.profit;
          label = 'Laba Bersih';
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

  // Statistik Ringkasan
  const stats = useMemo(() => {
    if (pointsData.length === 0) return { peak: '0', avg: '0', total: '0' };
    const values = pointsData.map(p => p.val);
    const maxVal = Math.max(...values);
    const sumVal = values.reduce((a, b) => a + b, 0);
    const avgVal = sumVal / values.length;

    const isCurrency = activeCategory === 'financial';

    return {
      peak: isCurrency ? formatRupiah(maxVal) : `${maxVal.toLocaleString('id-ID')}`,
      avg: isCurrency ? formatRupiah(avgVal) : `${Math.round(avgVal).toLocaleString('id-ID')}`,
      total: isCurrency ? formatRupiah(sumVal) : `${sumVal.toLocaleString('id-ID')}`
    };
  }, [pointsData, activeCategory]);

  // Ukuran Canvas SVG
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 25;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingY * 2;

  const maxVal = Math.max(...pointsData.map(p => p.val), 1);

  // Hitung koordinat (x, y) tiap titik
  const coords = useMemo(() => {
    const totalPts = pointsData.length;
    return pointsData.map((p, idx) => {
      const x = totalPts === 1 ? svgWidth / 2 : paddingX + (idx / (totalPts - 1)) * chartW;
      const y = paddingY + chartH - (p.val / maxVal) * chartH;
      return {
        ...p,
        x,
        y
      };
    });
  }, [pointsData, maxVal, chartW, chartH]);

  // Buat path kurva SVG
  const linePath = useMemo(() => {
    if (coords.length === 0) return '';
    if (coords.length === 1) {
      const pt = coords[0];
      if (!pt) return '';
      return `M ${pt.x - 20} ${pt.y} L ${pt.x + 20} ${pt.y}`;
    }

    return coords.reduce((acc, pt, idx) => {
      if (idx === 0) return `M ${pt.x} ${pt.y}`;
      return `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  }, [coords]);

  // Buat path gradien area di bawah garis
  const firstPt = coords[0];
  const lastPt = coords[coords.length - 1];
  const areaPath =
    coords.length > 0 && firstPt && lastPt
      ? `${linePath} L ${lastPt.x} ${paddingY + chartH} L ${firstPt.x} ${paddingY + chartH} Z`
      : '';

  return (
    <div className="bg-white rounded-[10px] p-4 sm:p-5 border border-[#eaeaea] shadow-xs space-y-4 animate-in fade-in duration-200">
      {/* Header Inline Chart */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#f0f0f0] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-[#f0f0f0] flex items-center justify-center shrink-0">
            <img src="/icons/chart-line.png" alt="" className="w-4 h-4 object-contain" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#111111] tracking-tight">Grafik Tren Operasional</h2>
            <p className="text-[11px] text-[#777777]">Visualisasi fluktuasi ritase armada & performa finansial</p>
          </div>
        </div>

        {/* Category Switcher */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveCategory('ritase')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-colors cursor-pointer ${
              activeCategory === 'ritase'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-[#f5f5f5] text-[#666666] hover:bg-[#eaeaea]'
            }`}
          >
            Tren Ritase & Volume
          </button>
          {!hideMargin && (
            <button
              type="button"
              onClick={() => setActiveCategory('financial')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-bold transition-colors cursor-pointer ${
                activeCategory === 'financial'
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'bg-[#f5f5f5] text-[#666666] hover:bg-[#eaeaea]'
              }`}
            >
              Tren Finansial
            </button>
          )}
        </div>
      </div>

      {/* Metric Selector Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
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
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  ritaseMetric === m.id
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#666666] border-[#e5e5e5] hover:bg-[#f5f5f5]'
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
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                  financialMetric === m.id
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#666666] border-[#e5e5e5] hover:bg-[#f5f5f5]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Chart Viewport & Tooltip Area */}
      <div className="relative w-full bg-[#fafafa] rounded-[10px] border border-[#eaeaea] p-3 flex flex-col items-center">
        {/* SVG Line Chart */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-44 sm:h-52 select-none overflow-visible"
        >
          <defs>
            <linearGradient id="inlineChartGradient" x1="0" y1="0" x2="0" y2="1">
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
          {areaPath && <path d={areaPath} fill="url(#inlineChartGradient)" />}

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
                fill="#111111"
                stroke="#ffffff"
                strokeWidth={hoveredPoint?.date === pt.date ? "2.5" : "2"}
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
        <div className="w-full flex justify-between px-6 pt-1 text-[10px] text-[#888888]">
          <span>{coords[0]?.date || ''}</span>
          {coords.length > 2 && (
            <span>{coords[Math.floor(coords.length / 2)]?.date || ''}</span>
          )}
          <span>{coords[coords.length - 1]?.date || ''}</span>
        </div>

        {/* Floating Tooltip Box */}
        {hoveredPoint && (
          <div className="mt-2.5 px-3 py-1.5 bg-[#111111] text-white rounded-[6px] shadow-lg text-[11px] flex items-center gap-1.5 animate-in fade-in duration-150">
            <span className="text-zinc-300">{hoveredPoint.date}:</span>
            <span className="font-bold text-white">{hoveredPoint.formatted}</span>
          </div>
        )}
      </div>

      {/* Quick Statistics Summary Cards */}
      <div className="grid grid-cols-3 gap-2.5">
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
  );
}
