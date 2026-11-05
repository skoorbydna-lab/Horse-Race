import React from 'react';
import { HorseOutcome } from '../types/probability';
import { HorseSprite } from './HorseSprite';
import { Trophy, Eye, EyeOff, Volume2, Flag, Zap } from 'lucide-react';
import { sound } from '../utils/soundEffects';

interface RaceTrackProps {
  horses: HorseOutcome[];
  trackLength: number;
  lastMovedHorseValue: number | null;
  winner: HorseOutcome | null;
  selectedHorseValue: number | null;
  onSelectHorse: (value: number | null) => void;
  showProbabilities: boolean;
  onToggleShowProbabilities: () => void;
  onChangeTrackLength: (length: number) => void;
  onInstantFinish?: () => void;
  totalRolls: number;
}

export const RaceTrack: React.FC<RaceTrackProps> = ({
  horses,
  trackLength,
  lastMovedHorseValue,
  winner,
  selectedHorseValue,
  onSelectHorse,
  showProbabilities,
  onToggleShowProbabilities,
  onChangeTrackLength,
  onInstantFinish,
  totalRolls,
}) => {
  // Generate clean distance markers that scale from 3 to 60 steps
  const markerSteps = React.useMemo(() => {
    if (trackLength <= 10) {
      return [0, Math.floor(trackLength / 2), trackLength];
    }
    if (trackLength <= 25) {
      return [
        0,
        Math.floor(trackLength * 0.25),
        Math.floor(trackLength * 0.5),
        Math.floor(trackLength * 0.75),
        trackLength,
      ];
    }
    // For 26 to 60: major milestones
    const steps = [0];
    for (let s = 10; s < trackLength; s += 10) {
      steps.push(s);
    }
    steps.push(trackLength);
    return steps;
  }, [trackLength]);

  const quickLengths = [5, 10, 20, 30, 45, 60];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-emerald-800/60 bg-gradient-to-b from-emerald-950 via-emerald-900 to-green-950 shadow-2xl">
      {/* Turf Header / Lesson Controls Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-emerald-950/95 border-b border-emerald-800/80 text-xs font-medium text-emerald-200">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold tracking-wide uppercase text-emerald-100 font-display">
            Turf Racecourse
          </span>
          <span className="text-emerald-400/80 font-mono text-[11px]">
            ({trackLength} Steps to Win)
          </span>
        </div>

        {/* Quick Length & Probability Visibility Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Race Length Quick Selector up to 60 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-emerald-300/80">Length:</span>
            <div className="flex items-center gap-0.5 p-0.5 bg-emerald-950 rounded-lg border border-emerald-800/70 font-mono text-[11px]">
              {quickLengths.map((len) => (
                <button
                  key={len}
                  onClick={() => onChangeTrackLength(len)}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-md transition-colors ${
                    trackLength === len
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-emerald-300 hover:text-white hover:bg-emerald-800/50'
                  }`}
                  title={`Set race length to ${len} steps`}
                >
                  {len}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={3}
                max={60}
                value={trackLength}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    onChangeTrackLength(Math.max(3, Math.min(60, val)));
                  }
                }}
                className="w-12 px-1.5 py-0.5 rounded-md bg-emerald-950 border border-emerald-800 text-center font-mono font-bold text-amber-300 text-[11px] focus:outline-hidden focus:border-amber-400"
                title="Enter custom length (3 to 60 steps)"
              />
              <span className="text-[10px] text-emerald-400/70 font-mono">m</span>
            </div>
          </div>

          {/* Instant Result Quick Button */}
          {onInstantFinish && (
            <button
              onClick={onInstantFinish}
              disabled={winner !== null}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 text-slate-950 font-bold text-[11px] shadow-sm transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              title="Instantly finish this race"
            >
              <Zap className="w-3 h-3 fill-slate-950" />
              <span>Instant Result</span>
            </button>
          )}

          {/* Show / Hide Probability Toggle */}
          <button
            onClick={onToggleShowProbabilities}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
              showProbabilities
                ? 'bg-emerald-800/80 border-emerald-600 text-white'
                : 'bg-emerald-950/80 border-emerald-800 text-emerald-300/80 hover:text-emerald-100'
            }`}
            title="Toggle theoretical probabilities on horse lanes"
          >
            {showProbabilities ? (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-300" />
                <span>Probabilities: Visible</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                <span>Probabilities: Hidden</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prominent Winner Announcement Bar (when race has finished) */}
      {winner && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 py-2.5 flex items-center justify-between border-b border-amber-600 shadow-md animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-slate-950 shrink-0" />
            <span className="font-extrabold text-sm sm:text-base font-display">
              WINNER ANNOUNCEMENT: {winner.label} crosses the finish line in {totalRolls} rolls!
            </span>
          </div>
          <button
            onClick={() => sound.announceWinner(winner.label, totalRolls)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-950 text-amber-300 hover:text-amber-200 text-xs font-bold transition-all shadow-sm shrink-0"
            title="Voice announce winner"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Announce Voice</span>
          </button>
        </div>
      )}

      {/* Track Lanes Container */}
      <div className="relative p-2 sm:p-4 overflow-x-auto min-w-full">
        {/* Distance Guide Header */}
        <div className="flex items-center pb-2 pl-36 sm:pl-48 pr-12 text-[10px] font-mono text-emerald-400/70 border-b border-emerald-800/40">
          <div className="relative w-full flex justify-between">
            {markerSteps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center transform -translate-x-1/2">
                <span>{step === 0 ? 'START' : step === trackLength ? 'FINISH' : `${step}m`}</span>
                <span className="w-0.5 h-1.5 bg-emerald-600 mt-0.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Lanes List */}
        <div className="flex flex-col gap-1.5 mt-2">
          {horses.map((horse) => {
            const isLastMoved = lastMovedHorseValue === horse.value;
            const isWinner = winner?.value === horse.value;
            const isSelected = selectedHorseValue === horse.value;
            const progressFraction = Math.min(horse.position / trackLength, 1);

            return (
              <div
                key={horse.value}
                onClick={() => onSelectHorse(isSelected ? null : horse.value)}
                className={`group relative flex items-center h-13 sm:h-14 rounded-xl transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'ring-2 ring-amber-400 bg-emerald-800/80'
                    : isWinner
                    ? 'bg-amber-950/60 ring-2 ring-amber-500'
                    : isLastMoved
                    ? 'bg-emerald-800/50'
                    : 'bg-emerald-900/40 hover:bg-emerald-800/30'
                }`}
              >
                {/* Lane Info Placard (Left) */}
                <div className="flex items-center gap-2 w-36 sm:w-48 pl-2 pr-2.5 shrink-0 border-r border-emerald-800/50">
                  {/* Horse Bib Badge */}
                  <div
                    className="relative flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm text-white shadow-sm shrink-0 font-display"
                    style={{ backgroundColor: horse.color.primary }}
                  >
                    {horse.value}
                  </div>

                  {/* Horse Name & Show/Hide Theoretical Probability */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-100 truncate">
                        {horse.label}
                      </span>
                      {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </div>

                    {showProbabilities ? (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-300/90 font-mono">
                        <span>P = {horse.simplifiedFraction}</span>
                        <span>·</span>
                        <span className="text-amber-300 font-semibold">
                          {(horse.theoreticalProb * 100).toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-emerald-500/70 font-mono italic">
                        P = ? (Hidden)
                      </div>
                    )}
                  </div>
                </div>

                {/* Running Lane Strip */}
                <div className="relative flex-1 h-full flex items-center px-4 overflow-hidden">
                  {/* Subtle distance track lines */}
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-1 bg-emerald-950/60 rounded-full">
                    {/* Progress track fill */}
                    <div
                      className="h-full rounded-full transition-all duration-300 ease-out"
                      style={{
                        width: `${progressFraction * 100}%`,
                        backgroundColor: horse.color.primary,
                        opacity: 0.4,
                      }}
                    />
                  </div>

                  {/* Milestone tick marks (clean spacing even up to 60 steps) */}
                  <div className="absolute inset-x-4 top-0 bottom-0 flex justify-between pointer-events-none opacity-20">
                    {Array.from({ length: trackLength <= 20 ? trackLength + 1 : Math.floor(trackLength / (trackLength > 40 ? 5 : 2)) + 1 }).map((_, i) => (
                      <div key={i} className="w-px h-full bg-emerald-400" />
                    ))}
                  </div>

                  {/* Finish Line (Checkered post) */}
                  <div className="absolute right-4 top-1 bottom-1 w-2.5 rounded-xs bg-[repeating-linear-gradient(45deg,#fff,#fff_4px,#000_4px,#000_8px)] opacity-85 shadow-sm" />

                  {/* Animated Runner Horse */}
                  <div
                    className="absolute transition-all duration-400 ease-out z-10 flex items-center"
                    style={{
                      left: `calc(1rem + ${progressFraction * 84}% - ${progressFraction * 40}px)`,
                    }}
                  >
                    <HorseSprite
                      horseNumber={horse.value}
                      color={horse.color}
                      isMoving={isLastMoved}
                      isWinner={isWinner}
                      size="sm"
                    />

                    {/* Move celebration badge */}
                    {isLastMoved && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-400 text-slate-950 shadow-md animate-bounce">
                        +1
                      </span>
                    )}
                  </div>
                </div>

                {/* Step Counter Indicator (Right) */}
                <div className="w-14 shrink-0 flex flex-col items-center justify-center border-l border-emerald-800/40 text-[11px] font-mono">
                  <span className={`font-bold ${horse.position >= trackLength ? 'text-amber-400' : 'text-slate-200'}`}>
                    {horse.position}/{trackLength}
                  </span>
                  <span className="text-[9px] text-emerald-400/70">
                    {horse.movesCount} {horse.movesCount === 1 ? 'roll' : 'rolls'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
