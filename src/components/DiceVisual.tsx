import React from 'react';

interface DiceVisualProps {
  value: number;
  label?: string;
  isRolling?: boolean;
  colorTheme?: 'amber' | 'cyan' | 'emerald' | 'purple';
  size?: 'sm' | 'md' | 'lg';
}

export const DiceVisual: React.FC<DiceVisualProps> = ({
  value,
  label,
  isRolling = false,
  colorTheme = 'amber',
  size = 'md',
}) => {
  const themeStyles = {
    amber: {
      bg: 'bg-gradient-to-br from-amber-100 via-amber-50 to-amber-200 border-amber-300 text-amber-950 shadow-amber-900/30',
      pip: 'bg-amber-950',
      tag: 'text-amber-400',
    },
    cyan: {
      bg: 'bg-gradient-to-br from-cyan-100 via-cyan-50 to-cyan-200 border-cyan-300 text-cyan-950 shadow-cyan-900/30',
      pip: 'bg-cyan-950',
      tag: 'text-cyan-400',
    },
    emerald: {
      bg: 'bg-gradient-to-br from-emerald-100 via-emerald-50 to-emerald-200 border-emerald-300 text-emerald-950 shadow-emerald-900/30',
      pip: 'bg-emerald-950',
      tag: 'text-emerald-400',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-100 via-purple-50 to-purple-200 border-purple-300 text-purple-950 shadow-purple-900/30',
      pip: 'bg-purple-950',
      tag: 'text-purple-400',
    },
  }[colorTheme];

  const sizeStyles = {
    sm: 'w-10 h-10 rounded-lg text-sm border-2 shadow-md',
    md: 'w-16 h-16 rounded-xl text-2xl border-2 shadow-lg',
    lg: 'w-20 h-20 rounded-2xl text-3xl border-3 shadow-xl',
  }[size];

  const pipSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
  }[size];

  // If value is between 1 and 6, render authentic standard dice pips
  const renderPips = (val: number) => {
    if (val < 1 || val > 6) {
      return (
        <span className="font-extrabold tracking-tight font-display">{val}</span>
      );
    }

    const pip = <div className={`${pipSizes} rounded-full ${themeStyles.pip} shadow-xs`} />;

    switch (val) {
      case 1:
        return <div className="flex items-center justify-center w-full h-full">{pip}</div>;
      case 2:
        return (
          <div className="flex justify-between w-full h-full p-1.5">
            <div className="self-start">{pip}</div>
            <div className="self-end">{pip}</div>
          </div>
        );
      case 3:
        return (
          <div className="flex justify-between w-full h-full p-1.5">
            <div className="self-start">{pip}</div>
            <div className="self-center">{pip}</div>
            <div className="self-end">{pip}</div>
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-2 gap-2 place-items-center w-full h-full p-1">
            {pip}{pip}{pip}{pip}
          </div>
        );
      case 5:
        return (
          <div className="relative w-full h-full p-1">
            <div className="absolute top-1.5 left-1.5">{pip}</div>
            <div className="absolute top-1.5 right-1.5">{pip}</div>
            <div className="absolute inset-0 flex items-center justify-center">{pip}</div>
            <div className="absolute bottom-1.5 left-1.5">{pip}</div>
            <div className="absolute bottom-1.5 right-1.5">{pip}</div>
          </div>
        );
      case 6:
        return (
          <div className="grid grid-cols-2 grid-rows-3 gap-x-2 gap-y-1 place-items-center w-full h-full p-1">
            {pip}{pip}{pip}{pip}{pip}{pip}
          </div>
        );
      default:
        return <span className="font-bold font-display">{val}</span>;
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      {label && (
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
      )}
      <div
        className={`relative flex items-center justify-center select-none transform transition-transform ${sizeStyles} ${themeStyles.bg} ${
          isRolling ? 'animate-dice-shake' : 'hover:scale-105'
        }`}
      >
        {renderPips(value)}
      </div>
    </div>
  );
};
