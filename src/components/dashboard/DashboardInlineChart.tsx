import React, { useState, useMemo } from 'react';
import { DispatchTransaction } from '@/types/database';

interface DashboardInlineChartProps {
  transactions: DispatchTransaction[];
  hideMargin?: boolean;
}

type ChartCategory = 'ritase' | 'financial';
type RitaseMetric = 'trips' | 'volumeDt' | 'volumeTon';
type FinancialMetric = 'revenue' | 'profit';

/**
 * Menghasilkan SVG path kurva smooth (Monotone Cubic Spline / Fritsch-Carlson)
 * Mencegah overshoot pada puncak dan lembah sehingga bentuk kurva mengalir alami dan akurat terhadap data.
 */
function getSmoothCurvePath(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n === 0) return '';
  const first = points[0];
  if (!first) return '';
  if (n === 1) {
    return `M ${first.x - 20} ${first.y} L ${first.x + 20} ${first.y}`;
  }
  const second = points[1];
  if (n === 2 && second) {
    const mx = (first.x + second.x) / 2;
    return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} C ${mx.toFixed(2)} ${first.y.toFixed(2)}, ${mx.toFixed(2)} ${second.y.toFixed(2)}, ${second.x.toFixed(2)} ${second.y.toFixed(2)}`;
  }

  // 1. Secant slopes
  const deltas: number[] = [];
  const dxs: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const pCurrent = points[i];
    const pNext = points[i + 1];
    if (!pCurrent || !pNext) continue;
    const dx = pNext.x - pCurrent.x;
    const dy = pNext.y - pCurrent.y;
    dxs.push(dx);
    deltas.push(dx === 0 ? 0 : dy / dx);
  }

  if (deltas.length < 2) return '';

  // 2. Tangents
  const m: number[] = new Array(n).fill(0);
  m[0] = deltas[0] ?? 0;
  m[n - 1] = deltas[deltas.length - 1] ?? 0;

  for (let i = 1; i < n - 1; i++) {
    const prevDelta = deltas[i - 1] ?? 0;
    const currDelta = deltas[i] ?? 0;
    if (prevDelta * currDelta <= 0) {
      m[i] = 0;
    } else {
      m[i] = (prevDelta + currDelta) / 2;
    }
  }

  // 3. Fritsch-Carlson adjustments to prevent overshoot
  for (let i = 0; i < n - 1; i++) {
    const delta = deltas[i] ?? 0;
    const mi = m[i] ?? 0;
    const miNext = m[i + 1] ?? 0;
    if (delta === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const alpha = mi / delta;
      const beta = miNext / delta;
      const s = alpha * alpha + beta * beta;
      if (s > 9) {
        const tau = 3 / Math.sqrt(s);
        m[i] = tau * alpha * delta;
        m[i + 1] = tau * beta * delta;
      }
    }
  }

  // 4. Generate cubic bezier path
  let path = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const dx = dxs[i] ?? 0;
    const mi = m[i] ?? 0;
    const miNext = m[i + 1] ?? 0;

    if (!p0 || !p1) continue;

    const cp1x = p0.x + dx / 3;
    const cp1y = p0.y + (mi * dx) / 3;

    const cp2x = p1.x - dx / 3;
    const cp2y = p1.y - (miNext * dx) / 3;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }

  return path;
}

/**
 * Format ringkas label angka pada sumbu Y
 */
function formatYAxisLabel(val: number, isCurrency: boolean): string {
  if (val === 0) return '0';
  if (isCurrency) {
    if (val >= 1_000_000_000) {
      const v = (val / 1_000_000_000).toFixed(1).replace(/\.0$/, '');
      return `Rp ${v}M`;
    }
    if (val >= 1_000_000) {
      const v = (val / 1_000_000).toFixed(1).replace(/\.0$/, '');
      return `Rp ${v}jt`;
    }
    if (val >= 1_000) {
      const v = (val / 1_000).toFixed(0);
      return `Rp ${v}rb`;
    }
    return `Rp ${Math.round(val)}`;
  }
  // Ritase / Volume
  if (val >= 1_000) {
    return (val / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return Number.isInteger(val) ? val.toString() : val.toFixed(1);
}

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

  // Ukuran Canvas SVG yang lebih lebar, tinggi, dan memiliki ruang sumbu Y di kiri
  const svgWidth = 800;
  const svgHeight = 260;
  const paddingLeft = 56;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 20;
  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  const maxVal = Math.max(...pointsData.map(p => p.val), 1);

  // Hitung koordinat (x, y) tiap titik
  const coords = useMemo(() => {
    const totalPts = pointsData.length;
    return pointsData.map((p, idx) => {
      const x = totalPts === 1 ? (paddingLeft + (svgWidth - paddingRight)) / 2 : paddingLeft + (idx / (totalPts - 1)) * chartW;
      const y = paddingTop + chartH - (p.val / maxVal) * chartH;
      return {
        ...p,
        x,
        y
      };
    });
  }, [pointsData, maxVal, chartW, chartH, paddingLeft, paddingTop]);

  // Buat path kurva SVG yang smooth & luwes tanpa kaku
  const linePath = useMemo(() => {
    return getSmoothCurvePath(coords);
  }, [coords]);

  // Buat path gradien area di bawah garis kurva smooth
  const areaPath = useMemo(() => {
    if (coords.length === 0 || !linePath) return '';
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (!first || !last) return '';
    const baseY = paddingTop + chartH;
    return `${linePath} L ${last.x.toFixed(2)} ${baseY.toFixed(2)} L ${first.x.toFixed(2)} ${baseY.toFixed(2)} Z`;
  }, [coords, linePath, paddingTop, chartH]);

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
            className={`px-3 py-1.5 rounded-[6px] text-xs font-bold border-none transition-colors cursor-pointer whitespace-nowrap ${
              activeCategory === 'ritase'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-[#f0f0f0] text-[#555555] hover:bg-[#e4e4e4]'
            }`}
          >
            Tren Ritase & Volume
          </button>
          {!hideMargin && (
            <button
              type="button"
              onClick={() => setActiveCategory('financial')}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-bold border-none transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === 'financial'
                  ? 'bg-[#111111] text-white shadow-xs'
                  : 'bg-[#f0f0f0] text-[#555555] hover:bg-[#e4e4e4]'
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
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border-none transition-colors cursor-pointer whitespace-nowrap ${
                  ritaseMetric === m.id ? 'bg-[#111111] text-white shadow-xs' : 'bg-[#f0f0f0] text-[#555555] hover:bg-[#e4e4e4]'
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
                className={`px-2.5 py-1 rounded-[6px] text-[11px] font-semibold border-none transition-colors cursor-pointer whitespace-nowrap ${
                  financialMetric === m.id ? 'bg-[#111111] text-white shadow-xs' : 'bg-[#f0f0f0] text-[#555555] hover:bg-[#e4e4e4]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Chart Viewport & Tooltip Area */}
      <div className="relative w-full bg-[#fafafa] rounded-[10px] border border-[#eaeaea] p-3 sm:p-4 flex flex-col items-center select-none">
        {/* SVG Container dengan Relative Wrapper untuk Floating Tooltip tepat di atas titik */}
        <div className="relative w-full">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
            className="w-full h-64 sm:h-72 md:h-80 select-none overflow-visible"
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id="inlineChartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#111111" stopOpacity="0.14" />
                <stop offset="100%" stopColor="#111111" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Sumbu Y Nilai & Horizontal Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = paddingTop + chartH * (1 - ratio);
              const yVal = maxVal * ratio;
              return (
                <g key={i}>
                  {/* Label Nilai Sumbu Y Rata Kanan di Samping Kiri Grid */}
                  <text
                    x={paddingLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fill="#888888"
                    fontSize="10"
                    className="font-mono font-medium select-none"
                  >
                    {formatYAxisLabel(yVal, activeCategory === 'financial')}
                  </text>
                  {/* Gridline Horizontal */}
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#eaeaea"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                </g>
              );
            })}

            {/* Area Under Curve */}
            {areaPath && <path d={areaPath} fill="url(#inlineChartGradient)" />}

            {/* Line Curve Smooth */}
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

            {/* Crosshair indicator vertikal saat titik di-hover */}
            {hoveredPoint && (
              <line
                x1={hoveredPoint.x}
                y1={paddingTop}
                x2={hoveredPoint.x}
                y2={paddingTop + chartH}
                stroke="#111111"
                strokeOpacity="0.15"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            )}

            {/* Interactive Dots */}
            {coords.map((pt, idx) => (
              <g
                key={idx}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
                onFocus={() => setHoveredPoint(pt)}
                onBlur={() => setHoveredPoint(null)}
                tabIndex={0}
                className="outline-none"
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPoint?.date === pt.date ? 6 : 3.5}
                  fill="#111111"
                  stroke="#ffffff"
                  strokeWidth={hoveredPoint?.date === pt.date ? "2.5" : "2"}
                  className="cursor-pointer transition-all duration-150"
                />
                {/* Invisible hit target for easy touch & mouse hover */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={16}
                  fill="transparent"
                  className="cursor-pointer"
                />
              </g>
            ))}
          </svg>

          {/* Floating Dark Pill Tooltip tepat di atas titik yang sedang di-hover */}
          {hoveredPoint && (
            <div
              className="pointer-events-none absolute z-30 transition-all duration-150 ease-out"
              style={{
                left: `${(hoveredPoint.x / svgWidth) * 100}%`,
                top: `${(hoveredPoint.y / svgHeight) * 100}%`,
                transform: (() => {
                  const percentX = (hoveredPoint.x / svgWidth) * 100;
                  if (percentX < 18) return 'translate(-8%, -100%) translateY(-12px)';
                  if (percentX > 82) return 'translate(-92%, -100%) translateY(-12px)';
                  return 'translate(-50%, -100%) translateY(-12px)';
                })()
              }}
            >
              <div className="relative px-3 py-1.5 bg-[#111111] text-white rounded-[7px] shadow-lg text-[11px] whitespace-nowrap flex items-center gap-2 border-none">
                <span className="text-zinc-400 font-mono text-[10px]">{hoveredPoint.date}</span>
                <span className="text-zinc-600">|</span>
                <span className="font-bold text-white tracking-tight">{hoveredPoint.formatted}</span>

                {/* Panah penunjuk halus menghadap ke bawah menuju titik */}
                <div
                  className="absolute -bottom-1 w-2 h-2 bg-[#111111] rotate-45"
                  style={{
                    left: (() => {
                      const percentX = (hoveredPoint.x / svgWidth) * 100;
                      if (percentX < 18) return '15%';
                      if (percentX > 82) return '85%';
                      return '50%';
                    })(),
                    transform: 'translateX(-50%)'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* X-Axis Date Labels presisi di bawah chart */}
        <div
          className="w-full flex justify-between pt-2 text-[10px] text-[#888888]"
          style={{
            paddingLeft: `${(paddingLeft / svgWidth) * 100}%`,
            paddingRight: `${(paddingRight / svgWidth) * 100}%`
          }}
        >
          <span>{coords[0]?.date || ''}</span>
          {coords.length > 2 && (
            <span>{coords[Math.floor(coords.length / 2)]?.date || ''}</span>
          )}
          <span>{coords[coords.length - 1]?.date || ''}</span>
        </div>
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
