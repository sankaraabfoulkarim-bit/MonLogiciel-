import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (linked to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Subjects table
export const subjects = pgTable('subjects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  color: text('color').default('#0284C7'),
  weight: integer('weight').default(3),
  isActive: boolean('is_active').default(true),
});

// Documents table
export const documents = pgTable('documents', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  name: text('name').notNull(),
  subjectId: text('subject_id').notNull(),
  subjectName: text('subject_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  pagesCount: integer('pages_count').notNull(),
  summary: text('summary'),
  status: text('status').notNull().default('ready'),
  uploadDate: text('upload_date'),
  chaptersJson: text('chapters_json'),
  keyConceptsJson: text('key_concepts_json'),
  keyArticlesJson: text('key_articles_json'),
  chunksJson: text('chunks_json'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Questions table
export const questions = pgTable('questions', {
  id: text('id').primaryKey(),
  subjectId: text('subject_id').notNull(),
  subjectName: text('subject_name').notNull(),
  chapter: text('chapter'),
  topic: text('topic'),
  question: text('question').notNull(),
  optionsJson: text('options_json').notNull(),
  correctAnswersJson: text('correct_answers_json').notNull(),
  explanation: text('explanation').notNull(),
  difficulty: text('difficulty').notNull().default('moyen'),
  source: text('source'),
  sourceQuote: text('source_quote'),
  pageNumber: integer('page_number'),
  notionEvaluated: text('notion_evaluated'),
  trapWarning: text('trap_warning'),
  timesAnswered: integer('times_answered').default(0),
  timesCorrect: integer('times_correct').default(0),
  isFavorite: boolean('is_favorite').default(false),
  documentId: text('document_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Quiz & Exam Sessions table
export const quizSessions = pgTable('quiz_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.uid),
  title: text('title').notNull(),
  mode: text('mode').notNull().default('training'),
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  percentage: integer('percentage').notNull(),
  timeSpentSeconds: integer('time_spent_seconds').notNull(),
  startedAt: text('started_at'),
  completedAt: text('completed_at'),
  weakTopicsJson: text('weak_topics_json'),
  answersJson: text('answers_json'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  quizSessions: many(quizSessions),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.uid],
  }),
}));

export const quizSessionsRelations = relations(quizSessions, ({ one }) => ({
  user: one(users, {
    fields: [quizSessions.userId],
    references: [users.uid],
  }),
}));
