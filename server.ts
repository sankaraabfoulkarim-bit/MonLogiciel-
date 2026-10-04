import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Shared Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

import { db } from './src/db/index.ts';
import { documents as documentsTable, questions as questionsTable, quizSessions as quizSessionsTable, users as usersTable } from './src/db/schema.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { eq } from 'drizzle-orm';

// Helper for error responses
const handleApiError = (res: Response, error: unknown, fallbackMessage: string) => {
  console.error(fallbackMessage, error);
  const message = error instanceof Error ? error.message : String(error);
  return res.status(500).json({ error: fallbackMessage, details: message });
};

// 0. Cloud SQL Database Endpoints
// Sync or create user
app.post('/api/auth/sync-user', async (req: Request, res: Response) => {
  try {
    const { uid, email, displayName } = req.body;
    if (!uid || !email) {
      return res.status(400).json({ error: 'UID et email requis' });
    }
    const user = await getOrCreateUser(uid, email, displayName);
    return res.json({ user });
  } catch (error) {
    return handleApiError(res, error, "Erreur lors de la synchronisation de l'utilisateur en base de données");
  }
});

// Update document subject (e.g. on Drag & Drop)
app.patch('/api/db/documents/:id/subject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subjectId, subjectName } = req.body;
    if (!subjectId || !subjectName) {
      return res.status(400).json({ error: 'subjectId et subjectName requis' });
    }

    const updated = await db
      .update(documentsTable)
      .set({ subjectId, subjectName })
      .where(eq(documentsTable.id, id))
      .returning();

    return res.json({ success: true, document: updated[0] });
  } catch (error) {
    return handleApiError(res, error, "Erreur lors du déplacement du document dans la base de données");
  }
});

// Sync/Save document to Cloud SQL
app.post('/api/db/documents', async (req: Request, res: Response) => {
  try {
    const doc = req.body;
    if (!doc.id || !doc.name || !doc.subjectId) {
      return res.status(400).json({ error: 'Données document incomplètes' });
    }

    await db
      .insert(documentsTable)
      .values({
        id: doc.id,
        name: doc.name,
        subjectId: doc.subjectId,
        subjectName: doc.subjectName || 'Général',
        fileType: doc.fileType || 'application/pdf',
        fileSize: Number(doc.fileSize) || 0,
        pagesCount: Number(doc.pagesCount) || 1,
        summary: doc.summary || null,
        status: doc.status || 'ready',
        uploadDate: doc.uploadDate || new Date().toISOString().split('T')[0],
        chaptersJson: doc.chapters ? JSON.stringify(doc.chapters) : null,
        keyConceptsJson: doc.keyConcepts ? JSON.stringify(doc.keyConcepts) : null,
        keyArticlesJson: doc.keyArticles ? JSON.stringify(doc.keyArticles) : null,
        chunksJson: doc.chunks ? JSON.stringify(doc.chunks) : null,
      })
      .onConflictDoUpdate({
        target: documentsTable.id,
        set: {
          subjectId: doc.subjectId,
          subjectName: doc.subjectName || 'Général',
          summary: doc.summary || null,
        },
      });

    return res.json({ success: true });
  } catch (error) {
    return handleApiError(res, error, "Erreur lors de l'enregistrement du document en base");
  }
});

// 1. Analyze Document (OCR, Chapters, Topics, Legal Articles, Key Concepts)
app.post('/api/documents/analyze', async (req: Request, res: Response) => {
  try {
    const { fileName, fileType, fileData, textContent, subjectName } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'Le nom du fichier est requis.' });
    }

    const promptText = `
Tu es un expert supérieur des finances publiques et du concours d'Administrateur des Services Financiers (ASF) au Burkina Faso.
Analyse en profondeur ce document intitulé "${fileName}" (Matière : ${subjectName || 'Non spécifiée'}).

Extrais et structure :
1. Un résumé synthétique et substantiel du document (5 à 8 phrases).
2. La liste des chapitres/titres identifiés avec leurs sous-thèmes.
3. Les notions clés et définitions essentielles.
4. Les articles de lois, décrets, directives (UEMOA ou Burkina Faso) mentionnés ou applicables.
5. Des extraits significatifs (chunks) pour la recherche documentaire RAG, chacun avec le chapitre, la section, le numéro de page approximatif ou repéré, le texte fidèle et 3-5 mots-clés.

Réponds STRICTEMENT sous forme de JSON valide correspondant à la structure demandée.
`;

    const parts: any[] = [];

    // If base64 file data is sent (PDF, image scan)
    if (fileData && typeof fileData === 'string') {
      const mime = fileType || (fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
      parts.push({
        inlineData: {
          mimeType: mime,
          data: fileData.replace(/^data:[^;]+;base64,/, ''),
        },
      });
    }

    // Text content if provided
    if (textContent && typeof textContent === 'string' && textContent.trim()) {
      parts.push({
        text: `Texte extrait du document :\n\n${textContent.slice(0, 50000)}`,
      });
    }

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            pagesEstimated: { type: Type.INTEGER },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  pageStart: { type: Type.INTEGER },
                  pageEnd: { type: Type.INTEGER },
                  topics: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['title', 'topics'],
              },
            },
            keyConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            keyArticles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            chunks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  chapter: { type: Type.STRING },
                  section: { type: Type.STRING },
                  page: { type: Type.INTEGER },
                  content: { type: Type.STRING },
                  keywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['chapter', 'content'],
              },
            },
          },
          required: ['summary', 'chapters', 'keyConcepts', 'keyArticles', 'chunks'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error) {
    return handleApiError(res, error, "Erreur lors de l'analyse du document");
  }
});

// 2. Generate QCM with Source Traceability & Validation
app.post('/api/qcm/generate', async (req: Request, res: Response) => {
  try {
    const {
      subject,
      chapter,
      topic,
      difficulty = 'moyen',
      questionCount = 10,
      questionType = 'melange',
      optionsCount = 4,
      documentTexts = [],
      documentNames = [],
      mode = 'document_grounded',
    } = req.body;

    const count = Math.min(Math.max(Number(questionCount) || 5, 1), 30);
    const optsCount = Math.min(Math.max(Number(optionsCount) || 4, 3), 5);

    const docContext = documentTexts && documentTexts.length > 0
      ? `DOCUMENTS DE RÉFÉRENCE FOURNIS :\n${documentTexts.map((txt: string, idx: number) => `--- Document: ${documentNames[idx] || `Doc ${idx + 1}`} ---\n${txt.slice(0, 30000)}`).join('\n\n')}`
      : 'Aucun document spécifique fourni. Fonde-toi sur le programme officiel du concours d’Administrateur des Services Financiers au Burkina Faso (Directives UEMOA, Décret 2016-601, Décret 2017-0049 sur les marchés publics, LOLF, Code des impôts).';

    const systemPrompt = `
Tu es un examinateur expert et concepteur d'épreuves pour le Concours Professionnel d’Administrateur des Services Financiers (ASF) au Burkina Faso.
Ta mission est de générer exactement ${count} questions de type QCM de très haute qualité, rigoureusement vérifiées et formulées au niveau concours professionnel.

PARAMÈTRES EXIGÉS :
- Matière : ${subject || 'Finances publiques / Comptabilité publique'}
- Chapitre ciblé : ${chapter || 'Tous chapitres'}
- Thème spécifique : ${topic || 'Général'}
- Niveau de difficulté : ${difficulty} (facile, moyen, difficile, expert)
- Type de questions : ${questionType} (compréhension, mémorisation, application, cas pratique, pièges de concours, mélange)
- Nombre de propositions par question : ${optsCount} propositions (lettrées implicitement 0 à ${optsCount - 1})
- Mode : ${mode}

RÈGLES DE CONCEPTION STRICTES :
1. Chaque question doit évaluer une notion juridique, financière, comptable ou administrative précise.
2. Éviter toute ambiguïté ou information inventée.
3. Chaque question doit comporter une explication détaillée expliquant pour chaque option pourquoi elle est vraie ou fausse.
4. Traçabilité impérative : spécifier la "source" (ex: "${documentNames[0] || 'Directives_Finances_Publiques_UEMOA.pdf'} — Chapitre 2 — Page 18") et une citation textuelle ("sourceQuote") vérifiable.
5. Indiquer clairement la notion évaluée ("notionEvaluated") et signaler les pièges fréquents ("trapWarning") s'il y a lieu.
6. Le tableau "correctAnswers" doit contenir les index (0, 1, 2...) de la ou des bonnes réponses.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        { text: systemPrompt },
        { text: docContext },
        { text: `Génère maintenant les ${count} QCM au format JSON strict.` },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctAnswers: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
              },
              explanation: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              chapter: { type: Type.STRING },
              topic: { type: Type.STRING },
              source: { type: Type.STRING },
              sourceQuote: { type: Type.STRING },
              pageNumber: { type: Type.INTEGER },
              notionEvaluated: { type: Type.STRING },
              trapWarning: { type: Type.STRING },
            },
            required: [
              'question',
              'options',
              'correctAnswers',
              'explanation',
              'difficulty',
              'source',
              'notionEvaluated',
            ],
          },
        },
      },
    });

    const questions = JSON.parse(response.text || '[]');
    return res.json({ questions });
  } catch (error) {
    return handleApiError(res, error, 'Erreur lors de la génération des QCM');
  }
});

// 3. Batch Generation for Mock Exam from Multiple Documents
app.post('/api/qcm/batch-generate', async (req: Request, res: Response) => {
  try {
    const { documents = [], totalQuestions = 20, difficulty = 'moyen' } = req.body;

    const count = Math.min(Math.max(Number(totalQuestions) || 20, 5), 50);

    const docContext = documents
      .map((d: any, idx: number) => `Document [${idx + 1}] (${d.subjectName || 'Général'}): ${d.name}\n${(d.content || d.summary || '').slice(0, 15000)}`)
      .join('\n\n---\n\n');

    const prompt = `
Tu conçois un examen blanc complet pour le concours d'Administrateur des Services Financiers (Burkina Faso).
Génère un lot équilibré de ${count} QCM représentatifs répartis judicieusement entre les matières et documents ci-dessous.

Documents sources :
${docContext}

Niveau général : ${difficulty}
Exigences :
- 4 propositions par question
- 1 seule bonne réponse (index dans correctAnswers)
- Explication complète avec référence juridique (articles de lois, décrets, directives UEMOA)
- Mention de la source exacte et notion évaluée.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              subjectName: { type: Type.STRING },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctAnswers: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
              },
              explanation: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              chapter: { type: Type.STRING },
              topic: { type: Type.STRING },
              source: { type: Type.STRING },
              sourceQuote: { type: Type.STRING },
              pageNumber: { type: Type.INTEGER },
              notionEvaluated: { type: Type.STRING },
            },
            required: ['subjectName', 'question', 'options', 'correctAnswers', 'explanation', 'source', 'notionEvaluated'],
          },
        },
      },
    });

    const questions = JSON.parse(response.text || '[]');
    return res.json({ questions });
  } catch (error) {
    return handleApiError(res, error, "Erreur lors de la génération par lot d'examen");
  }
});

// 4. AI Specialized Coach Chat
app.post('/api/assistant/chat', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory = [], documentContext = '', weakTopics = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message requis.' });
    }

    const weakTopicsText = weakTopics && weakTopics.length > 0
      ? `Points faibles actuels du candidat : ${weakTopics.map((w: any) => `${w.topic} (${w.subjectName}: ${w.masteryPercent}% maîtrise)`).join(', ')}`
      : 'Aucun point faible critique signalé.';

    const systemInstruction = `
Tu es le Coach d'Élite pour la préparation au Concours Professionnel d'Administrateur des Services Financiers (ASF) au Burkina Faso.
Tu as une maîtrise parfaite du droit financier burkinabè, des directives du cadre harmonisé des finances publiques de l'UEMOA (LOLF, Décret n°2016-601 sur la comptabilité publique, Décret n°2017-0049 sur la commande publique, régime de la comptabilité des matières, Code Général des Impôts, attributions de la DGTCP, DGB, DGI, DGD et de la Cour des comptes).

COMPORTEMENT & STYLE :
- Sois rigoureux, bienveillant, pédagogique et stimulant.
- Fournis des réponses structurées avec les bases juridiques exactes (articles, décrets, directives).
- Priorise toujours les documents fournis par le candidat lorsqu'ils contiennent la réponse.
- Si le candidat pose une question sur une notion qu'il maîtrise mal (${weakTopicsText}), adapte ton explication avec un exemple concret et propose un court exercice d'application.
- Propose à la fin 2 ou 3 questions de relance percutantes pour tester immédiatement sa compréhension.
`;

    const chatParts: any[] = [];
    chatParts.push({ text: systemInstruction });

    if (documentContext) {
      chatParts.push({
        text: `EXTRAITS DE COURS / DOCUMENTS DU CANDIDAT :\n${documentContext.slice(0, 25000)}`,
      });
    }

    // Include recent history
    for (const msg of conversationHistory.slice(-6)) {
      chatParts.push({
        text: `${msg.sender === 'user' ? 'Candidat' : 'Coach ASF'} : ${msg.text}`,
      });
    }

    chatParts.push({ text: `Candidat : ${message}` });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatParts,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replyText: { type: Type.STRING },
            sources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  documentName: { type: Type.STRING },
                  page: { type: Type.INTEGER },
                  excerpt: { type: Type.STRING },
                },
                required: ['documentName', 'excerpt'],
              },
            },
            suggestedPrompts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['replyText', 'suggestedPrompts'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return res.json(result);
  } catch (error) {
    return handleApiError(res, error, "Erreur lors de l'interaction avec le coach IA");
  }
});

// 5. Generate Flashcards from Document
app.post('/api/flashcards/generate', async (req: Request, res: Response) => {
  try {
    const { documentName, documentContent, subjectName, count = 6 } = req.body;

    const prompt = `
À partir du document suivant pour le concours ASF au Burkina Faso :
Titre : ${documentName || 'Document de cours'}
Matière : ${subjectName || 'Finances publiques'}

Contenu :
${(documentContent || '').slice(0, 30000)}

Génère exactement ${count} fiches de révision (flashcards) à fort rendement pédagogique.
Chaque fiche doit cibler l'une de ces catégories :
- 'definition' : définition juridique ou financière clé
- 'concept' : principe fondamental
- 'tableau' : tableau comparatif ou distinction binaire
- 'date_chiffre' : pourcentage, seuil, délai, date limite légale
- 'regle' : règle de gestion stricte
- 'article' : article de loi ou décret déterminant
- 'piege' : piège classique de concours

Fournis une question/intitulé au recto ("front") et une réponse synthétique et percutante au verso ("back"), avec la référence légale ("legalReference") et la source.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              front: { type: Type.STRING },
              back: { type: Type.STRING },
              legalReference: { type: Type.STRING },
              source: { type: Type.STRING },
            },
            required: ['title', 'category', 'front', 'back'],
          },
        },
      },
    });

    const flashcards = JSON.parse(response.text || '[]');
    return res.json({ flashcards });
  } catch (error) {
    return handleApiError(res, error, 'Erreur lors de la génération des fiches');
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`ASF Prépa Faso server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
