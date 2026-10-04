export type Difficulty = 'facile' | 'moyen' | 'difficile' | 'expert';

export type QuestionType = 
  | 'comprehension' 
  | 'memorisation' 
  | 'application' 
  | 'cas_pratique' 
  | 'piege' 
  | 'melange';

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  iconName: string;
  isActive: boolean;
  weight: number; // Coefficient au concours
  chaptersCount?: number;
  questionsCount?: number;
}

export interface DocumentChunk {
  id: string;
  chapter: string;
  section?: string;
  page?: number;
  content: string;
  keywords?: string[];
}

export interface DocumentSummary {
  id: string;
  name: string;
  subjectId: string;
  subjectName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  pagesCount: number;
  pagesEstimated?: number;
  status: 'uploading' | 'analyzing' | 'indexed' | 'ready' | 'error';
  questionsGeneratedCount: number;
  flashcardsCount: number;
  summary: string;
  chapters: {
    title: string;
    pageStart?: number;
    pageEnd?: number;
    topics: string[];
  }[];
  keyConcepts: string[];
  keyArticles: string[];
  chunks: DocumentChunk[];
  error?: string;
}

export interface Question {
  id: string;
  subjectId: string;
  subjectName: string;
  chapter: string;
  topic: string;
  question: string;
  options: string[];
  correctAnswers: number[]; // Index(es) of correct option(s) (0-indexed)
  explanation: string;
  difficulty: Difficulty;
  source: string; // e.g. "Finances publiques.pdf — Chapitre 3 — Page 27"
  sourceQuote?: string; // Exact citation from the document
  pageNumber?: number;
  notionEvaluated: string;
  trapWarning?: string;
  timesAnswered: number;
  timesCorrect: number;
  lastAnsweredAt?: string;
  isFavorite?: boolean;
  documentId?: string;
  isFlagged?: boolean;
  userLastChoice?: number[];
  wasLastCorrect?: boolean;
}

export interface QuizSession {
  id: string;
  title: string;
  mode: 'training' | 'exam' | 'errors_review' | 'daily';
  subjectIds: string[];
  questions: Question[];
  userAnswers: Record<string, number[]>; // questionId -> selected indexes
  score: number;
  totalQuestions: number;
  percentage: number;
  startedAt: string;
  completedAt?: string;
  timeSpentSeconds: number;
  timeLimitSeconds?: number;
  weakTopicsDetected: string[];
  unansweredCount: number;
  correctCount: number;
  incorrectCount: number;
}

export interface StudyPhase {
  phaseNumber: number;
  title: string;
  months: string;
  description: string;
  focusSubjects: string[];
  status: 'current' | 'upcoming' | 'completed';
}

export interface StudyTask {
  id: string;
  title: string;
  subjectName: string;
  type: 'qcm' | 'lecture' | 'fiche' | 'examen';
  durationMinutes: number;
  phaseNumber: number;
  completed: boolean;
  dayLabel?: string;
}

export interface StudyPlan {
  examDate: string;
  dailyHours: number;
  daysPerWeek: number;
  currentLevel: 'debutant' | 'intermediaire' | 'avance';
  prioritySubjectIds: string[];
  phases: StudyPhase[];
  weeklyTasks: StudyTask[];
}

export type FlashcardCategory = 
  | 'definition' 
  | 'concept' 
  | 'tableau' 
  | 'date_chiffre' 
  | 'regle' 
  | 'article' 
  | 'piege';

export interface Flashcard {
  id: string;
  subjectId: string;
  subjectName: string;
  title: string;
  category: FlashcardCategory;
  front: string;
  back: string;
  legalReference?: string;
  source?: string;
  documentId?: string;
  isFavorite: boolean;
  masteryLevel: number; // 0 to 5 (Leitner / SM-2 spaced repetition)
  lastReviewedAt?: string;
  nextReviewAt?: string;
}

export interface WeakTopic {
  topic: string;
  subjectName: string;
  errorCount: number;
  successCount: number;
  masteryPercent: number;
  lastFailedAt: string;
}

export interface PerformanceDay {
  date: string;
  label: string;
  questionsCount: number;
  successRate: number;
}

export interface UserStats {
  examDate: string;
  questionsAnswered: number;
  overallSuccessRate: number;
  totalStudyMinutes: number;
  examsTaken: number;
  streakDays: number;
  masteryPerSubject: Record<string, number>; // subjectId -> 0..100
  masteryPerTopic: Record<string, number>; // topic -> 0..100
  weakTopics: WeakTopic[];
  dailyGoals: {
    qcmTarget: number;
    qcmDone: number;
    cardsTarget: number;
    cardsDone: number;
    studyMinutesTarget: number;
    studyMinutesDone: number;
  };
  recentActivities: {
    id: string;
    type: 'qcm' | 'exam' | 'doc' | 'flashcard' | 'assistant';
    title: string;
    details: string;
    timestamp: string;
    scorePercent?: number;
  }[];
  history7Days: PerformanceDay[];
  history30Days: PerformanceDay[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: {
    documentName: string;
    page?: number;
    excerpt: string;
  }[];
  suggestedPrompts?: string[];
}
