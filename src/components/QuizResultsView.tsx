import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Sparkles,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { QuizSession, Question } from '../types';
import { SourceModal } from './SourceModal';

interface QuizResultsViewProps {
  session: QuizSession;
  onRetryFailed: (failedQuestions: Question[]) => void;
  onGoToDashboard: () => void;
  onAskCoachAboutErrors: (session: QuizSession) => void;
}

export const QuizResultsView: React.FC<QuizResultsViewProps> = ({
  session,
  onRetryFailed,
  onGoToDashboard,
  onAskCoachAboutErrors,
}) => {
  const [selectedSourceQ, setSelectedSourceQ] = useState<Question | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'errors' | 'correct'>('all');

  const avgSeconds = Math.round(session.timeSpentSeconds / session.totalQuestions);

  // Arrays comparison
  const arraysEqual = (a: number[] = [], b: number[] = []) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((v, i) => v === sortedB[i]);
  };

  const failedQuestions = session.questions.filter((q) => {
    const userChoice = session.userAnswers[q.id] || [];
    return !arraysEqual(userChoice, q.correctAnswers);
  });

  const filteredQuestions = session.questions.filter((q) => {
    const userChoice = session.userAnswers[q.id] || [];
    const isCorrect = arraysEqual(userChoice, q.correctAnswers);
    if (filterMode === 'errors') return !isCorrect;
    if (filterMode === 'correct') return isCorrect;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-900 mx-auto flex items-center justify-center shadow-xs">
          <Award className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-mono text-emerald-800 uppercase tracking-wider font-semibold">
            Bilan de la séance · {session.title}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
            {session.percentage >= 70
              ? 'Excellent travail, candidat !'
              : session.percentage >= 50
              ? 'Résultats honorables, approfondissez les lacunes'
              : 'Effort d’assimilation à intensifier'}
          </h1>
        </div>

        {/* Big score presentation */}
        <div className="flex items-center justify-center gap-6 pt-2">
          <div className="text-center">
            <span className="text-4xl sm:text-5xl font-extrabold font-mono text-slate-900 tabular-nums">
              {session.score}/{session.totalQuestions}
            </span>
            <span className="text-xs text-slate-500 block mt-1 font-mono">
              Note ({session.percentage.toFixed(1)} %)
            </span>
          </div>
        </div>

        {/* Secondary metric stats */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2 text-xs">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
            <span className="text-slate-500 block">Bonnes réponses</span>
            <span className="text-lg font-bold font-mono text-emerald-700 tabular-nums">
              {session.correctCount}
            </span>
          </div>

          <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-red-900">
            <span className="text-slate-500 block">Erreurs</span>
            <span className="text-lg font-bold font-mono text-red-600 tabular-nums">
              {session.incorrectCount}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800">
            <span className="text-slate-500 block">Temps moyen</span>
            <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
              {avgSeconds}s / q
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100">
          {failedQuestions.length > 0 && (
            <button
              onClick={() => onRetryFailed(failedQuestions)}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Refaire uniquement les {failedQuestions.length} erreurs</span>
            </button>
          )}

          <button
            onClick={() => onAskCoachAboutErrors(session)}
            className="px-4 py-2.5 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 rounded-lg transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span>Demander au coach d'analyser mes erreurs</span>
          </button>

          <button
            onClick={onGoToDashboard}
            className="px-4 py-2.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>

      {/* Weak Topics Callout */}
      {session.weakTopicsDetected.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            <span>Notions nécessitant une révision immédiate :</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {session.weakTopicsDetected.map((topic, i) => (
              <span
                key={i}
                className="text-xs bg-white text-slate-800 border border-amber-200/80 px-2.5 py-1 rounded-md font-medium"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Question by Question Review */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 font-serif">
            Correction détaillée question par question
          </h2>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Toutes ({session.questions.length})
            </button>
            <button
              onClick={() => setFilterMode('errors')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                filterMode === 'errors' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Erreurs ({session.incorrectCount + session.unansweredCount})
            </button>
            <button
              onClick={() => setFilterMode('correct')}
              className={`px-3 py-1 font-medium rounded transition-colors ${
                filterMode === 'correct' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Réussies ({session.correctCount})
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const userChoice = session.userAnswers[q.id] || [];
            const isCorrect = arraysEqual(userChoice, q.correctAnswers);

            return (
              <div
                key={q.id}
                className={`bg-white border rounded-xl p-5 shadow-xs transition-colors space-y-4 ${
                  isCorrect ? 'border-slate-200' : 'border-red-200 bg-red-50/10'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <span>Question {idx + 1}</span>
                      <span aria-hidden="true">·</span>
                      <span>{q.subjectName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{q.difficulty}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 font-serif leading-snug">
                      {q.question}
                    </h3>
                  </div>

                  <div className="shrink-0">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Exact</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded border border-red-200">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Erreur</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Options display */}
                <div className="space-y-1.5 text-xs">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = userChoice.includes(optIdx);
                    const isRight = q.correctAnswers.includes(optIdx);

                    let style = 'bg-slate-50 text-slate-700 border-slate-200';
                    if (isRight) {
                      style = 'bg-emerald-50 text-emerald-950 font-medium border-emerald-400';
                    } else if (isSelected && !isRight) {
                      style = 'bg-red-50 text-red-950 font-medium border-red-300';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${style}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-bold text-slate-500">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          <span>{opt}</span>
                        </div>
                        <div className="shrink-0 font-mono text-[11px]">
                          {isRight && <span className="text-emerald-700 font-bold">Bonne réponse</span>}
                          {isSelected && !isRight && <span className="text-red-600 font-bold">Votre choix</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1.5 text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-900 block">
                    Explication de l'épreuve :
                  </span>
                  <p>{q.explanation}</p>
                </div>

                {/* Source & Notion link */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-500 font-mono">
                    Notion : <strong className="text-slate-800">{q.notionEvaluated}</strong>
                  </span>

                  <button
                    onClick={() => setSelectedSourceQ(q)}
                    className="font-semibold text-emerald-800 hover:text-emerald-700 flex items-center gap-1 underline decoration-emerald-700/40"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Voir la source & la page</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Source Citation Modal */}
      {selectedSourceQ && (
        <SourceModal
          question={selectedSourceQ}
          onClose={() => setSelectedSourceQ(null)}
        />
      )}
    </div>
  );
};
