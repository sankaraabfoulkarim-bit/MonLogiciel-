import React from 'react';
import { X, BookOpen, Quote, FileText, ArrowRight } from 'lucide-react';
import { Question, DocumentSummary } from '../types';

interface SourceModalProps {
  question: Question | null;
  document?: DocumentSummary | null;
  onClose: () => void;
  onGoToDocument?: (docId: string) => void;
}

export const SourceModal: React.FC<SourceModalProps> = ({
  question,
  document,
  onClose,
  onGoToDocument,
}) => {
  if (!question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Source Documentaire & Traçabilité
              </h3>
              <p className="text-xs text-slate-500">
                Extrait vérifié pour la préparation au concours ASF
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Question recap */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Question évaluée
            </span>
            <p className="text-sm font-medium text-slate-900 font-serif leading-relaxed">
              {question.question}
            </p>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
              <span>{question.subjectName}</span>
              <span aria-hidden="true">·</span>
              <span>{question.topic}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">Niveau {question.difficulty}</span>
            </div>
          </div>

          {/* Source Reference Tag */}
          <div className="flex items-center gap-2 text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5">
            <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
            <div className="font-mono text-xs">
              <span className="font-semibold">{question.source}</span>
              {question.pageNumber && (
                <span className="ml-2 font-normal text-emerald-700">
                  (Page repérée : {question.pageNumber})
                </span>
              )}
            </div>
          </div>

          {/* Exact Quote Excerpt */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2">
              <Quote className="w-3.5 h-3.5 text-slate-400" />
              <span>Passage textuel exact du document :</span>
            </div>
            <div className="bg-amber-50/60 border-l-4 border-amber-500 p-4 rounded-r-lg text-slate-800 text-sm italic font-serif leading-relaxed">
              « {question.sourceQuote || question.explanation} »
            </div>
          </div>

          {/* Notion breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="border border-slate-200 rounded-lg p-3">
              <span className="text-slate-500 block mb-1">Notion juridique/financière :</span>
              <span className="font-semibold text-slate-800">{question.notionEvaluated}</span>
            </div>
            <div className="border border-slate-200 rounded-lg p-3">
              <span className="text-slate-500 block mb-1">Statut de vérification :</span>
              <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Vérifié conforme aux textes en vigueur (Burkina Faso)
              </span>
            </div>
          </div>

          {/* Detailed explanation */}
          <div>
            <span className="text-xs font-semibold text-slate-700 block mb-1.5">
              Explication de l'examinateur :
            </span>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {question.explanation}
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Réf: {question.id}
          </span>
          <div className="flex items-center gap-2">
            {document && onGoToDocument && (
              <button
                onClick={() => {
                  onClose();
                  onGoToDocument(document.id);
                }}
                className="px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-white transition-colors flex items-center gap-1.5"
              >
                <span>Ouvrir la fiche du document</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
