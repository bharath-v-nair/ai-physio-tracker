import React from 'react';

export interface SignalPoint {
    t: number;
    v: number;
}

interface SignalPlotProps {
    points: SignalPoint[];
    tHi: number;
    tLo: number;
    twoSided: boolean;
    unit: string;
    windowSeconds?: number;
}

const W = 320;
const H = 130;

// Live view of the movement signal against the two counting thresholds:
// a rep starts when the line crosses "target" and counts when it comes back under "return".
export const SignalPlot: React.FC<SignalPlotProps> = ({ points, tHi, tLo, twoSided, unit, windowSeconds = 12 }) => {
    const now = points.length ? points[points.length - 1].t : 0;
    const visible = points.filter(p => now - p.t <= windowSeconds);
    const peak = Math.max(tHi * 1.4, ...visible.map(p => Math.abs(p.v)));
    const top = peak;
    const bottom = twoSided ? -peak : -peak * 0.35;
    const x = (t: number) => W - ((now - t) / windowSeconds) * W;
    const y = (v: number) => 6 + ((top - v) / (top - bottom)) * (H - 12);
    const path = visible.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
    const fmt = (v: number) => `${Math.round(v * 10) / 10}${unit}`;

    const guides = [
        { v: tHi, label: `target ${fmt(tHi)}`, color: '#16a34a' },
        { v: tLo, label: `return ${fmt(tLo)}`, color: '#9ca3af' },
        ...(twoSided ? [{ v: -tHi, label: '', color: '#16a34a' }, { v: -tLo, label: '', color: '#9ca3af' }] : []),
    ];

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img"
             aria-label={`Live movement signal with a target line at ${fmt(tHi)} and a return line at ${fmt(tLo)}`}>
            <line x1={0} x2={W} y1={y(0)} y2={y(0)} stroke="#e5e7eb" strokeWidth={1} />
            {guides.map((g, i) => (
                <g key={i}>
                    <line x1={0} x2={W} y1={y(g.v)} y2={y(g.v)} stroke={g.color} strokeWidth={1} strokeDasharray="4 4" />
                    {g.label && <text x={4} y={y(g.v) - 4} fontSize={10} fill={g.color}>{g.label}</text>}
                </g>
            ))}
            {path && <path d={path} fill="none" stroke="#4F8EF7" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
        </svg>
    );
};
