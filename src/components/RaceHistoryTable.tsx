import React from 'react';
import { RaceRecord, HorseOutcome } from '../types/probability';
import { Trophy, RotateCcw, History, Zap } from 'lucide-react';
import { HorseWinsBarChart } from './HorseWinsBarChart';

interface RaceHistoryTableProps {
  records: RaceRecord[];
  onClearHistory: () => void;
  horses: HorseOutcome[];
  onOpenBatchModal?: () => void;
}

export const RaceHistoryTable: React.FC<RaceHistoryTableProps> = ({
  records,
  onClearHistory,
  horses,
  onOpenBatchModal,
}) => {
  return (
    <div className="flex flex-col gap-5">
      {/* 1. Dedicated Bar Chart of Wins per Horse Number */}
      <HorseWinsBarChart records={records} horses={horses} />

      {/* 2. Detailed Race-by-Race Log & Cumulative Cards */}
      <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl gap-4">
        {/* Header and Reset Action */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-semibold text-slate-100 font-display">
                Multi-Race Winners Log
              </h3>
              <span className="text-xs text-slate-400">
                {records.length} {records.length === 1 ? 'race' : 'races'} completed in session
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenBatchModal && (
              <button
                onClick={onOpenBatchModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                title="Simulate multiple complete races in one go"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                <span>Simulate Multiple Races</span>
              </button>
            )}
            {records.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                title="Clear multi-race winner history"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset History</span>
              </button>
            )}
          </div>
        </div>

        {records.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <History className="w-8 h-8 text-slate-600 mb-2" />
            <h4 className="text-sm font-semibold text-slate-200 font-display">
              No Completed Races Yet
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Roll the dice, use the &quot;Instant Result&quot; button, or batch-simulate multiple races to populate the winners log and bar chart!
            </p>
            {onOpenBatchModal && (
              <button
                onClick={onOpenBatchModal}
                className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Simulate Multiple Races Instantly</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Winners Log Table */}
            <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-xl border border-slate-800/80">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Race #</th>
                    <th className="py-2.5 px-3">Winner</th>
                    <th className="py-2.5 px-3">Length</th>
                    <th className="py-2.5 px-3 text-center">Rolls to Win</th>
                    <th className="py-2.5 px-3 text-right">Theoretical P(Winner)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono">
                  {records.map((r) => (
                    <tr key={r.raceNumber} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2 px-3 text-slate-400 font-bold">
                        Race {r.raceNumber}
                      </td>
                      <td className="py-2 px-3 flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: r.winnerColor.primary }}
                        />
                        <span className="font-bold text-white">{r.winnerLabel}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {r.trackLength}m
                      </td>
                      <td className="py-2 px-3 text-center text-amber-300 font-bold">
                        {r.totalRolls}
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-400">
                        {r.simplifiedFraction} ({(r.theoreticalProb * 100).toFixed(1)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
