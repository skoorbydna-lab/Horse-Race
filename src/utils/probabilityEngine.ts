import { DiceConfig, DiceRule, HorseColorTheme, HorseOutcome, SampleSpaceCell, GCSEQuestion } from '../types/probability';

// Palette of 18 distinctive, high-contrast, accessible colours for jockey silks
export const HORSE_PALETTES: HorseColorTheme[] = [
  { primary: '#DC2626', secondary: '#FEE2E2', bg: 'bg-red-600', text: 'text-red-600', border: 'border-red-500', badge: 'bg-red-950/60 text-red-300 border-red-800' }, // Red
  { primary: '#2563EB', secondary: '#DBEAFE', bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-500', badge: 'bg-blue-950/60 text-blue-300 border-blue-800' }, // Blue
  { primary: '#16A34A', secondary: '#DCFCE7', bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-500', badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800' }, // Emerald
  { primary: '#D97706', secondary: '#FEF3C7', bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-500', badge: 'bg-amber-950/60 text-amber-300 border-amber-800' }, // Amber
  { primary: '#9333EA', secondary: '#F3E8FF', bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-500', badge: 'bg-purple-950/60 text-purple-300 border-purple-800' }, // Purple
  { primary: '#0891B2', secondary: '#CFFAFE', bg: 'bg-cyan-600', text: 'text-cyan-600', border: 'border-cyan-500', badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-800' }, // Cyan
  { primary: '#E11D48', secondary: '#FFE4E6', bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-500', badge: 'bg-rose-950/60 text-rose-300 border-rose-800' }, // Rose
  { primary: '#4F46E5', secondary: '#E0E7FF', bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-500', badge: 'bg-indigo-950/60 text-indigo-300 border-indigo-800' }, // Indigo
  { primary: '#CA8A04', secondary: '#FEF9C3', bg: 'bg-yellow-600', text: 'text-yellow-600', border: 'border-yellow-500', badge: 'bg-yellow-950/60 text-yellow-300 border-yellow-800' }, // Yellow
  { primary: '#059669', secondary: '#D1FAE5', bg: 'bg-teal-600', text: 'text-teal-600', border: 'border-teal-500', badge: 'bg-teal-950/60 text-teal-300 border-teal-800' }, // Teal
  { primary: '#C026D3', secondary: '#FAE8FF', bg: 'bg-fuchsia-600', text: 'text-fuchsia-600', border: 'border-fuchsia-500', badge: 'bg-fuchsia-950/60 text-fuchsia-300 border-fuchsia-800' }, // Fuchsia
  { primary: '#EA580C', secondary: '#FFEDD5', bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-500', badge: 'bg-orange-950/60 text-orange-300 border-orange-800' }, // Orange
  { primary: '#65A30D', secondary: '#ECFCCB', bg: 'bg-lime-600', text: 'text-lime-600', border: 'border-lime-500', badge: 'bg-lime-950/60 text-lime-300 border-lime-800' }, // Lime
  { primary: '#475569', secondary: '#F1F5F9', bg: 'bg-slate-600', text: 'text-slate-600', border: 'border-slate-500', badge: 'bg-slate-950/60 text-slate-300 border-slate-800' }, // Slate
  { primary: '#DB2777', secondary: '#FCE7F3', bg: 'bg-pink-600', text: 'text-pink-600', border: 'border-pink-500', badge: 'bg-pink-950/60 text-pink-300 border-pink-800' }, // Pink
  { primary: '#0D9488', secondary: '#CCFBF1', bg: 'bg-emerald-700', text: 'text-emerald-700', border: 'border-emerald-600', badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800' }, // Dark Emerald
  { primary: '#7C3AED', secondary: '#EDE9FE', bg: 'bg-violet-600', text: 'text-violet-600', border: 'border-violet-500', badge: 'bg-violet-950/60 text-violet-300 border-violet-800' }, // Violet
  { primary: '#B45309', secondary: '#FEF3C7', bg: 'bg-amber-700', text: 'text-amber-700', border: 'border-amber-600', badge: 'bg-amber-950/60 text-amber-300 border-amber-800' }, // Dark Amber
];

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

export function simplifyFraction(numerator: number, denominator: number): string {
  if (numerator === 0) return '0';
  if (numerator === denominator) return '1';
  const divisor = gcd(numerator, denominator);
  const num = numerator / divisor;
  const den = denominator / divisor;
  if (den === 1) return `${num}`;
  return `${num}/${den}`;
}

export function calculateOutcome(d1: number, d2: number, rule: DiceRule): number {
  switch (rule) {
    case 'sum':
      return d1 + d2;
    case 'difference':
      return Math.abs(d1 - d2);
    case 'product':
      return d1 * d2;
    case 'max':
      return Math.max(d1, d2);
    default:
      return d1 + d2;
  }
}

export function getRuleSymbol(rule: DiceRule): string {
  switch (rule) {
    case 'sum': return '+';
    case 'difference': return '−';
    case 'product': return '×';
    case 'max': return 'max';
  }
}

export function getRuleDescription(rule: DiceRule): string {
  switch (rule) {
    case 'sum': return 'Sum (D₁ + D₂)';
    case 'difference': return 'Difference |D₁ − D₂|';
    case 'product': return 'Product (D₁ × D₂)';
    case 'max': return 'Highest Face max(D₁, D₂)';
  }
}

export function computeSampleSpace(config: DiceConfig): {
  cells: SampleSpaceCell[][];
  flatCells: SampleSpaceCell[];
  totalOutcomes: number;
  outcomeCounts: Map<number, number>;
} {
  const cells: SampleSpaceCell[][] = [];
  const flatCells: SampleSpaceCell[] = [];
  const outcomeCounts = new Map<number, number>();

  for (let i = 0; i < config.faces1.length; i++) {
    const row: SampleSpaceCell[] = [];
    const d1 = config.faces1[i];
    for (let j = 0; j < config.faces2.length; j++) {
      const d2 = config.faces2[j];
      const outcome = calculateOutcome(d1, d2, config.rule);
      const cell: SampleSpaceCell = {
        d1,
        d2,
        outcome,
        key: `${i}-${j}`,
      };
      row.push(cell);
      flatCells.push(cell);
      outcomeCounts.set(outcome, (outcomeCounts.get(outcome) || 0) + 1);
    }
    cells.push(row);
  }

  const totalOutcomes = config.faces1.length * config.faces2.length;
  return { cells, flatCells, totalOutcomes, outcomeCounts };
}

export function createHorsesFromConfig(config: DiceConfig): HorseOutcome[] {
  const { totalOutcomes, outcomeCounts } = computeSampleSpace(config);
  const uniqueOutcomes = Array.from(outcomeCounts.keys()).sort((a, b) => a - b);

  return uniqueOutcomes.map((value, index) => {
    const count = outcomeCounts.get(value) || 0;
    const theoreticalProb = count / totalOutcomes;
    const simplifiedFraction = simplifyFraction(count, totalOutcomes);

    // Fair/educational odds multiplier calculation:
    // Payout inversely proportional to probability, clamped reasonably for student engagement
    // Low prob (e.g. 1/36) -> ~18x; High prob (e.g. 6/36 = 1/6) -> ~2.8x
    const rawOdds = (1 / theoreticalProb) * 0.75;
    const oddsMultiplier = Number(Math.max(1.4, Math.min(25, rawOdds)).toFixed(1));

    const color = HORSE_PALETTES[index % HORSE_PALETTES.length];

    return {
      value,
      label: `Horse ${value}`,
      color,
      theoreticalCount: count,
      theoreticalProb,
      simplifiedFraction,
      oddsMultiplier,
      position: 0,
      movesCount: 0,
    };
  });
}

export function isPrime(n: number): boolean {
  if (n <= 1) return false;
  if (n <= 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

// Generate GCSE examination style practice questions dynamically based on active dice config
export function generateGCSEQuestions(config: DiceConfig, horses: HorseOutcome[]): GCSEQuestion[] {
  const { totalOutcomes, flatCells, outcomeCounts } = computeSampleSpace(config);
  const questions: GCSEQuestion[] = [];

  // 1. Most Likely Outcome (Mode)
  let maxCount = 0;
  let modalHorses: number[] = [];
  outcomeCounts.forEach((count, val) => {
    if (count > maxCount) {
      maxCount = count;
      modalHorses = [val];
    } else if (count === maxCount) {
      modalHorses.push(val);
    }
  });

  const modalStr = modalHorses.join(' or ');
  const modalProbStr = simplifyFraction(maxCount, totalOutcomes);
  questions.push({
    id: 'mode-question',
    topic: 'Sample Space',
    question: `Which horse has the greatest probability of moving on any single roll of the two dice?`,
    options: [
      `Horse ${modalStr}`,
      `All horses have equal chance`,
      `Horse ${horses[0].value}`,
      `Horse ${horses[horses.length - 1].value}`,
    ],
    correctIndex: 0,
    explanation: `Horse ${modalStr} corresponds to ${maxCount} out of ${totalOutcomes} outcomes in the sample space diagram (P = ${modalProbStr}), making it the modal outcome.`,
    gcseMark: '1 Mark [AO1]',
    filterHighlight: (outcome) => modalHorses.includes(outcome),
  });

  // 2. Specific Outcome Probability
  const targetHorse = horses[Math.floor(horses.length / 2)] || horses[0];
  const targetCount = outcomeCounts.get(targetHorse.value) || 0;
  const correctProb = simplifyFraction(targetCount, totalOutcomes);
  const decoy1 = simplifyFraction(Math.max(1, targetCount - 1), totalOutcomes);
  const decoy2 = simplifyFraction(Math.min(totalOutcomes - 1, targetCount + 2), totalOutcomes);
  const decoy3 = `${targetCount}/${totalOutcomes + 2}`;

  const probOptions = Array.from(new Set([correctProb, decoy1, decoy2, decoy3]));
  while (probOptions.length < 4) {
    probOptions.push(`${Math.floor(Math.random() * 5) + 1}/${totalOutcomes}`);
  }
  // Shuffle options
  const shuffledProbOptions = [...probOptions].sort(() => 0.5 - Math.random());
  const correctProbIndex = shuffledProbOptions.indexOf(correctProb);

  questions.push({
    id: 'specific-prob',
    topic: 'Probability Fraction',
    question: `Find the probability of rolling a result for Horse ${targetHorse.value} on one roll. Give your answer in simplest form.`,
    mathExpression: `P(\\text{Outcome} = ${targetHorse.value})`,
    options: shuffledProbOptions,
    correctIndex: correctProbIndex,
    explanation: `From the sample space grid, there are ${targetCount} cells out of ${totalOutcomes} total outcomes that produce ${targetHorse.value}. ${targetCount}/${totalOutcomes} simplifies to ${correctProb}.`,
    gcseMark: '2 Marks [AO1 / AO2]',
    filterHighlight: (outcome) => outcome === targetHorse.value,
  });

  // 3. Even Outcome Probability
  const evenCount = flatCells.filter(c => c.outcome % 2 === 0).length;
  const evenFraction = simplifyFraction(evenCount, totalOutcomes);
  const oddFraction = simplifyFraction(totalOutcomes - evenCount, totalOutcomes);
  questions.push({
    id: 'even-outcome',
    topic: 'Events & Sets',
    question: `What is the probability that an EVEN numbered horse moves on any given roll?`,
    mathExpression: `P(\\text{Outcome is Even})`,
    options: [
      evenFraction,
      oddFraction,
      simplifyFraction(Math.floor(evenCount / 2), totalOutcomes),
      '1/2',
    ],
    correctIndex: 0,
    explanation: `Count all cells where the result is even: ${evenCount} cells out of ${totalOutcomes}. ${evenCount}/${totalOutcomes} simplifies to ${evenFraction}.`,
    gcseMark: '2 Marks [AO2]',
    filterHighlight: (outcome) => outcome % 2 === 0,
  });

  // 4. Expected Frequency Question
  const sampleRolls = 180;
  const expectedFreq = Math.round((targetCount / totalOutcomes) * sampleRolls);
  questions.push({
    id: 'expected-frequency',
    topic: 'Expected Frequency',
    question: `In an experiment, the two dice are rolled ${sampleRolls} times. Calculate an estimate for the number of times Horse ${targetHorse.value} will move forward.`,
    mathExpression: `\\text{Expected Frequency} = n \\times P(E)`,
    options: [
      `${expectedFreq} times`,
      `${expectedFreq + 12} times`,
      `${Math.max(1, expectedFreq - 15)} times`,
      `${sampleRolls / horses.length} times`,
    ],
    correctIndex: 0,
    explanation: `Expected frequency = Number of trials × P(Event) = ${sampleRolls} × (${targetCount}/${totalOutcomes}) = ${expectedFreq}.`,
    gcseMark: '2 Marks [AO2]',
    filterHighlight: (outcome) => outcome === targetHorse.value,
  });

  // 5. Fairness / Bias Question
  questions.push({
    id: 'fairness-question',
    topic: 'Fairness & Bias',
    question: `A student claims: "This horse race is fair because every horse has an equal opportunity to win." Is the student correct?`,
    options: [
      `No, because the outcomes in the sample space have different frequencies.`,
      `Yes, because both dice are standard and unbiased.`,
      `Yes, because the track length is the same for every lane.`,
      `No, because lower numbered horses always win.`,
    ],
    correctIndex: 0,
    explanation: `Although the dice themselves may be fair, the resulting ${config.rule} distribution is not uniform. The outcomes have different theoretical probabilities, so the horses do NOT have equal chances of moving.`,
    gcseMark: '1 Mark [AO3 Explanation]',
  });

  return questions;
}
