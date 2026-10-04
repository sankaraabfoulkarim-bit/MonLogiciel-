/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header, NavTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { DocumentsView } from './components/DocumentsView';
import { QcmGeneratorView } from './components/QcmGeneratorView';
import { QuestionBankView } from './components/QuestionBankView';
import { ExamensBlancsView } from './components/ExamensBlancsView';
import { RevisionsView } from './components/RevisionsView';
import { MesErreursView } from './components/MesErreursView';
import { PlanningView } from './components/PlanningView';
import { StatistiquesView } from './components/StatistiquesView';
import { AssistantIaView } from './components/AssistantIaView';
import { ParametresView } from './components/ParametresView';
import { QuizPlayerView } from './components/QuizPlayerView';
import { QuizResultsView } from './components/QuizResultsView';
import { OfflineIndicator } from './components/OfflineIndicator';

import {
  Subject,
  DocumentSummary,
  Question,
  Flashcard,
  StudyPlan,
  UserStats,
  QuizSession,
  ChatMessage,
} from './types';
import { StorageService } from './services/storage';
import { ApiService } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Application Data States
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizSession[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Active quiz/exam session state
  const [activeQuizSession, setActiveQuizSession] = useState<{
    questions: Question[];
    title: string;
    mode: 'training' | 'exam' | 'errors_review' | 'daily';
    timeLimitMinutes?: number;
  } | null>(null);

  // Completed session for review
  const [completedSession, setCompletedSession] = useState<QuizSession | null>(null);

  // Preselected document when jumping to QCM generator
  const [preselectedDoc, setPreselectedDoc] = useState<DocumentSummary | null>(null);

  // Load all initial data from storage
  const loadAllData = () => {
    setSubjects(StorageService.getSubjects());
    setDocuments(StorageService.getDocuments());
    setQuestions(StorageService.getQuestions());
    setFlashcards(StorageService.getFlashcards());
    setStudyPlan(StorageService.getStudyPlan());
    setUserStats(StorageService.getUserStats());
    setQuizHistory(StorageService.getQuizHistory());
    setChatMessages(StorageService.getChatMessages());
  };

  useEffect(() => {
    loadAllData();
  }, []);

  if (!studyPlan || !userStats) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-mono">
        Chargement de la plateforme ASF Prépa Faso...
      </div>
    );
  }

  // Calculate days remaining to exam
  const examDate = new Date(studyPlan.examDate);
  const today = new Date();
  const diffTime = examDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Weak questions count
  const failedQuestions = questions.filter(
    (q) => q.timesAnswered > 0 && q.wasLastCorrect === false
  );

  // Handlers for Document actions
  const handleAddDocument = (newDoc: DocumentSummary) => {
    StorageService.addDocument(newDoc);
    setDocuments(StorageService.getDocuments());
  };

  const handleUpdateDocument = (updatedDoc: DocumentSummary) => {
    StorageService.updateDocument(updatedDoc);
    setDocuments(StorageService.getDocuments());
  };

  const handleDeleteDocument = (docId: string) => {
    if (window.confirm('Voulez-vous supprimer ce document et ses extraits ?')) {
      StorageService.deleteDocument(docId);
      setDocuments(StorageService.getDocuments());
    }
  };

  const handleGenerateQcmForDoc = (doc: DocumentSummary) => {
    setPreselectedDoc(doc);
    setActiveTab('qcm-generator');
  };

  const handleGenerateFlashcardForDoc = async (doc: DocumentSummary) => {
    try {
      const newCards = await ApiService.generateFlashcards({
        documentName: doc.name,
        documentContent: doc.chunks?.map((c) => c.content).join('\n') || doc.summary,
        subjectName: doc.subjectName,
        count: 6,
      });

      if (newCards.length > 0) {
        StorageService.addFlashcards(newCards);
        // Increment document flashcards count
        doc.flashcardsCount = (doc.flashcardsCount || 0) + newCards.length;
        StorageService.updateDocument(doc);
        loadAllData();
        setActiveTab('revisions');
      }
    } catch (err) {
      console.error('Error creating cards for doc:', err);
    }
  };

  // Handler when QCM are freshly generated
  const handleQuestionsGenerated = (newQuestions: Question[], mode: 'training' | 'exam') => {
    StorageService.addQuestions(newQuestions);
    setQuestions(StorageService.getQuestions());

    // Launch quiz session directly with the generated questions
    setActiveQuizSession({
      questions: newQuestions,
      title: `Session ${mode === 'exam' ? 'Examen' : 'Entraînement'} (${newQuestions.length} QCM)`,
      mode,
      timeLimitMinutes: Math.round(newQuestions.length * 1.5),
    });
  };

  // Launch a quiz with custom questions (e.g. from bank, errors, etc.)
  const handleStartQuizWithQuestions = (
    selectedQuestions: Question[],
    title = 'Séance d’entraînement',
    mode: 'training' | 'exam' | 'errors_review' | 'daily' = 'training'
  ) => {
    if (selectedQuestions.length === 0) return;
    setActiveQuizSession({
      questions: selectedQuestions,
      title,
      mode,
      timeLimitMinutes: Math.round(selectedQuestions.length * 1.5),
    });
  };

  // Finish quiz handler
  const handleFinishQuiz = (session: QuizSession) => {
    setActiveQuizSession(null);
    setCompletedSession(session);
    loadAllData();
  };

  // Start Quick Daily Session
  const handleStartDailySession = () => {
    // Pick 20 questions mixing subjects and prioritizing recent errors
    const errorsPool = questions.filter((q) => q.timesAnswered > 0 && q.wasLastCorrect === false);
    const regularPool = questions.filter((q) => !errorsPool.includes(q));

    const selected: Question[] = [];
    // Add up to 8 errors
    selected.push(...errorsPool.slice(0, 8));
    // Add up to 12 regular questions
    const remainingCount = 20 - selected.length;
    selected.push(...regularPool.slice(0, remainingCount));

    handleStartQuizWithQuestions(
      selected.length > 0 ? selected : questions.slice(0, 20),
      'Séance du Jour — Routine d’Excellence',
      'daily'
    );
  };

  // Launch Mock Exam from ExamensBlancsView
  const handleStartExam = (config: {
    questionCount: number;
    timeLimitMinutes: number;
    subjectIds: string[];
    difficulty: string;
    questions: Question[];
  }) => {
    setActiveQuizSession({
      questions: config.questions,
      title: `Examen Blanc Chronométré (${config.questionCount} QCM)`,
      mode: 'exam',
      timeLimitMinutes: config.timeLimitMinutes,
    });
  };

  // Ask coach to analyze errors
  const handleAskCoachAboutErrors = (session: QuizSession) => {
    setCompletedSession(null);
    setActiveTab('assistant');

    const promptText = `Coach, je viens d'obtenir ${session.score}/${session.totalQuestions} (${session.percentage.toFixed(1)} %) à mon épreuve "${session.title}". Mes points faibles détectés sont : ${session.weakTopicsDetected.join(', ')}. Peux-tu m'expliquer clairement mes erreurs et me donner les règles juridiques clés pour ne plus tomber dans ces pièges ?`;

    const userMsg: ChatMessage = {
      id: `msg-err-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMsgs = [...chatMessages, userMsg];
    setChatMessages(newMsgs);
    StorageService.saveChatMessages(newMsgs);

    // Call coach
    ApiService.chatWithCoach({
      message: promptText,
      conversationHistory: newMsgs.map((m) => ({ sender: m.sender, text: m.text })),
      weakTopics: userStats.weakTopics,
    }).then((res) => {
      const astMsg: ChatMessage = {
        id: `msg-ast-${Date.now()}`,
        sender: 'assistant',
        text: res.replyText,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        sources: res.sources,
        suggestedPrompts: res.suggestedPrompts,
      };
      const finalMsgs = [...newMsgs, astMsg];
      setChatMessages(finalMsgs);
      StorageService.saveChatMessages(finalMsgs);
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveQuizSession(null);
          setCompletedSession(null);
          setActiveTab(tab);
        }}
        daysRemaining={daysRemaining}
        weakCount={failedQuestions.length}
        onQuickQuiz={handleStartDailySession}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* If Active Quiz is Running */}
        {activeQuizSession ? (
          <QuizPlayerView
            questions={activeQuizSession.questions}
            title={activeQuizSession.title}
            mode={activeQuizSession.mode}
            timeLimitMinutes={activeQuizSession.timeLimitMinutes}
            onFinishQuiz={handleFinishQuiz}
            onExit={() => setActiveQuizSession(null)}
          />
        ) : completedSession ? (
          /* If Quiz Results are being reviewed */
          <QuizResultsView
            session={completedSession}
            onRetryFailed={(failedList) => {
              setCompletedSession(null);
              handleStartQuizWithQuestions(failedList, 'Rattrapage des erreurs', 'errors_review');
            }}
            onGoToDashboard={() => {
              setCompletedSession(null);
              setActiveTab('dashboard');
            }}
            onAskCoachAboutErrors={handleAskCoachAboutErrors}
          />
        ) : (
          /* Normal Tab Views */
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                stats={userStats}
                subjects={subjects}
                weakTopics={userStats.weakTopics}
                onStartQuiz={() => handleStartDailySession()}
                onStartExam={() => setActiveTab('examens-blancs')}
                onReviewErrors={() => setActiveTab('mes-erreurs')}
                onGoToTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'documents' && (
              <DocumentsView
                documents={documents}
                subjects={subjects}
                onAddDocument={handleAddDocument}
                onUpdateDocument={handleUpdateDocument}
                onDeleteDocument={handleDeleteDocument}
                onGenerateQcmForDoc={handleGenerateQcmForDoc}
                onGenerateFlashcardForDoc={handleGenerateFlashcardForDoc}
              />
            )}

            {activeTab === 'qcm-generator' && (
              <QcmGeneratorView
                subjects={subjects}
                documents={documents}
                preselectedDoc={preselectedDoc}
                onQuestionsGenerated={handleQuestionsGenerated}
              />
            )}

            {activeTab === 'question-bank' && (
              <QuestionBankView
                questions={questions}
                subjects={subjects}
                onStartQuizWithQuestions={(ql) => handleStartQuizWithQuestions(ql, 'Entraînement ciblé')}
                onUpdateQuestion={(q) => {
                  StorageService.updateQuestion(q);
                  setQuestions(StorageService.getQuestions());
                }}
                onDeleteQuestion={(id) => {
                  StorageService.deleteQuestion(id);
                  setQuestions(StorageService.getQuestions());
                }}
              />
            )}

            {activeTab === 'examens-blancs' && (
              <ExamensBlancsView
                subjects={subjects}
                allQuestions={questions}
                quizHistory={quizHistory}
                onStartExam={handleStartExam}
                onReviewPastExam={(session) => setCompletedSession(session)}
              />
            )}

            {activeTab === 'revisions' && (
              <RevisionsView
                flashcards={flashcards}
                subjects={subjects}
                onStartDailySession={handleStartDailySession}
                onUpdateFlashcard={(card) => {
                  StorageService.updateFlashcard(card);
                  setFlashcards(StorageService.getFlashcards());
                }}
              />
            )}

            {activeTab === 'mes-erreurs' && (
              <MesErreursView
                questions={questions}
                weakTopics={userStats.weakTopics}
                subjects={subjects}
                onStartTargetedQuiz={(errQuestions) =>
                  handleStartQuizWithQuestions(errQuestions, 'Session Ciblée — Mes Erreurs', 'errors_review')
                }
              />
            )}

            {activeTab === 'planning' && (
              <PlanningView
                studyPlan={studyPlan}
                subjects={subjects}
                onUpdateStudyPlan={(plan) => {
                  StorageService.saveStudyPlan(plan);
                  setStudyPlan(plan);
                }}
                onToggleTask={(taskId) => {
                  StorageService.toggleTask(taskId);
                  setStudyPlan(StorageService.getStudyPlan());
                }}
              />
            )}

            {activeTab === 'statistiques' && (
              <StatistiquesView
                stats={userStats}
                subjects={subjects}
                questions={questions}
              />
            )}

            {activeTab === 'assistant' && (
              <AssistantIaView
                messages={chatMessages}
                documents={documents}
                weakTopics={userStats.weakTopics}
                onSendMessage={(msg) => {
                  const updated = [...chatMessages, msg];
                  setChatMessages(updated);
                  StorageService.saveChatMessages(updated);
                }}
                onClearHistory={() => {
                  StorageService.saveChatMessages([]);
                  setChatMessages([]);
                }}
              />
            )}

            {activeTab === 'parametres' && (
              <ParametresView
                subjects={subjects}
                onAddSubject={(newSub) => {
                  StorageService.addSubject(newSub);
                  setSubjects(StorageService.getSubjects());
                }}
                onUpdateSubject={(sub) => {
                  StorageService.updateSubject(sub);
                  setSubjects(StorageService.getSubjects());
                }}
                onDeleteSubject={(id) => {
                  StorageService.deleteSubject(id);
                  setSubjects(StorageService.getSubjects());
                }}
                onDataReset={loadAllData}
              />
            )}
          </>
        )}
      </main>

      {/* Quiet Footer with Civil Service Motto & Burkinabè Flag Colors Accent */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" title="Rouge" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" title="Vert" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" title="Étoile jaune" />
            <span className="font-semibold text-slate-800">
              ASF Prépa Faso — Concours Professionnel Administrateur des Services Financiers
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Burkina Faso · Ministère de l'Économie et des Finances</span>
            <span aria-hidden="true">·</span>
            <span>UEMOA Harmonisé</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
