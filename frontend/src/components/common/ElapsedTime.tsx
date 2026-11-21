import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

export interface ElapsedTimeProps {
  fileName?: string;
  prefix?: string;
  className?: string;
}

export const ElapsedTime: React.FC<ElapsedTimeProps> = ({
  fileName,
  prefix = 'Analyzing',
  className,
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <p className={cn('text-xs text-slate-500 mt-2 font-mono', className)}>
      <span>{prefix} </span>
      {fileName && (
        <>
          <span className="font-semibold text-slate-700 italic">{fileName}</span>
          <span> · </span>
        </>
      )}
      <span>{seconds} s elapsed</span>
    </p>
  );
};
