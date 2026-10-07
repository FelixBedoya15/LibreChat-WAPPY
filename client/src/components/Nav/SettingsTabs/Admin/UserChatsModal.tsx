import React, { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { useToastContext, Spinner } from '@librechat/client';
import { useLocalize } from '~/hooks';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, ArrowLeft, X, Bot, User, Clock } from 'lucide-react';

interface UserChatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
}

export default function UserChatsModal({ isOpen, onClose, userId, userName }: UserChatsModalProps) {
    const localize = useLocalize();
    const { showToast } = useToastContext();
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedConvo, setSelectedConvo] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            setConversations([]);
            setPage(1);
            setHasMore(true);
            setSelectedConvo(null);
            fetchConversations(1);
        }
    }, [isOpen, userId]);

    const fetchConversations = async (pageNum: number) => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/admin/users/${userId}/conversations?page=${pageNum}&limit=20`);
            setConversations(prev => pageNum === 1 ? res.data.conversations : [...prev, ...res.data.conversations]);
            setHasMore(pageNum < res.data.pages);
        } catch (error) {
            console.error('Error fetching conversations:', error);
            showToast({ message: 'Error al cargar las conversaciones', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchConversations(nextPage);
        }
    };

    const handleSelectConvo = async (convo: any) => {
        setSelectedConvo(convo);
        try {
            setMessagesLoading(true);
            const res = await axios.get(`/api/admin/users/${userId}/conversations/${convo.conversationId}`);
            setMessages(res.data.messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
            showToast({ message: 'Error al cargar los mensajes', status: 'error' });
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleBack = () => {
        setSelectedConvo(null);
        setMessages([]);
    };

    return (
        <Transition appear show={isOpen} as={React.Fragment}>
            <Dialog as="div" className="relative z-[100050]" onClose={onClose}>
                <TransitionChild
                    as={React.Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <TransitionChild
                            as={React.Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 p-6 md:p-8 text-left align-middle shadow-2xl transition-all h-[82vh] flex flex-col border border-slate-200/80 dark:border-zinc-800">
                                {/* Header */}
                                <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-800/80 pb-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-600/20">
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <DialogTitle as="h3" className="text-base font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                                                <span>Historial de Chats: {userName}</span>
                                                {selectedConvo && (
                                                    <span className="text-xs font-normal text-slate-400 dark:text-zinc-500">
                                                        / {selectedConvo.title || localize('com_ui_new_chat') || 'Conversación'}
                                                    </span>
                                                )}
                                            </DialogTitle>
                                            <p className="text-xs text-slate-500 dark:text-zinc-400">
                                                Auditoría y soporte de consultas del usuario.
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={onClose} 
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                                    {!selectedConvo ? (
                                        <div className="flex-1 overflow-y-auto pr-1 custom-admin-scrollbar">
                                            {loading && conversations.length === 0 ? (
                                                <div className="flex justify-center p-8"><Spinner /></div>
                                            ) : conversations.length === 0 ? (
                                                <div className="text-center p-12 text-slate-400 dark:text-zinc-500 italic">No hay conversaciones registradas para este usuario.</div>
                                            ) : (
                                                <div className="space-y-2.5">
                                                    {conversations.map(convo => (
                                                        <div
                                                            key={convo.conversationId}
                                                            onClick={() => handleSelectConvo(convo)}
                                                            className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-800/40 hover:bg-teal-50/60 dark:hover:bg-teal-950/20 hover:border-teal-500/30 transition-all cursor-pointer shadow-2xs"
                                                        >
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate pr-4">
                                                                    {convo.title || localize('com_ui_new_chat') || 'Nueva conversación'}
                                                                </span>
                                                                <span className="text-[11px] text-slate-400 dark:text-zinc-500 whitespace-nowrap flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {new Date(convo.updatedAt).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <div className="text-[10px] text-teal-600 dark:text-teal-400 font-mono mt-1">
                                                                Modelo: {convo.model || 'Por defecto'}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {hasMore && (
                                                        <button
                                                            onClick={handleLoadMore}
                                                            disabled={loading}
                                                            className="w-full py-2.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                                                        >
                                                            {loading ? 'Cargando más...' : 'Cargar más conversaciones'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col h-full min-h-0">
                                            <div className="flex items-center justify-between mb-3">
                                                <button
                                                    onClick={handleBack}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-slate-200 cursor-pointer transition-all active:scale-95"
                                                >
                                                    <ArrowLeft className="w-3.5 h-3.5" />
                                                    <span>Volver al listado</span>
                                                </button>
                                            </div>

                                            <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-4 bg-slate-50/70 dark:bg-zinc-950/60 space-y-4 custom-admin-scrollbar">
                                                {messagesLoading ? (
                                                    <div className="flex justify-center h-full items-center"><Spinner /></div>
                                                ) : messages.length === 0 ? (
                                                    <div className="text-center p-8 text-slate-400 italic">No hay mensajes en esta conversación.</div>
                                                ) : (
                                                    messages.map((msg, idx) => (
                                                        <div key={msg.messageId || idx} className={`flex flex-col ${msg.isCreatedByUser ? 'items-end' : 'items-start'}`}>
                                                            <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs ${msg.isCreatedByUser
                                                                ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-tr-xs'
                                                                : 'bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-tl-xs'
                                                                }`}>
                                                                {msg.text ? (
                                                                    <div className="prose dark:prose-invert text-xs max-w-none">
                                                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                                                    </div>
                                                                ) : (
                                                                    <span className="italic text-xs opacity-75">Sin contenido de texto</span>
                                                                )}
                                                            </div>
                                                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
                                                                {msg.isCreatedByUser ? <User className="w-2.5 h-2.5" /> : <Bot className="w-2.5 h-2.5" />}
                                                                {msg.isCreatedByUser ? 'Usuario' : (msg.sender || 'IA')} • {new Date(msg.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
