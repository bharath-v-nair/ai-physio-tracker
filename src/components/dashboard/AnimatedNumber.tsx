import React, { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

interface Props {
  value: number;
  from?: number;
  duration?: number;
  className?: string;
}

// Counts from the previous value to the new one, with no overshoot: it only ever shows real in-between numbers.
export const AnimatedNumber: React.FC<Props> = ({ value, from, duration = 0.8, className }) => {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : from ?? value);
  const last = useRef(from ?? value);

  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    const controls = animate(last.current, value, {
      duration,
      ease: [0.25, 1, 0.5, 1],
      onUpdate: v => setShown(Math.round(v)),
    });
    last.current = value;
    return () => controls.stop();
  }, [value, duration, reduce]);

  return <span className={`tabular ${className ?? ''}`}>{shown}</span>;
};
