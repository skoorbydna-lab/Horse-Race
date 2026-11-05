import React, { useState } from 'react';
import { DiceConfig, HorseOutcome, RaceRecord } from '../types/probability';
import { calculateOutcome } from '../utils/probabilityEngine';
import { sound } from '../utils/soundEffects';
import { Zap, X, Play, Trophy, Sparkles, CheckCircle2 } from 'lucide-react';

interface BatchRaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DiceConfig;
  horses: HorseOutcome[];
  existingRecordsCount: number;
  onBatchComplete: (newRecords: RaceRecord[]) => void;
}

export const BatchRaceModal: React.FC<BatchRaceModalProps> = ({
  isOpen,
  onClose,
  config,
  horses,
  existingRecordsCount,
  onBatchComplete,
}) => {
  const [raceCount, setRaceCount] = useState<number>(25);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [lastBatchResult, setLastBatchResult] = useState<{
    simulatedCount: number;
    topWinner: string;
    topWins: number;
  } | null>(null);

  if (!isOpen) return null;

  const quickPresets = [5, 10, 25, 50, 100, 250, 500, 1000];

  const handleSimulate = () => {
    if (raceCount <= 0 || isSimulating) return;

    setIsSimulating(true);

    // Run in a small timeout so the UI renders the loading state
    setTimeout(() => {
      const newRecords: RaceRecord[] = [];
      const winTallies: Record<number, number> = {};

      const horseMap = new Map<number, HorseOutcome>();
      horses.forEach(h => horseMap.set(h.value, h));

      for (let r = 0; r < raceCount; r++) {
        const raceNum = existingRecordsCount + r + 1;
        const horsePositions: Record<number, number> = {};
        let winnerOutcome: number | null = null;
        let totalRollsInRace = 0;

        // Roll dice until a horse reaches trackLength
        while (winnerOutcome === null && totalRollsInRace < 100000) {
          const d1 = config.faces1[Math.floor(Math.random() * config.faces1.length)];
          const d2 = config.faces2[Math.floor(Math.random() * config.faces2.length)];
          const outcome = calculateOutcome(d1, d2, config.rule);
          totalRollsInRace++;

          const nextPos = (horsePositions[outcome] || 0) + 1;
          horsePositions[outcome] = nextPos;

          if (nextPos >= config.trackLength) {
            winnerOutcome = outcome;
          }
        }

        if (winnerOutcome !== null) {
          const winnerHorse = horseMap.get(winnerOutcome) || horses[0];
          winTallies[winnerOutcome] = (winTallies[winnerOutcome] || 0) + 1;

          newRecords.push({
            raceNumber: raceNum,
            winnerValue: winnerOutcome,
            winnerLabel: winnerHorse.label,
            winnerColor: winnerHorse.color,
            totalRolls: totalRollsInRace,
            trackLength: config.trackLength,
            theoreticalProb: winnerHorse.theoreticalProb,
            simplifiedFraction: winnerHorse.simplifiedFraction,
            rule: config.rule,
            timestamp: Date.now() + r,
          });
        }
      }

      // Find top winner of this batch
      let maxWins = 0;
      let topWinnerHorse = horses[0];
      Object.entries(winTallies).forEach(([valStr, count]) => {
        if (count > maxWins) {
          maxWins = count;
          topWinnerHorse = horseMap.get(parseInt(valStr, 10)) || horses[0];
        }
      });

      setLastBatchResult({
        simulatedCount: raceCount,
        topWinner: topWinnerHorse.label,
        topWins: maxWins,
      });

      sound.playCashReward();
      onBatchComplete(newRecords);
      setIsSimulating(false);
    }, 40);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 text-slate-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h3 className="text-lg font-bold font-display text-white">
              Instant Multiple Race Simulation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Simulate any number of complete races in milliseconds. The winners and roll statistics will immediately populate the <strong className="text-amber-300">Bar Chart</strong> and <strong className="text-amber-300">Winners Log</strong>.
        </p>

        {/* Quick Presets */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Quick Number of Races Presets:
          </span>
          <div className="grid grid-cols-4 gap-2 font-mono text-xs">
            {quickPresets.map(preset => (
              <button
                key={preset}
                onClick={() => setRaceCount(preset)}
                className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                  raceCount === preset
                    ? 'border-amber-400 bg-amber-500/20 text-white ring-1 ring-amber-400'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {preset} Races
              </button>
            ))}
          </div>
        </div>

        {/* Custom Race Count Input */}
        <div className="flex flex-col gap-1.5 pt-2">
          <label className="text-xs font-medium text-slate-300">
            Or Enter Any Custom Number of Races:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={10000}
              value={raceCount}
              onChange={e => setRaceCount(Math.max(1, Math.min(10000, parseInt(e.target.value, 10) || 1)))}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 focus:outline-hidden text-base font-mono font-bold text-amber-300"
              placeholder="e.g. 50"
            />
            <span className="text-xs text-slate-400 font-mono">races</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Current track length: {config.trackLength} steps per race
          </span>
        </div>

        {/* Success Feedback Callout */}
        {lastBatchResult && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Successfully simulated <strong>{lastBatchResult.simulatedCount} races</strong>!
              </span>
            </div>
            <span className="font-mono text-[11px] text-amber-300">
              Leader: {lastBatchResult.topWinner} ({lastBatchResult.topWins} wins)
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleSimulate}
            disabled={isSimulating || raceCount <= 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>
              {isSimulating ? 'Simulating...' : `Simulate ${raceCount} Races Instantly`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
