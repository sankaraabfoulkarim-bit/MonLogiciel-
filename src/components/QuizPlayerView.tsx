import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Award,
  RotateCcw,
  Sparkles,
  Quote,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Question, QuizSession } from '../types';
import { StorageService } from '../services/storage';
import { SourceModal } from './SourceModal';

interface QuizPlayerViewProps {
  questions: Question[];
  title?: string;
  mode: 'training' | 'exam' | 'errors_review' | 'daily';
  timeLimitMinutes?: number;
  onFinishQuiz: (session: QuizSession) => void;
  onExit: () => void;
}

export const QuizPlayerView: React.FC<QuizPlayerViewProps> = ({
  questions,
  title = 'Séance de QCM',
  mode,
  timeLimitMinutes,
  onFinishQuiz,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number[]>>({});
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [sourceModalQuestion, setSourceModalQuestion] = useState<Question | null>(null);

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Timer
  useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isCompleted]);

  // Reset reveal state on question navigation in training mode
  useEffect(() => {
    setIsAnswerRevealed(false);
  }, [currentIndex]);

  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle option selection
  const handleSelectOption = (optIndex: number) => {
    if (isCompleted) return;
    if (mode === 'training' && isAnswerRevealed) return;

    const currentSelected = userAnswers[currentQ.id] || [];
    const isMultiple = currentQ.correctAnswers.length > 1;

    let updated: number[];
    if (isMultiple) {
      if (currentSelected.includes(optIndex)) {
        updated = currentSelected.filter((i) => i !== optIndex);
      } else {
        updated = [...currentSelected, optIndex];
      }
    } else {
      updated = [optIndex];
    }

    setUserAnswers({
      ...userAnswers,
      [currentQ.id]: updated,
    });
  };

  // Reveal answer in training mode
  const handleValidateTraining = () => {
    setIsAnswerRevealed(true);
    // Record question attempt in storage
    const selected = userAnswers[currentQ.id] || [];
    const isCorrect = arraysEqual(selected, currentQ.correctAnswers);
    StorageService.recordQuestionAnswer(currentQ.id, isCorrect, selected);
  };

  // Helper array comparison
  const arraysEqual = (a: number[], b: number[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, idx) => val === sortedB[idx]);
  };

  // Finish quiz
  const handleCompleteQuiz = () => {
    setIsCompleted(true);

    let score = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const weakTopicsDetected: string[] = [];

    questions.forEach((q) => {
      const selected = userAnswers[q.id];
      if (!selected || selected.length === 0) {
        unansweredCount += 1;
        StorageService.recordQuestionAnswer(q.id, false, []);
        if (!weakTopicsDetected.includes(q.topic)) {
          weakTopicsDetected.push(q.topic);
        }
      } else if (arraysEqual(selected, q.correctAnswers)) {
        score += 1;
        correctCount += 1;
        StorageService.recordQuestionAnswer(q.id, true, selected);
      } else {
        incorrectCount += 1;
        StorageService.recordQuestionAnswer(q.id, false, selected);
        if (!weakTopicsDetected.includes(q.topic)) {
          weakTopicsDetected.push(q.topic);
        }
      }
    });

    const percentage = (score / questions.length) * 100;

    const session: QuizSession = {
      id: `session-${Date.now()}`,
      title,
      mode,
      subjectIds: Array.from(new Set(questions.map((q) => q.subjectId))),
      questions,
      userAnswers,
      score,
      totalQuestions: questions.length,
      percentage,
      startedAt: new Date(Date.now() - secondsElapsed * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      timeSpentSeconds: secondsElapsed,
      weakTopicsDetected,
      unansweredCount,
      correctCount,
      incorrectCount,
    };

    StorageService.saveQuizSession(session);

    if (percentage >= 70) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    onFinishQuiz(session);
  };

  const selectedForCurrent = userAnswers[currentQ?.id] || [];
  const hasAnsweredCurrent = selectedForCurrent.length > 0;
  const isCurrentCorrect = hasAnsweredCurrent && arraysEqual(selectedForCurrent, currentQ.correctAnswers);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{currentQ?.subjectName}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{mode === 'exam' ? 'Examen Blanc' : 'Entraînement'}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">Niveau {currentQ?.difficulty}</span>
          </div>
          <h2 className="text-sm font-bold text-slate-900 font-serif mt-0.5">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer with tabular nums */}
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="tabular-nums">{formatTimer(secondsElapsed)}</span>
          </div>

          <button
            onClick={onExit}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Quitter la séance
          </button>
        </div>
      </div>

      {/* Question Progression Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Question {currentIndex + 1} sur {questions.length}</span>
          <span>{Math.round(((currentIndex + 1) / questions.length) * 100)} %</span>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-700 h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Question Statement */}
        <div className="space-y-2">
          <div className="text-xs font-mono text-emerald-800 font-semibold uppercase tracking-wider">
            {currentQ.topic || currentQ.chapter}
          </div>
          <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 leading-snug">
            {currentQ.question}
          </h3>
          {currentQ.correctAnswers.length > 1 && (
            <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded inline-block font-medium">
              Plusieurs réponses possibles ({currentQ.correctAnswers.length} bonnes réponses)
            </div>
          )}
        </div>

        {/* Options List */}
        <div className="space-y-2.5">
          {currentQ.options.map((optText, optIdx) => {
            const isSelected = selectedForCurrent.includes(optIdx);
            const isCorrectOption = currentQ.correctAnswers.includes(optIdx);

            let optionStyle = 'border-slate-200 hover:border-slate-300 bg-white text-slate-800';

            if (mode === 'training' && isAnswerRevealed) {
              if (isCorrectOption) {
                optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-medium ring-1 ring-emerald-500';
              } else if (isSelected && !isCorrectOption) {
                optionStyle = 'border-red-400 bg-red-50 text-red-900 ring-1 ring-red-400';
              } else {
                optionStyle = 'border-slate-200 opacity-60 text-slate-600 bg-white';
              }
            } else if (isSelected) {
              optionStyle = 'border-slate-900 bg-slate-900 text-white font-medium shadow-xs';
            }

            const letter = String.fromCharCode(65 + optIdx); // A, B, C, D...

            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(optIdx)}
                className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3 ${optionStyle}`}
              >
                <span
                  className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                    isSelected && !(mode === 'training' && isAnswerRevealed)
                      ? 'bg-white text-slate-900'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {letter}
                </span>
                <span className="leading-relaxed pt-0.5">{optText}</span>
              </button>
            );
          })}
        </div>

        {/* Training Mode: Instant Feedback & Explanation */}
        {mode === 'training' && (
          <div>
            {!isAnswerRevealed ? (
              <button
                onClick={handleValidateTraining}
                disabled={!hasAnsweredCurrent}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                Valider ma réponse
              </button>
            ) : (
              <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
                {/* Result indicator */}
                <div
                  className={`p-4 rounded-xl flex items-start gap-3 ${
                    isCurrentCorrect
                      ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
                      : 'bg-red-50 text-red-950 border border-red-200'
                  }`}
                >
                  {isCurrentCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <span className="text-sm font-bold block">
                      {isCurrentCorrect ? 'Excellente réponse !' : 'Réponse incorrecte'}
                    </span>
                    <p className="text-xs leading-relaxed text-slate-700">
                      {currentQ.explanation}
                    </p>
                  </div>
                </div>

                {/* Trap Warning if applicable */}
                {currentQ.trapWarning && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Piège classique de concours : </span>
                      {currentQ.trapWarning}
                    </div>
                  </div>
                )}

                {/* Source Traceability Button */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-500 font-mono">
                    Notion : <span className="font-semibold text-slate-700">{currentQ.notionEvaluated}</span>
                  </div>

                  <button
                    onClick={() => setSourceModalQuestion(currentQ)}
                    className="text-xs font-semibold text-emerald-800 hover:text-emerald-700 flex items-center gap-1.5 underline decoration-emerald-700/40"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Voir la source & l'extrait du cours</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Précédente</span>
          </button>

          <div className="flex items-center gap-2">
            {!isLastQuestion ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Question suivante</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleCompleteQuiz}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Award className="w-4 h-4" />
                <span>Terminer et voir mon bilan</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Question Grid Bubbles Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <span className="text-xs font-semibold text-slate-600 block mb-2">
          Navigation rapide :
        </span>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => {
            const hasAns = (userAnswers[q.id] || []).length > 0;
            const isCurr = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-mono font-medium transition-all ${
                  isCurr
                    ? 'ring-2 ring-emerald-700 font-bold bg-slate-900 text-white'
                    : hasAns
                    ? 'bg-emerald-100 text-emerald-900 font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Source Citation Modal */}
      {sourceModalQuestion && (
        <SourceModal
          question={sourceModalQuestion}
          onClose={() => setSourceModalQuestion(null)}
        />
      )}
    </div>
  );
};
