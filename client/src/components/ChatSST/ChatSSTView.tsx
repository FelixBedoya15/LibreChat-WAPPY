import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users, ShieldCheck, Bot, Sparkles, Clock, AtSign, Loader2 } from 'lucide-react';
import { request } from 'librechat-data-provider';
import { useAuthContext } from '~/hooks';

interface ChatMessage {
  _id?: string;
  id?: string;
  senderName: string;
  senderRole: 'user' | 'bot' | 'system' | 'admin';
  content: string;
  mentions?: string[];
  createdAt?: string;
  time?: string;
  status?: string;
}

export default function ChatSSTView() {
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMentions, setShowMentions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const data = await request.get('/api/chat-sst/messages') as any;
      if (data && data.success && Array.isArray(data.data)) {
        setMessages(data.data);
      }
    } catch (err) {
      console.error('Error al cargar mensajes del Chat SST:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Polling cada 3 segundos
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    const lastChar = val.slice(-1);
    if (lastChar === '@' || (val.includes('@') && !val.includes(' '))) {
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (mentionText: string) => {
    const parts = input.split('@');
    parts.pop();
    const newInput = parts.join('@') + mentionText + ' ';
    setInput(newInput);
    setShowMentions(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const currentText = input.trim();
    const userName = user?.name || user?.email?.split('@')[0] || 'Admin';
    const userRole = user?.role === 'ADMIN' ? 'admin' : 'user';

    setInput('');
    setSending(true);
    setShowMentions(false);

    const mentionsFound: string[] = [];
    const isWappy = currentText.toLowerCase().includes('@wappy');
    if (isWappy) {
      mentionsFound.push('@wappy');
    }

    // Actualización optimista inmediata en la UI
    const tempUserMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      senderName: userName,
      senderRole: userRole,
      content: currentText,
      mentions: mentionsFound,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const data = await request.post('/api/chat-sst/send', {
        content: currentText,
        mentions: mentionsFound,
      }) as any;

      if (data && data.success) {
        fetchMessages();
      } else {
        console.error('Error del servidor al enviar mensaje:', data);
      }
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#f0f2f5] dark:bg-zinc-900 font-sans relative">
      {/* Header estilo WhatsApp / WAPPY */}
      <div className="flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
            <MessageCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Chat SST</h1>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                Oficial
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Users className="h-3 w-3 inline" /> Comunidad Pro & Vital • <Bot className="h-3 w-3 inline text-emerald-500" /> Agente @wappy activo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Modo Administrador
          </div>
        </div>
      </div>

      {/* Banner de aviso / Cola de atención */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200/60 dark:border-emerald-900/50 px-6 py-2 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <span>Menciona a <strong>@wappy</strong> para consultas SST con respuesta inteligente y búsqueda web.</span>
        </div>
        <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
          <Clock className="h-3.5 w-3.5" /> Atención en orden de llegada (FIFO)
        </div>
      </div>

      {/* Mensajes / Chat Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]">
        {loading && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-zinc-400 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-500" /> Cargando historial de Chat SST...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-zinc-400 gap-2">
            <Bot className="h-10 w-10 text-emerald-500/50" />
            <p className="text-sm font-medium">No hay mensajes aún en el Chat SST.</p>
            <p className="text-xs text-zinc-500">¡Sé el primero en saludar o hacer una consulta a @wappy!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderName === (user?.name || user?.email?.split('@')[0] || 'Admin') || msg.senderRole === 'admin';
            const isBot = msg.senderRole === 'bot';
            const formattedTime = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : msg.time || '';

            return (
              <div
                key={msg._id || msg.id || index}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 shadow-xs relative ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-tr-xs'
                      : isBot
                      ? 'bg-zinc-900 text-zinc-100 border border-emerald-500/30 rounded-tl-xs dark:bg-zinc-950'
                      : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-xs border border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span
                      className={`text-xs font-bold flex items-center gap-1 ${
                        isMe
                          ? 'text-emerald-100'
                          : isBot
                          ? 'text-emerald-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isBot && <Bot className="h-3.5 w-3.5" />}
                      {msg.senderName}
                    </span>
                    <span
                      className={`text-[10px] ${
                        isMe ? 'text-emerald-200' : 'text-zinc-400'
                      }`}
                    >
                      {formattedTime}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Auto-suggest Menciones Popup */}
      {showMentions && (
        <div className="absolute bottom-20 left-6 z-20 w-64 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
          <div className="px-3 py-2 text-xs font-semibold text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-1">
            <AtSign className="h-3.5 w-3.5 text-emerald-500" /> Seleccionar mención
          </div>
          <button
            onClick={() => insertMention('@wappy')}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 transition-colors text-zinc-800 dark:text-zinc-200"
          >
            <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="font-bold text-xs">@wappy</div>
              <div className="text-[10px] text-zinc-400">Asistente Experto SST</div>
            </div>
          </button>
        </div>
      )}

      {/* Formulario de envío / Input estilo WhatsApp */}
      <div className="p-3 sm:p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
        <form onSubmit={handleSend} className="flex items-center gap-2 max-w-5xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Escribe un mensaje o menciona a @wappy..."
            className="flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-zinc-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white shadow-md transition-all shrink-0"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
