import React from 'react';
import { motion } from 'framer-motion';

interface RepCounterProps {
    reps: number;
    targetReps: number;
}

// One ring segment per target rep; a segment fills when that rep is counted
export const RepCounter: React.FC<RepCounterProps> = ({ reps, targetReps }) => {
    const total = Math.max(1, targetReps);
    const size = 168, r = 70, c = size / 2, gap = 4;
    const seg = 360 / total;
    const arc = (i: number) => {
        const a0 = ((i * seg + gap / 2 - 90) * Math.PI) / 180;
        const a1 = (((i + 1) * seg - gap / 2 - 90) * Math.PI) / 180;
        const large = seg - gap > 180 ? 1 : 0;
        return `M${c + r * Math.cos(a0)},${c + r * Math.sin(a0)} A${r},${r} 0 ${large} 1 ${c + r * Math.cos(a1)},${c + r * Math.sin(a1)}`;
    };
    const done = Math.min(reps, total);

    return (
        <section className="bg-white border border-rule rounded-[4px] p-5 flex items-center gap-5" aria-live="polite">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 w-32 h-32 sm:w-[168px] sm:h-[168px]" aria-hidden="true">
                {Array.from({ length: total }, (_, i) => (
                    <path key={`bg-${i}`} d={arc(i)} stroke="#E6EDEC" strokeWidth={12} fill="none" strokeLinecap="butt" />
                ))}
                {Array.from({ length: done }, (_, i) => (
                    <motion.path key={`on-${i}`} d={arc(i)} stroke="#00806E" strokeWidth={12} fill="none"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }} />
                ))}
                <motion.text key={reps} x={c} y={c + 14} textAnchor="middle" fontSize={48} fontFamily="Newsreader, Georgia, serif" fill="#10181B"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16 }}>
                    {reps}
                </motion.text>
            </svg>
            <div>
                <p className="font-serif text-[22px] text-ink">Reps</p>
                <p className="text-muted"><span className="tabular">{reps}</span> of {total}</p>
                {reps >= total && <p className="text-primary font-semibold mt-1">Target reached</p>}
            </div>
        </section>
    );
};
