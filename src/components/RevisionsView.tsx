import React, { useState } from 'react';
import {
  BookOpen,
  RotateCcw,
  Star,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Plus,
  Search,
  Quote,
  Flame,
  BrainCircuit,
  SlidersHorizontal,
} from 'lucide-react';
import { Flashcard, Subject, FlashcardCategory } from '../types';
import { StorageService } from '../services/storage';

interface RevisionsViewProps {
  flashcards: Flashcard[];
  subjects: Subject[];
  onStartDailySession: () => void;
  onUpdateFlashcard: (card: Flashcard) => void;
}

export const RevisionsView: React.FC<RevisionsViewProps> = ({
  flashcards,
  subjects,
  onStartDailySession,
  onUpdateFlashcard,
}) => {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'daily'>('flashcards');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive flashcard deck mode
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Filtered flashcards
  const filteredCards = flashcards.filter((fc) => {
    const matchesSubject = selectedSubject === 'all' || fc.subjectId === selectedSubject;
    const matchesCat = selectedCategory === 'all' || fc.category === selectedCategory;
    const matchesSearch =
      fc.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fc.back.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fc.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesCat && matchesSearch;
  });

  const currentStudyCard = filteredCards[studyIndex];

  const handleRateCard = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentStudyCard) return;
    StorageService.reviewFlashcard(currentStudyCard.id, rating);
    setIsFlipped(false);
    if (studyIndex < filteredCards.length - 1) {
      setStudyIndex(studyIndex + 1);
    } else {
      setIsStudyMode(false);
      setStudyIndex(0);
    }
  };

  const toggleFavorite = (card: Flashcard) => {
    onUpdateFlashcard({
      ...card,
      isFavorite: !card.isFavorite,
    });
  };

  const getCategoryLabel = (cat: FlashcardCategory): string => {
    switch (cat) {
      case 'definition': return 'Définition';
      case 'concept': return 'Concept';
      case 'tableau': return 'Tableau comparatif';
      case 'date_chiffre': return 'Date / Chiffre';
      case 'regle': return 'Règle juridique';
      case 'article': return 'Article de loi';
      case 'piege': return 'Piège classique';
      default: return cat;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold font-serif text-slate-900">
            Fiches de Révision & Répétition Espacée
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Algorithme adaptatif SM-2 : mémorisation à long terme des définitions, articles, chiffres clés et règles d'ordre public.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {filteredCards.length > 0 && (
            <button
              onClick={() => {
                setIsStudyMode(true);
                setStudyIndex(0);
                setIsFlipped(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <BrainCircuit className="w-4 h-4" />
              <span>Lancer le mode révision interactive ({filteredCards.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation tabs: Fiches vs Révision du jour */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl max-w-sm text-xs">
        <button
          onClick={() => setActiveTab('flashcards')}
          className={`flex-1 py-1.5 font-semibold rounded-lg transition-colors ${
            activeTab === 'flashcards'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Toutes les fiches ({flashcards.length})
        </button>

        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-1.5 font-semibold rounded-lg transition-colors ${
            activeTab === 'daily'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Programme « Aujourd'hui »
        </button>
      </div>

      {/* View 1: Interactive Flashcard Study Mode Modal / Fullscreen */}
      {isStudyMode && currentStudyCard && (
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-10 shadow-xl max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Fiche {studyIndex + 1} sur {filteredCards.length}</span>
            <button
              onClick={() => setIsStudyMode(false)}
              className="hover:text-white"
            >
              Quitter le mode interactif ✕
            </button>
          </div>

          {/* Flashcard surface */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[260px] bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 cursor-pointer flex flex-col justify-between transition-all select-none"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-mono font-semibold uppercase">
                {getCategoryLabel(currentStudyCard.category)}
              </span>
              <span className="text-slate-400">
                {currentStudyCard.subjectName}
              </span>
            </div>

            <div className="py-6 text-center">
              {!isFlipped ? (
                <div className="space-y-3">
                  <span className="text-xs text-slate-400 block font-mono">RECTO / QUESTION :</span>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-white leading-relaxed">
                    {currentStudyCard.front}
                  </h3>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in">
                  <span className="text-xs text-emerald-400 block font-mono">VERSO / RÉPONSE DU CONCOURS :</span>
                  <p className="text-sm sm:text-base font-serif text-slate-200 leading-relaxed whitespace-pre-line text-left bg-slate-900/60 p-4 rounded-xl border border-slate-700">
                    {currentStudyCard.back}
                  </p>
                  {currentStudyCard.legalReference && (
                    <div className="text-xs text-amber-300 font-mono text-left pt-1">
                      Réf: {currentStudyCard.legalReference}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="text-center text-xs text-slate-400 font-mono">
              {!isFlipped ? 'Cliquez pour retourner la carte' : 'Cliquez pour voir le recto'}
            </div>
          </div>

          {/* Spaced repetition evaluation buttons */}
          {isFlipped && (
            <div className="grid grid-cols-4 gap-2 pt-2 animate-in fade-in">
              <button
                onClick={() => handleRateCard('again')}
                className="py-2.5 px-2 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 rounded-xl text-xs font-semibold text-center transition-colors"
              >
                À revoir (1j)
              </button>
              <button
                onClick={() => handleRateCard('hard')}
                className="py-2.5 px-2 bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-200 rounded-xl text-xs font-semibold text-center transition-colors"
              >
                Difficile (2j)
              </button>
              <button
                onClick={() => handleRateCard('good')}
                className="py-2.5 px-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 rounded-xl text-xs font-semibold text-center transition-colors"
              >
                Bien (4j)
              </button>
              <button
                onClick={() => handleRateCard('easy')}
                className="py-2.5 px-2 bg-blue-950/80 hover:bg-blue-900 border border-blue-800 text-blue-200 rounded-xl text-xs font-semibold text-center transition-colors"
              >
                Facile (7j)
              </button>
            </div>
          )}
        </div>
      )}

      {/* View 2: Daily Routine (Aujourd'hui) as requested in Req 23 */}
      {activeTab === 'daily' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 font-semibold uppercase">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>Routine Personnalisée d'Aujourd'hui</span>
              </div>
              <h2 className="text-xl font-bold font-serif text-slate-900">
                Votre séance d'excellence quotidienne
              </h2>
            </div>

            <button
              onClick={onStartDailySession}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <PlayIcon className="w-3.5 h-3.5 fill-current" />
              <span>Démarrer la routine</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                1
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">20 QCM de renforcement</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Finances publiques & Comptabilité publique (Directives UEMOA)</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                2
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">1 fiche mémo à revoir</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Article 38 : Cas d'interdiction de réquisition du comptable</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                3
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">10 questions sur vos erreurs récentes</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Fongibilité asymétrique & Seuils de marchés publics</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                4
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">30 minutes de lecture active de cours</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Comptabilité des matières (Inventaire physique contradictoire)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 3: Cards List & Grid */}
      {activeTab === 'flashcards' && !isStudyMode && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher une fiche ou un mot-clé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="border border-slate-200 rounded-lg py-1.5 px-2 bg-white text-slate-800"
              >
                <option value="all">Toutes les matières</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-slate-200 rounded-lg py-1.5 px-2 bg-white text-slate-800"
              >
                <option value="all">Toutes catégories</option>
                <option value="definition">Définitions</option>
                <option value="concept">Concepts</option>
                <option value="tableau">Tableaux</option>
                <option value="regle">Règles</option>
                <option value="article">Articles</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-emerald-800 font-semibold uppercase text-[11px]">
                      {getCategoryLabel(card.category)}
                    </span>
                    <button
                      onClick={() => toggleFavorite(card)}
                      className={`p-1 rounded ${card.isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-slate-600'}`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <h3 className="font-serif font-bold text-sm text-slate-900 leading-snug">
                    {card.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {card.front}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Maîtrise : {card.masteryLevel}/5</span>
                  <span className="text-slate-800 font-medium truncate max-w-[140px]">
                    {card.subjectName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
