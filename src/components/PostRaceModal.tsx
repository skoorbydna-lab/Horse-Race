import React, { useEffect, useState } from 'react';
import { DiceConfig, HorseOutcome } from '../types/probability';
import confetti from 'canvas-confetti';
import { Trophy, Volume2, Sparkles, X, CheckCircle2, RotateCcw } from 'lucide-react';
import { sound } from '../utils/soundEffects';
import { computeSampleSpace } from '../utils/probabilityEngine';

interface PostRaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  winner: HorseOutcome;
  horses: HorseOutcome[];
  totalRolls: number;
  config: DiceConfig;
  onResetRace: () => void;
  onSimulateLargeSample: (extraRolls: number) => void;
}

export const PostRaceModal: React.FC<PostRaceModalProps> = ({
  isOpen,
  onClose,
  winner,
  horses,
  totalRolls,
  config,
  onResetRace,
  onSimulateLargeSample,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'chart' | 'theory'>('summary');
  const [hasSimulated500, setHasSimulated500] = useState(false);

  useEffect(() => {
    if (isOpen) {
      sound.playVictoryFanfare();
      sound.announceWinner(winner.label, totalRolls);
      // Fire celebratory confetti bursts
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, winner, totalRolls]);

  if (!isOpen) return null;

  const { totalOutcomes } = computeSampleSpace(config);

  const handleLargeSample = () => {
    onSimulateLargeSample(500);
    setHasSimulated500(true);
    sound.playDiceRoll();
  };

  const handleSpeakWinner = () => {
    sound.announceWinner(winner.label, totalRolls);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 text-slate-100 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Winner Hero Banner */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/30 border border-amber-500/40 shadow-lg">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-white text-3xl shadow-xl font-display shrink-0 ring-4 ring-amber-400/40"
            style={{ backgroundColor: winner.color.primary }}
          >
            {winner.value}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-display">
                {winner.label} Takes First Place!
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Crossed the finish line in <span className="font-bold text-amber-400 font-mono">{totalRolls} total rolls</span>.
            </p>
          </div>

          {/* Voice Announcement Button */}
          <button
            onClick={handleSpeakWinner}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>Hear Announcement</span>
          </button>
        </div>

        {/* Segmented Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          {[
            { id: 'summary', label: 'Probability Calculations' },
            { id: 'chart', label: 'Theoretical vs Experimental Chart' },
            { id: 'theory', label: 'GCSE Law of Large Numbers' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Detailed Calculations Table */}
        {activeTab === 'summary' && (
          <div className="flex flex-col gap-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400">
                    <th className="py-2 px-2">Horse</th>
                    <th className="py-2 px-2">Sample Space Ways</th>
                    <th className="py-2 px-2">Theoretical P(E)</th>
                    <th className="py-2 px-2 text-center">Expected Rolls</th>
                    <th className="py-2 px-2 text-center">Actual Rolls</th>
                    <th className="py-2 px-2 text-right">Experimental Relative Freq</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {horses.map(horse => {
                    const isWin = horse.value === winner.value;
                    const theoreticalPct = (horse.theoreticalProb * 100).toFixed(1);
                    const expectedRolls = (horse.theoreticalProb * totalRolls).toFixed(1);
                    const experimentalProb = totalRolls > 0 ? (horse.movesCount / totalRolls) : 0;
                    const experimentalPct = (experimentalProb * 100).toFixed(1);

                    return (
                      <tr
                        key={horse.value}
                        className={isWin ? 'bg-amber-500/10 font-bold text-amber-200' : 'text-slate-300'}
                      >
                        <td className="py-2 px-2 flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: horse.color.primary }}
                          />
                          <span>H{horse.value}</span>
                          {isWin && <span className="text-[10px] text-amber-400">★ WINNER</span>}
                        </td>
                        <td className="py-2 px-2">
                          {horse.theoreticalCount} / {totalOutcomes}
                        </td>
                        <td className="py-2 px-2">
                          {horse.simplifiedFraction} ({theoreticalPct}%)
                        </td>
                        <td className="py-2 px-2 text-center text-slate-400">
                          {expectedRolls}
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-white">
                          {horse.movesCount}
                        </td>
                        <td className="py-2 px-2 text-right text-emerald-400 font-semibold">
                          {experimentalPct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-200 font-medium">GCSE Exam Mark Formula:</span>{' '}
                <span className="text-emerald-400 font-mono font-bold">
                  Relative Frequency = Actual Favourable Rolls ÷ Total Rolls
                </span>
                . In this race of {totalRolls} rolls, each horse's relative frequency approximates its theoretical probability from the sample space diagram.
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Comparative Bar Chart */}
        {activeTab === 'chart' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-4 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-cyan-500" /> Theoretical Probability %
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-amber-400" /> Actual Experimental %
                </span>
              </div>
            </div>

            {/* Bars container */}
            <div className="space-y-2 p-3 rounded-2xl bg-slate-950 border border-slate-800">
              {horses.map(horse => {
                const theoreticalPct = horse.theoreticalProb * 100;
                const experimentalPct = totalRolls > 0 ? (horse.movesCount / totalRolls) * 100 : 0;

                return (
                  <div key={horse.value} className="flex items-center gap-3 text-xs font-mono">
                    <span className="w-10 text-right font-bold text-slate-300">
                      H{horse.value}
                    </span>

                    <div className="flex-1 flex flex-col gap-1">
                      {/* Theoretical bar */}
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, theoreticalPct * 3.5)}%` }}
                        />
                      </div>
                      {/* Experimental bar */}
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, experimentalPct * 3.5)}%` }}
                        />
                      </div>
                    </div>

                    <div className="w-24 text-right text-[11px] text-slate-400">
                      <span className="text-cyan-400">{theoreticalPct.toFixed(1)}%</span>
                      {' / '}
                      <span className="text-amber-400 font-bold">{experimentalPct.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: GCSE Theory & Law of Large Numbers */}
        {activeTab === 'theory' && (
          <div className="flex flex-col gap-3 text-xs leading-relaxed text-slate-300">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
              <h4 className="font-bold text-sm text-white font-display">
                Why doesn't the theoretical favourite always win?
              </h4>
              <p className="text-slate-400">
                In a short race of 8 to 15 steps, probability is subject to{' '}
                <span className="text-amber-400 font-semibold">experimental variance</span>. Even though Horse 7 has a theoretical chance of 6/36 = 16.7%, an outlier horse (like Horse 5 or Horse 9) can easily enjoy a short run of luck.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
              <h4 className="font-bold text-sm text-white font-display">
                The Law of Large Numbers (GCSE Curriculum Topic)
              </h4>
              <p className="text-slate-400">
                As the number of trials ($n$) increases, the experimental relative frequency gets closer and closer to the exact theoretical probability calculated from the sample space diagram.
              </p>

              <div className="mt-2 flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div>
                  <div className="font-semibold text-slate-200">
                    Test the Law of Large Numbers right now:
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Simulate 500 extra rolls instantaneously to witness convergence!
                  </div>
                </div>
                <button
                  onClick={handleLargeSample}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Simulate 500 Rolls
                </button>
              </div>

              {hasSimulated500 && (
                <div className="text-emerald-400 font-mono text-[11px] flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>500 rolls added! Check the Probability Calculations tab to see how closely experimental matches theoretical!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Winner: <span className="font-bold text-white">{winner.label}</span> (Recorded in Winners Log)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Explore Sample Space
            </button>
            <button
              onClick={() => {
                onClose();
                onResetRace();
              }}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Next Race</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
