import React, { useState } from 'react';
import { RaceRecord, HorseOutcome } from '../types/probability';
import { BarChart3, TrendingUp, Info, Sparkles } from 'lucide-react';

interface HorseWinsBarChartProps {
  records: RaceRecord[];
  horses: HorseOutcome[];
}

export const HorseWinsBarChart: React.FC<HorseWinsBarChartProps> = ({
  records,
  horses,
}) => {
  const [viewMode, setViewMode] = useState<'count' | 'percentage' | 'theoretical'>('count');

  // Compute actual win tallies
  const winCounts: Record<number, number> = {};
  records.forEach((r) => {
    winCounts[r.winnerValue] = (winCounts[r.winnerValue] || 0) + 1;
  });

  const totalRaces = records.length;

  // Maximum win count to scale the Y-axis
  const maxWins = Math.max(1, ...horses.map((h) => winCounts[h.value] || 0));
  // Y-axis ticks
  const yTicks = [
    maxWins,
    Math.round((maxWins * 3) / 4),
    Math.round(maxWins / 2),
    Math.max(1, Math.round(maxWins / 4)),
    0,
  ].filter((v, i, arr) => arr.indexOf(v) === i).sort((a, b) => b - a);

  // Leader horse
  const topHorse = horses.reduce((prev, curr) => {
    const prevWins = winCounts[prev.value] || 0;
    const currWins = winCounts[curr.value] || 0;
    return currWins > prevWins ? curr : prev;
  }, horses[0]);

  const topWins = winCounts[topHorse.value] || 0;

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl gap-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-base font-semibold text-slate-100 font-display">
              Number of Wins by Horse Number
            </h3>
            <span className="text-xs text-slate-400">
              {totalRaces === 0 ? (
                'Theoretical Expectation (No races run yet)'
              ) : (
                <>
                  Based on <strong className="text-amber-300 font-mono">{totalRaces}</strong> {totalRaces === 1 ? 'race' : 'races'} completed
                </>
              )}
            </span>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs shrink-0 font-mono">
          <button
            onClick={() => setViewMode('count')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === 'count'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Win Count
          </button>
          <button
            onClick={() => setViewMode('percentage')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === 'percentage'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Win %
          </button>
          <button
            onClick={() => setViewMode('theoretical')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              viewMode === 'theoretical'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Compare Theory
          </button>
        </div>
      </div>

      {/* Main Bar Chart Canvas */}
      <div className="relative pt-6 pb-2 px-2 bg-slate-950/70 rounded-xl border border-slate-800/80">
        {/* Y-axis guidelines */}
        <div className="absolute inset-x-8 top-6 bottom-12 flex flex-col justify-between pointer-events-none opacity-20">
          {yTicks.map((tick, i) => (
            <div key={i} className="w-full flex items-center border-b border-slate-500">
              <span className="text-[10px] font-mono text-slate-400 -mt-3.5 -ml-6">
                {viewMode === 'percentage'
                  ? `${Math.round((tick / Math.max(1, totalRaces)) * 100)}%`
                  : tick}
              </span>
            </div>
          ))}
        </div>

        {/* Columns Container */}
        <div className="relative flex items-end justify-between gap-1 sm:gap-2 h-48 sm:h-56 pl-6 pr-2">
          {horses.map((horse) => {
            const wins = winCounts[horse.value] || 0;
            const winRatePct = totalRaces > 0 ? (wins / totalRaces) * 100 : 0;
            const theoreticalPct = horse.theoreticalProb * 100;

            // Height calculation based on viewMode
            let barHeightFraction = 0;
            if (totalRaces === 0) {
              // If no races, show theoretical height as faint reference
              barHeightFraction = horse.theoreticalProb / Math.max(...horses.map(h => h.theoreticalProb));
            } else if (viewMode === 'percentage') {
              barHeightFraction = Math.min(1, winRatePct / Math.max(10, ...horses.map(h => ((winCounts[h.value] || 0) / totalRaces) * 100)));
            } else {
              barHeightFraction = maxWins > 0 ? wins / maxWins : 0;
            }

            const barHeightPx = Math.max(totalRaces === 0 ? 12 : wins > 0 ? 14 : 4, barHeightFraction * 160);

            // Theoretical expected marker position
            const expectedWins = totalRaces * horse.theoreticalProb;
            const expectedHeightPx = maxWins > 0 ? Math.min(160, (expectedWins / maxWins) * 160) : 0;

            return (
              <div
                key={horse.value}
                className="flex-1 flex flex-col items-center justify-end h-full group relative"
              >
                {/* Tooltip on Hover */}
                <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 bg-slate-900 border border-slate-700 p-2 rounded-lg text-center shadow-xl whitespace-nowrap">
                  <div className="font-bold text-xs text-white">
                    {horse.label}
                  </div>
                  <div className="text-[10px] text-amber-300 font-mono">
                    {wins} {wins === 1 ? 'Win' : 'Wins'} ({winRatePct.toFixed(1)}%)
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    Theoretical P: {horse.simplifiedFraction} ({theoreticalPct.toFixed(1)}%)
                  </div>
                </div>

                {/* Number of Wins Label on top of Bar */}
                <div className="mb-1 text-center font-mono font-bold text-[11px]">
                  {totalRaces === 0 ? (
                    <span className="text-[9px] text-slate-500 font-normal">
                      {horse.simplifiedFraction}
                    </span>
                  ) : viewMode === 'percentage' ? (
                    <span className={wins > 0 ? 'text-amber-300' : 'text-slate-600'}>
                      {winRatePct.toFixed(0)}%
                    </span>
                  ) : (
                    <span className={wins > 0 ? 'text-white' : 'text-slate-600'}>
                      {wins}
                    </span>
                  )}
                </div>

                {/* Bar Element */}
                <div className="relative w-full max-w-[42px] flex items-end justify-center">
                  {/* Theoretical Expected Line marker (in 'theoretical' mode) */}
                  {viewMode === 'theoretical' && totalRaces > 0 && (
                    <div
                      className="absolute w-full border-t-2 border-dashed border-cyan-400 z-20 pointer-events-none"
                      style={{ bottom: `${expectedHeightPx}px` }}
                      title={`Expected: ${expectedWins.toFixed(1)} wins`}
                    />
                  )}

                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ease-out shadow-md ${
                      totalRaces === 0
                        ? 'opacity-25 border border-dashed border-slate-600'
                        : wins > 0
                        ? 'hover:brightness-110'
                        : 'opacity-20'
                    }`}
                    style={{
                      height: `${barHeightPx}px`,
                      backgroundColor: horse.color.primary,
                    }}
                  />
                </div>

                {/* X-Axis Horse Number Label */}
                <div className="mt-2 flex flex-col items-center">
                  <div
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center font-bold text-white text-[11px] font-display shadow-xs shrink-0"
                    style={{ backgroundColor: horse.color.primary }}
                  >
                    {horse.value}
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5 hidden sm:inline">
                    H{horse.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart Legend & Educational Callout */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="w-3 h-3 rounded-xs bg-amber-400" />
            <span>Actual Number of Wins</span>
          </div>
          {viewMode === 'theoretical' && (
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-cyan-300">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-cyan-400" />
              <span>Theoretical Expected Wins (n × P)</span>
            </div>
          )}
        </div>

        {totalRaces > 0 && topWins > 0 && (
          <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
            <span className="text-amber-400 font-bold">Leading Horse:</span>
            <span
              className="px-1.5 py-0.5 rounded-sm font-bold text-white"
              style={{ backgroundColor: topHorse.color.primary }}
            >
              H{topHorse.value}
            </span>
            <span>({topWins} wins, {((topWins / totalRaces) * 100).toFixed(0)}%)</span>
          </div>
        )}
      </div>

      {/* GCSE Math Takeaway */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">GCSE Probability Observation:</strong> Notice how the win frequency distribution aligns with the sample space combinations. Horses with more favorable outcomes in the 2D grid accumulate more wins over multiple races!
        </div>
      </div>
    </div>
  );
};
