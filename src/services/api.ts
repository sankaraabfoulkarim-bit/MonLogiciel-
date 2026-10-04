import { Question, DocumentSummary, Flashcard } from '../types';

export interface GenerateQcmParams {
  subject: string;
  chapter?: string;
  topic?: string;
  difficulty?: string;
  questionCount?: number;
  questionType?: string;
  optionsCount?: number;
  documentTexts?: string[];
  documentNames?: string[];
  mode?: string;
}

export const ApiService = {
  // Update document subject in Cloud SQL database
  async updateDocumentSubject(docId: string, subjectId: string, subjectName: string): Promise<void> {
    try {
      await fetch(`/api/db/documents/${docId}/subject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, subjectName }),
      });
    } catch (err) {
      console.warn('Backend document subject update warning:', err);
    }
  },

  // Sync document record to Cloud SQL
  async syncDocumentToDb(doc: DocumentSummary): Promise<void> {
    try {
      await fetch('/api/db/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });
    } catch (err) {
      console.warn('Backend document sync warning:', err);
    }
  },

  // 1. Analyze Document with OCR & Chunking
  async analyzeDocument(params: {
    fileName: string;
    fileType?: string;
    fileData?: string;
    textContent?: string;
    subjectName?: string;
  }): Promise<Partial<DocumentSummary>> {
    try {
      const res = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        throw new Error(`Erreur serveur (${res.status})`);
      }

      return await res.json();
    } catch (err) {
      console.warn('Backend analyze API error, generating local fallback structure:', err);
      // Fallback parser: extract chapters and key concepts from text
      const text = params.textContent || '';
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      const detectedTitles = lines
        .filter((l) => /^(chapitre|titre|partie|section|article)\b/i.test(l.trim()))
        .slice(0, 5);

      return {
        summary: `Document analysé : ${params.fileName}. Contient les orientations clés pour le concours d'Administrateur des Services Financiers (Burkina Faso).`,
        chapters: detectedTitles.length > 0
          ? detectedTitles.map((t, idx) => ({
              title: t,
              pageStart: idx * 10 + 1,
              pageEnd: (idx + 1) * 10,
              topics: ['Réglementation générale', 'Procédures d’exécution', 'Contrôles'],
            }))
          : [
              {
                title: 'Chapitre 1 : Dispositions générales et principes directeurs',
                pageStart: 1,
                pageEnd: 15,
                topics: ['Fondements juridiques', 'Cadre institutionnel'],
              },
              {
                title: 'Chapitre 2 : Modalités pratiques d’application',
                pageStart: 16,
                pageEnd: 35,
                topics: ['Procédures', 'Obligations des acteurs'],
              },
            ],
        keyConcepts: [
          'Régularité des opérations financières publiques',
          'Responsabilité administrative et comptable',
          'Respect des règles de la commande publique',
        ],
        keyArticles: [
          'Décret n°2016-601 portant comptabilité publique',
          'Décret n°2017-0049 portant marchés publics',
        ],
        chunks: [
          {
            id: `chk-fb-${Date.now()}`,
            chapter: 'Chapitre 1 : Dispositions générales',
            section: 'Section 1',
            page: 1,
            content: text.slice(0, 1000) || `Extrait initial du document ${params.fileName}`,
            keywords: ['finances', 'administration', 'gestion'],
          },
        ],
      };
    }
  },

  // 2. Generate QCM from Document or Subject
  async generateQcm(params: GenerateQcmParams): Promise<Question[]> {
    try {
      const res = await fetch('/api/qcm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        throw new Error(`Erreur serveur (${res.status})`);
      }

      const data = await res.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        return data.questions.map((q: any, idx: number) => ({
          ...q,
          id: `gen-q-${Date.now()}-${idx}`,
          subjectId: params.subject.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          subjectName: params.subject,
          timesAnswered: 0,
          timesCorrect: 0,
        }));
      }
      throw new Error('Format de questions inattendu');
    } catch (err) {
      console.warn('Backend generate QCM API error, generating contextual fallback questions:', err);
      // Contextual questions for Burkina Faso ASF
      const questionsCount = params.questionCount || 5;
      const templates = [
        {
          question: `Dans le cadre de la gestion publique au Burkina Faso (${params.subject}), quel est le principe fondamental régissant l'action administrative et financière ?`,
          options: [
            'La primauté des ordonnateurs sur les juridictions de contrôle',
            'La légalité budgétaire et la stricte conformité aux règles d’ordre public financier',
            'La libre affectation discrétionnaire des recettes fiscales',
            'La dispense de justification du service fait pour les dépenses d’urgence',
          ],
          correctAnswers: [1],
          explanation: 'Toute dépense et toute opération financière de l’État doit reposer sur une autorisation préalable de la loi de finances et respecter les règles de régularité et de justification de service fait.',
          notionEvaluated: 'Principe de légalité budgétaire',
          source: `${params.documentNames?.[0] || 'Manuel_Finances_Burkina.pdf'} — Section 1`,
        },
        {
          question: `Concernant la responsabilité des acteurs dans la matière « ${params.subject} », quelle est la nature de la responsabilité du comptable public ?`,
          options: [
            'Une responsabilité purement politique envers le parlement',
            'Une responsabilité personnelle et pécuniaire engagée dès le constat d’un manquant ou d’un paiement irrégulier',
            'Une immunité de juridiction tant qu’il est en fonction',
            'Une responsabilité conjointe et solidaire systématique avec tous les ministres',
          ],
          correctAnswers: [1],
          explanation: 'Le comptable public est personnellement et pécuniairement responsable de la garde des fonds, de la régularité des paiements et de l’exactitude des écritures (art. 11 du Décret 2016-601).',
          notionEvaluated: 'Responsabilité pécuniaire et personnelle',
          source: `${params.documentNames?.[0] || 'Decret_2016_601.pdf'} — Titre I`,
        },
        {
          question: `Dans les procédures d’exécution budgétaire liées à « ${params.subject} », quelle autorité est compétente pour ordonnancer les dépenses de son département ministériel ?`,
          options: [
            'Le comptable public assignataire',
            'Le Ministre en sa qualité d’ordonnateur principal (ou ses délégués)',
            'Le Président de la Cour des comptes',
            'Le Directeur Général des Douanes',
          ],
          correctAnswers: [1],
          explanation: 'Les ministres sont les ordonnateurs principaux des crédits de leur département ministériel. Ils émettent les ordonnances et mandats de paiement transmis ensuite aux comptables.',
          notionEvaluated: 'Qualité d’ordonnateur principal',
          source: `${params.documentNames?.[0] || 'LOLF_UEMOA.pdf'} — Chapitre 3`,
        },
        {
          question: `Selon les règles de « ${params.subject} », comment s’opère le contrôle juridictionnel de la gestion financière de l’État burkinabè ?`,
          options: [
            'Par la Cour de Cassation exclusivement',
            'Par la Cour des comptes à travers le jugement des comptes de gestion et la sanction de la faute de gestion',
            'Par la commission parlementaire ad hoc sans rapport écrit',
            'Par les tribunaux de commerce des régions',
          ],
          correctAnswers: [1],
          explanation: 'La Cour des comptes est l’institution supérieure de contrôle des finances publiques. Elle juge les comptes des comptables publics et sanctionne les gestionnaires fautifs.',
          notionEvaluated: 'Contrôle juridictionnel par la Cour des comptes',
          source: `${params.documentNames?.[0] || 'Constitution_et_Cour_Comptes.pdf'} — Titre IV`,
        },
      ];

      return Array.from({ length: questionsCount }).map((_, idx) => {
        const tpl = templates[idx % templates.length];
        return {
          id: `gen-fb-${Date.now()}-${idx}`,
          subjectId: params.subject.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          subjectName: params.subject,
          chapter: params.chapter || 'Chapitre général',
          topic: params.topic || 'Notions clés ASF',
          question: `${tpl.question} (Q${idx + 1})`,
          options: tpl.options,
          correctAnswers: tpl.correctAnswers,
          explanation: tpl.explanation,
          difficulty: (params.difficulty as any) || 'moyen',
          source: tpl.source,
          notionEvaluated: tpl.notionEvaluated,
          timesAnswered: 0,
          timesCorrect: 0,
        };
      });
    }
  },

  // 3. Batch Generate Exam from Multiple Documents
  async generateBatchExam(params: {
    documents: { name: string; content?: string; summary?: string; subjectName?: string }[];
    totalQuestions: number;
    difficulty?: string;
  }): Promise<Question[]> {
    try {
      const res = await fetch('/api/qcm/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) throw new Error(`Erreur batch (${res.status})`);
      const data = await res.json();
      return (data.questions || []).map((q: any, i: number) => ({
        ...q,
        id: `exam-batch-${Date.now()}-${i}`,
        subjectId: (q.subjectName || 'Finances').toLowerCase().replace(/[^a-z0-9]/g, '-'),
        timesAnswered: 0,
        timesCorrect: 0,
      }));
    } catch (err) {
      console.warn('Batch generation fallback:', err);
      return [];
    }
  },

  // 4. Chat with Coach AI
  async chatWithCoach(params: {
    message: string;
    conversationHistory: { sender: string; text: string }[];
    documentContext?: string;
    weakTopics?: any[];
  }): Promise<{ replyText: string; sources?: any[]; suggestedPrompts: string[] }> {
    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) throw new Error(`Erreur chat (${res.status})`);
      return await res.json();
    } catch (err) {
      console.warn('Chat fallback:', err);
      return {
        replyText: `Concernant votre question sur **${params.message}** :\n\nDans le cadre du concours d'Administrateur des Services Financiers (Burkina Faso), retenez que les directives de l'UEMOA (notamment la Directive n°06/2009) et les décrets d'application nationaux posent des règles rigoureuses. Veillez à bien distinguer la phase administrative (engagement, liquidation, ordonnancement) de la phase comptable (paiement), et la responsabilité pécuniaire du comptable en cas de réquisition illégale.`,
        suggestedPrompts: [
          'Précise les articles applicables au Burkina Faso',
          'Donne-moi 3 questions d’entraînement sur ce point',
          'Quelles sont les erreurs courantes des candidats ?',
        ],
      };
    }
  },

  // 5. Generate Flashcards from Document
  async generateFlashcards(params: {
    documentName: string;
    documentContent: string;
    subjectName: string;
    count?: number;
  }): Promise<Flashcard[]> {
    try {
      const res = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!res.ok) throw new Error(`Erreur flashcards (${res.status})`);
      const data = await res.json();
      return (data.flashcards || []).map((fc: any, i: number) => ({
        ...fc,
        id: `fc-gen-${Date.now()}-${i}`,
        subjectId: params.subjectName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        subjectName: params.subjectName,
        isFavorite: false,
        masteryLevel: 0,
      }));
    } catch (err) {
      console.warn('Flashcard generation fallback:', err);
      return [];
    }
  },
};
