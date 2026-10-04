import {
  Subject,
  DocumentSummary,
  Question,
  Flashcard,
  StudyPlan,
  UserStats,
  QuizSession,
  ChatMessage,
  WeakTopic,
} from '../types';
import {
  INITIAL_SUBJECTS,
  INITIAL_DOCUMENTS,
  INITIAL_QUESTIONS,
  INITIAL_FLASHCARDS,
  INITIAL_STUDY_PLAN,
  INITIAL_USER_STATS,
} from '../data/initialData';

const STORAGE_KEYS = {
  SUBJECTS: 'asf_subjects_v1',
  DOCUMENTS: 'asf_documents_v1',
  QUESTIONS: 'asf_questions_v1',
  FLASHCARDS: 'asf_flashcards_v1',
  STUDY_PLAN: 'asf_study_plan_v1',
  USER_STATS: 'asf_user_stats_v1',
  QUIZ_HISTORY: 'asf_quiz_history_v1',
  CHAT_MESSAGES: 'asf_chat_messages_v1',
};

// Safe localStorage helper
function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

export const StorageService = {
  // Subjects
  getSubjects(): Subject[] {
    return getStored<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  },
  saveSubjects(subjects: Subject[]): void {
    setStored(STORAGE_KEYS.SUBJECTS, subjects);
  },
  addSubject(subject: Omit<Subject, 'id'>): Subject {
    const subjects = this.getSubjects();
    const newSubject: Subject = {
      ...subject,
      id: `sub-${Date.now()}`,
    };
    subjects.push(newSubject);
    this.saveSubjects(subjects);
    return newSubject;
  },
  updateSubject(subject: Subject): void {
    const subjects = this.getSubjects().map((s) => (s.id === subject.id ? subject : s));
    this.saveSubjects(subjects);
  },
  deleteSubject(id: string): void {
    const subjects = this.getSubjects().filter((s) => s.id !== id);
    this.saveSubjects(subjects);
  },

  // Documents
  getDocuments(): DocumentSummary[] {
    return getStored<DocumentSummary[]>(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
  },
  saveDocuments(docs: DocumentSummary[]): void {
    setStored(STORAGE_KEYS.DOCUMENTS, docs);
  },
  addDocument(doc: DocumentSummary): void {
    const docs = this.getDocuments();
    docs.unshift(doc);
    this.saveDocuments(docs);
  },
  updateDocument(doc: DocumentSummary): void {
    const docs = this.getDocuments().map((d) => (d.id === doc.id ? doc : d));
    this.saveDocuments(docs);
  },
  deleteDocument(id: string): void {
    const docs = this.getDocuments().filter((d) => d.id !== id);
    this.saveDocuments(docs);
  },

  // Questions
  getQuestions(): Question[] {
    return getStored<Question[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
  },
  saveQuestions(questions: Question[]): void {
    setStored(STORAGE_KEYS.QUESTIONS, questions);
  },
  addQuestions(newQuestions: Question[]): void {
    const current = this.getQuestions();
    // Filter out potential duplicates by question text
    const existingTexts = new Set(current.map((q) => q.question.toLowerCase().trim()));
    const filtered = newQuestions.filter((q) => !existingTexts.has(q.question.toLowerCase().trim()));
    const merged = [...filtered, ...current];
    this.saveQuestions(merged);
  },
  updateQuestion(question: Question): void {
    const current = this.getQuestions().map((q) => (q.id === question.id ? question : q));
    this.saveQuestions(current);
  },
  deleteQuestion(id: string): void {
    const current = this.getQuestions().filter((q) => q.id !== id);
    this.saveQuestions(current);
  },
  recordQuestionAnswer(questionId: string, isCorrect: boolean, selectedChoice: number[]): void {
    const questions = this.getQuestions();
    const q = questions.find((item) => item.id === questionId);
    if (!q) return;

    q.timesAnswered += 1;
    if (isCorrect) {
      q.timesCorrect += 1;
    }
    q.lastAnsweredAt = new Date().toISOString();
    q.userLastChoice = selectedChoice;
    q.wasLastCorrect = isCorrect;

    this.saveQuestions(questions);

    // Update topic mastery in stats
    this.updateTopicMastery(q.topic, q.subjectName, isCorrect);
  },

  // Flashcards
  getFlashcards(): Flashcard[] {
    return getStored<Flashcard[]>(STORAGE_KEYS.FLASHCARDS, INITIAL_FLASHCARDS);
  },
  saveFlashcards(cards: Flashcard[]): void {
    setStored(STORAGE_KEYS.FLASHCARDS, cards);
  },
  addFlashcards(newCards: Flashcard[]): void {
    const current = this.getFlashcards();
    this.saveFlashcards([...newCards, ...current]);
  },
  updateFlashcard(card: Flashcard): void {
    const current = this.getFlashcards().map((c) => (c.id === card.id ? card : c));
    this.saveFlashcards(current);
  },
  deleteFlashcard(id: string): void {
    const current = this.getFlashcards().filter((c) => c.id !== id);
    this.saveFlashcards(current);
  },
  reviewFlashcard(id: string, rating: 'again' | 'hard' | 'good' | 'easy'): void {
    const cards = this.getFlashcards();
    const c = cards.find((card) => card.id === id);
    if (!c) return;

    c.lastReviewedAt = new Date().toISOString();
    if (rating === 'again') {
      c.masteryLevel = Math.max(0, c.masteryLevel - 1);
    } else if (rating === 'good') {
      c.masteryLevel = Math.min(5, c.masteryLevel + 1);
    } else if (rating === 'easy') {
      c.masteryLevel = Math.min(5, c.masteryLevel + 2);
    }

    // Schedule next review
    const now = new Date();
    const intervalDays = [1, 2, 4, 7, 15, 30][c.masteryLevel] || 1;
    now.setDate(now.getDate() + intervalDays);
    c.nextReviewAt = now.toISOString();

    this.saveFlashcards(cards);

    // Update daily card count
    const stats = this.getUserStats();
    stats.dailyGoals.cardsDone += 1;
    this.saveUserStats(stats);
  },

  // Study Plan
  getStudyPlan(): StudyPlan {
    return getStored<StudyPlan>(STORAGE_KEYS.STUDY_PLAN, INITIAL_STUDY_PLAN);
  },
  saveStudyPlan(plan: StudyPlan): void {
    setStored(STORAGE_KEYS.STUDY_PLAN, plan);
  },
  toggleTask(taskId: string): void {
    const plan = this.getStudyPlan();
    const task = plan.weeklyTasks.find((t) => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveStudyPlan(plan);
    }
  },

  // User Stats & Adaptive Learning
  getUserStats(): UserStats {
    return getStored<UserStats>(STORAGE_KEYS.USER_STATS, INITIAL_USER_STATS);
  },
  saveUserStats(stats: UserStats): void {
    setStored(STORAGE_KEYS.USER_STATS, stats);
  },
  updateTopicMastery(topic: string, subjectName: string, isCorrect: boolean): void {
    const stats = this.getUserStats();

    // Update topic score
    const currentRate = stats.masteryPerTopic[topic] ?? 50;
    const delta = isCorrect ? 8 : -12;
    const newRate = Math.min(100, Math.max(0, currentRate + delta));
    stats.masteryPerTopic[topic] = newRate;

    // Update weak topics list
    const existingWeakIdx = stats.weakTopics.findIndex((w) => w.topic.toLowerCase() === topic.toLowerCase());
    if (newRate < 65) {
      if (existingWeakIdx >= 0) {
        stats.weakTopics[existingWeakIdx].masteryPercent = newRate;
        if (!isCorrect) {
          stats.weakTopics[existingWeakIdx].errorCount += 1;
          stats.weakTopics[existingWeakIdx].lastFailedAt = 'Aujourd’hui';
        } else {
          stats.weakTopics[existingWeakIdx].successCount += 1;
        }
      } else {
        stats.weakTopics.push({
          topic,
          subjectName,
          errorCount: isCorrect ? 0 : 1,
          successCount: isCorrect ? 1 : 0,
          masteryPercent: newRate,
          lastFailedAt: 'Aujourd’hui',
        });
      }
    } else if (existingWeakIdx >= 0 && newRate >= 75) {
      // Graduated from weak topics!
      stats.weakTopics.splice(existingWeakIdx, 1);
    }

    // Update global counters
    stats.questionsAnswered += 1;
    stats.dailyGoals.qcmDone += 1;

    this.saveUserStats(stats);
  },

  // Quiz / Exam Sessions
  getQuizHistory(): QuizSession[] {
    return getStored<QuizSession[]>(STORAGE_KEYS.QUIZ_HISTORY, []);
  },
  saveQuizSession(session: QuizSession): void {
    const history = this.getQuizHistory();
    history.unshift(session);
    setStored(STORAGE_KEYS.QUIZ_HISTORY, history);

    // Update user stats
    const stats = this.getUserStats();
    if (session.mode === 'exam') {
      stats.examsTaken += 1;
    }
    stats.totalStudyMinutes += Math.round(session.timeSpentSeconds / 60);

    // Add activity
    stats.recentActivities.unshift({
      id: `act-${Date.now()}`,
      type: session.mode === 'exam' ? 'exam' : 'qcm',
      title: session.title,
      details: `${session.score}/${session.totalQuestions} (${session.percentage.toFixed(1)} %) · Durée ${Math.round(session.timeSpentSeconds / 60)} min`,
      timestamp: 'Aujourd’hui',
      scorePercent: session.percentage,
    });
    if (stats.recentActivities.length > 20) {
      stats.recentActivities = stats.recentActivities.slice(0, 20);
    }

    this.saveUserStats(stats);
  },

  // Chat
  getChatMessages(): ChatMessage[] {
    return getStored<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES, [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: 'Bonjour cher candidat ! Je suis votre coach dédié pour le concours d’Administrateur des Services Financiers (ASF) au Burkina Faso. Je suis prêt à vous interroger, clarifier les directives UEMOA, les décrets de comptabilité publique et marchés publics, ou décortiquer vos cours. Que souhaitez-vous travailler aujourd’hui ?',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: [
          'Explique-moi le principe d’annualité budgétaire et ses dérogations',
          'Quels sont les 4 cas où le comptable public doit refuser la réquisition ?',
          'Fais-moi réviser mes notions faibles',
          'Donne-moi un cas pratique sur les marchés publics',
        ],
      },
    ]);
  },
  saveChatMessages(messages: ChatMessage[]): void {
    setStored(STORAGE_KEYS.CHAT_MESSAGES, messages);
  },

  // Reset to initial seed
  resetToInitialData(): void {
    localStorage.clear();
    setStored(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    setStored(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS);
    setStored(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
    setStored(STORAGE_KEYS.FLASHCARDS, INITIAL_FLASHCARDS);
    setStored(STORAGE_KEYS.STUDY_PLAN, INITIAL_STUDY_PLAN);
    setStored(STORAGE_KEYS.USER_STATS, INITIAL_USER_STATS);
  },

  // Export full JSON backup
  exportBackup(): string {
    const backup = {
      subjects: this.getSubjects(),
      documents: this.getDocuments(),
      questions: this.getQuestions(),
      flashcards: this.getFlashcards(),
      studyPlan: this.getStudyPlan(),
      userStats: this.getUserStats(),
      quizHistory: this.getQuizHistory(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    return JSON.stringify(backup, null, 2);
  },

  // Import JSON backup
  importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.subjects) setStored(STORAGE_KEYS.SUBJECTS, data.subjects);
      if (data.documents) setStored(STORAGE_KEYS.DOCUMENTS, data.documents);
      if (data.questions) setStored(STORAGE_KEYS.QUESTIONS, data.questions);
      if (data.flashcards) setStored(STORAGE_KEYS.FLASHCARDS, data.flashcards);
      if (data.studyPlan) setStored(STORAGE_KEYS.STUDY_PLAN, data.studyPlan);
      if (data.userStats) setStored(STORAGE_KEYS.USER_STATS, data.userStats);
      if (data.quizHistory) setStored(STORAGE_KEYS.QUIZ_HISTORY, data.quizHistory);
      return true;
    } catch (e) {
      console.error('Backup import error:', e);
      return false;
    }
  },
};
