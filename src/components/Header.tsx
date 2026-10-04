import React from 'react';
import {
  LayoutDashboard,
  Files,
  FileCheck2,
  GraduationCap,
  RotateCcw,
  AlertTriangle,
  CalendarDays,
  Bot,
  Settings,
  Sparkles,
  BookOpen,
  BarChart3,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type NavTab = 
  | 'dashboard'
  | 'documents'
  | 'qcm-generator'
  | 'question-bank'
  | 'examens-blancs'
  | 'revisions'
  | 'mes-erreurs'
  | 'planning'
  | 'statistiques'
  | 'assistant'
  | 'parametres';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  daysRemaining: number;
  weakCount: number;
  onQuickQuiz: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  daysRemaining,
  weakCount,
  onQuickQuiz,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      {/* Top Bar Contract: 3 zones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-900 flex items-center justify-center text-amber-400 font-bold text-sm tracking-wider shadow-sm">
              ASF
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 font-serif block leading-tight">
                ASF Prépa Faso
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:block">
                Administrateur des Services Financiers
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (single line, clean text) */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Tableau de bord
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'documents'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Documents & Cours
          </button>

          <button
            onClick={() => setActiveTab('qcm-generator')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'qcm-generator'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Générer QCM
          </button>

          <button
            onClick={() => setActiveTab('question-bank')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'question-bank'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Banque QCM
          </button>

          <button
            onClick={() => setActiveTab('examens-blancs')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'examens-blancs'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Examens blancs
          </button>

          <button
            onClick={() => setActiveTab('revisions')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'revisions'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Fiches & Révisions
          </button>

          <button
            onClick={() => setActiveTab('mes-erreurs')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'mes-erreurs'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>Mes erreurs</span>
            {weakCount > 0 && (
              <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                {weakCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('planning')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'planning'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Planning 9 mois
          </button>

          <button
            onClick={() => setActiveTab('assistant')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'assistant'
                ? 'bg-emerald-50 text-emerald-900 font-semibold'
                : 'text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Coach IA</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <PWAInstallButton variant="header" />

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 mr-1">
            <span className="text-slate-400">Concours dans</span>
            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
              {daysRemaining}j
            </span>
          </div>

          <button
            onClick={onQuickQuiz}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shadow-sm flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Séance du jour</span>
          </button>

          <button
            onClick={() => setActiveTab('parametres')}
            title="Paramètres & Sauvegarde"
            className={`p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors ${
              activeTab === 'parametres' ? 'bg-slate-100 text-slate-900' : ''
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Secondary Navigation scroll bar */}
      <div className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-100 bg-slate-50/80 text-xs">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'}`}
        >
          Tableau
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'documents' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'}`}
        >
          Documents
        </button>
        <button
          onClick={() => setActiveTab('qcm-generator')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'qcm-generator' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'}`}
        >
          Générer QCM
        </button>
        <button
          onClick={() => setActiveTab('question-bank')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'question-bank' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'}`}
        >
          Banque ({daysRemaining}j)
        </button>
        <button
          onClick={() => setActiveTab('examens-blancs')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'examens-blancs' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'}`}
        >
          Examens
        </button>
        <button
          onClick={() => setActiveTab('revisions')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'revisions' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'}`}
        >
          Fiches
        </button>
        <button
          onClick={() => setActiveTab('mes-erreurs')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'mes-erreurs' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'}`}
        >
          Erreurs ({weakCount})
        </button>
        <button
          onClick={() => setActiveTab('planning')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'planning' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'}`}
        >
          Planning
        </button>
        <button
          onClick={() => setActiveTab('statistiques')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'statistiques' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'}`}
        >
          Stats
        </button>
        <button
          onClick={() => setActiveTab('assistant')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'assistant' ? 'bg-emerald-100 text-emerald-900 font-semibold' : 'text-emerald-700'}`}
        >
          Coach IA
        </button>
      </div>
    </header>
  );
};
