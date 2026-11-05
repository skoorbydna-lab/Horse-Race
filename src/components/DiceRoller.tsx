import React, { useState, useEffect } from 'react';
import { DiceConfig, HorseOutcome, RollResult } from '../types/probability';
import { DiceVisual } from './DiceVisual';
import { getRuleSymbol } from '../utils/probabilityEngine';
import { sound } from '../utils/soundEffects';
import { Play, Pause, RotateCcw, FastForward, Dices, Volume2, VolumeX, Sparkles, Zap } from 'lucide-react';

interface DiceRollerProps {
  config: DiceConfig;
  lastRoll: RollResult | null;
  onRollOnce: () => void;
  onSimulateRolls: (count: number) => void;
  onInstantFinish: () => void;
  onResetRace: () => void;
  isAutoRacing: boolean;
  onToggleAutoRace: () => void;
  autoSpeed: number;
  onChangeAutoSpeed: (speed: number) => void;
  raceFinished: boolean;
  totalRolls: number;
  winner: HorseOutcome | null;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({
  config,
  lastRoll,
  onRollOnce,
  onSimulateRolls,
  onInstantFinish,
  onResetRace,
  isAutoRacing,
  onToggleAutoRace,
  autoSpeed,
  onChangeAutoSpeed,
  raceFinished,
  totalRolls,
  winner,
}) => {
  const [isRollingAnimation, setIsRollingAnimation] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  // Listen to spacebar to roll dice
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && !raceFinished && !isAutoRacing) {
        // Prevent default spacebar scrolling
        if (['INPUT', 'TEXTAREA', 'BUTTON'].includes((e.target as HTMLElement)?.tagName)) {
          return;
        }
        e.preventDefault();
        triggerRoll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [raceFinished, isAutoRacing]);

  const triggerRoll = () => {
    if (raceFinished || isAutoRacing) return;
    setIsRollingAnimation(true);
    sound.playDiceRoll();
    setTimeout(() => {
      onRollOnce();
      setIsRollingAnimation(false);
      sound.playHoofBeat();
    }, 180);
  };

  const handleToggleMute = () => {
    const newMuted = sound.toggleMute();
    setIsMuted(newMuted);
  };

  const ruleSymbol = getRuleSymbol(config.rule);

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
      {/* Control Bar Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Dices className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-semibold text-slate-100 font-display">
            Dice Control Station
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Rolls Counter */}
          <div className="text-xs font-mono px-2.5 py-1 rounded-md bg-slate-950 text-slate-300 border border-slate-800">
            Total Rolls: <span className="font-bold text-amber-400">{totalRolls}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Dice Showcase Arena */}
      <div className="py-5 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 bg-slate-950/70 rounded-xl my-4 border border-slate-800/80">
        {/* Die 1 */}
        <DiceVisual
          value={lastRoll ? lastRoll.d1 : config.faces1[0]}
          label="Die 1"
          isRolling={isRollingAnimation || isAutoRacing}
          colorTheme="amber"
          size="lg"
        />

        {/* Operation Symbol */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-slate-800/90 border border-slate-700 flex items-center justify-center text-lg font-black text-amber-400 font-mono shadow-md">
            {ruleSymbol}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1 uppercase">
            {config.rule}
          </span>
        </div>

        {/* Die 2 */}
        <DiceVisual
          value={lastRoll ? lastRoll.d2 : config.faces2[0]}
          label="Die 2"
          isRolling={isRollingAnimation || isAutoRacing}
          colorTheme="cyan"
          size="lg"
        />

        {/* Equals Sign & Outcome */}
        <div className="flex items-center gap-4 pl-2 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0">
          <span className="text-2xl font-bold text-slate-500">=</span>
          <div className="flex flex-col items-center">
            <span className="text-xs text-slate-400 font-medium">Result</span>
            <div className="flex items-center justify-center min-w-[56px] h-14 px-3 rounded-xl bg-emerald-600/20 border-2 border-emerald-500/80 text-emerald-300 font-black text-3xl font-display shadow-lg shadow-emerald-950/40">
              {lastRoll ? lastRoll.outcome : '—'}
            </div>
            {lastRoll && (
              <span className="text-[11px] font-semibold text-amber-400 mt-1">
                Horse {lastRoll.outcome} Moves!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          {/* Single Roll Button */}
          <button
            onClick={triggerRoll}
            disabled={raceFinished || isAutoRacing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <Dices className="w-4 h-4" />
            <span>Roll Dice</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-amber-600/30 text-slate-900 rounded-sm font-mono">
              Space
            </kbd>
          </button>

          {/* Continuous Auto-Race Button */}
          <button
            onClick={onToggleAutoRace}
            disabled={raceFinished}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer disabled:cursor-not-allowed ${
              isAutoRacing
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40 shadow-lg'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 shadow-md'
            }`}
          >
            {isAutoRacing ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Auto Race</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Instant Result Button */}
          <button
            onClick={onInstantFinish}
            disabled={raceFinished}
            title="Instantly simulate race to the finish line in 0 seconds"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 text-xs font-bold text-slate-950 shadow-md transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Instant Result</span>
          </button>

          {/* Fast Simulate Rolls for GCSE experimental probability */}
          <button
            onClick={() => onSimulateRolls(50)}
            disabled={raceFinished || isAutoRacing}
            title="Roll 50 times quickly to observe probability distribution"
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs text-slate-300 font-medium transition-colors cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fast 50</span>
          </button>

          {/* Reset Race */}
          <button
            onClick={onResetRace}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Auto Race Speed Control Toolbar (Always visible & interactive) */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-medium">Auto-Race Speed:</span>
        </div>

        <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 font-mono">
          {[
            { label: '0.5× Slow', speed: 1000 },
            { label: '1× Normal', speed: 500 },
            { label: '2× Fast', speed: 200 },
            { label: '5× Swift', speed: 80 },
            { label: '15× Turbo', speed: 25 },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => onChangeAutoSpeed(item.speed)}
              className={`px-2 py-1 rounded-md text-[11px] transition-colors cursor-pointer ${
                autoSpeed === item.speed
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={`Roll every ${item.speed}ms`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
