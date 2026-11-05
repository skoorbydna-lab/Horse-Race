export type DiceRule = 'sum' | 'difference' | 'product' | 'max';

export interface DiceConfig {
  sides1: number;
  sides2: number;
  faces1: number[];
  faces2: number[];
  rule: DiceRule;
  trackLength: number;
}

export interface HorseColorTheme {
  primary: string;
  secondary: string;
  bg: string;
  text: string;
  border: string;
  badge: string;
}

export interface HorseOutcome {
  value: number;
  label: string;
  color: HorseColorTheme;
  theoreticalCount: number;
  theoreticalProb: number; // between 0 and 1
  simplifiedFraction: string;
  oddsMultiplier: number; // e.g. 3.2
  position: number; // 0 to trackLength
  movesCount: number;
}

export interface SampleSpaceCell {
  d1: number;
  d2: number;
  outcome: number;
  key: string;
}

export interface RollResult {
  d1: number;
  d2: number;
  outcome: number;
  rollNumber: number;
}

export interface RaceRecord {
  raceNumber: number;
  winnerValue: number;
  winnerLabel: string;
  winnerColor: HorseColorTheme;
  totalRolls: number;
  trackLength: number;
  theoreticalProb: number;
  simplifiedFraction: string;
  rule: DiceRule;
  timestamp: number;
}

export interface RelativeFrequencyPoint {
  trial: number;
  count: number;
  relativeFrequency: number;
}

export interface GCSEQuestion {
  id: string;
  topic: 'Sample Space' | 'Probability Fraction' | 'Expected Frequency' | 'Fairness & Bias' | 'Events & Sets';
  question: string;
  mathExpression?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  gcseMark: string;
  filterHighlight?: (outcome: number, d1: number, d2: number) => boolean;
}

export interface StudentAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}
