import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DiceConfig, HorseOutcome, RollResult, RaceRecord } from './types/probability';
import { createHorsesFromConfig, calculateOutcome, getRuleDescription } from './utils/probabilityEngine';
import { Header } from './components/Header';
import { RaceTrack } from './components/RaceTrack';
import { SampleSpaceDiagram } from './components/SampleSpaceDiagram';
import { DiceRoller } from './components/DiceRoller';
import { RaceHistoryTable } from './components/RaceHistoryTable';
import { HorseWinsBarChart } from './components/HorseWinsBarChart';
import { DiceConfigModal } from './components/DiceConfigModal';
import { PostRaceModal } from './components/PostRaceModal';
import { GCSEQuizModal } from './components/GCSEQuizModal';
import { sound } from './utils/soundEffects';
import { Sparkles, GraduationCap, LayoutGrid, Award, Info, RefreshCw, Trophy, History, Zap, LineChart } from 'lucide-react';
import { BatchRaceModal } from './components/BatchRaceModal';
import { RelativeFrequencyLab } from './components/RelativeFrequencyLab';

const DEFAULT_CONFIG: DiceConfig = {
  sides1: 6,
  sides2: 6,
  faces1: [1, 2, 3, 4, 5, 6],
  faces2: [1, 2, 3, 4, 5, 6],
  rule: 'sum',
  trackLength: 8,
};

export default function App() {
  const [config, setConfig] = useState<DiceConfig>(DEFAULT_CONFIG);
  const [horses, setHorses] = useState<HorseOutcome[]>(() => createHorsesFromConfig(DEFAULT_CONFIG));

  // Lesson customization: Show/Hide probabilities next to horse numbers
  const [showProbabilities, setShowProbabilities] = useState<boolean>(() => {
    const saved = localStorage.getItem('equiprob_show_probabilities');
    return saved !== null ? saved === 'true' : true;
  });

  // Multi-race winners history log
  const [raceRecords, setRaceRecords] = useState<RaceRecord[]>(() => {
    const saved = localStorage.getItem('equiprob_race_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedHorseValue, setSelectedHorseValue] = useState<number | null>(null);

  const [totalRolls, setTotalRolls] = useState<number>(0);
  const [lastRoll, setLastRoll] = useState<RollResult | null>(null);
  const [lastMovedHorseValue, setLastMovedHorseValue] = useState<number | null>(null);
  const [winner, setWinner] = useState<HorseOutcome | null>(null);

  // Auto race controls
  const [isAutoRacing, setIsAutoRacing] = useState<boolean>(false);
  const [autoSpeed, setAutoSpeed] = useState<number>(500);

  // Navigation & Modals
  const [activeView, setActiveView] = useState<'track' | 'samplespace' | 'history' | 'frequency'>('track');
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isPostRaceOpen, setIsPostRaceOpen] = useState<boolean>(false);
  const [isQuizOpen, setIsQuizOpen] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);

  // Handle batch simulation completion
  const handleBatchRacesComplete = (newRecords: RaceRecord[]) => {
    setRaceRecords(prev => [...newRecords.reverse(), ...prev]);
  };

  // Save showProbabilities preference in localStorage
  useEffect(() => {
    localStorage.setItem('equiprob_show_probabilities', String(showProbabilities));
  }, [showProbabilities]);

  // Save race records in localStorage
  useEffect(() => {
    localStorage.setItem('equiprob_race_records', JSON.stringify(raceRecords));
  }, [raceRecords]);

  // When config changes, regenerate horses and reset race
  const handleSaveConfig = (newConfig: DiceConfig) => {
    setConfig(newConfig);
    const newHorses = createHorsesFromConfig(newConfig);
    setHorses(newHorses);
    handleResetRace(newConfig, newHorses);
  };

  // Change race length on the fly
  const handleChangeTrackLength = (newLength: number) => {
    const updatedConfig = { ...config, trackLength: newLength };
    setConfig(updatedConfig);
    // If a horse was already at or beyond new length, reset race cleanly
    const hasExceeded = horses.some(h => h.position >= newLength);
    if (hasExceeded || winner) {
      handleResetRace(updatedConfig);
    }
  };

  // References for deterministic auto-racing and immediate winner detection
  const horsesRef = useRef<HorseOutcome[]>(horses);
  horsesRef.current = horses;

  const winnerRef = useRef<HorseOutcome | null>(winner);
  winnerRef.current = winner;

  const totalRollsRef = useRef<number>(totalRolls);
  totalRollsRef.current = totalRolls;

  const isAutoRacingRef = useRef<boolean>(isAutoRacing);
  isAutoRacingRef.current = isAutoRacing;

  const autoRaceRef = useRef<NodeJS.Timeout | null>(null);

  const handleResetRace = (activeCfg = config, activeHorses = horses) => {
    if (autoRaceRef.current) {
      clearTimeout(autoRaceRef.current);
      autoRaceRef.current = null;
    }
    isAutoRacingRef.current = false;
    winnerRef.current = null;
    totalRollsRef.current = 0;

    setIsAutoRacing(false);
    setTotalRolls(0);
    setLastRoll(null);
    setLastMovedHorseValue(null);
    setWinner(null);
    setIsPostRaceOpen(false);

    const resetList = activeHorses.map(h => ({
      ...h,
      position: 0,
      movesCount: 0,
    }));
    horsesRef.current = resetList;
    setHorses(resetList);
  };

  const handleClearHistory = () => {
    setRaceRecords([]);
    localStorage.removeItem('equiprob_race_records');
  };

  // Check and handle race win
  const handleCheckWin = useCallback((detectedWinner: HorseOutcome, rollsCount: number) => {
    winnerRef.current = detectedWinner;
    isAutoRacingRef.current = false;
    setIsAutoRacing(false);
    if (autoRaceRef.current) {
      clearTimeout(autoRaceRef.current);
      autoRaceRef.current = null;
    }

    setWinner(detectedWinner);
    setIsPostRaceOpen(true);

    // Voice announce the winner
    sound.announceWinner(detectedWinner.label, rollsCount);

    // Record race into multi-race winners table
    const newRecord: RaceRecord = {
      raceNumber: raceRecords.length + 1,
      winnerValue: detectedWinner.value,
      winnerLabel: detectedWinner.label,
      winnerColor: detectedWinner.color,
      totalRolls: rollsCount,
      trackLength: config.trackLength,
      theoreticalProb: detectedWinner.theoreticalProb,
      simplifiedFraction: detectedWinner.simplifiedFraction,
      rule: config.rule,
      timestamp: Date.now(),
    };
    setRaceRecords(prev => [newRecord, ...prev]);
  }, [config.trackLength, config.rule, raceRecords.length]);

  // Perform a single roll of the 2 dice (synchronously returns winning HorseOutcome if finished)
  const performRoll = useCallback((): HorseOutcome | null => {
    if (winnerRef.current) return winnerRef.current;

    // Pick random face from faces1 and faces2
    const d1 = config.faces1[Math.floor(Math.random() * config.faces1.length)];
    const d2 = config.faces2[Math.floor(Math.random() * config.faces2.length)];
    const outcome = calculateOutcome(d1, d2, config.rule);

    const nextRollNum = totalRollsRef.current + 1;
    totalRollsRef.current = nextRollNum;
    setTotalRolls(nextRollNum);
    setLastRoll({ d1, d2, outcome, rollNumber: nextRollNum });
    setLastMovedHorseValue(outcome);

    let winningHorse: HorseOutcome | null = null;
    const currentList = horsesRef.current;
    const nextList = currentList.map(h => {
      if (h.value === outcome) {
        const nextPos = h.position + 1;
        const updated: HorseOutcome = {
          ...h,
          position: nextPos,
          movesCount: h.movesCount + 1,
        };
        if (nextPos >= config.trackLength && !winningHorse) {
          winningHorse = updated;
        }
        return updated;
      }
      return h;
    });

    horsesRef.current = nextList;
    setHorses(nextList);

    if (winningHorse) {
      handleCheckWin(winningHorse, nextRollNum);
    }

    return winningHorse;
  }, [config, handleCheckWin]);

  // Single roll trigger
  const handleRollOnce = () => {
    if (winnerRef.current) return;
    performRoll();
  };

  // Continuous auto race timer loop
  useEffect(() => {
    if (!isAutoRacing || winner) {
      if (autoRaceRef.current) {
        clearTimeout(autoRaceRef.current);
        autoRaceRef.current = null;
      }
      return;
    }

    const step = () => {
      if (winnerRef.current || !isAutoRacingRef.current) {
        if (autoRaceRef.current) {
          clearTimeout(autoRaceRef.current);
          autoRaceRef.current = null;
        }
        return;
      }

      sound.playHoofBeat();
      const won = performRoll();

      // Only schedule the next roll if no winner has crossed the finish line!
      if (!won && isAutoRacingRef.current && !winnerRef.current) {
        autoRaceRef.current = setTimeout(step, autoSpeed);
      }
    };

    autoRaceRef.current = setTimeout(step, autoSpeed);

    return () => {
      if (autoRaceRef.current) {
        clearTimeout(autoRaceRef.current);
        autoRaceRef.current = null;
      }
    };
  }, [isAutoRacing, winner, autoSpeed, performRoll]);

  // Simulate multiple rolls instantly for GCSE Law of Large Numbers
  const handleSimulateRolls = (count: number) => {
    if (winnerRef.current) return;

    let localWinner: HorseOutcome | null = null;
    const movesDelta: Record<number, number> = {};
    let finalRoll: RollResult | null = null;
    let rollsAdded = 0;

    for (let i = 0; i < count; i++) {
      const d1 = config.faces1[Math.floor(Math.random() * config.faces1.length)];
      const d2 = config.faces2[Math.floor(Math.random() * config.faces2.length)];
      const outcome = calculateOutcome(d1, d2, config.rule);

      movesDelta[outcome] = (movesDelta[outcome] || 0) + 1;
      rollsAdded++;
      finalRoll = { d1, d2, outcome, rollNumber: totalRollsRef.current + rollsAdded };

      // Check if this move wins the race
      const target = horsesRef.current.find(h => h.value === outcome);
      const currentPos = (target?.position || 0) + movesDelta[outcome];
      if (currentPos >= config.trackLength) {
        // Winner reached the finish line! Stop simulating rolls
        break;
      }
    }

    const newTotal = totalRollsRef.current + rollsAdded;
    totalRollsRef.current = newTotal;
    setTotalRolls(newTotal);
    if (finalRoll) setLastRoll(finalRoll);

    const nextList = horsesRef.current.map(h => {
      const delta = movesDelta[h.value] || 0;
      const nextPos = h.position + delta;
      const updated = {
        ...h,
        position: nextPos,
        movesCount: h.movesCount + delta,
      };
      if (nextPos >= config.trackLength && !localWinner) {
        localWinner = updated;
      }
      return updated;
    });

    horsesRef.current = nextList;
    setHorses(nextList);

    if (localWinner) {
      handleCheckWin(localWinner, newTotal);
    }
  };

  // Simulate large sample (for post race modal Law of Large Numbers demo)
  const handleSimulateLargeSample = (extraRolls: number) => {
    const movesDelta: Record<number, number> = {};
    for (let i = 0; i < extraRolls; i++) {
      const d1 = config.faces1[Math.floor(Math.random() * config.faces1.length)];
      const d2 = config.faces2[Math.floor(Math.random() * config.faces2.length)];
      const outcome = calculateOutcome(d1, d2, config.rule);
      movesDelta[outcome] = (movesDelta[outcome] || 0) + 1;
    }

    setTotalRolls(prev => prev + extraRolls);
    setHorses(prev => {
      return prev.map(h => ({
        ...h,
        movesCount: h.movesCount + (movesDelta[h.value] || 0),
      }));
    });
  };

  // Instantly finish the race to find the winner in 0ms
  const handleInstantFinish = useCallback(() => {
    if (winnerRef.current) return;

    // Halt any active auto race
    if (autoRaceRef.current) {
      clearTimeout(autoRaceRef.current);
      autoRaceRef.current = null;
    }
    isAutoRacingRef.current = false;
    setIsAutoRacing(false);

    let winningHorse: HorseOutcome | null = null;
    const currentList = horsesRef.current;
    const movesDelta: Record<number, number> = {};
    let rollsAdded = 0;
    let finalRoll: RollResult | null = null;

    const maxSafetyTrials = 100000;
    while (!winningHorse && rollsAdded < maxSafetyTrials) {
      const d1 = config.faces1[Math.floor(Math.random() * config.faces1.length)];
      const d2 = config.faces2[Math.floor(Math.random() * config.faces2.length)];
      const outcome = calculateOutcome(d1, d2, config.rule);

      movesDelta[outcome] = (movesDelta[outcome] || 0) + 1;
      rollsAdded++;
      finalRoll = { d1, d2, outcome, rollNumber: totalRollsRef.current + rollsAdded };

      const target = currentList.find(h => h.value === outcome);
      const currentPos = (target?.position || 0) + movesDelta[outcome];
      if (currentPos >= config.trackLength) {
        winningHorse = {
          ...target!,
          position: currentPos,
          movesCount: (target?.movesCount || 0) + movesDelta[outcome],
        };
        break;
      }
    }

    if (!winningHorse) return;

    const newTotal = totalRollsRef.current + rollsAdded;
    totalRollsRef.current = newTotal;
    setTotalRolls(newTotal);
    if (finalRoll) setLastRoll(finalRoll);
    setLastMovedHorseValue(winningHorse.value);

    const nextList = currentList.map(h => {
      const delta = movesDelta[h.value] || 0;
      return {
        ...h,
        position: h.position + delta,
        movesCount: h.movesCount + delta,
      };
    });

    horsesRef.current = nextList;
    setHorses(nextList);

    handleCheckWin(winningHorse, newTotal);
  }, [config, handleCheckWin]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <Header
        activeView={activeView}
        onSelectView={setActiveView}
        racesCount={raceRecords.length}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenQuiz={() => setIsQuizOpen(true)}
      />

      {/* Main Educational Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col gap-5">
        {/* Active Rules Info Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold font-mono">
              2D
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm font-display">
                  {getRuleDescription(config.rule)}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-mono">
                  {config.faces1.length}-sided × {config.faces2.length}-sided
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 font-mono border border-emerald-800">
                  {config.trackLength} Steps
                </span>
              </div>
              <div className="text-slate-400 mt-0.5">
                Roll the two dice to evaluate the {config.rule}. The corresponding horse moves forward 1 step!
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowProbabilities(!showProbabilities)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
            >
              {showProbabilities ? 'Hide Probabilities' : 'Show Probabilities'}
            </button>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors cursor-pointer"
            >
              Change Dice / Rules
            </button>
          </div>
        </div>

        {/* 2-Zone Sandbox: Stage & Control Deck */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left / Primary Zone (Race Track, Sample Space, or Winners History Table) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* View Switcher Tabs */}
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveView('track')}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeView === 'track'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Race Course View
                </button>
                <button
                  onClick={() => setActiveView('frequency')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeView === 'frequency'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Plot relative frequency line graph against theoretical probability"
                >
                  <LineChart className="w-3.5 h-3.5" />
                  <span>Relative Frequency Graph</span>
                </button>
                <button
                  onClick={() => setActiveView('samplespace')}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeView === 'samplespace'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sample Space Matrix
                </button>
                <button
                  onClick={() => setActiveView('history')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeView === 'history'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Winners Log ({raceRecords.length})</span>
                </button>
              </div>

              {selectedHorseValue !== null && activeView !== 'frequency' && (
                <button
                  onClick={() => setSelectedHorseValue(null)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear Selection (Horse {selectedHorseValue})
                </button>
              )}
            </div>

            {/* Display Active View */}
            {activeView === 'track' && (
              <RaceTrack
                horses={horses}
                trackLength={config.trackLength}
                lastMovedHorseValue={lastMovedHorseValue}
                winner={winner}
                selectedHorseValue={selectedHorseValue}
                onSelectHorse={setSelectedHorseValue}
                showProbabilities={showProbabilities}
                onToggleShowProbabilities={() => setShowProbabilities(!showProbabilities)}
                onChangeTrackLength={handleChangeTrackLength}
                onInstantFinish={handleInstantFinish}
                totalRolls={totalRolls}
              />
            )}

            {activeView === 'frequency' && (
              <RelativeFrequencyLab
                config={config}
                horses={horses}
              />
            )}

            {activeView === 'samplespace' && (
              <SampleSpaceDiagram
                config={config}
                horses={horses}
                selectedHorseValue={selectedHorseValue}
                onSelectHorse={setSelectedHorseValue}
                lastRoll={lastRoll}
              />
            )}

            {activeView === 'history' && (
              <RaceHistoryTable
                records={raceRecords}
                onClearHistory={handleClearHistory}
                horses={horses}
                onOpenBatchModal={() => setIsBatchModalOpen(true)}
              />
            )}

            {/* When on track view, show the dedicated Bar Chart of Wins per Horse Number and the Sample Space Diagram beneath */}
            {activeView === 'track' && (
              <div className="flex flex-col gap-5 mt-1">
                {/* Bar chart showing number of wins per horse number */}
                <HorseWinsBarChart records={raceRecords} horses={horses} />

                {/* GCSE Sample Space Diagram */}
                <SampleSpaceDiagram
                  config={config}
                  horses={horses}
                  selectedHorseValue={selectedHorseValue}
                  onSelectHorse={setSelectedHorseValue}
                  lastRoll={lastRoll}
                />
              </div>
            )}
          </div>

          {/* Right Zone: Dice Roller Station & Classroom Controls */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Dice Roller Station */}
            <DiceRoller
              config={config}
              lastRoll={lastRoll}
              onRollOnce={handleRollOnce}
              onSimulateRolls={handleSimulateRolls}
              onInstantFinish={handleInstantFinish}
              onResetRace={() => handleResetRace()}
              isAutoRacing={isAutoRacing}
              onToggleAutoRace={() => {
                if (!isAutoRacing) sound.playBugleCall();
                setIsAutoRacing(!isAutoRacing);
              }}
              autoSpeed={autoSpeed}
              onChangeAutoSpeed={setAutoSpeed}
              raceFinished={winner !== null}
              totalRolls={totalRolls}
              winner={winner}
            />

            {/* Quick Multi-Race Winners Summary Card */}
            <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold text-white font-display">
                    Session Winners ({raceRecords.length} Races)
                  </h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (winnerRef.current) {
                        handleResetRace();
                        setTimeout(() => handleInstantFinish(), 20);
                      } else {
                        handleInstantFinish();
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-all cursor-pointer"
                    title="Simulate a single complete race in 0ms to add to the bar chart"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>+1 Instant</span>
                  </button>
                  <button
                    onClick={() => setIsBatchModalOpen(true)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Simulate any number of races in one go"
                  >
                    <Zap className="w-3 h-3 fill-slate-950" />
                    <span>Batch Races</span>
                  </button>
                  {raceRecords.length > 0 && (
                    <button
                      onClick={() => setActiveView('history')}
                      className="text-xs text-amber-400 hover:underline cursor-pointer ml-1"
                    >
                      View All
                    </button>
                  )}
                </div>
              </div>

              {raceRecords.length === 0 ? (
                <p className="text-xs text-slate-400 leading-relaxed">
                  No races completed yet in this session. Run a race to the finish line to log the winner!
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="text-[11px] text-slate-400">
                    Latest Winner:{' '}
                    <span className="font-bold text-white">
                      {raceRecords[0].winnerLabel}
                    </span>{' '}
                    ({raceRecords[0].totalRolls} rolls, P={raceRecords[0].simplifiedFraction})
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto py-1">
                    {raceRecords.slice(0, 6).map((r, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold text-white shadow-xs shrink-0"
                        style={{ backgroundColor: r.winnerColor.primary }}
                        title={`Race ${r.raceNumber}: ${r.winnerLabel} (${r.totalRolls} rolls)`}
                      >
                        H{r.winnerValue}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Lesson Prompt & GCSE Question Launcher */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs flex flex-col gap-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold font-display">
                  <GraduationCap className="w-4 h-4" />
                  <span>GCSE Lesson Discussion</span>
                </div>
                <button
                  onClick={() => setIsQuizOpen(true)}
                  className="text-xs px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold"
                >
                  Start Quiz
                </button>
              </div>
              <ul className="space-y-2 text-slate-400 text-[11px] leading-relaxed">
                <li>
                  <strong className="text-slate-200">Pre-Race Hypothesis:</strong> Hide probabilities and ask students: <em>"Which horse do you predict will win and why?"</em>
                </li>
                <li>
                  <strong className="text-slate-200">Compare Outcomes:</strong> Show the Sample Space diagram to reveal why certain sums have more combinations.
                </li>
                <li>
                  <strong className="text-slate-200">Multi-Race Law:</strong> Run 5 to 10 races to observe whether the modal outcome consistently dominates overall wins.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-5 border-t border-slate-800 text-center text-xs text-slate-500">
        EquiProb GCSE Maths Simulator · Probability & Sample Space Interactive Demonstration
      </footer>

      {/* Modals */}
      <DiceConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />

      {winner && (
        <PostRaceModal
          isOpen={isPostRaceOpen}
          onClose={() => setIsPostRaceOpen(false)}
          winner={winner}
          horses={horses}
          totalRolls={totalRolls}
          config={config}
          onResetRace={() => handleResetRace()}
          onSimulateLargeSample={handleSimulateLargeSample}
        />
      )}

      <GCSEQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        config={config}
        horses={horses}
        onRewardCredits={() => {}}
      />

      <BatchRaceModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        config={config}
        horses={horses}
        existingRecordsCount={raceRecords.length}
        onBatchComplete={handleBatchRacesComplete}
      />
    </div>
  );
}
