import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  BookOpen,
  Bot,
  User,
  Quote,
  HelpCircle,
  BrainCircuit,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { ChatMessage, DocumentSummary, WeakTopic } from '../types';
import { ApiService } from '../services/api';

interface AssistantIaViewProps {
  messages: ChatMessage[];
  documents: DocumentSummary[];
  weakTopics: WeakTopic[];
  onSendMessage: (msg: ChatMessage) => void;
  onClearHistory: () => void;
}

export const AssistantIaView: React.FC<AssistantIaViewProps> = ({
  messages,
  documents,
  weakTopics,
  onSendMessage,
  onClearHistory,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Explique-moi le principe d’annualité budgétaire et la journée complémentaire',
    'Donne-moi 5 questions pièges sur la loi de finances et la LOLF',
    'Quels sont les 4 cas où le comptable DOIT refuser d’obtempérer à la réquisition ?',
    'Donne-moi un cas pratique de passation de marchés publics au Burkina Faso',
    'Fais-moi réviser les notions où mes résultats sont faibles',
    'Explique la différence entre matière durable et matière consomptible',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    setInputText('');

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    onSendMessage(userMsg);
    setIsLoading(true);

    try {
      // Aggregate document context
      const docContext = documents
        .map((d) => `Document: ${d.name}\n${d.summary}\n${d.chunks?.map((c) => c.content).join('\n') || ''}`)
        .join('\n\n')
        .slice(0, 30000);

      const response = await ApiService.chatWithCoach({
        message: query,
        conversationHistory: messages.map((m) => ({ sender: m.sender, text: m.text })),
        documentContext: docContext,
        weakTopics: weakTopics.map((w) => ({
          topic: w.topic,
          subjectName: w.subjectName,
          masteryPercent: w.masteryPercent,
        })),
      });

      const assistantMsg: ChatMessage = {
        id: `msg-ast-${Date.now()}`,
        sender: 'assistant',
        text: response.replyText,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        sources: response.sources,
        suggestedPrompts: response.suggestedPrompts,
      };

      onSendMessage(assistantMsg);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'assistant',
        text: 'Une erreur de communication est survenue. Veuillez vérifier votre connexion ou reformuler votre question.',
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      onSendMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4 h-[calc(100vh-5rem)] flex flex-col">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-900 text-amber-400 flex items-center justify-center font-bold text-sm shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-base font-bold font-serif text-slate-900">
              Coach Spécialisé ASF Burkina Faso
            </h1>
            <p className="text-xs text-slate-500">
              Assistance juridique, financière, explications d'erreurs et interrogation continue.
            </p>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Effacer l'historique</span>
        </button>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="shrink-0 flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 whitespace-nowrap transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 overflow-y-auto space-y-4 shadow-xs">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs sm:text-sm ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-emerald-900 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 space-y-2.5 ${
                  isUser
                    ? 'bg-slate-900 text-white rounded-tr-xs'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-line leading-relaxed font-serif">
                  {msg.text}
                </div>

                {/* Sources quotes if any */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 text-xs space-y-1">
                    <span className="font-semibold text-emerald-900 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Source(s) documentaire(s) :</span>
                    </span>
                    {msg.sources.map((src, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border border-slate-200 text-[11px] italic text-slate-600">
                        « {src.excerpt} » — <strong className="font-mono">{src.documentName}</strong> {src.page ? `(p. ${src.page})` : ''}
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested follow-up prompts */}
                {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {msg.suggestedPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(p)}
                        className="text-[11px] text-emerald-800 bg-white border border-emerald-200 hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}

                <div className={`text-[10px] font-mono text-right ${isUser ? 'text-slate-400' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 text-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-900 text-amber-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 animate-spin" />
              <span>Le coach analyse les textes applicables et formule sa réponse...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2 shadow-xs shrink-0"
      >
        <input
          type="text"
          placeholder="Posez votre question sur les finances publiques, demandez un cas pratique ou un résumé..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
          className="flex-1 px-3 py-2 text-xs sm:text-sm focus:outline-none"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1.5 shadow-xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Envoyer</span>
        </button>
      </form>
    </div>
  );
};
