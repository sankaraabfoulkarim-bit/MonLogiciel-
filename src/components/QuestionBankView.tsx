import React, { useState } from 'react';
import {
  Search,
  Filter,
  Star,
  Trash2,
  Edit3,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  XCircle,
  Flag,
  Sparkles,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { Question, Subject, Difficulty } from '../types';
import { SourceModal } from './SourceModal';

interface QuestionBankViewProps {
  questions: Question[];
  subjects: Subject[];
  onStartQuizWithQuestions: (questions: Question[]) => void;
  onUpdateQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string) => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  questions,
  subjects,
  onStartQuizWithQuestions,
  onUpdateQuestion,
  onDeleteQuestion,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'failed' | 'success' | 'favorites'>('all');
  const [selectedSourceModalQ, setSelectedSourceModalQ] = useState<Question | null>(null);

  // Edit question modal state
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.notionEvaluated.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = selectedSubject === 'all' || q.subjectId === selectedSubject;
    const matchesDifficulty = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;

    let matchesStatus = true;
    if (selectedStatus === 'favorites') {
      matchesStatus = !!q.isFavorite;
    } else if (selectedStatus === 'failed') {
      matchesStatus = q.timesAnswered > 0 && q.wasLastCorrect === false;
    } else if (selectedStatus === 'success') {
      matchesStatus = q.timesAnswered > 0 && q.wasLastCorrect === true;
    }

    return matchesSearch && matchesSubject && matchesDifficulty && matchesStatus;
  });

  const failedQuestions = questions.filter((q) => q.timesAnswered > 0 && q.wasLastCorrect === false);

  const toggleFavorite = (q: Question) => {
    onUpdateQuestion({
      ...q,
      isFavorite: !q.isFavorite,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingQuestion) {
      onUpdateQuestion(editingQuestion);
      setEditingQuestion(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900">
            Banque Permanente de QCM
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {questions.length} questions capitalisées et classées par matière, chapitre, difficulté et traçabilité documentaire.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {failedQuestions.length > 0 && (
            <button
              onClick={() => onStartQuizWithQuestions(failedQuestions)}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refaire les {failedQuestions.length} ratées</span>
            </button>
          )}

          <button
            onClick={() => onStartQuizWithQuestions(filteredQuestions)}
            disabled={filteredQuestions.length === 0}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-40"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>S'entraîner sur ce filtre ({filteredQuestions.length})</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une question, une notion, un article de loi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        {/* Dropdowns row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Matière</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              <option value="all">Toutes les matières</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Difficulté</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 capitalize"
            >
              <option value="all">Tous niveaux</option>
              <option value="facile">Facile</option>
              <option value="moyen">Moyen</option>
              <option value="difficile">Difficile</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Statut / Historique</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full border border-slate-200 rounded-lg py-1.5 px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            >
              <option value="all">Tous les QCM</option>
              <option value="failed">Dernière fois ratée</option>
              <option value="success">Dernière fois réussie</option>
              <option value="favorites">Favoris uniquement</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('all');
                setSelectedDifficulty('all');
                setSelectedStatus('all');
              }}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500 text-xs">
            Aucun QCM ne correspond à vos critères de recherche.
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
            >
              {/* Question top metadata */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono">
                    <span className="text-slate-900 font-semibold">{q.subjectName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{q.chapter || 'Général'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{q.difficulty}</span>
                    {q.timesAnswered > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-600">
                          Répondu {q.timesAnswered}x ({q.timesCorrect}✓)
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 font-serif leading-snug">
                    {q.question}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleFavorite(q)}
                    className={`p-1.5 rounded-md transition-colors ${
                      q.isFavorite
                        ? 'text-amber-500 hover:text-amber-600 bg-amber-50'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                    title="Ajouter aux favoris"
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    onClick={() => setEditingQuestion(q)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Modifier la question"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteQuestion(q.id)}
                    className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Supprimer la question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Options list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {q.options.map((opt, optIdx) => {
                  const isCorrect = q.correctAnswers.includes(optIdx);
                  return (
                    <div
                      key={optIdx}
                      className={`p-2 rounded-lg border flex items-center gap-2 ${
                        isCorrect
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-medium'
                          : 'border-slate-100 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span className="font-mono font-bold text-slate-500">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      <span className="truncate">{opt}</span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom footer with source and notion */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <div className="font-mono">
                  Notion : <strong className="text-slate-700">{q.notionEvaluated}</strong>
                </div>

                <button
                  onClick={() => setSelectedSourceModalQ(q)}
                  className="font-semibold text-emerald-800 hover:text-emerald-700 flex items-center gap-1 underline decoration-emerald-700/40"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{q.source || 'Voir la source du cours'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">
                Modifier la question QCM
              </h3>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Intitulé de la question :
              </label>
              <textarea
                rows={3}
                value={editingQuestion.question}
                onChange={(e) =>
                  setEditingQuestion({ ...editingQuestion, question: e.target.value })
                }
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Explication détaillée :
              </label>
              <textarea
                rows={3}
                value={editingQuestion.explanation}
                onChange={(e) =>
                  setEditingQuestion({ ...editingQuestion, explanation: e.target.value })
                }
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notion évaluée :
              </label>
              <input
                type="text"
                value={editingQuestion.notionEvaluated}
                onChange={(e) =>
                  setEditingQuestion({ ...editingQuestion, notionEvaluated: e.target.value })
                }
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg"
              >
                Enregistrer les modifications
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Source Citation Modal */}
      {selectedSourceModalQ && (
        <SourceModal
          question={selectedSourceModalQ}
          onClose={() => setSelectedSourceModalQ(null)}
        />
      )}
    </div>
  );
};
