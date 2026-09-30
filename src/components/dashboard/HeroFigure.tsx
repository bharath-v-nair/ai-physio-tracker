import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { PostureFigure } from './PostureFigure';

// An example (not a real user) played once: the same three measurements a check takes, improving over time
const STEPS = [
  { label: 'First check', note: 'Head 24% off centre, shoulders tilted 8°', score: 75, m: { head_offset_pct: 24, shoulder_tilt_deg: 8, trunk_lean: null } },
  { label: 'After one week', note: 'Head 14% off centre, shoulders 4°', score: 90, m: { head_offset_pct: 14, shoulder_tilt_deg: 4, trunk_lean: null } },
  { label: 'After two weeks', note: 'Head 7% off centre, shoulders 2°', score: 100, m: { head_offset_pct: 7, shoulder_tilt_deg: 2, trunk_lean: 'TUP' } },
];

export const HeroFigure: React.FC = () => {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(reduce ? STEPS.length - 1 : 0);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (reduce || step >= STEPS.length - 1) return;
    const t = window.setTimeout(() => setStep(s => s + 1), 2800);
    return () => window.clearTimeout(t);
  }, [step, run, reduce]);

  const s = STEPS[step];
  return (
    <figure className="bg-white border border-rule rounded-[4px]">
      <div className="flex items-baseline justify-between px-5 pt-4 pb-3 border-b border-faint">
        <span className="font-serif text-[20px] text-ink">Posture check</span>
        <span className="text-sm text-muted">Example</span>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-stretch">
        <div className="graph-paper border-r border-faint">
          <PostureFigure m={s.m} drawKey={`${run}-${step}`} />
        </div>
        <div className="w-40 sm:w-48 p-4 sm:p-5 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.24 }}>
              <p className="text-sm font-semibold text-primary">{s.label}</p>
              <p className="font-serif text-[56px] leading-none text-ink mt-2 tabular">{s.score}</p>
              <p className="text-sm text-muted mt-1">/ 100</p>
              <p className="text-sm text-ink mt-4">{s.note}</p>
            </motion.div>
          </AnimatePresence>
          <div className="mt-auto pt-4 flex items-center gap-1.5" aria-hidden="true">
            {STEPS.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-primary' : 'bg-faint'}`} />)}
          </div>
          {step === STEPS.length - 1 && !reduce && (
            <button type="button" onClick={() => { setStep(0); setRun(r => r + 1); }}
              className="mt-3 self-start text-sm font-semibold text-primary flex items-center gap-1.5 hover:underline">
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Replay
            </button>
          )}
        </div>
      </div>
      <figcaption className="px-5 py-2.5 text-[13px] text-muted border-t border-faint">Every line is drawn from the check's measurements: head position, shoulder level and trunk lean.</figcaption>
    </figure>
  );
};
