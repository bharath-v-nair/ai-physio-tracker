import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface PostureMeasurements {
  head_offset_pct: number | null;
  shoulder_tilt_deg: number | null;
  trunk_lean: string | null;
}

export type Highlight = 'head' | 'shoulders' | 'trunk' | null;

interface Props {
  m: PostureMeasurements;
  highlight?: Highlight;
  headLimit?: number;
  shoulderLimit?: number;
}

const INK = '#10181B';
const TEAL = '#00806E';
const FLAG = '#D9531E';
const FLAG_TEXT = '#B8440F';
const MUTED = '#46555A';
const EASE = [0.25, 1, 0.5, 1] as const;

// Lean classes from the posture model, drawn as a small sideways shift of the trunk
const LEAN_DX: Record<string, number> = { TLL: 10, TLR: -10 };

// Front-view body diagram drawn from a posture check's three measurements (not a photo).
// It draws itself in once; when the measurements change, the lines move to the new positions.
export const PostureFigure: React.FC<Props> = ({ m, highlight = null, headLimit = 12, shoulderLimit = 5 }) => {
  const reduce = useReducedMotion();
  const mounted = useRef(false);
  useEffect(() => { mounted.current = true; }, []);
  const first = !mounted.current && !reduce;

  const headOffset = m.head_offset_pct ?? 0;
  const tilt = m.shoulder_tilt_deg ?? 0;
  const headFlag = headOffset > headLimit;
  const shoulderFlag = tilt > shoulderLimit;
  const trunkFlag = !!m.trunk_lean && m.trunk_lean !== 'TUP';

  const cx = 150, shoulderW = 130, shoulderY = 150, hipY = 290, hipW = 84;
  const dy = Math.tan((tilt * Math.PI) / 180) * (shoulderW / 2);
  const L = [cx - shoulderW / 2, shoulderY + dy];
  const R = [cx + shoulderW / 2, shoulderY - dy];
  const lean = LEAN_DX[m.trunk_lean ?? ''] ?? 0;
  const hl = [cx - hipW / 2 - lean, hipY];
  const hr = [cx + hipW / 2 - lean, hipY];
  const headX = cx + (headOffset / 100) * shoulderW;
  const headY = 72, r = 32;
  const dimY = headY - r - 14;
  const le = [L[0] - 22, L[1] + 80], re = [R[0] + 22, R[1] + 80];
  const seg = (a: number[], b: number[]) => `M${a[0]},${a[1]} L${b[0]},${b[1]}`;
  const armL = `${seg(L, le)} L${L[0] - 30},${L[1] + 150}`;
  const armR = `${seg(R, re)} L${R[0] + 30},${R[1] + 150}`;
  const level = `M${R[0] + 20},${R[1]} L${L[0] - 12},${R[1]}`;
  const neck = seg([headX, headY + r], [cx, (L[1] + R[1]) / 2]);

  // First appearance: lines draw in one after another. Later changes: everything moves together.
  const move = { duration: reduce ? 0 : 0.4, ease: EASE };
  // `start` repeats the shape's position, so the very first frame is already in place
  const drawIn = (i: number, start: Record<string, number | string>) => (first
    ? { initial: { pathLength: 0, ...start }, transition: { pathLength: { duration: 0.4, delay: 0.07 * i, ease: EASE }, d: move, stroke: move } }
    : { initial: false as const, transition: { d: move, stroke: move } });
  const fadeIn = (delay: number, start: Record<string, number | string> = {}) => (first
    ? { initial: { opacity: 0, ...start }, transition: { opacity: { duration: 0.2, delay }, default: move } }
    : { initial: false as const, transition: move });
  const flagDelay = 0.75;

  const body = { strokeWidth: 3.5, strokeLinecap: 'round' as const, fill: 'none' };
  const dim = (part: Highlight) => (highlight && highlight !== part ? 0.25 : 1);
  const group = { style: { transition: 'opacity 160ms' } };

  return (
    <svg viewBox="0 0 300 330" className="w-full h-auto" role="img"
         aria-label={`Posture diagram. Head ${headOffset.toFixed(0)}% of shoulder width off centre, shoulders tilted ${tilt.toFixed(1)} degrees${trunkFlag ? ', trunk leaning' : ''}.`}>
      <motion.path d={`M${cx},16 L${cx},322`} stroke={TEAL} strokeWidth={1.5} strokeDasharray="5 5" fill="none" animate={{ opacity: 1 }} {...fadeIn(0)} />

      <g opacity={dim('trunk')} {...group}>
        <motion.path {...body} animate={{ d: seg(L, hl), stroke: trunkFlag ? FLAG : INK, pathLength: 1 }} {...drawIn(2, { d: seg(L, hl), stroke: INK })} />
        <motion.path {...body} animate={{ d: seg(R, hr), stroke: trunkFlag ? FLAG : INK, pathLength: 1 }} {...drawIn(2, { d: seg(R, hr), stroke: INK })} />
        <motion.path {...body} stroke={INK} animate={{ d: seg(hl, hr), pathLength: 1 }} {...drawIn(3, { d: seg(hl, hr) })} />
      </g>
      <g opacity={dim('shoulders')} {...group}>
        <motion.path {...body} animate={{ d: seg(L, R), stroke: shoulderFlag ? FLAG : INK, pathLength: 1 }} {...drawIn(1, { d: seg(L, R), stroke: INK })} />
        <motion.path {...body} stroke={INK} animate={{ d: armL, pathLength: 1 }} {...drawIn(3, { d: armL })} />
        <motion.path {...body} stroke={INK} animate={{ d: armR, pathLength: 1 }} {...drawIn(3, { d: armR })} />
        {/* level line from the higher shoulder, with the measured tilt */}
        <motion.path stroke={MUTED} strokeWidth={1} strokeDasharray="2 3" fill="none"
          animate={{ d: level, opacity: 1 }} {...fadeIn(0.5, { d: level })} />
        <motion.text fontSize={13} fill={shoulderFlag ? FLAG_TEXT : MUTED} fontWeight={shoulderFlag ? 600 : 400}
          animate={{ x: R[0] + 24, y: R[1] + 4, opacity: 1 }} {...fadeIn(shoulderFlag ? flagDelay : 0.55, { x: R[0] + 24, y: R[1] + 4 })}>
          {tilt.toFixed(0)}°
        </motion.text>
      </g>
      <g opacity={dim('head')} {...group}>
        <motion.path {...body} stroke={INK} animate={{ d: neck, pathLength: 1 }} {...drawIn(4, { d: neck })} />
        <motion.circle r={r} {...body} stroke={INK} fill="#fff" animate={{ cx: headX, cy: headY, pathLength: 1 }} {...drawIn(4, { cx: headX, cy: headY })} />
        {/* head offset as a dimension line above the head */}
        <motion.g animate={{ opacity: 1 }} {...fadeIn(headFlag ? flagDelay : 0.6)}>
          <motion.path strokeWidth={1.5} strokeDasharray="3 3" fill="none"
            animate={{ d: `M${headX},${headY - r} L${headX},${dimY - 6}`, stroke: headFlag ? FLAG : MUTED }} transition={move} initial={false} />
          <motion.path strokeWidth={2.5} fill="none"
            animate={{ d: `M${cx},${dimY} L${headX},${dimY} M${cx},${dimY - 6} L${cx},${dimY + 6} M${headX},${dimY - 6} L${headX},${dimY + 6}`, stroke: headFlag ? FLAG : MUTED }}
            transition={move} initial={false} />
          <motion.text fontSize={13} fontWeight={600} fill={headFlag ? FLAG_TEXT : MUTED}
            animate={{ x: Math.max(headX, cx) + 8, y: dimY + 5 }} transition={move} initial={false}>
            {headOffset.toFixed(0)}%
          </motion.text>
        </motion.g>
      </g>
      {[L, R, hl, hr].map((p, i) => (
        <motion.circle key={i} r={5} fill="#fff" stroke={TEAL} strokeWidth={2.5}
          animate={{ cx: p[0], cy: p[1], opacity: 1 }} {...fadeIn(0.4 + 0.04 * i, { cx: p[0], cy: p[1] })} />
      ))}
    </svg>
  );
};
