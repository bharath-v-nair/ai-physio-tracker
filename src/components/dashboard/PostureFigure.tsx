import React from 'react';
import { motion } from 'framer-motion';

export interface PostureMeasurements {
  head_offset_pct: number | null;
  shoulder_tilt_deg: number | null;
  trunk_lean: string | null;
}

export type Highlight = 'head' | 'shoulders' | 'trunk' | null;

interface Props {
  m: PostureMeasurements;
  highlight?: Highlight;
  /** Change this to replay the draw-in (e.g. the assessment id). */
  drawKey?: string | number;
  headLimit?: number;
  shoulderLimit?: number;
}

const INK = '#10181B';
const TEAL = '#00806E';
const FLAG = '#D9531E';
const FLAG_TEXT = '#B8440F';
const MUTED = '#46555A';

// Lean classes from the posture model, drawn as a small sideways shift of the trunk
const LEAN_DX: Record<string, number> = { TLL: 10, TLR: -10 };

// Front-view body diagram drawn from a posture check's three measurements.
// It isn't a photo: every line comes from a saved number.
export const PostureFigure: React.FC<Props> = ({ m, highlight = null, drawKey, headLimit = 12, shoulderLimit = 5 }) => {
  const headOffset = m.head_offset_pct ?? 0;
  const tilt = m.shoulder_tilt_deg ?? 0;
  const headFlag = headOffset > headLimit;
  const shoulderFlag = tilt > shoulderLimit;
  const trunkFlag = !!m.trunk_lean && m.trunk_lean !== 'TUP';

  const cx = 150, shoulderW = 130, shoulderY = 150, hipY = 290, hipW = 84;
  const dy = Math.tan((tilt * Math.PI) / 180) * (shoulderW / 2);
  const L: [number, number] = [cx - shoulderW / 2, shoulderY + dy];
  const R: [number, number] = [cx + shoulderW / 2, shoulderY - dy];
  const lean = LEAN_DX[m.trunk_lean ?? ''] ?? 0;
  const hl: [number, number] = [cx - hipW / 2 - lean, hipY];
  const hr: [number, number] = [cx + hipW / 2 - lean, hipY];
  const headX = cx + (headOffset / 100) * shoulderW;
  const headY = 72, r = 32;
  const dimY = headY - r - 14;

  const draw = (i: number) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { pathLength: { duration: 0.45, delay: 0.08 * i, ease: [0.25, 1, 0.5, 1] as const }, opacity: { duration: 0.01, delay: 0.08 * i } },
  });
  const appear = (delay: number) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.24, delay },
  });
  const body = { stroke: INK, strokeWidth: 3.5, strokeLinecap: 'round' as const, fill: 'none' };
  const dim = (part: Highlight) => (highlight && highlight !== part ? 0.25 : 1);
  const line = (a: [number, number], b: [number, number]) => `M${a[0]},${a[1]} L${b[0]},${b[1]}`;
  const le: [number, number] = [L[0] - 22, L[1] + 80], re: [number, number] = [R[0] + 22, R[1] + 80];
  const flaggedLast = 1.25;

  return (
    <svg key={drawKey} viewBox="0 0 300 330" className="w-full h-auto" role="img"
         aria-label={`Posture diagram. Head ${headOffset.toFixed(0)}% of shoulder width off centre, shoulders tilted ${tilt.toFixed(1)} degrees${trunkFlag ? ', trunk leaning' : ''}.`}>
      {/* centre line through the middle of the shoulders */}
      <motion.path d={`M${cx},16 L${cx},322`} stroke={TEAL} strokeWidth={1.5} strokeDasharray="5 5" fill="none" {...appear(0)} />

      <g opacity={dim('trunk')} style={{ transition: 'opacity 160ms' }}>
        <motion.path d={line(L, hl)} {...body} {...draw(2)} stroke={trunkFlag ? FLAG : INK} />
        <motion.path d={line(R, hr)} {...body} {...draw(2)} stroke={trunkFlag ? FLAG : INK} />
        <motion.path d={line(hl, hr)} {...body} {...draw(3)} />
      </g>
      <g opacity={dim('shoulders')} style={{ transition: 'opacity 160ms' }}>
        <motion.path d={line(L, R)} {...body} {...draw(1)} stroke={shoulderFlag ? FLAG : INK} />
        <motion.path d={`${line(L, le)} L${L[0] - 30},${L[1] + 150}`} {...body} {...draw(3)} />
        <motion.path d={`${line(R, re)} L${R[0] + 30},${R[1] + 150}`} {...body} {...draw(3)} />
        {/* level line from the higher shoulder, with the measured tilt */}
        <motion.path d={`M${R[0] + 20},${R[1]} L${L[0] - 12},${R[1]}`} stroke={MUTED} strokeWidth={1} strokeDasharray="2 3" fill="none" {...appear(0.6)} />
        <motion.text x={R[0] + 24} y={R[1] + 4} fontSize={13} fill={shoulderFlag ? FLAG_TEXT : MUTED} fontWeight={shoulderFlag ? 600 : 400} {...appear(shoulderFlag ? flaggedLast : 0.7)}>
          {tilt.toFixed(0)}°
        </motion.text>
      </g>
      <g opacity={dim('head')} style={{ transition: 'opacity 160ms' }}>
        <motion.path d={line([headX, headY + r], [cx, (L[1] + R[1]) / 2])} {...body} {...draw(4)} />
        <motion.circle cx={headX} cy={headY} r={r} {...body} fill="#fff" {...draw(4)} />
        {/* head offset as a dimension line above the head */}
        <motion.g {...appear(headFlag ? flaggedLast : 0.8)}>
          <path d={`M${headX},${headY - r} L${headX},${dimY - 6}`} stroke={headFlag ? FLAG : MUTED} strokeWidth={1.5} strokeDasharray="3 3" />
          <path d={`M${cx},${dimY} L${headX},${dimY} M${cx},${dimY - 6} L${cx},${dimY + 6} M${headX},${dimY - 6} L${headX},${dimY + 6}`}
                stroke={headFlag ? FLAG : MUTED} strokeWidth={2.5} />
          <text x={Math.max(headX, cx) + 8} y={dimY + 5} fontSize={13} fontWeight={600} fill={headFlag ? FLAG_TEXT : MUTED}>
            {headOffset.toFixed(0)}%
          </text>
        </motion.g>
      </g>
      {[L, R, hl, hr].map((p, i) => (
        <motion.circle key={i} cx={p[0]} cy={p[1]} r={5} fill="#fff" stroke={TEAL} strokeWidth={2.5} {...appear(0.5 + 0.05 * i)} />
      ))}
    </svg>
  );
};
