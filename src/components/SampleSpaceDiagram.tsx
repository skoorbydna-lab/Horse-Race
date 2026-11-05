import React, { useState } from 'react';
import { DiceConfig, HorseOutcome, SampleSpaceCell } from '../types/probability';
import { computeSampleSpace, simplifyFraction, isPrime, getRuleSymbol } from '../utils/probabilityEngine';
import { HelpCircle, Sparkles, Filter, Check } from 'lucide-react';

interface SampleSpaceDiagramProps {
  config: DiceConfig;
  horses: HorseOutcome[];
  selectedHorseValue: number | null;
  onSelectHorse: (value: number | null) => void;
  lastRoll: { d1: number; d2: number; outcome: number } | null;
}

type QuickFilter = 'all' | 'even' | 'odd' | 'prime' | 'doubles';

export const SampleSpaceDiagram: React.FC<SampleSpaceDiagramProps> = ({
  config,
  horses,
  selectedHorseValue,
  onSelectHorse,
  lastRoll,
}) => {
  const [activeFilter, setActiveFilter] = useState<QuickFilter>('all');
  const [hoveredCell, setHoveredCell] = useState<SampleSpaceCell | null>(null);

  const { cells, flatCells, totalOutcomes } = computeSampleSpace(config);
  const ruleSymbol = getRuleSymbol(config.rule);

  // Map outcome value to horse for quick styling
  const horseMap = new Map<number, HorseOutcome>();
  horses.forEach(h => horseMap.set(h.value, h));

  // Determine which cells should be highlighted
  const isCellHighlighted = (cell: SampleSpaceCell) => {
    if (selectedHorseValue !== null) {
      return cell.outcome === selectedHorseValue;
    }
    if (hoveredCell !== null) {
      return cell.outcome === hoveredCell.outcome;
    }
    switch (activeFilter) {
      case 'even': return cell.outcome % 2 === 0;
      case 'odd': return cell.outcome % 2 !== 0;
      case 'prime': return isPrime(cell.outcome);
      case 'doubles': return cell.d1 === cell.d2;
      default: return true;
    }
  };

  // Inspect current focus outcome (either selected or hovered)
  const currentInspectValue = selectedHorseValue ?? hoveredCell?.outcome ?? null;
  const inspectHorse = currentInspectValue !== null ? horseMap.get(currentInspectValue) : null;
  const inspectCount = currentInspectValue !== null
    ? flatCells.filter(c => c.outcome === currentInspectValue).length
    : 0;

  // Filter count
  const filterCount = flatCells.filter(c => {
    switch (activeFilter) {
      case 'even': return c.outcome % 2 === 0;
      case 'odd': return c.outcome % 2 !== 0;
      case 'prime': return isPrime(c.outcome);
      case 'doubles': return c.d1 === c.d2;
      default: return true;
    }
  }).length;

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
      {/* Header and Quick Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-100 font-display">
              GCSE Sample Space Diagram
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
              {config.faces1.length} × {config.faces2.length} = {totalOutcomes} Outcomes
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Table shows all possible combinations of Die 1 and Die 2 under the rule:{' '}
            <span className="text-amber-400 font-mono font-medium">
              {config.rule === 'sum' && 'D₁ + D₂'}
              {config.rule === 'difference' && '|D₁ − D₂|'}
              {config.rule === 'product' && 'D₁ × D₂'}
              {config.rule === 'max' && 'max(D₁, D₂)'}
            </span>
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800/80 shrink-0 text-xs">
          {(['all', 'even', 'odd', 'prime', 'doubles'] as QuickFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setActiveFilter(filter);
                onSelectHorse(null);
              }}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all ${
                activeFilter === filter && selectedHorseValue === null
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Viewport */}
      <div className="mt-4 flex flex-col lg:flex-row gap-5 items-start">
        {/* The 2D Matrix Grid */}
        <div className="overflow-x-auto max-w-full pb-2">
          <table className="border-collapse text-center select-none">
            <thead>
              <tr>
                {/* Top-Left Corner Header */}
                <th className="p-2 text-xs font-mono font-bold text-slate-400 bg-slate-950/90 border border-slate-800 rounded-tl-lg">
                  D₁ \ D₂
                </th>
                {/* Column Headers: Die 2 */}
                {config.faces2.map((f2, j) => (
                  <th
                    key={j}
                    className="w-10 sm:w-12 h-9 p-1 text-xs font-mono font-bold text-cyan-400 bg-slate-950 border border-slate-800"
                  >
                    {f2}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {config.faces1.map((f1, i) => (
                <tr key={i}>
                  {/* Row Header: Die 1 */}
                  <th className="w-10 sm:w-12 h-10 sm:h-12 text-xs font-mono font-bold text-amber-400 bg-slate-950 border border-slate-800">
                    {f1}
                  </th>

                  {/* Outcome Cells */}
                  {cells[i].map((cell, j) => {
                    const horse = horseMap.get(cell.outcome);
                    const isHighlighted = isCellHighlighted(cell);
                    const isLastRolled =
                      lastRoll &&
                      lastRoll.d1 === cell.d1 &&
                      lastRoll.d2 === cell.d2 &&
                      lastRoll.outcome === cell.outcome;

                    return (
                      <td
                        key={j}
                        onMouseEnter={() => setHoveredCell(cell)}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() =>
                          onSelectHorse(selectedHorseValue === cell.outcome ? null : cell.outcome)
                        }
                        className={`relative w-10 sm:w-12 h-10 sm:h-12 border border-slate-800/90 transition-all cursor-pointer font-mono font-bold text-xs sm:text-sm ${
                          isHighlighted
                            ? 'text-white'
                            : 'opacity-25 text-slate-500 bg-slate-950/40'
                        } ${
                          isLastRolled
                            ? 'ring-3 ring-amber-400 ring-offset-1 ring-offset-slate-900 z-20 scale-105'
                            : ''
                        }`}
                        style={{
                          backgroundColor: isHighlighted && horse ? horse.color.primary : undefined,
                        }}
                      >
                        <div className="flex flex-col items-center justify-center w-full h-full">
                          <span>{cell.outcome}</span>
                          <span className="text-[9px] opacity-75 font-normal hidden sm:inline">
                            {cell.d1}{ruleSymbol}{cell.d2}
                          </span>
                        </div>

                        {/* Animated ping marker for current roll */}
                        {isLastRolled && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live GCSE Probability Calculation Card */}
        <div className="flex-1 w-full flex flex-col gap-3 min-w-[240px]">
          {inspectHorse ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 flex flex-col gap-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-md shadow-xs shrink-0"
                    style={{ backgroundColor: inspectHorse.color.primary }}
                  />
                  <span className="font-bold text-sm font-display text-white">
                    {inspectHorse.label}
                  </span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {inspectCount} / {totalOutcomes} ways
                </span>
              </div>

              {/* Exact Formula Breakdown */}
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 font-mono text-xs flex flex-col gap-1.5">
                <div className="text-slate-400 text-[11px]">GCSE Probability Formula:</div>
                <div className="text-emerald-400 font-semibold">
                  P({inspectHorse.value}) = n(Favourable) ÷ n(Total)
                </div>
                <div className="flex items-center gap-2 text-slate-200 mt-1">
                  <span>= {inspectCount}/{totalOutcomes}</span>
                  {inspectHorse.simplifiedFraction !== `${inspectCount}/${totalOutcomes}` && (
                    <span className="text-amber-400 font-bold">
                      = {inspectHorse.simplifiedFraction} (Simplified)
                    </span>
                  )}
                  <span>≈ {(inspectHorse.theoreticalProb * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Odds Payout Note */}
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>Fair Payout Multiplier:</span>
                <span className="font-bold text-amber-400 font-mono">
                  {inspectHorse.oddsMultiplier}× Stake
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Sample Space Analysis</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hover over any cell or horse to calculate its exact theoretical probability, favourable outcome count, and simplified fraction.
              </p>
              {activeFilter !== 'all' && (
                <div className="mt-1 p-2 rounded-lg bg-slate-900 text-xs font-mono text-emerald-400 flex items-center justify-between">
                  <span className="capitalize">{activeFilter} Outcomes:</span>
                  <span>
                    {filterCount}/{totalOutcomes} = {simplifyFraction(filterCount, totalOutcomes)} ({((filterCount / totalOutcomes) * 100).toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quick Horse Legend Ribbon */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {horses.map(h => (
              <button
                key={h.value}
                onClick={() => onSelectHorse(selectedHorseValue === h.value ? null : h.value)}
                className={`px-2 py-1 rounded-md text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                  selectedHorseValue === h.value
                    ? 'ring-2 ring-white text-white'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300'
                }`}
                style={{
                  backgroundColor: selectedHorseValue === h.value ? h.color.primary : undefined,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: h.color.primary }}
                />
                <span>H{h.value}</span>
                <span className="text-[10px] opacity-70">({h.theoreticalCount})</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
