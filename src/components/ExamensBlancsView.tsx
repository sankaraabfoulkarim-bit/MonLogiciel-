import React, { useState } from 'react';
import {
  Award,
  Clock,
  Sliders,
  CheckCircle2,
  Calendar,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Subject, QuizSession, Question } from '../types';
import examDeskImg from '../assets/images/exam_hall_prep_1791071217565.jpg';

interface ExamensBlancsViewProps {
  subjects: Subject[];
  allQuestions: Question[];
  quizHistory: QuizSession[];
  onStartExam: (config: {
    questionCount: number;
    timeLimitMinutes: number;
    subjectIds: string[];
    difficulty: string;
    questions: Question[];
  }) => void;
  onReviewPastExam: (session: QuizSession) => void;
}

export const ExamensBlancsView: React.FC<ExamensBlancsViewProps> = ({
  subjects,
  allQuestions,
  quizHistory,
  onStartExam,
  onReviewPastExam,
}) => {
  const [questionCount, setQuestionCount] = useState<number>(40);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(60);
  const [difficulty, setDifficulty] = useState<string>('moyen');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(
    subjects.slice(0, 5).map((s) => s.id)
  );

  const pastExams = quizHistory.filter((s) => s.mode === 'exam');

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleLaunch = () => {
    // Select questions matching criteria or shuffle from available bank
    let pool = allQuestions.filter((q) => selectedSubjectIds.includes(q.subjectId));
    if (pool.length < questionCount) {
      pool = [...allQuestions];
    }

    // Shuffle pool
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, questionCount);

    onStartExam({
      questionCount,
      timeLimitMinutes,
      subjectIds: selectedSubjectIds,
      difficulty,
      questions: selectedQuestions,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Banner with Exam Desk Illustration */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 text-white shadow-lg">
        <div className="absolute inset-0 z-0">
          <img
            src={examDeskImg}
            alt="Bureau de préparation au concours"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/60" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-mono tracking-wide uppercase">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Simulateur en Conditions Réelles de Concours</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white tracking-tight">
            Examens Blancs Chronométrés
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Plongez dans l'épreuve sans correction intermédiaire. L'évaluation et la ventilation
            détaillée des points faibles interviennent uniquement à l'achèvement du chronomètre.
          </p>
        </div>
      </div>

      {/* Grid: Exam Launcher (Left) + Exam History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exam Configuration Form (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 font-serif">
              Paramétrer une nouvelle épreuve blanche
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choisissez le volume de questions, le délai imparti et le panier de matières.
            </p>
          </div>

          {/* Question Count & Time Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Nombre de questions :
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[20, 40, 60, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setQuestionCount(num);
                      setTimeLimitMinutes(Math.round(num * 1.5));
                    }}
                    className={`py-2 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                      questionCount === num
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {num} QCM
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Temps alloué (minutes) :
              </label>
              <div className="flex items-center gap-2">
                {[30, 45, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setTimeLimitMinutes(mins)}
                    className={`flex-1 py-2 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                      timeLimitMinutes === mins
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Difficulty selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Niveau de difficulté global :
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['moyen', 'difficile', 'expert'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`py-2 text-xs font-medium rounded-lg border capitalize transition-colors ${
                    difficulty === lvl
                      ? 'bg-emerald-800 border-emerald-800 text-white font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Multi-subject picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Matières incluses dans l'épreuve :
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {selectedSubjectIds.length} sélectionnée(s)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {subjects.map((s) => {
                const isChecked = selectedSubjectIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSubject(s.id)}
                    className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                      isChecked
                        ? 'border-emerald-700 bg-emerald-50/50 text-emerald-950 font-medium'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ml-2 ${
                        isChecked ? 'bg-emerald-700 border-emerald-700 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isChecked && <span className="text-[10px]">✓</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Launch Button */}
          <div className="pt-2">
            <button
              onClick={handleLaunch}
              disabled={selectedSubjectIds.length === 0}
              className="w-full py-3 px-6 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Démarrer l'examen blanc ({questionCount} QCM · {timeLimitMinutes} min)</span>
            </button>
          </div>
        </div>

        {/* Past Exams History (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                Historique des examens blancs
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {pastExams.length} session(s)
              </span>
            </div>

            {pastExams.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <Award className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Aucun examen blanc n'a encore été réalisé. Lancez votre première simulation !</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {pastExams.map((exam) => (
                  <div
                    key={exam.id}
                    onClick={() => onReviewPastExam(exam)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-600 bg-slate-50/50 hover:bg-emerald-50/20 cursor-pointer transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900 font-serif truncate">
                        {exam.title}
                      </span>
                      <span className="font-mono font-bold text-emerald-800 tabular-nums">
                        {exam.percentage.toFixed(1)} %
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>{exam.score}/{exam.totalQuestions} réussis</span>
                      <span>{Math.round(exam.timeSpentSeconds / 60)} min</span>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-emerald-800">
                      <span>Consulter le rapport complet</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
