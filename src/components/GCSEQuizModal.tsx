import React, { useState } from 'react';
import { GCSEQuestion, DiceConfig, HorseOutcome } from '../types/probability';
import { generateGCSEQuestions } from '../utils/probabilityEngine';
import { GraduationCap, CheckCircle2, XCircle, ArrowRight, RotateCcw, X, Award } from 'lucide-react';
import { sound } from '../utils/soundEffects';

interface GCSEQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DiceConfig;
  horses: HorseOutcome[];
  onRewardCredits: (amount: number) => void;
}

export const GCSEQuizModal: React.FC<GCSEQuizModalProps> = ({
  isOpen,
  onClose,
  config,
  horses,
  onRewardCredits,
}) => {
  const [questions, setQuestions] = useState<GCSEQuestion[]>(() =>
    generateGCSEQuestions(config, horses)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Regenerate questions if modal opens or config changes
  React.useEffect(() => {
    if (isOpen) {
      setQuestions(generateGCSEQuestions(config, horses));
      setCurrentIndex(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setScore(0);
      setCompleted(false);
    }
  }, [isOpen, config, horses]);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
    sound.playClick();
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    const isCorrect = selectedOption === currentQ.correctIndex;
    if (isCorrect) {
      sound.playCashReward();
      setScore(prev => prev + 1);
      onRewardCredits(25); // 25 credits bonus for answering correctly!
    } else {
      sound.playClick();
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setCompleted(true);
    }
  };

  const handleRestart = () => {
    setQuestions(generateGCSEQuestions(config, horses));
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setCompleted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-7 text-slate-100 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold font-display text-white">
              GCSE Maths Exam Practice
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!completed ? (
          <div className="flex flex-col gap-4">
            {/* Progress & Topic indicator */}
            <div className="flex items-center justify-between text-xs">
              <span className="px-2.5 py-1 rounded-md bg-slate-800 text-amber-400 font-mono font-semibold">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-slate-400 font-medium">
                Topic: <span className="text-slate-200">{currentQ.topic}</span>
              </span>
              <span className="text-emerald-400 font-mono font-bold">
                {currentQ.gcseMark}
              </span>
            </div>

            {/* Question Text */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
              <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
                {currentQ.question}
              </p>
              {currentQ.mathExpression && (
                <div className="p-2 rounded-lg bg-slate-900 text-amber-300 font-mono text-xs">
                  {currentQ.mathExpression}
                </div>
              )}
            </div>

            {/* Multiple Choice Options */}
            <div className="flex flex-col gap-2">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;

                let btnStyle = 'border-slate-800 bg-slate-950/70 text-slate-300 hover:bg-slate-800';
                if (isAnswerSubmitted) {
                  if (isCorrect) {
                    btnStyle = 'border-emerald-500 bg-emerald-950/70 text-emerald-200 ring-1 ring-emerald-500';
                  } else if (isSelected) {
                    btnStyle = 'border-rose-500 bg-rose-950/70 text-rose-200 ring-1 ring-rose-500';
                  } else {
                    btnStyle = 'border-slate-800/40 bg-slate-950/30 text-slate-500';
                  }
                } else if (isSelected) {
                  btnStyle = 'border-amber-400 bg-amber-500/20 text-white ring-1 ring-amber-400';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswerSubmitted}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-xs sm:text-sm text-left transition-all cursor-pointer disabled:cursor-default ${btnStyle}`}
                  >
                    <span>{option}</span>
                    {isAnswerSubmitted && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    {isAnswerSubmitted && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Step-by-Step Mark Scheme Explanation */}
            {isAnswerSubmitted && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex flex-col gap-1.5 animate-fadeIn">
                <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <span>GCSE Mark Scheme & Working:</span>
                </div>
                <p className="leading-relaxed text-slate-400">
                  {currentQ.explanation}
                </p>
                {selectedOption === currentQ.correctIndex && (
                  <div className="text-emerald-400 font-mono font-semibold pt-1">
                    ✓ Correct! 1 Mark awarded for accurate reasoning.
                  </div>
                )}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-mono">
                Current Score: {score} / {questions.length}
              </span>

              {!isAnswerSubmitted ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selectedOption === null}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'View Results'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Completion Screen */
          <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shadow-xl">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-white font-display">
                GCSE Practice Round Completed!
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                You scored <span className="text-amber-400 font-bold font-mono text-sm">{score} out of {questions.length}</span> correct.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 max-w-md">
              Great job applying sample space diagrams, mutually exclusive events, and relative frequency formulas! Use these insights to make smarter predictions in the next race.
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={handleRestart}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Questions</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all"
              >
                Back to Horse Race
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
