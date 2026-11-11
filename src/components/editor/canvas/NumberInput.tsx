import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface NumberInputProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  placeholder?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  className = '',
  placeholder,
}) => {
  const handleStep = (direction: 'up' | 'down') => {
    const delta = direction === 'up' ? step : -step;
    let next = (Number(value) || 0) + delta;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChange(next);
  };

  return (
    <div
      className={`relative flex items-center bg-slate-50 dark:bg-[#292936] border border-slate-200 dark:border-[#3A3948] rounded-xl overflow-hidden focus-within:border-lavender-500 focus-within:ring-1 focus-within:ring-lavender-400/50 transition-all ${className}`}
    >
      {prefix && (
        <span className="pl-2.5 text-[10px] font-mono font-bold text-slate-400 dark:text-[#A5A3B5] select-none shrink-0">
          {prefix}
        </span>
      )}
      <input
        type="number"
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={(e) => {
          const val = Number(e.target.value);
          onChange(isNaN(val) ? 0 : val);
        }}
        className="w-full bg-transparent px-2.5 py-1 text-xs font-mono text-slate-800 dark:text-[#E8E7EF] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {suffix && (
        <span className="pr-1 text-[10px] text-slate-400 dark:text-[#A5A3B5] select-none shrink-0">
          {suffix}
        </span>
      )}
      {/* Custom Designed Up/Down Stepper Buttons */}
      <div className="flex flex-col border-l border-slate-200 dark:border-[#3A3948] shrink-0 w-4.5 self-stretch bg-white dark:bg-[#201F29]">
        <button
          type="button"
          onClick={() => handleStep('up')}
          className="flex-1 flex items-center justify-center text-slate-400 hover:text-lavender-600 dark:hover:text-[#B7A5FF] hover:bg-slate-100 dark:hover:bg-[#2D2C3B] border-b border-slate-200 dark:border-[#3A3948] transition-colors"
          title="수치 증가"
        >
          <ChevronUp className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          onClick={() => handleStep('down')}
          className="flex-1 flex items-center justify-center text-slate-400 hover:text-lavender-600 dark:hover:text-[#B7A5FF] hover:bg-slate-100 dark:hover:bg-[#2D2C3B] transition-colors"
          title="수치 감소"
        >
          <ChevronDown className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};

