import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  ArrowRight,
  BrainCircuit,
  Filter,
} from 'lucide-react';
import { Question, WeakTopic, Subject } from '../types';
import { SourceModal } from './SourceModal';

interface MesErreursViewProps {
  questions: Question[];
  weakTopics: WeakTopic[];
  subjects: Subject[];
  onStartTargetedQuiz: (questionsToRevise: Question[]) => void;
}

export const MesErreursView: React.FC<MesErreursViewProps> = ({
  questions,
  weakTopics,
  subjects,
  onStartTargetedQuiz,
}) => {
  const [selectedTopicFilter, setSelectedTopicFilter] = useState('all');
  const [selectedSourceQ, setSelectedSourceQ] = useState<Question | null>(null);

  // Failed questions
  const failedQuestions = questions.filter(
    (q) => q.timesAnswered > 0 && q.wasLastCorrect === false
  );

  const filteredFailed = failedQuestions.filter((q) => {
    if (selectedTopicFilter === 'all') return true;
    return q.topic.toLowerCase() === selectedTopicFilter.toLowerCase();
  });

  const handleLaunchTargeted = () => {
    const targetSet = filteredFailed.length > 0 ? filteredFailed : failedQuestions;
    onStartTargetedQuiz(targetSet);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header Card */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-900 font-semibold uppercase">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            <span>Gestion Adaptative des Lacunes</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
            Mes Erreurs & Notions Fragiles
          </h1>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            Pour réussir le concours ASF, chaque erreur est une opportunité d'ancrage.
            Révisez de manière chirurgicale les règles et questions qui vous ont mis en difficulté.
          </p>
        </div>

        <button
          onClick={handleLaunchTargeted}
          disabled={failedQuestions.length === 0}
          className="px-5 py-3 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap disabled:opacity-40"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Réviser mes erreurs ({failedQuestions.length} questions)</span>
        </button>
      </div>

      {/* Grid: Weak Notions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {weakTopics.map((w, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 truncate">{w.subjectName}</span>
              <span className="font-mono text-red-600 font-bold">{w.masteryPercent} %</span>
            </div>

            <h3 className="font-serif font-bold text-sm text-slate-900 leading-snug">
              {w.topic}
            </h3>

            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-red-500 h-full rounded-full"
                style={{ width: `${w.masteryPercent}%` }}
              />
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
              <span>{w.errorCount} échec(s)</span>
              <span>Dernier : {w.lastFailedAt}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Failed Questions List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-serif">
              Questions récemment ratées ({failedQuestions.length})
            </h2>
            <p className="text-xs text-slate-500">
              Analyse des pièges et justification textuelle du corrigé
            </p>
          </div>

          {weakTopics.length > 0 && (
            <select
              value={selectedTopicFilter}
              onChange={(e) => setSelectedTopicFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg py-1.5 px-3 bg-white text-slate-800"
            >
              <option value="all">Toutes les notions fragiles</option>
              {weakTopics.map((w, i) => (
                <option key={i} value={w.topic}>
                  {w.topic} ({w.masteryPercent}%)
                </option>
              ))}
            </select>
          )}
        </div>

        {failedQuestions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="font-semibold text-slate-800 text-sm">Aucune erreur en suspens !</p>
            <p>Toutes vos dernières réponses aux QCM étaient exactes. Félicitations pour votre assiduité.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFailed.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-red-200 bg-red-50/10 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <span className="text-slate-800 font-semibold">{q.subjectName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{q.topic}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 font-serif leading-snug">
                      {q.question}
                    </h3>
                  </div>

                  <span className="text-[11px] font-mono text-red-600 bg-red-100 px-2 py-0.5 rounded font-bold shrink-0">
                    À revoir
                  </span>
                </div>

                {/* Explication */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-1">
                  <span className="font-bold text-slate-900 block">Explication & Droit applicable :</span>
                  <p>{q.explanation}</p>
                </div>

                {/* Trap warning */}
                {q.trapWarning && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                    <span className="font-bold">Piège de l'épreuve : </span>
                    {q.trapWarning}
                  </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-500 font-mono">
                    Notion : <strong className="text-slate-700">{q.notionEvaluated}</strong>
                  </span>

                  <button
                    onClick={() => setSelectedSourceQ(q)}
                    className="font-semibold text-emerald-800 hover:text-emerald-700 flex items-center gap-1 underline decoration-emerald-700/40"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Consulter le passage du cours</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
