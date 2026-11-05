import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { DiceConfig, HorseOutcome, RelativeFrequencyPoint, RollResult } from '../types/probability';
import { DiceVisual } from './DiceVisual';
import { calculateOutcome, getRuleSymbol, getRuleDescription, simplifyFraction } from '../utils/probabilityEngine';
import { sound } from '../utils/soundEffects';
import { LineChart, Play, Pause, RotateCcw, FastForward, Dices, TrendingUp, Sparkles, Plus, Info, ArrowUpDown, Maximize2 } from 'lucide-react';

interface RelativeFrequencyLabProps {
  config: DiceConfig;
  horses: HorseOutcome[];
}

export const RelativeFrequencyLab: React.FC<RelativeFrequencyLabProps> = ({
  config,
  horses,
}) => {
  // Chosen score to track on the relative frequency line graph (default modal outcome, e.g. 7 for sum)
  const [selectedScore, setSelectedScore] = useState<number>(() => {
    // Pick the horse with the highest theoretical probability
    const modal = horses.reduce((max, h) => h.theoreticalProb > max.theoreticalProb ? h : max, horses[0]);
    return modal?.value ?? 7;
  });

  // Track all roll occurrences
  const [totalTrials, setTotalTrials] = useState<number>(0);
  const [outcomeCounts, setOutcomeCounts] = useState<Record<number, number>>({});
  // Sub-sampled history points for smooth line rendering (to keep canvas/SVG light even at 10,000 rolls)
  const [historyPoints, setHistoryPoints] = useState<RelativeFrequencyPoint[]>([]);
  const [lastRoll, setLastRoll] = useState<RollResult | null>(null);

  // Auto-roll controls
  const [isAutoRolling, setIsAutoRolling] = useState<boolean>(false);
  const [autoSpeed, setAutoSpeed] = useState<number>(200); // ms per roll
  const [customRollCount, setCustomRollCount] = useState<number>(100);

  // References for reliable interval rolling
  const trialsRef = useRef<number>(0);
  const countsRef = useRef<Record<number, number>>({});
  const historyRef = useRef<RelativeFrequencyPoint[]>([]);
  const autoRollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep selected score valid if config changed
  useEffect(() => {
    const exists = horses.some(h => h.value === selectedScore);
    if (!exists && horses.length > 0) {
      const modal = horses.reduce((max, h) => h.theoreticalProb > max.theoreticalProb ? h : max, horses[0]);
      setSelectedScore(modal.value);
    }
  }, [horses, selectedScore]);

  // Recalculate line history when selected score changes
  const activeHorse = useMemo(() => {
    return horses.find(h => h.value === selectedScore) || horses[0];
  }, [horses, selectedScore]);

  // Handle single or multiple roll simulation
  const addRolls = useCallback((count: number) => {
    const currentTrials = trialsRef.current;
    const currentCounts = { ...countsRef.current };
    let currentChosenHits = currentCounts[selectedScore] || 0;

    const newHistory = [...historyRef.current];
    let finalD1 = 1;
    let finalD2 = 1;
    let finalOutcome = selectedScore;

    // Determine sampling stride to keep history graph responsive and silky smooth
    const stride = count > 1000 ? Math.floor(count / 150) : count > 200 ? 5 : 1;

    for (let i = 1; i <= count; i++) {
      const d1 = config.faces1[Math.floor(Math.random() * config.faces1.length)];
      const d2 = config.faces2[Math.floor(Math.random() * config.faces2.length)];
      const outcome = calculateOutcome(d1, d2, config.rule);

      currentCounts[outcome] = (currentCounts[outcome] || 0) + 1;
      if (outcome === selectedScore) {
        currentChosenHits++;
      }

      finalD1 = d1;
      finalD2 = d2;
      finalOutcome = outcome;

      const trialNum = currentTrials + i;
      if (i % stride === 0 || i === count) {
        newHistory.push({
          trial: trialNum,
          count: currentChosenHits,
          relativeFrequency: currentChosenHits / trialNum,
        });
      }
    }

    const nextTotal = currentTrials + count;
    trialsRef.current = nextTotal;
    countsRef.current = currentCounts;
    historyRef.current = newHistory;

    setTotalTrials(nextTotal);
    setOutcomeCounts(currentCounts);
    setHistoryPoints(newHistory);
    setLastRoll({
      d1: finalD1,
      d2: finalD2,
      outcome: finalOutcome,
      rollNumber: nextTotal,
    });
  }, [config, selectedScore]);

  // Auto roll timer
  useEffect(() => {
    if (!isAutoRolling) {
      if (autoRollTimerRef.current) clearTimeout(autoRollTimerRef.current);
      return;
    }

    const step = () => {
      sound.playDiceRoll();
      addRolls(1);
      autoRollTimerRef.current = setTimeout(step, autoSpeed);
    };

    autoRollTimerRef.current = setTimeout(step, autoSpeed);

    return () => {
      if (autoRollTimerRef.current) clearTimeout(autoRollTimerRef.current);
    };
  }, [isAutoRolling, autoSpeed, addRolls]);

  // Reset trials
  const handleReset = () => {
    if (autoRollTimerRef.current) clearTimeout(autoRollTimerRef.current);
    setIsAutoRolling(false);
    trialsRef.current = 0;
    countsRef.current = {};
    historyRef.current = [];
    setTotalTrials(0);
    setOutcomeCounts({});
    setHistoryPoints([]);
    setLastRoll(null);
  };

  // Switch chosen score (recompute history from scratch if user clicks another score)
  const handleSelectScore = (score: number) => {
    if (score === selectedScore) return;
    setSelectedScore(score);
    // If trials already exist, reset to observe the chosen score's convergence clearly
    handleReset();
  };

  // Theoretical probability of the chosen score
  const theoreticalProb = activeHorse ? activeHorse.theoreticalProb : 0.1667;
  const currentHits = outcomeCounts[selectedScore] || 0;
  const currentRelativeFreq = totalTrials > 0 ? currentHits / totalTrials : 0;
  const theoreticalPct = (theoreticalProb * 100).toFixed(1);
  const relativeFreqPct = (currentRelativeFreq * 100).toFixed(1);

  // Graph vertical height mode: 'tall' (420px) or 'extra-tall' (520px)
  const [graphHeightMode, setGraphHeightMode] = useState<'tall' | 'extra-tall'>('tall');

  // SVG Line Graph Dimensions (significantly increased height for GCSE clarity)
  const svgWidth = 800;
  const svgHeight = graphHeightMode === 'extra-tall' ? 520 : 420;
  const padding = { top: 24, right: 30, bottom: 44, left: 60 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  // Compute Y-domain (range from 0 to max of theoretical*2 or max relative frequency)
  const maxRelFreq = historyPoints.length > 0
    ? Math.max(...historyPoints.map(p => p.relativeFrequency))
    : theoreticalProb * 1.5;
  const yMax = Math.max(0.3, Math.min(1.0, Math.ceil(Math.max(theoreticalProb * 2, maxRelFreq * 1.2) * 10) / 10));

  // Scale functions
  const getX = (trial: number) => {
    if (totalTrials <= 1) return padding.left;
    return padding.left + ((trial - 1) / (totalTrials - 1)) * graphWidth;
  };

  const getY = (val: number) => {
    return padding.top + graphHeight - (val / yMax) * graphHeight;
  };

  // Generate SVG path for relative frequency curve
  const linePath = useMemo(() => {
    if (historyPoints.length === 0) return '';
    return historyPoints
      .map((p, idx) => {
        const x = getX(p.trial);
        const y = getY(p.relativeFrequency);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [historyPoints, totalTrials, yMax]);

  const theoreticalY = getY(theoreticalProb);
  const ruleSymbol = getRuleSymbol(config.rule);

  return (
    <div className="flex flex-col gap-5">
      {/* Top Banner: Score Selector & Lab Description */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white font-display">
              Relative Frequency Convergence Lab
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
              GCSE Experimental Probability
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Test the Law of Large Numbers! Roll the two dice repeatedly and watch the line graph show how the experimental relative frequency fluctuates at first, then stabilizes onto the true theoretical probability.
          </p>
        </div>

        {/* Selected Score Selector Strip */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Select Dice Score to Track:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {horses.map(h => {
              const isSelected = h.value === selectedScore;
              return (
                <button
                  key={h.value}
                  onClick={() => handleSelectScore(h.value)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-amber-400 text-white shadow-md'
                      : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                  style={{
                    backgroundColor: isSelected ? h.color.primary : undefined,
                  }}
                  title={`Track score ${h.value} (P = ${h.simplifiedFraction})`}
                >
                  {h.value}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 cols): Interactive Line Graph */}
        <div className="lg:col-span-8 flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
          {/* Graph Header Metrics */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-base shadow-sm font-display shrink-0"
                style={{ backgroundColor: activeHorse?.color.primary }}
              >
                {selectedScore}
              </div>
              <div>
                <div className="font-bold text-white text-sm">
                  Tracking Score {selectedScore}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Theoretical P = <span className="text-cyan-400 font-bold">{activeHorse?.simplifiedFraction}</span> ({theoreticalPct}%)
                </div>
              </div>
            </div>

            {/* Current Trials & Relative Frequency readout */}
            <div className="flex items-center gap-4 font-mono">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 uppercase">Trials (n)</span>
                <span className="text-sm font-bold text-white">{totalTrials}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 uppercase">Hits</span>
                <span className="text-sm font-bold text-amber-300">{currentHits}</span>
              </div>
              <div className="flex flex-col items-end pl-2 border-l border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Relative Freq</span>
                <span className="text-sm font-bold text-emerald-400">
                  {totalTrials > 0 ? (currentHits / totalTrials).toFixed(4) : '0.0000'} ({relativeFreqPct}%)
                </span>
              </div>
            </div>
          </div>

          {/* SVG Line Graph Viewport (Increased vertical presence) */}
          <div className="relative w-full bg-slate-950/80 rounded-xl border border-slate-800/80 p-2 sm:p-3 overflow-hidden min-h-[380px] sm:min-h-[430px] flex items-center justify-center">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto select-none overflow-visible"
            >
              {/* Grid Lines & Y-Axis Labels */}
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((frac, idx) => {
                const val = yMax * frac;
                const y = getY(val);
                return (
                  <g key={idx}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={svgWidth - padding.right}
                      y2={y}
                      stroke="#334155"
                      strokeWidth="1"
                      strokeDasharray={idx === 0 ? undefined : '2,4'}
                      opacity={0.6}
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 4}
                      fill="#94A3B8"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="end"
                    >
                      {val.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Ticks (Trial milestones) */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
                const trialNum = Math.max(1, Math.round(totalTrials * frac));
                const x = padding.left + frac * graphWidth;
                return (
                  <g key={idx}>
                    <line
                      x1={x}
                      y1={padding.top + graphHeight}
                      x2={x}
                      y2={padding.top + graphHeight + 5}
                      stroke="#64748B"
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={padding.top + graphHeight + 18}
                      fill="#94A3B8"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {totalTrials === 0 ? (idx === 0 ? '0' : '') : trialNum}
                    </text>
                  </g>
                );
              })}

              {/* Theoretical Probability Reference Line (Cyan Dashed) */}
              <line
                x1={padding.left}
                y1={theoreticalY}
                x2={svgWidth - padding.right}
                y2={theoreticalY}
                stroke="#06B6D4"
                strokeWidth="2"
                strokeDasharray="6,4"
              />
              <text
                x={svgWidth - padding.right}
                y={theoreticalY - 6}
                fill="#06B6D4"
                fontSize="11"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="end"
              >
                Theoretical P({selectedScore}) = {theoreticalProb.toFixed(3)} ({activeHorse?.simplifiedFraction})
              </text>

              {/* Experimental Relative Frequency Line (Amber Gold) */}
              {historyPoints.length > 1 && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="filter drop-shadow-sm"
                />
              )}

              {/* Latest Point Indicator Pin */}
              {historyPoints.length > 0 && (
                <circle
                  cx={getX(totalTrials)}
                  cy={getY(currentRelativeFreq)}
                  r="5"
                  fill="#F59E0B"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="animate-pulse"
                />
              )}

              {/* X-Axis and Y-Axis Titles */}
              <text
                x={svgWidth / 2}
                y={svgHeight - 4}
                fill="#64748B"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                Number of Trials / Dice Rolls (n)
              </text>
              <text
                x={-svgHeight / 2}
                y={14}
                fill="#64748B"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
                transform="rotate(-90)"
              >
                Relative Frequency (Count / n)
              </text>
            </svg>

            {/* Empty state overlay when no rolls have happened */}
            {totalTrials === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-2xs text-center p-4">
                <Dices className="w-8 h-8 text-amber-400 mb-2 animate-bounce" />
                <h4 className="text-sm font-bold text-white font-display">
                  Ready to Plot Relative Frequency
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Roll the dice using the controls on the right to start plotting the relative frequency line for Score {selectedScore}!
                </p>
              </div>
            )}
          </div>

          {/* Graph Legend & Height Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
            <div className="flex flex-wrap items-center gap-4 font-mono text-[11px]">
              <div className="flex items-center gap-1.5 text-amber-400">
                <span className="w-4 h-1 bg-amber-400 rounded-full" />
                <span>Experimental Relative Frequency (Hits / n)</span>
              </div>
              <div className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-cyan-400" />
                <span>Theoretical Probability (P = {activeHorse?.simplifiedFraction})</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {totalTrials > 50 && (
                <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Diff: {Math.abs(currentRelativeFreq - theoreticalProb).toFixed(4)}</span>
                </div>
              )}

              {/* Graph Height Selector */}
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
                <span className="text-slate-400 mr-1 flex items-center gap-1 text-[10px]">
                  <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  Height:
                </span>
                <button
                  onClick={() => setGraphHeightMode('tall')}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    graphHeightMode === 'tall'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tall Graph View (420px)"
                >
                  Tall (420px)
                </button>
                <button
                  onClick={() => setGraphHeightMode('extra-tall')}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    graphHeightMode === 'extra-tall'
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Extra Tall Graph View (520px)"
                >
                  Extra Tall (520px)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Dice Rolling Controls Station & Quick Batch Inputs */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Dice Rolling Station */}
          <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Dices className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-white font-display">
                  Dice Roll Station
                </h4>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Total: <strong className="text-white">{totalTrials}</strong>
              </span>
            </div>

            {/* Live 3D Dice Preview */}
            <div className="flex items-center justify-center gap-3 py-3 px-2 bg-slate-950/70 rounded-xl border border-slate-800">
              <DiceVisual
                value={lastRoll ? lastRoll.d1 : config.faces1[0]}
                label="Die 1"
                size="md"
                colorTheme="amber"
              />
              <span className="text-xl font-bold font-mono text-amber-400">
                {ruleSymbol}
              </span>
              <DiceVisual
                value={lastRoll ? lastRoll.d2 : config.faces2[0]}
                label="Die 2"
                size="md"
                colorTheme="cyan"
              />
              <span className="text-xl font-bold text-slate-500">=</span>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400">Outcome</span>
                <span className="text-2xl font-black font-display text-white">
                  {lastRoll ? lastRoll.outcome : '—'}
                </span>
              </div>
            </div>

            {/* Step-by-Step Roll Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  sound.playDiceRoll();
                  addRolls(1);
                }}
                disabled={isAutoRolling}
                className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Dices className="w-4 h-4" />
                <span>Roll 1</span>
              </button>

              <button
                onClick={() => setIsAutoRolling(!isAutoRolling)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                  isAutoRolling
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40 shadow-md'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 shadow-md'
                }`}
              >
                {isAutoRolling ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Auto Roll</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                title="Reset all trials"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Batch Roll Presets (+10, +50, +100, +500, +1000) */}
            <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400">
                Batch Roll Presets:
              </span>
              <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
                {[10, 50, 100, 500, 1000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => {
                      sound.playDiceRoll();
                      addRolls(amt);
                    }}
                    disabled={isAutoRolling}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3 text-cyan-400" />
                    <span>{amt}</span>
                  </button>
                ))}

                {/* Custom Number of Rolls Input */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={25000}
                    value={customRollCount}
                    onChange={e => setCustomRollCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-14 px-1.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-center font-mono text-amber-300 text-xs focus:outline-hidden focus:border-amber-400"
                    title="Enter custom number of rolls"
                  />
                  <button
                    onClick={() => {
                      sound.playDiceRoll();
                      addRolls(customRollCount);
                    }}
                    disabled={isAutoRolling || customRollCount <= 0}
                    className="flex-1 py-1 px-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-all cursor-pointer disabled:opacity-40"
                    title={`Roll ${customRollCount} times`}
                  >
                    Roll
                  </button>
                </div>
              </div>
            </div>

            {/* Auto Roll Speed Control */}
            {isAutoRolling && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80 font-mono">
                <span className="text-slate-400 text-[11px]">Speed:</span>
                <div className="flex items-center gap-1">
                  {[
                    { label: 'Normal', ms: 300 },
                    { label: 'Fast', ms: 100 },
                    { label: 'Turbo', ms: 25 },
                  ].map(s => (
                    <button
                      key={s.ms}
                      onClick={() => setAutoSpeed(s.ms)}
                      className={`px-2 py-0.5 rounded-md text-[10px] ${
                        autoSpeed === s.ms
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GCSE Pedagogical Insight */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs flex flex-col gap-2 shadow-lg">
            <div className="flex items-center gap-2 text-amber-400 font-bold font-display">
              <Info className="w-4 h-4" />
              <span>GCSE Curriculum Note</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              <strong className="text-slate-200">Law of Large Numbers:</strong> In a small number of throws, experimental probability is subject to high random chance. As trials increase ($n \to \infty$), the relative frequency line settles directly onto the true probability line!
            </p>
          </div>
        </div>
      </div>

      {/* Comprehensive GCSE Outcomes Frequency Table */}
      <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white font-display">
              Complete Outcomes Distribution ({totalTrials} Rolls)
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            Click any row to switch tracked graph score
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-3 text-center">Tally (Count)</th>
                <th className="py-2.5 px-3 text-center">Relative Frequency</th>
                <th className="py-2.5 px-3 text-center">Experimental %</th>
                <th className="py-2.5 px-3 text-right">Theoretical P(E)</th>
                <th className="py-2.5 px-3 text-right">Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {horses.map(horse => {
                const hits = outcomeCounts[horse.value] || 0;
                const relFreq = totalTrials > 0 ? hits / totalTrials : 0;
                const expPct = (relFreq * 100).toFixed(1);
                const theoPct = (horse.theoreticalProb * 100).toFixed(1);
                const diff = totalTrials > 0 ? (relFreq - horse.theoreticalProb) : 0;
                const isSelected = horse.value === selectedScore;

                return (
                  <tr
                    key={horse.value}
                    onClick={() => handleSelectScore(horse.value)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-amber-500/15 font-bold text-amber-200'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="py-2.5 px-3 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: horse.color.primary }}
                      />
                      <span>Score {horse.value}</span>
                      {isSelected && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-amber-400 text-slate-950 font-bold">
                          TRACKED
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-white">
                      {hits}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-300">
                      {totalTrials > 0 ? `${hits}/${totalTrials}` : '0'} ({relFreq.toFixed(4)})
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-amber-300">
                      {expPct}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-cyan-400">
                      {horse.simplifiedFraction} ({theoPct}%)
                    </td>
                    <td className={`py-2.5 px-3 text-right font-semibold ${
                      totalTrials === 0 ? 'text-slate-500' : Math.abs(diff) < 0.02 ? 'text-emerald-400' : 'text-slate-300'
                    }`}>
                      {totalTrials > 0 ? `${diff >= 0 ? '+' : ''}${(diff * 100).toFixed(1)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
