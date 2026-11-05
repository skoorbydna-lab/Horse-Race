import React, { useState } from 'react';
import { DiceConfig, DiceRule } from '../types/probability';
import { Settings2, X, Check, Dices, RotateCcw, AlertTriangle, Sparkles } from 'lucide-react';
import { computeSampleSpace } from '../utils/probabilityEngine';

interface DiceConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DiceConfig;
  onSaveConfig: (newConfig: DiceConfig) => void;
}

export const DiceConfigModal: React.FC<DiceConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [rule, setRule] = useState<DiceRule>(config.rule);
  const [trackLength, setTrackLength] = useState<number>(config.trackLength);

  const [faces1Str, setFaces1Str] = useState<string>(config.faces1.join(', '));
  const [faces2Str, setFaces2Str] = useState<string>(config.faces2.join(', '));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Parse strings to numbers array
  const parseFaces = (str: string): number[] => {
    return str
      .split(',')
      .map(s => s.trim())
      .filter(s => s !== '')
      .map(s => parseInt(s, 10))
      .filter(n => !isNaN(n));
  };

  const parsedFaces1 = parseFaces(faces1Str);
  const parsedFaces2 = parseFaces(faces2Str);

  const applyPreset = (size: number) => {
    const faces = Array.from({ length: size }, (_, i) => i + 1);
    setFaces1Str(faces.join(', '));
    setFaces2Str(faces.join(', '));
    setErrorMsg(null);
  };

  // Special Sicherman Dice easter egg (math curriculum curiosity)
  const applySicherman = () => {
    setFaces1Str('1, 2, 2, 3, 3, 4');
    setFaces2Str('1, 3, 4, 5, 6, 8');
    setRule('sum');
    setErrorMsg(null);
  };

  const handleSave = () => {
    if (parsedFaces1.length < 2 || parsedFaces2.length < 2) {
      setErrorMsg('Each die must have at least 2 faces.');
      return;
    }
    if (parsedFaces1.length > 20 || parsedFaces2.length > 20) {
      setErrorMsg('Maximum 20 faces per die for performance.');
      return;
    }

    const newConfig: DiceConfig = {
      sides1: parsedFaces1.length,
      sides2: parsedFaces2.length,
      faces1: parsedFaces1,
      faces2: parsedFaces2,
      rule,
      trackLength,
    };

    onSaveConfig(newConfig);
    onClose();
  };

  // Quick stats preview
  const previewSampleSpace = () => {
    if (parsedFaces1.length === 0 || parsedFaces2.length === 0) return null;
    try {
      const tempConfig: DiceConfig = {
        sides1: parsedFaces1.length,
        sides2: parsedFaces2.length,
        faces1: parsedFaces1,
        faces2: parsedFaces2,
        rule,
        trackLength,
      };
      const { totalOutcomes, outcomeCounts } = computeSampleSpace(tempConfig);
      return { totalOutcomes, horseCount: outcomeCounts.size };
    } catch {
      return null;
    }
  };

  const stats = previewSampleSpace();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Settings2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold font-display text-white">
              Dice & Rules Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Rule Selection */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Mathematical Rule for Horse Movement
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'sum', label: 'Sum', formula: 'D₁ + D₂', desc: 'Outcomes 2 to 12' },
              { id: 'difference', label: 'Difference', formula: '|D₁ − D₂|', desc: 'Outcomes 0 to 5' },
              { id: 'product', label: 'Product', formula: 'D₁ × D₂', desc: 'Outcomes 1 to 36' },
              { id: 'max', label: 'Highest Face', formula: 'max(D₁, D₂)', desc: 'Outcomes 1 to 6' },
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setRule(r.id as DiceRule)}
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  rule === r.id
                    ? 'border-amber-400 bg-amber-500/15 text-white ring-1 ring-amber-400'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-display">{r.label}</span>
                  {rule === r.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <span className="text-[11px] font-mono text-amber-300">{r.formula}</span>
                <span className="text-[10px] text-slate-400">{r.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Standard Dice Presets */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Quick Dice Presets
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: '4-Sided (d4)', size: 4 },
              { label: '6-Sided (Standard d6)', size: 6 },
              { label: '8-Sided (d8)', size: 8 },
              { label: '10-Sided (d10)', size: 10 },
              { label: '12-Sided (d12)', size: 12 },
            ].map(p => (
              <button
                key={p.size}
                onClick={() => applyPreset(p.size)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={applySicherman}
              title="Sicherman Dice have custom faces [1,2,2,3,3,4] and [1,3,4,5,6,8] which produce the exact same sum distribution as normal dice!"
              className="px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/70 hover:border-amber-600 text-xs font-medium text-amber-300 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Sicherman Dice</span>
            </button>
          </div>
        </div>

        {/* 3. Custom Face Values Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Die 1 Faces ({parsedFaces1.length} sides):
            </label>
            <input
              type="text"
              value={faces1Str}
              onChange={e => setFaces1Str(e.target.value)}
              placeholder="e.g. 1, 2, 3, 4, 5, 6"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-400 focus:outline-hidden text-sm font-mono text-amber-300"
            />
            <span className="text-[10px] text-slate-400">Comma-separated numbers</span>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Die 2 Faces ({parsedFaces2.length} sides):
            </label>
            <input
              type="text"
              value={faces2Str}
              onChange={e => setFaces2Str(e.target.value)}
              placeholder="e.g. 1, 2, 3, 4, 5, 6"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-400 focus:outline-hidden text-sm font-mono text-cyan-300"
            />
            <span className="text-[10px] text-slate-400">Comma-separated numbers</span>
          </div>
        </div>

        {/* 4. Track Length Slider (up to 60 steps) */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300">
              Race Track Length (Steps to Win):
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={3}
                max={60}
                value={trackLength}
                onChange={e => setTrackLength(Math.max(3, Math.min(60, parseInt(e.target.value, 10) || 3)))}
                className="w-14 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-center font-mono font-bold text-amber-400 text-xs"
              />
              <span className="text-xs text-slate-400">steps</span>
            </div>
          </div>
          <input
            type="range"
            min={3}
            max={60}
            value={trackLength}
            onChange={e => setTrackLength(parseInt(e.target.value, 10))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex flex-wrap items-center justify-between gap-1 mt-1 text-[10px] text-slate-400 font-mono">
            {[5, 10, 20, 30, 45, 60].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setTrackLength(val)}
                className={`px-2 py-0.5 rounded-md border transition-colors ${
                  trackLength === val
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {val}m
              </button>
            ))}
          </div>
        </div>

        {/* Preview Summary */}
        {stats && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
            <span>Sample Space: {stats.totalOutcomes} Outcomes</span>
            <span className="text-amber-400 font-semibold">{stats.horseCount} Horses on Track</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
          >
            Apply & Reset Race
          </button>
        </div>
      </div>
    </div>
  );
};
