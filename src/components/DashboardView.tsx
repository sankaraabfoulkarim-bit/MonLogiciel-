import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Award,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  BookOpen,
  FileCheck2,
  BrainCircuit,
  Flame,
  Target,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { UserStats, Subject, Question, WeakTopic } from '../types';
import heroImg from '../assets/images/hero_burkina_finance_1791071194678.jpg';
import badgeImg from '../assets/images/badge_burkina_asf_1791071206045.jpg';

interface DashboardViewProps {
  stats: UserStats;
  subjects: Subject[];
  weakTopics: WeakTopic[];
  onStartQuiz: (subjectId?: string) => void;
  onStartExam: () => void;
  onReviewErrors: () => void;
  onGoToTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  subjects,
  weakTopics,
  onStartQuiz,
  onStartExam,
  onReviewErrors,
  onGoToTab,
}) => {
  const [activeHistorySpan, setActiveHistorySpan] = useState<'7d' | '30d'>('7d');

  // Calculate days remaining to exam
  const examDate = new Date(stats.examDate);
  const today = new Date();
  const diffTime = examDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Subjects breakdown
  const masteredSubjects = subjects.filter((s) => (stats.masteryPerSubject[s.id] ?? 50) >= 75);
  const weakSubjects = subjects.filter((s) => (stats.masteryPerSubject[s.id] ?? 50) < 65);

  const historyData = activeHistorySpan === '7d' ? stats.history7Days : stats.history30Days;
  const maxQ = Math.max(...historyData.map((d) => d.questionsCount), 20);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Hero Banner with Official Civic Aesthetics */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 text-white shadow-lg">
        {/* Background Image with Measured Contrast Scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImg}
            alt="Ministère des Finances Ouagadougou"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/60" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Concours Professionnel 2027 · Burkina Faso</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif tracking-tight text-white text-balance">
              Administrateur des Services Financiers
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Votre coach d'excellence pour 9 mois de préparation intensive : analyse de cours,
              QCM sourcés aux textes UEMOA et Burkinabè, révision espacée et simulations d'examen.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onStartQuiz()}
                className="px-4 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
              >
                <BookOpen className="w-4 h-4" />
                <span>Commencer l'entraînement</span>
              </button>

              <button
                onClick={onStartExam}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Lancer un examen blanc</span>
              </button>
            </div>
          </div>

          {/* Right Highlights Box: Days countdown & streak */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 shrink-0 bg-slate-950/70 p-4 rounded-xl border border-slate-800 backdrop-blur-xs">
            <div className="text-center p-3 border-r border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Jours restants</span>
              <span className="text-3xl font-extrabold font-mono text-amber-400 tabular-nums">
                {daysRemaining}
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">Échéance juin</span>
            </div>

            <div className="text-center p-3">
              <span className="text-[11px] text-slate-400 block mb-1">Régularité</span>
              <div className="flex items-center justify-center gap-1 text-emerald-400 font-mono text-3xl font-extrabold">
                <Flame className="w-6 h-6 text-amber-500 fill-amber-500" />
                <span className="tabular-nums">{stats.streakDays}</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">jours consécutifs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Metrics Row (Anti-pill text layout with tabular figures) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Progression globale</span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {stats.overallSuccessRate.toFixed(1)} %
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <span>Taux de réussite</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium">+4.2% ce mois</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>QCM complétés</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {stats.questionsAnswered}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <span>Questions traitées</span>
            <span aria-hidden="true">·</span>
            <span>Objectif 1 500</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Temps de travail</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {Math.round(stats.totalStudyMinutes / 60)}h {(stats.totalStudyMinutes % 60)}m
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <span>Temps cumulé</span>
            <span aria-hidden="true">·</span>
            <span>Moy. 2h15 / j</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Examens blancs</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {stats.examsTaken}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <span>Simulations faites</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-700">Dernier 72.5%</span>
          </div>
        </div>
      </div>

      {/* Main Grid: 2 Zones (Left: Daily goals & Trends, Right: Weak points & Recent Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Goals Routine Card (Aujourd'hui) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-700" />
                <h2 className="text-base font-bold text-slate-900">
                  Objectifs du jour — Votre entraînement
                </h2>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {stats.dailyGoals.qcmDone}/{stats.dailyGoals.qcmTarget} QCM
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Série de QCM</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold font-mono text-slate-900">
                    {stats.dailyGoals.qcmDone} / {stats.dailyGoals.qcmTarget}
                  </span>
                  <span className="text-xs text-emerald-700 font-medium">
                    {Math.round((stats.dailyGoals.qcmDone / stats.dailyGoals.qcmTarget) * 100)} %
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (stats.dailyGoals.qcmDone / stats.dailyGoals.qcmTarget) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Fiches mémo à revoir</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold font-mono text-slate-900">
                    {stats.dailyGoals.cardsDone} / {stats.dailyGoals.cardsTarget}
                  </span>
                  <span className="text-xs text-emerald-700 font-medium">
                    {Math.round((stats.dailyGoals.cardsDone / stats.dailyGoals.cardsTarget) * 100)} %
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (stats.dailyGoals.cardsDone / stats.dailyGoals.cardsTarget) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Temps de travail</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold font-mono text-slate-900">
                    {stats.dailyGoals.studyMinutesDone}m / {stats.dailyGoals.studyMinutesTarget}m
                  </span>
                  <span className="text-xs text-emerald-700 font-medium">
                    {Math.round((stats.dailyGoals.studyMinutesDone / stats.dailyGoals.studyMinutesTarget) * 100)} %
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (stats.dailyGoals.studyMinutesDone / stats.dailyGoals.studyMinutesTarget) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Routine quotidienne adaptée selon vos erreurs récentes
              </span>
              <button
                onClick={() => onStartQuiz()}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>Exécuter la séance du jour</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Performance Trend Chart */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Évolution des performances
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Volume de questions traitées et taux de réussite
                </p>
              </div>

              {/* Segmented interactive control */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setActiveHistorySpan('7d')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    activeHistorySpan === '7d'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  7 derniers jours
                </button>
                <button
                  onClick={() => setActiveHistorySpan('30d')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    activeHistorySpan === '30d'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  30 derniers jours
                </button>
              </div>
            </div>

            {/* Visual SVG bar & line chart */}
            <div className="mt-6 h-48 flex items-end gap-3 sm:gap-6 pt-6 border-b border-slate-200">
              {historyData.map((d, i) => {
                const heightPercent = Math.max(15, Math.round((d.questionsCount / maxQ) * 100));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono bg-slate-900 text-white px-2 py-0.5 rounded shadow-sm whitespace-nowrap mb-1">
                      {d.questionsCount} QCM · {d.successRate}%
                    </div>

                    <div className="w-full max-w-[40px] flex flex-col justify-end h-full">
                      <div
                        className="w-full bg-emerald-600/80 hover:bg-emerald-600 rounded-t-md transition-all relative"
                        style={{ height: `${heightPercent}%` }}
                      >
                        {/* Success rate marker line */}
                        <div
                          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400 border border-white"
                          title={`Taux de réussite: ${d.successRate}%`}
                        />
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500 mt-1">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-emerald-600 rounded-xs" />
                  <span>Volume de QCM</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-amber-400 rounded-full" />
                  <span>Taux de réussite (%)</span>
                </div>
              </div>
              <span className="font-mono text-[11px]">
                Moyenne : {stats.overallSuccessRate}%
              </span>
            </div>
          </div>

          {/* Subjects Mastery Overview */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">
                Maîtrise par matière au concours
              </h2>
              <button
                onClick={() => onGoToTab('statistiques')}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>Voir le détail complet</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {subjects.slice(0, 6).map((sub) => {
                const mastery = stats.masteryPerSubject[sub.id] ?? 60;
                return (
                  <div key={sub.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-800 truncate">
                        {sub.name}
                      </span>
                      <span
                        className={`font-mono font-bold ${
                          mastery >= 75
                            ? 'text-emerald-700'
                            : mastery >= 60
                            ? 'text-amber-700'
                            : 'text-red-600'
                        }`}
                      >
                        {mastery} %
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          mastery >= 75
                            ? 'bg-emerald-600'
                            : mastery >= 60
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${mastery}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* Weak Topics Alert Card (Points Faibles) */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
              <div className="flex items-center gap-2 text-amber-900">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold">
                  Points faibles détectés ({weakTopics.length})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-amber-800">
                Priorité révision
              </span>
            </div>

            <p className="text-xs text-amber-900/80 mt-2 mb-3">
              Le système adapte automatiquement vos séances pour cibler ces notions récurrentes :
            </p>

            <div className="space-y-2.5">
              {weakTopics.slice(0, 4).map((weak, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-lg border border-amber-200/80 text-xs space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-900 leading-tight">
                      {weak.topic}
                    </span>
                    <span className="text-red-600 font-mono font-bold shrink-0">
                      {weak.masteryPercent} %
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>{weak.subjectName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-amber-800 font-medium">
                      {weak.errorCount} erreurs
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onReviewErrors}
              className="mt-4 w-full py-2 px-3 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Réviser mes erreurs maintenant</span>
            </button>
          </div>

          {/* Recent Activity Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Dernières activités</span>
            </h3>

            <div className="space-y-3">
              {stats.recentActivities.slice(0, 5).map((act) => (
                <div key={act.id} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800 truncate">
                      {act.title}
                    </span>
                    {act.scorePercent !== undefined && (
                      <span className="font-mono font-bold text-emerald-700 shrink-0">
                        {act.scorePercent.toFixed(0)} %
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {act.details}
                  </div>
                  <div className="text-slate-400 text-[10px] mt-1 font-mono">
                    {act.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Ask Coach IA Card */}
          <div className="bg-emerald-950 text-white rounded-xl p-5 shadow-xs border border-emerald-900">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase mb-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Coach ASF Spécialisé</span>
            </div>
            <h4 className="text-sm font-bold text-white font-serif mb-1">
              Une interrogation sur un article ou une procédure ?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              L'assistant IA est entraîné sur le programme officiel du Burkina Faso et vos documents de cours.
            </p>
            <button
              onClick={() => onGoToTab('assistant')}
              className="w-full py-2 px-3 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Poser une question au coach</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
