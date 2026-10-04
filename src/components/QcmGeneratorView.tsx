import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  FileText,
  Sliders,
  CheckSquare,
  HelpCircle,
  FileCheck2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { Subject, DocumentSummary, Question, Difficulty, QuestionType } from '../types';
import { ApiService } from '../services/api';

interface QcmGeneratorViewProps {
  subjects: Subject[];
  documents: DocumentSummary[];
  preselectedDoc?: DocumentSummary | null;
  onQuestionsGenerated: (questions: Question[], mode: 'training' | 'exam') => void;
}

export const QcmGeneratorView: React.FC<QcmGeneratorViewProps> = ({
  subjects,
  documents,
  preselectedDoc,
  onQuestionsGenerated,
}) => {
  // Mode: single document or multi-document batch
  const [generationScope, setGenerationScope] = useState<'single' | 'batch'>(
    preselectedDoc ? 'single' : 'single'
  );

  // Form states
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    preselectedDoc?.subjectId || subjects[0]?.id || ''
  );
  const [selectedDocId, setSelectedDocId] = useState<string>(
    preselectedDoc?.id || (documents[0]?.id ?? '')
  );
  const [selectedBatchDocIds, setSelectedBatchDocIds] = useState<string[]>(
    documents.slice(0, 3).map((d) => d.id)
  );

  const [questionCount, setQuestionCount] = useState<number>(10);
  const [customQuestionCount, setCustomQuestionCount] = useState<string>('');
  const [chapter, setChapter] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('moyen');
  const [questionType, setQuestionType] = useState<QuestionType>('melange');
  const [optionsCount, setOptionsCount] = useState<number>(4);
  const [allowMultipleCorrect, setAllowMultipleCorrect] = useState<boolean>(false);
  const [showExplanations, setShowExplanations] = useState<boolean>(true);
  const [showPageReferences, setShowPageReferences] = useState<boolean>(true);
  const [quizMode, setQuizMode] = useState<'training' | 'exam'>('training');

  // Loading & Progress
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Selected document info
  const currentDoc = documents.find((d) => d.id === selectedDocId);
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Toggle batch doc selection
  const toggleBatchDoc = (docId: string) => {
    setSelectedBatchDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  // Submit Generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(15);
    setStatusMessage('Lecture et indexation des chapitres sélectionnés...');

    const actualCount = customQuestionCount ? Number(customQuestionCount) || 10 : questionCount;

    try {
      let generated: Question[] = [];

      if (generationScope === 'batch') {
        setGenerationProgress(35);
        setStatusMessage('Agrégation des documents pour examen blanc équilibré...');

        const chosenDocs = documents.filter((d) => selectedBatchDocIds.includes(d.id));
        setGenerationProgress(65);
        setStatusMessage('Formulation des QCM, élimination des doublons et validation...');

        generated = await ApiService.generateBatchExam({
          documents: chosenDocs.map((d) => ({
            name: d.name,
            summary: d.summary,
            subjectName: d.subjectName,
          })),
          totalQuestions: actualCount,
          difficulty,
        });
      } else {
        setGenerationProgress(40);
        setStatusMessage('Extraction des articles de lois et notions du document...');

        const docTexts = currentDoc?.chunks?.map((c) => c.content) || [currentDoc?.summary || ''];
        setGenerationProgress(70);
        setStatusMessage('Validation de la traçabilité des sources et pièges de concours...');

        generated = await ApiService.generateQcm({
          subject: currentSubject?.name || 'Finances publiques',
          chapter: chapter || undefined,
          topic: topic || undefined,
          difficulty,
          questionCount: actualCount,
          questionType,
          optionsCount,
          documentTexts: docTexts,
          documentNames: currentDoc ? [currentDoc.name] : ['Programme ASF Burkina'],
          mode: 'document_grounded',
        });
      }

      setGenerationProgress(95);
      setStatusMessage('Validation de conformité terminée avec succès.');

      setTimeout(() => {
        setIsGenerating(false);
        onQuestionsGenerated(generated, quizMode);
      }, 400);
    } catch (err) {
      console.error('Generation error:', err);
      setIsGenerating(false);
      setStatusMessage('Une erreur est survenue lors de la génération.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 uppercase tracking-wide">
          <Sparkles className="w-4 h-4 text-emerald-700" />
          <span>Générateur Intelligent de QCM Sourcés</span>
        </div>
        <h1 className="text-2xl font-bold font-serif text-slate-900 mt-1">
          Générer des QCM à partir d'un document
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          L'IA analyse le contenu textuel et réglementaire de vos cours pour concevoir des questions précises,
          vérifiées et assorties de leur référence de page exacte.
        </p>
      </div>

      {/* Mode selection tabs (Single vs Batch) */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl max-w-md">
        <button
          onClick={() => setGenerationScope('single')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
            generationScope === 'single'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Document ciblé</span>
        </button>

        <button
          onClick={() => setGenerationScope('batch')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
            generationScope === 'batch'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-700" />
          <span>Génération par lot (Multi-documents)</span>
        </button>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Scope: Single Document Selector */}
        {generationScope === 'single' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                1. Matière :
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  const matchingDoc = documents.find((d) => d.subjectId === e.target.value);
                  if (matchingDoc) setSelectedDocId(matchingDoc.id);
                }}
                className="w-full text-xs border border-slate-300 rounded-lg py-2 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 font-medium"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                2. Document source analysé :
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg py-2 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 truncate"
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.pagesCount} p.)
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          /* Scope: Batch Selector */
          <div className="space-y-3 pb-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Sélectionnez les documents à combiner pour le lot :
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {selectedBatchDocIds.length} document(s) sélectionné(s)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {documents.map((doc) => {
                const isChecked = selectedBatchDocIds.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => toggleBatchDoc(doc.id)}
                    className={`p-3 rounded-lg border text-left text-xs transition-colors flex items-center justify-between gap-2 ${
                      isChecked
                        ? 'border-emerald-700 bg-emerald-50/50 text-emerald-950 font-medium'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate">
                      <div className="truncate font-semibold">{doc.name}</div>
                      <div className="text-[10px] text-slate-500">{doc.subjectName} · {doc.pagesCount} pages</div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-emerald-700 border-emerald-700 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isChecked && <span className="text-[10px]">✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Chapter and Topic filters (for single mode) */}
        {generationScope === 'single' && currentDoc && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chapitre ciblé (optionnel) :
              </label>
              <select
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg py-2 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
              >
                <option value="">Tous les chapitres du document</option>
                {currentDoc.chapters.map((ch, idx) => (
                  <option key={idx} value={ch.title}>
                    {ch.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Thème ou notion spécifique :
              </label>
              <input
                type="text"
                placeholder="Ex : fongibilité, réquisition, seuils gré à gré..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              >
              </input>
            </div>
          </div>
        )}

        {/* Question Count Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Nombre de questions à générer :
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {[5, 10, 20, 30, 50, 100].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setQuestionCount(num);
                  setCustomQuestionCount('');
                }}
                className={`px-4 py-2 text-xs font-mono font-semibold rounded-lg border transition-colors ${
                  questionCount === num && !customQuestionCount
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {num}
              </button>
            ))}

            <div className="flex items-center gap-1 ml-2">
              <span className="text-xs text-slate-500">ou :</span>
              <input
                type="number"
                min="1"
                max="100"
                placeholder="Perso"
                value={customQuestionCount}
                onChange={(e) => setCustomQuestionCount(e.target.value)}
                className="w-20 px-2 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>
          </div>
        </div>

        {/* Level and Type grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Niveau de difficulté :
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['facile', 'moyen', 'difficile', 'expert'] as Difficulty[]).map((lvl) => (
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Type de questions :
            </label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as QuestionType)}
              className="w-full text-xs border border-slate-300 rounded-lg py-2 px-3 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700 capitalize"
            >
              <option value="melange">Mélange équilibré (recommandé)</option>
              <option value="comprehension">Compréhension des textes</option>
              <option value="memorisation">Mémorisation (dates, chiffres, articles)</option>
              <option value="application">Application des procédures</option>
              <option value="cas_pratique">Cas pratiques de gestionnaire</option>
              <option value="piege">Pièges classiques de concours</option>
            </select>
          </div>
        </div>

        {/* Options count and Mode options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Propositions par question :
            </label>
            <div className="flex items-center gap-2">
              {[3, 4, 5].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setOptionsCount(opt)}
                  className={`flex-1 py-1.5 font-mono font-medium rounded-lg border transition-colors ${
                    optionsCount === opt
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  {opt} choix
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Mode de passage :
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuizMode('training')}
                className={`flex-1 py-1.5 font-medium rounded-lg border transition-colors ${
                  quizMode === 'training'
                    ? 'bg-emerald-800 border-emerald-800 text-white'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                Entraînement
              </button>
              <button
                type="button"
                onClick={() => setQuizMode('exam')}
                className={`flex-1 py-1.5 font-medium rounded-lg border transition-colors ${
                  quizMode === 'exam'
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                Examen
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Traçabilité & Affichage :
            </label>
            <div className="space-y-1 text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showExplanations}
                  onChange={(e) => setShowExplanations(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-700"
                />
                <span>Explications détaillées</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPageReferences}
                  onChange={(e) => setShowPageReferences(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-700"
                />
                <span>Références aux pages exactes</span>
              </label>
            </div>
          </div>
        </div>

        {/* Quality notice */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-slate-900">Charte qualité concours : </span>
            Chaque question fait l'objet d'un contrôle de cohérence automatique. Si une information
            n'est pas expressément stipulée ou déductible du document, l'IA ne génère pas de réponse fictive.
          </div>
        </div>

        {/* Progress Bar when generating */}
        {isGenerating && (
          <div className="space-y-2 bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 animate-spin" />
                {statusMessage}
              </span>
              <span className="font-mono text-emerald-800 font-bold">{generationProgress}%</span>
            </div>
            <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-700 h-full rounded-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Primary Submit Button */}
        <div className="pt-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 px-6 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Générer les QCM</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
