import React from 'react';
import { Settings2, GraduationCap, Volume2, VolumeX, History, LineChart } from 'lucide-react';
import { sound } from '../utils/soundEffects';

interface HeaderProps {
  activeView: 'track' | 'samplespace' | 'history' | 'frequency';
  onSelectView: (view: 'track' | 'samplespace' | 'history' | 'frequency') => void;
  racesCount: number;
  onOpenConfig: () => void;
  onOpenQuiz: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  racesCount,
  onOpenConfig,
  onOpenQuiz,
}) => {
  const [isMuted, setIsMuted] = React.useState(sound.getMuted());

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6 sm:gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xl font-black tracking-tight font-display text-white whitespace-nowrap">
            Equi<span className="text-amber-400">Prob</span>
          </span>
          <span className="text-xs text-slate-400 hidden xl:inline">GCSE Lesson Demo</span>
        </div>

        {/* Zone 2: Navigation Links (Single-line controls) */}
        <nav className="flex items-center gap-1 sm:gap-1.5 text-xs font-semibold overflow-x-auto py-1">
          <button
            onClick={() => onSelectView('track')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeView === 'track'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Race Track
          </button>
          <button
            onClick={() => onSelectView('frequency')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeView === 'frequency'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Relative Frequency Line Graph & Dice Roll Trials (No Race)"
          >
            <LineChart className="w-3.5 h-3.5 text-amber-400" />
            <span>Relative Frequency Graph</span>
          </button>
          <button
            onClick={() => onSelectView('samplespace')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeView === 'samplespace'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Sample Space Grid
          </button>
          <button
            onClick={() => onSelectView('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              activeView === 'history'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Winners Log ({racesCount})</span>
          </button>
          <button
            onClick={onOpenQuiz}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">GCSE Practice</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Utility Audio */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Sound & Voice Announce Toggle */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? 'Unmute Sound & Voice' : 'Mute Sound & Voice'}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Dice & Rules Settings Modal Trigger */}
          <button
            onClick={onOpenConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold whitespace-nowrap shrink-0 shadow-sm transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-950" />
            <span className="hidden sm:inline">Configure Dice</span>
          </button>
        </div>
      </div>
    </header>
  );
};
