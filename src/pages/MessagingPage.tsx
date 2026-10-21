import React, { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  CheckCheck,
  Flag,
  MessageSquare,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  createSafetyReport,
  getConversationMessages,
  getUserConversations,
  sendMessageInConversation,
} from '../services/erikalogService';
import { SeoHead } from '../components/SeoHead';
import type { Conversation, Message } from '../types/database';

export const MessagingPage: React.FC = () => {
  const { user, refreshState, showToast } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvParam = searchParams.get('conversation');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(activeConvParam);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    const list = getUserConversations(user);
    setConversations(list);
    if (activeConvParam && list.some((c) => c.id === activeConvParam)) {
      setSelectedConvId(activeConvParam);
    } else if (!selectedConvId && list.length > 0) {
      setSelectedConvId(list[0].id);
    }
  }, [user, activeConvParam, selectedConvId]);

  useEffect(() => {
    if (!user || !selectedConvId) {
      setMessages([]);
      return;
    }
    try {
      const msgs = getConversationMessages(user, selectedConvId);
      setMessages(msgs);
      refreshState();
    } catch {
      setMessages([]);
    }
  }, [user, selectedConvId, refreshState]);

  if (!user) {
    return <Navigate to="/connexion?redirect=/messagerie" replace />;
  }

  const activeConversation = conversations.find((c) => c.id === selectedConvId) || null;
  const otherParticipant = activeConversation
    ? user.id === activeConversation.student_id
      ? activeConversation.advertiser
      : activeConversation.student
    : null;

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !replyText.trim()) return;
    try {
      setSending(true);
      await sendMessageInConversation(user, selectedConvId, replyText);
      setReplyText('');
      const updatedMsgs = getConversationMessages(user, selectedConvId);
      setMessages(updatedMsgs);
      setConversations(getUserConversations(user));
      refreshState();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur d’envoi', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleReportConversation = async () => {
    if (!activeConversation) return;
    await createSafetyReport(user, {
      target_type: 'conversation',
      target_conversation_id: activeConversation.id,
      target_user_id: otherParticipant?.id || null,
      reason_category: 'inappropriate_behavior',
      description: `Signalement de la conversation "${activeConversation.subject}" par ${user.full_name}.`,
    });
    showToast(
      'Conversation signalée à l’équipe de modération ErikaLog.',
      'info'
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <SeoHead
        title="Messagerie Privée Sécurisée | ErikaLog"
        description="Échangez en direct avec les propriétaires, agences immobilières et étudiants sur ErikaLog."
        canonicalPath="/messagerie"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-sage-700">
            Échanges confidentiels (RLS PostgreSQL)
          </span>
          <h1 className="text-2xl font-extrabold text-navy-950">Messagerie privée ErikaLog</h1>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sage-50 border border-sage-200 text-xs text-sage-900">
          <ShieldCheck className="w-4 h-4 text-sage-600" />
          <span>Vos conversations sont privées et réservées aux participants</span>
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-navy-950">Aucune conversation active</h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            {user.role === 'student'
              ? 'Consultez une fiche logement et cliquez sur « Envoyer un message » pour démarrer une discussion directe avec un propriétaire ou une agence.'
              : 'Vous recevrez ici tous les messages envoyés par les étudiants intéressés par vos logements publiés.'}
          </p>
          <Link
            to="/recherche"
            className="inline-block px-5 py-2.5 rounded-xl bg-navy-900 text-white text-xs font-semibold"
          >
            Parcourir les logements
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[580px]">
          
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Mes conversations ({conversations.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-100 overflow-y-auto max-h-[520px]">
              {conversations.map((conv) => {
                const partner =
                  user.id === conv.student_id ? conv.advertiser : conv.student;
                const isSelected = conv.id === selectedConvId;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => {
                      setSelectedConvId(conv.id);
                      setSearchParams({ conversation: conv.id });
                    }}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 ${
                      isSelected ? 'bg-sage-50/90' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-navy-900 text-sage-300 font-bold flex items-center justify-center shrink-0">
                      {partner?.full_name?.charAt(0) || 'E'}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-navy-950 truncate">
                          {partner?.full_name || 'Utilisateur ErikaLog'}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(conv.last_message_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {conv.property && (
                        <p className="text-[11px] font-semibold text-sage-700 truncate">
                          {conv.property.title}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 truncate">
                        {conv.last_message_preview || 'Nouvelle discussion'}
                      </p>
                    </div>
                    {(conv.unread_count || 0) > 0 && (
                      <span className="w-5 h-5 rounded-full bg-sage-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          
          <div className="lg:col-span-8 flex flex-col justify-between">
            {activeConversation ? (
              <>
                
                <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-navy-950">
                        {otherParticipant?.full_name}
                      </h2>
                      <span className="px-2 py-0.5 rounded bg-navy-100 text-navy-800 text-[10px] font-bold uppercase">
                        {otherParticipant?.role === 'student' ? 'Étudiant' : 'Annonceur'}
                      </span>
                    </div>
                    {activeConversation.property && (
                      <Link
                        to={`/logement/${activeConversation.property.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-sage-700 hover:underline"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>
                          {activeConversation.property.title} (
                          {activeConversation.property.rent_including_charges} €/mois CC)
                        </span>
                      </Link>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleReportConversation}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 text-xs font-medium text-slate-600"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Signaler</span>
                  </button>
                </div>

                
                <div className="p-5 space-y-4 overflow-y-auto max-h-[380px] flex-1 bg-cream-50/50">
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-lg rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-sm ${
                            isMine
                              ? 'bg-navy-900 text-white rounded-br-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.content}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 px-1">
                          <span>
                            {new Date(msg.created_at).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMine && (
                            <span className="inline-flex items-center gap-0.5 text-sage-600">
                              <CheckCheck className="w-3 h-3" />
                              {msg.is_read ? 'Lu' : 'Envoyé'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                
                <form
                  onSubmit={handleSendReply}
                  className="p-4 border-t border-slate-200 bg-white flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Écrivez votre message en toute sécurité..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-navy-800"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-sage-600 hover:bg-sage-500 disabled:opacity-40 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    <span>Envoyer</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="p-12 text-center text-sm text-slate-500">
                Sélectionnez une conversation dans la colonne de gauche.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
