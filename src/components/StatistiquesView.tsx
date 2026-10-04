import React from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  Target,
  BarChart3,
  Calendar,
  Layers,
} from 'lucide-react';
import { UserStats, Subject, Question } from '../types';

interface StatistiquesViewProps {
  stats: UserStats;
  subjects: Subject[];
  questions: Question[];
}

export const StatistiquesView: React.FC<StatistiquesViewProps> = ({
  stats,
  subjects,
  questions,
}) => {
  const answeredQuestions = questions.filter((q) => q.timesAnswered > 0);
  const correctCount = answeredQuestions.reduce((acc, q) => acc + q.timesCorrect, 0);
  const totalAttempts = answeredQuestions.reduce((acc, q) => acc + q.timesAnswered, 0);

  // Group questions by subject
  const subjectStats = subjects.map((sub) => {
    const subQuestions = questions.filter((q) => q.subjectId === sub.id);
    const subAnswered = subQuestions.filter((q) => q.timesAnswered > 0);
    const subAttempts = subAnswered.reduce((acc, q) => acc + q.timesAnswered, 0);
    const subCorrect = subAnswered.reduce((acc, q) => acc + q.timesCorrect, 0);
    const calculatedRate = subAttempts > 0 ? Math.round((subCorrect / subAttempts) * 100) : (stats.masteryPerSubject[sub.id] ?? 50);

    return {
      ...sub,
      totalQuestionsCount: subQuestions.length,
      attempts: subAttempts,
      correct: subCorrect,
      mastery: calculatedRate,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold font-serif text-slate-900">
          Statistiques & Diagnostic de Maîtrise
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Suivi quantitatif et qualitatif de votre progression vers le concours d'Administrateur des Services Financiers.
        </p>
      </div>

      {/* Top 4 Metrics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Moyenne générale</span>
          <div className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
            {stats.overallSuccessRate.toFixed(1)} %
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Toutes épreuves confondues</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Tentatives cumulées</span>
          <div className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
            {totalAttempts}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">{correctCount} réussites enregistrées</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Temps total d'étude</span>
          <div className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
            {Math.round(stats.totalStudyMinutes / 60)}h {stats.totalStudyMinutes % 60}m
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block font-mono">Cadence régulière</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <span className="text-xs text-slate-500 block mb-1">Simulations d'examen</span>
          <div className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
            {stats.examsTaken}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Examens blancs terminés</span>
        </div>
      </div>

      {/* Table: Subject Mastery & Coefficient breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 font-serif">
            Ventilation détaillée par matière au concours
          </h2>
          <p className="text-xs text-slate-500">
            Niveau de maîtrise estimé en regard du coefficient d'admissibilité
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-mono">
                <th className="pb-3 font-semibold">Matière</th>
                <th className="pb-3 font-semibold text-center">Pondération (Coeff)</th>
                <th className="pb-3 font-semibold text-center">Questions dans la banque</th>
                <th className="pb-3 font-semibold text-center">Tentatives</th>
                <th className="pb-3 font-semibold text-right">Taux de maîtrise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjectStats.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 font-medium text-slate-900">
                    <div>{sub.name}</div>
                    <div className="text-[11px] text-slate-500 font-normal line-clamp-1">{sub.description}</div>
                  </td>
                  <td className="py-3 text-center font-mono font-semibold text-slate-700">
                    Coeff. {sub.weight}
                  </td>
                  <td className="py-3 text-center font-mono text-slate-600">
                    {sub.totalQuestionsCount}
                  </td>
                  <td className="py-3 text-center font-mono text-slate-600">
                    {sub.attempts}
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={`font-mono font-bold text-sm ${
                        sub.mastery >= 75
                          ? 'text-emerald-700'
                          : sub.mastery >= 60
                          ? 'text-amber-700'
                          : 'text-red-600'
                      }`}
                    >
                      {sub.mastery} %
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Topics Detailed Mastery Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 font-serif">
            Maîtrise par notion juridique et financière
          </h2>
          <p className="text-xs text-slate-500">
            Niveau calculé sur vos réponses réelles pour orienter l'algorithme adaptatif
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(stats.masteryPerTopic).map(([topic, rate], i) => (
            <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 truncate">{topic}</span>
                <span
                  className={`font-mono font-bold ${
                    rate >= 75 ? 'text-emerald-700' : rate >= 60 ? 'text-amber-700' : 'text-red-600'
                  }`}
                >
                  {rate} %
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    rate >= 75 ? 'bg-emerald-600' : rate >= 60 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
