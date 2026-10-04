import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  Sliders,
  ChevronRight,
  BookOpen,
  Award,
  Sparkles,
  ArrowRight,
  Target,
} from 'lucide-react';
import { StudyPlan, Subject, StudyTask } from '../types';

interface PlanningViewProps {
  studyPlan: StudyPlan;
  subjects: Subject[];
  onUpdateStudyPlan: (plan: StudyPlan) => void;
  onToggleTask: (taskId: string) => void;
}

export const PlanningView: React.FC<PlanningViewProps> = ({
  studyPlan,
  subjects,
  onUpdateStudyPlan,
  onToggleTask,
}) => {
  const [examDate, setExamDate] = useState(studyPlan.examDate);
  const [dailyHours, setDailyHours] = useState(studyPlan.dailyHours);
  const [daysPerWeek, setDaysPerWeek] = useState(studyPlan.daysPerWeek);
  const [currentLevel, setCurrentLevel] = useState(studyPlan.currentLevel);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStudyPlan({
      ...studyPlan,
      examDate,
      dailyHours,
      daysPerWeek,
      currentLevel,
    });
  };

  const completedCount = studyPlan.weeklyTasks.filter((t) => t.completed).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900">
            Programme Stratégique sur 9 Mois
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Feuille de route progressive structurée en 6 phases clés menant aux épreuves du concours ASF.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3.5 py-1.5 rounded-lg font-mono">
          <CalendarDays className="w-4 h-4 text-emerald-800" />
          <span>Concours fixé au : {studyPlan.examDate}</span>
        </div>
      </div>

      {/* Preparation parameters bar */}
      <form
        onSubmit={handleSaveSettings}
        className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs"
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Date du concours :</span>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Temps par jour :</span>
            <select
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="border border-slate-300 rounded px-2 py-1 text-xs bg-white"
            >
              <option value={1.5}>1h30 / jour</option>
              <option value={2}>2h / jour</option>
              <option value={2.5}>2h30 / jour</option>
              <option value={3}>3h / jour</option>
              <option value={4}>4h / jour</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Rythme :</span>
            <select
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
              className="border border-slate-300 rounded px-2 py-1 text-xs bg-white"
            >
              <option value={5}>5 jours / semaine</option>
              <option value={6}>6 jours / semaine</option>
              <option value={7}>7 jours / semaine</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
        >
          Ajuster le planning
        </button>
      </form>

      {/* 6 Phases Timeline Carousel / Stepper */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {studyPlan.phases.map((phase, idx) => {
          const isSelected = activePhaseIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => setActivePhaseIndex(idx)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-emerald-700 bg-emerald-50/60 ring-1 ring-emerald-700'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold block">
                  {phase.months}
                </span>
                <h3 className="font-serif font-bold text-xs text-slate-900 leading-snug">
                  {phase.title.split('—')[1] || phase.title}
                </h3>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Phase {phase.phaseNumber}</span>
                <span className="text-emerald-700 font-bold">
                  {phase.status === 'current' ? 'En cours' : 'À venir'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Phase Detail Card */}
      {studyPlan.phases[activePhaseIndex] && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-mono text-emerald-800 font-semibold uppercase">
                {studyPlan.phases[activePhaseIndex].months}
              </span>
              <h2 className="text-xl font-bold font-serif text-slate-900 mt-0.5">
                {studyPlan.phases[activePhaseIndex].title}
              </h2>
            </div>
            <span className="text-xs font-mono bg-slate-100 text-slate-800 px-3 py-1 rounded-lg">
              Statut : {studyPlan.phases[activePhaseIndex].status === 'current' ? 'Phase Active' : 'Objectif Futur'}
            </span>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">
            {studyPlan.phases[activePhaseIndex].description}
          </p>

          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-2">
              Matières au cœur de cette phase :
            </h4>
            <div className="flex flex-wrap gap-2">
              {studyPlan.phases[activePhaseIndex].focusSubjects.map((sub, i) => (
                <span
                  key={i}
                  className="text-xs bg-slate-50 text-slate-800 border border-slate-200 px-3 py-1 rounded-md font-medium"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weekly Tasks Checklist */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-serif">
              Tâches et séances de la semaine
            </h3>
            <p className="text-xs text-slate-500">
              Cochez vos réalisations pour recalculer automatiquement votre avancement
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-800 font-bold">
            {completedCount}/{studyPlan.weeklyTasks.length} accomplies
          </span>
        </div>

        <div className="space-y-2.5">
          {studyPlan.weeklyTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onToggleTask(task.id)}
              className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-3 ${
                task.completed
                  ? 'border-emerald-200 bg-emerald-50/40 text-slate-500 line-through'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                    task.completed
                      ? 'bg-emerald-700 border-emerald-700 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {task.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>

                <div>
                  <span className="font-semibold block">{task.title}</span>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-mono no-underline">
                    <span>{task.dayLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span>{task.subjectName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{task.durationMinutes} min</span>
                  </div>
                </div>
              </div>

              <span className="text-[11px] font-mono capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
                {task.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
