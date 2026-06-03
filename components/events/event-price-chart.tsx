"use client";

import { useMemo, useRef, useState } from "react";
import type { EventPriceHistory } from "@/lib/events/price-history";

const PALETTE = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#a855f7", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

const VIEW_W = 760;
const VIEW_H = 320;
const PAD = { top: 16, right: 16, bottom: 28, left: 36 };
const PLOT_W = VIEW_W - PAD.left - PAD.right;
const PLOT_H = VIEW_H - PAD.top - PAD.bottom;

interface EventPriceChartProps {
  history: EventPriceHistory;
}

export function EventPriceChart({ history }: EventPriceChartProps) {
  const { outcomes, points } = history;
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const times = useMemo(
    () => points.map((p) => new Date(p.t).getTime()),
    [points]
  );

  const { tMin, tSpan } = useMemo(() => {
    if (times.length === 0) return { tMin: 0, tSpan: 1 };
    const min = times[0]!;
    const max = times[times.length - 1]!;
    return { tMin: min, tSpan: Math.max(1, max - min) };
  }, [times]);

  if (points.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center text-slate-400 text-sm">
        אין עדיין נתוני מסחר להצגת גרף.
      </div>
    );
  }

  const xFor = (t: number) =>
    PAD.left + ((t - tMin) / tSpan) * PLOT_W;
  const yFor = (cents: number) =>
    PAD.top + (1 - Math.max(0, Math.min(100, cents)) / 100) * PLOT_H;

  // Stepped path: price holds constant until the next trade.
  const pathFor = (outcomeId: string): string => {
    if (points.length === 1) {
      const x = xFor(times[0]!);
      const y = yFor(points[0]!.prices[outcomeId] ?? 0);
      return `M ${x} ${y} L ${PAD.left + PLOT_W} ${y}`;
    }
    let d = "";
    points.forEach((p, i) => {
      const x = xFor(times[i]!);
      const y = yFor(p.prices[outcomeId] ?? 0);
      if (i === 0) {
        d += `M ${x} ${y}`;
      } else {
        d += ` H ${x} V ${y}`;
      }
    });
    return d;
  };

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    // Nearest point by x.
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < times.length; i++) {
      const dist = Math.abs(xFor(times[i]!) - svgX);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    setActiveIndex(best);
  };

  const toggle = (id: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const active = activeIndex !== null ? points[activeIndex] : null;
  const activeX = activeIndex !== null ? xFor(times[activeIndex]!) : 0;
  const tooltipLeftPct = (activeX / VIEW_W) * 100;
  const tooltipOnRight = tooltipLeftPct > 60;

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleString("he-IL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
      <h2 className="text-lg font-semibold text-white mb-3">
        סיכויי השוק לאורך זמן
      </h2>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-auto select-none"
          onMouseMove={handleMove}
          onMouseLeave={() => setActiveIndex(null)}
        >
          {yTicks.map((tick) => {
            const y = yFor(tick);
            return (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + PLOT_W}
                  y1={y}
                  y2={y}
                  stroke="#334155"
                  strokeWidth={1}
                  strokeDasharray={tick === 0 || tick === 100 ? undefined : "3 4"}
                />
                <text
                  x={PAD.left - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-500"
                  fontSize={10}
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {outcomes.map((o, i) => {
            if (hidden.has(o.id)) return null;
            const color = PALETTE[i % PALETTE.length];
            return (
              <path
                key={o.id}
                d={pathFor(o.id)}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinejoin="round"
              />
            );
          })}

          {active && (
            <>
              <line
                x1={activeX}
                x2={activeX}
                y1={PAD.top}
                y2={PAD.top + PLOT_H}
                stroke="#64748b"
                strokeWidth={1}
              />
              {outcomes.map((o, i) => {
                if (hidden.has(o.id)) return null;
                return (
                  <circle
                    key={o.id}
                    cx={activeX}
                    cy={yFor(active.prices[o.id] ?? 0)}
                    r={3.5}
                    fill={PALETTE[i % PALETTE.length]}
                    stroke="#0f172a"
                    strokeWidth={1.5}
                  />
                );
              })}
            </>
          )}
        </svg>

        {active && (
          <div
            className="pointer-events-none absolute top-2 z-10 rounded-md border border-slate-600 bg-slate-900/95 px-3 py-2 text-xs shadow-lg"
            style={
              tooltipOnRight
                ? { right: `${100 - tooltipLeftPct}%`, marginRight: 8 }
                : { left: `${tooltipLeftPct}%`, marginLeft: 8 }
            }
          >
            <div className="text-slate-400 mb-1" dir="ltr">
              {dateFmt(active.t)}
            </div>
            {outcomes
              .map((o, i) => ({ o, i }))
              .filter(({ o }) => !hidden.has(o.id))
              .sort(
                (a, b) =>
                  (active.prices[b.o.id] ?? 0) - (active.prices[a.o.id] ?? 0)
              )
              .map(({ o, i }) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-1.5 text-slate-200">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: PALETTE[i % PALETTE.length] }}
                    />
                    {o.label}
                  </span>
                  <span className="tabular-nums text-white" dir="ltr">
                    {active.prices[o.id] ?? 0}%
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {outcomes.map((o, i) => {
          const isHidden = hidden.has(o.id);
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => toggle(o.id)}
              className={`flex items-center gap-1.5 text-xs transition-opacity ${
                isHidden ? "opacity-40" : "opacity-100"
              }`}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: PALETTE[i % PALETTE.length] }}
              />
              <span
                className={`text-slate-300 ${isHidden ? "line-through" : ""}`}
              >
                {o.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
