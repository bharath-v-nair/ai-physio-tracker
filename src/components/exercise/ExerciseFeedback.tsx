import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ExerciseFeedbackProps {
    formScore: number | null;
    status: string;
    feedback: string;
}

const label = (score: number) => (score >= 90 ? 'Excellent' : score >= 80 ? 'Good' : score >= 60 ? 'Fair' : 'Needs work');

export const ExerciseFeedback: React.FC<ExerciseFeedbackProps> = ({ formScore, status, feedback }) => {
    const needsAttention = status !== 'Good Form' && status !== 'Calibrating';
    return (
        <>
            <section className="bg-white border border-rule rounded-[4px] p-5">
                <p className="font-serif text-[20px] text-ink">Form score</p>
                {formScore === null ? (
                    <p className="text-muted mt-1">Scored after your first rep.</p>
                ) : (
                    <>
                        <p className="mt-1 flex items-baseline gap-2">
                            <span className="font-serif text-[40px] leading-none text-ink tabular">{formScore}%</span>
                            <span className={`text-sm font-semibold ${formScore >= 80 ? 'text-primary' : 'text-flag-text'}`}>{label(formScore)}</span>
                        </p>
                        <div className="w-full bg-faint rounded-full h-1.5 mt-3">
                            <div className={`h-1.5 rounded-full transition-[width] duration-500 ${formScore >= 80 ? 'bg-primary' : 'bg-flag'}`} style={{ width: `${formScore}%` }} />
                        </div>
                    </>
                )}
            </section>

            <section className={`bg-white border rounded-[4px] p-5 flex-1 flex flex-col ${needsAttention ? 'border-flag' : 'border-rule'}`} aria-live="polite">
                <div className="flex items-center justify-between mb-3">
                    <p className="font-serif text-[20px] text-ink">What to do</p>
                    <span className={`text-sm font-semibold ${needsAttention ? 'text-flag-text' : 'text-primary'}`}>{status}</span>
                </div>
                <AnimatePresence mode="wait">
                    <motion.p key={feedback} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}
                        className="text-lg text-ink leading-snug">
                        {feedback}
                    </motion.p>
                </AnimatePresence>
            </section>

            <p className="text-[13px] text-muted px-1">
                Feedback is calculated from your camera and is for guidance only. Stop if anything hurts.
            </p>
        </>
    );
};
