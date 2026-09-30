import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PostureFigure } from './PostureFigure';
import type { Highlight } from './PostureFigure';
import { AnimatedNumber } from './AnimatedNumber';

export interface Assessment {
  id: number;
  posture_score: number;
  detected_issue: string | null;
  created_at: string;
  head_offset_pct: number | null;
  shoulder_tilt_deg: number | null;
  trunk_lean: string | null;
  neck_angle_deg: number | null;
}

export const LEAN_LABELS: Record<string, string> = {
  TUP: 'Upright', TLF: 'Leaning forward', TLB: 'Leaning backward', TLL: 'Leaning left', TLR: 'Leaning right',
};

// How the score was reached, using the same rules as the posture check
export const scoreReasons = (a: Assessment) => {
  const out: string[] = [];
  if (a.head_offset_pct != null && a.head_offset_pct > 12) out.push(`${a.head_offset_pct > 20 ? 20 : 10} points off for head position`);
  if (a.shoulder_tilt_deg != null && a.shoulder_tilt_deg > 5) out.push(`${a.shoulder_tilt_deg > 10 ? 15 : 5} off for shoulder level`);
  if (a.trunk_lean && a.trunk_lean !== 'TUP') out.push('10 off for trunk lean');
  if (a.head_offset_pct == null) return 'Measurements weren\'t recorded for this check.';
  return out.length ? `${out.join(', ')}.` : 'Nothing flagged.';
};

// The body diagram, score and three readings of one posture check (dashboard and report)
export const CheckSummary: React.FC<{ check: Assessment; previous?: Assessment; footer?: React.ReactNode }> = ({ check, previous, footer }) => {
  const [highlight, setHighlight] = useState<Highlight>(null);
  const readings = [
    { key: 'head' as const, label: 'Head position', value: check.head_offset_pct != null ? `${check.head_offset_pct.toFixed(0)}% of shoulder width off centre` : 'Not recorded', limit: 'Over 12%', flag: (check.head_offset_pct ?? 0) > 12, okText: 'Within 12%' },
    { key: 'shoulders' as const, label: 'Shoulder level', value: check.shoulder_tilt_deg != null ? `${check.shoulder_tilt_deg.toFixed(1)}° tilt` : 'Not recorded', limit: 'Over 5°', flag: (check.shoulder_tilt_deg ?? 0) > 5, okText: 'Within 5°' },
    { key: 'trunk' as const, label: 'Trunk', value: check.trunk_lean ? `${LEAN_LABELS[check.trunk_lean]}, from the trained posture model` : 'Hips not in view, so lean was not measured', limit: 'Leaning', flag: !!check.trunk_lean && check.trunk_lean !== 'TUP', okText: check.trunk_lean ? 'Good' : '–' },
  ];
  const flagged = readings.filter(r => r.flag);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
      <figure className="graph-paper border-b md:border-b-0 md:border-r border-faint flex flex-col">
        <div className="flex-1 grid place-items-center">
          <div className="max-w-[240px] md:max-w-none w-full mx-auto">
            <PostureFigure highlight={highlight}
              m={{ head_offset_pct: check.head_offset_pct, shoulder_tilt_deg: check.shoulder_tilt_deg, trunk_lean: check.trunk_lean }} />
          </div>
        </div>
        <figcaption className="px-4 py-2.5 text-[13px] text-muted bg-white border-t border-faint">
          {check.head_offset_pct != null ? 'Drawn from the measurements of this check' : 'This check was saved before measurements were recorded'}
        </figcaption>
      </figure>
      <div className="p-5 md:p-6 flex flex-col gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <AnimatedNumber value={Math.round(check.posture_score)} from={previous ? Math.round(previous.posture_score) : 0}
              className="font-serif text-[64px] leading-none text-ink" />
            <span className="font-serif text-[22px] text-muted">/ 100</span>
          </div>
          <p className="text-sm text-muted mt-1">{scoreReasons(check)}</p>
        </div>
        <ol className="grid gap-3">
          {readings.map((r, i) => (
            <motion.li key={`${check.id}-${r.key}`}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: r.flag ? 0.75 : 0.3 + 0.06 * i }}
              onMouseEnter={() => setHighlight(r.key)} onMouseLeave={() => setHighlight(null)}
              onFocus={() => setHighlight(r.key)} onBlur={() => setHighlight(null)} tabIndex={0}
              className="grid grid-cols-[12px_1fr_auto] gap-3 items-start rounded-[4px] -mx-2 px-2 py-1 hover:bg-paper focus:bg-paper">
              <span className={`mt-1.5 w-2.5 h-2.5 rounded-full ${r.flag ? 'bg-flag' : 'bg-primary'}`} />
              <span><strong className="block font-semibold text-ink">{r.label}</strong><span className="text-sm text-muted">{r.value}</span></span>
              <span className={`text-sm font-semibold whitespace-nowrap ${r.flag ? 'text-flag-text' : 'text-primary'}`}>{r.flag ? r.limit : r.okText}</span>
            </motion.li>
          ))}
        </ol>
        {check.neck_angle_deg != null && (
          <p className="text-sm text-muted">Side view neck angle: <strong className="text-ink">{check.neck_angle_deg.toFixed(1)}°</strong> (higher means the head sits further back{previous?.neck_angle_deg != null ? `; ${(check.neck_angle_deg - previous.neck_angle_deg) >= 0 ? '+' : ''}${(check.neck_angle_deg - previous.neck_angle_deg).toFixed(1)}° since the check before` : ''}).</p>
        )}
        {flagged.length > 0 ? (
          <p className="text-sm bg-flag-wash rounded-[4px] px-3.5 py-3 text-ink">
            {flagged[0].key === 'head' ? 'Keep your ears level and over the middle of your shoulders.' : flagged[0].key === 'shoulders' ? 'Let both shoulders drop and relax evenly.' : 'Sit back with your weight even on both hips.'} Check again after today's exercises.
          </p>
        ) : check.head_offset_pct != null ? (
          <p className="text-sm bg-teal-50 rounded-[4px] px-3.5 py-3 text-ink">Nothing flagged in this check. Keep the routine going to hold it there.</p>
        ) : null}
        {footer}
      </div>
    </div>
  );
};
