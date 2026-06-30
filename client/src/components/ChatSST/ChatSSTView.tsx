import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users, ShieldCheck, Bot, Sparkles, Clock, AtSign, Loader2, Trash2, Edit2, Check, X, RefreshCw, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { request } from 'librechat-data-provider';
import { useAuthContext } from '~/hooks';

interface ChatMessage {
  _id?: string;
  id?: string;
  user?: any;
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
  const [mentionQuery, setMentionQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Estados de grupos
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('general');
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [userSearchText, setUserSearchText] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<any[]>([]);
  const [invitedUsers, setInvitedUsers] = useState<any[]>([]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUp = useRef<boolean>(false);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
    isUserScrolledUp.current = !isAtBottom;
  };

  const scrollToBottom = (force = false) => {
    if (force || !isUserScrolledUp.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchGroups = async () => {
    try {
      const data = await request.get('/api/chat-sst/groups') as any;
      if (data && data.success && Array.isArray(data.data)) {
        setGroups(data.data);
      }
    } catch (err) {
      console.error('Error al cargar grupos del Chat SST:', err);
    }
  };

  const fetchMessagesForGroup = async (groupId: string, isInitial = false) => {
    try {
      const endpoint = `/api/chat-sst/messages?groupId=${groupId}`;
      const data = await request.get(endpoint) as any;
      if (data && data.success && Array.isArray(data.data)) {
        setMessages(data.data);
        if (isInitial) {
          setTimeout(() => scrollToBottom(true), 100);
        }
      }
    } catch (err) {
      console.error('Error al cargar mensajes del Chat SST:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carga periódica
  useEffect(() => {
    fetchGroups();
    fetchMessagesForGroup(selectedGroupId, true);

    const interval = setInterval(() => {
      fetchGroups();
      fetchMessagesForGroup(selectedGroupId, false);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedGroupId]);

  // Búsqueda de usuarios con retardo (debounced)
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (userSearchText.trim().length >= 2) {
        try {
          const res = await request.get(`/api/chat-sst/users-search?q=${encodeURIComponent(userSearchText.trim())}`) as any;
          if (res && res.success && Array.isArray(res.data)) {
            setSearchedUsers(res.data);
          }
        } catch (err) {
          console.error('Error al buscar usuarios:', err);
        }
      } else {
        setSearchedUsers([]);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [userSearchText]);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages]);

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setMessages([]);
    setLoading(true);
    isUserScrolledUp.current = false;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    const lastWord = val.split(' ').pop() || '';
    if (lastWord.startsWith('@')) {
      setShowMentions(true);
      setMentionQuery(lastWord.slice(1).toLowerCase());
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const insertMention = (mentionText: string) => {
    const words = input.split(' ');
    words.pop();
    const prefix = words.length > 0 ? words.join(' ') + ' ' : '';
    const newInput = prefix + mentionText + ' ';
    setInput(newInput);
    setShowMentions(false);
    setMentionQuery('');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const currentText = input.trim();
    const userName = user?.name || user?.email?.split('@')[0] || 'Usuario';
    const userRole = user?.role === 'ADMIN' ? 'admin' : 'user';

    setInput('');
    setSending(true);
    setShowMentions(false);

    const mentionsFound: string[] = [];
    const words = currentText.split(' ');
    words.forEach(w => {
      if (w.startsWith('@') && w.length > 1) {
        mentionsFound.push(w);
      }
    });

    const tempUserMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      user: user?._id || user?.id,
      senderName: userName,
      senderRole: userRole,
      content: currentText,
      mentions: mentionsFound,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const data = await request.post('/api/chat-sst/send', {
        content: currentText,
        mentions: mentionsFound,
        groupId: selectedGroupId !== 'general' ? selectedGroupId : null,
      }) as any;

      if (data && data.success) {
        fetchMessagesForGroup(selectedGroupId, false);
      } else {
        console.error('Error del servidor al enviar mensaje:', data);
      }
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (msgId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este mensaje?')) return;
    try {
      await request.delete(`/api/chat-sst/messages/${msgId}`);
      setMessages((prev) => prev.filter((m) => (m._id || m.id) !== msgId));
    } catch (err) {
      console.error('Error eliminando mensaje:', err);
    }
  };

  const handleRegenerate = async (msgId: string) => {
    setRegeneratingId(msgId);
    try {
      await request.post(`/api/chat-sst/messages/${msgId}/regenerate`, {});
      fetchMessagesForGroup(selectedGroupId, false);
    } catch (err) {
      console.error('Error regenerando mensaje:', err);
    } finally {
      setRegeneratingId(null);
    }
  };

  const startEdit = (msg: ChatMessage) => {
    setEditingId(msg._id || msg.id || null);
    setEditText(msg.content);
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!editText.trim()) return;
    try {
      await request.put(`/api/chat-sst/messages/${msgId}`, { content: editText.trim() });
      setMessages((prev) =>
        prev.map((m) => ((m._id || m.id) === msgId ? { ...m, content: editText.trim() } : m))
      );
      setEditingId(null);
    } catch (err) {
      console.error('Error editando mensaje:', err);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    try {
      const invitedIds = invitedUsers.map(u => u._id || u.id);
      const res = await request.post('/api/chat-sst/groups', {
        name: newGroupName.trim(),
        invitedUserIds: invitedIds,
      }) as any;

      if (res && res.success && res.data) {
        setGroups(prev => [...prev, res.data]);
        setSelectedGroupId(res.data._id);
        setShowCreateGroupModal(false);
        setNewGroupName('');
        setInvitedUsers([]);
        setUserSearchText('');
        setSearchedUsers([]);
      }
    } catch (err) {
      console.error('Error al crear grupo:', err);
      alert('Ocurrió un error al crear el grupo de chat.');
    }
  };

  const currentUserIdStr = (user?._id || user?.id)?.toString();
  const currentUserName = user?.name || user?.email?.split('@')[0];

  const extractUserIdString = (u: any): string => {
    if (!u) return '';
    if (typeof u === 'string') return u;
    if (u._id) return u._id.toString();
    if (u.id) return u.id.toString();
    return '';
  };

  const isAdmin = user?.role === 'ADMIN';
  const isPro = user?.role === 'USER_PRO';
  const canCreateGroup = isAdmin || isPro;

  // Extraer participantes del grupo seleccionado (o comunidad general)
  const uniqueParticipants = Array.from(
    new Set(
      messages
        .filter((m) => m.senderRole !== 'bot' && m.senderRole !== 'system')
        .map((m) => m.senderName)
    )
  ).filter((name) => name && name !== currentUserName);

  // Menciones inteligentes
  const allMentionOptions = [
    { name: 'wappy', type: 'bot', label: 'Asistente Experto SST' },
    ...uniqueParticipants.map(pName => ({ name: pName, type: 'user', label: 'Miembro Comunidad' }))
  ];

  const filteredMentions = allMentionOptions.filter(opt => 
    opt.name.toLowerCase().includes(mentionQuery)
  );

  const selectedGroup = selectedGroupId === 'general' 
    ? { name: 'Comunidad General' } 
    : groups.find(g => g._id === selectedGroupId) || { name: 'Cargando Grupo...' };

  return (
    <div className="flex h-full w-full bg-[#f0f2f5] dark:bg-zinc-900 font-sans relative overflow-hidden">
      
      {/* Sidebar de Canales y Grupos (WhatsApp Style) */}
      <div className="w-80 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0 z-10">
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-emerald-500" /> Salas y Canales SST
          </span>
          {canCreateGroup && (
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
              title="Crear nuevo grupo"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Canal Comunidad General */}
          <button
            onClick={() => handleSelectGroup('general')}
            className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
              selectedGroupId === 'general'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-500 pl-2 shadow-xs'
                : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <div className="h-9 w-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              G
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs">Comunidad General</div>
              <div className="text-[10px] text-zinc-400 truncate">Chat de libre participación</div>
            </div>
          </button>

          {/* Listado de Canales Creados */}
          {groups.map(g => (
            <button
              key={g._id}
              onClick={() => handleSelectGroup(g._id)}
              className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                selectedGroupId === g._id
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-500 pl-2 shadow-xs'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <div className="h-9 w-9 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-sm shrink-0 uppercase text-xs">
                {g.name.substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs truncate">{g.name}</div>
                <div className="text-[10px] text-zinc-400 truncate">{g.members?.length || 1} miembros</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header del Grupo Seleccionado */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-6 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm font-bold uppercase ${selectedGroupId === 'general' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
              {selectedGroupId === 'general' ? <MessageCircle className="h-6 w-6" /> : selectedGroup.name.substring(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-100">{selectedGroup.name}</h1>
                {selectedGroupId === 'general' && (
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                    Oficial
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <Users className="h-3 w-3 inline" /> {selectedGroupId === 'general' ? 'Comunidad Pro & Vital' : `${selectedGroup.members?.length || 1} participantes`} • <Bot className="h-3 w-3 inline text-emerald-500" /> Agente @wappy activo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> {isAdmin ? 'Modo Administrador' : 'Modo Pruebas'}
            </div>
          </div>
        </div>

        {/* Banner de Mención e Indicador de Cola */}
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
        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]"
        >
          {loading && messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-zinc-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" /> Cargando historial del Chat...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-zinc-400 gap-2">
              <Bot className="h-10 w-10 text-emerald-500/50" />
              <p className="text-sm font-medium">No hay mensajes aún en esta sala de chat.</p>
              <p className="text-xs text-zinc-500">¡Sé el primero en saludar o hacer una consulta a @wappy!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const msgUserIdStr = extractUserIdString(msg.user);
              const isBot = msg.senderRole === 'bot';
              const isMe = Boolean(currentUserIdStr && msgUserIdStr && currentUserIdStr === msgUserIdStr);

              const msgId = msg._id || msg.id || index.toString();
              const formattedTime = msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : msg.time || '';

              const canManageUserMsg = isMe || isAdmin;
              const canManageBotMsg = isBot && isAdmin;

              return (
                <div
                  key={msgId}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 shadow-xs relative ${
                      isMe
                        ? 'bg-emerald-600 text-white rounded-tr-xs'
                        : isBot
                        ? 'bg-[#f4fbf7] text-zinc-800 border border-emerald-200/70 rounded-tl-xs dark:bg-zinc-950 dark:text-zinc-100 dark:border-emerald-500/20'
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
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] ${
                            isMe ? 'text-emerald-200' : 'text-zinc-400'
                          }`}
                        >
                          {formattedTime}
                        </span>

                        {/* Acciones para mensajes de Usuario */}
                        {canManageUserMsg && !isBot && editingId !== msgId && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2">
                            {isMe && (
                              <button
                                onClick={() => startEdit(msg)}
                                className="p-1 hover:bg-black/10 rounded text-xs transition-colors"
                                title="Editar mensaje"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(msgId)}
                              className="p-1 hover:bg-black/10 rounded text-xs transition-colors text-rose-300 hover:text-rose-100"
                              title="Eliminar mensaje"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}

                        {/* Acciones especiales de Administrador para respuestas del Bot (@wappy) */}
                        {canManageBotMsg && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2">
                            <button
                              onClick={() => handleRegenerate(msgId)}
                              disabled={regeneratingId === msgId}
                              className="p-1 hover:bg-white/10 rounded text-xs transition-colors text-emerald-400 hover:text-emerald-200"
                              title="Regenerar respuesta del agente"
                            >
                              {regeneratingId === msgId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(msgId)}
                              className="p-1 hover:bg-white/10 rounded text-xs transition-colors text-rose-400 hover:text-rose-200"
                              title="Eliminar respuesta del agente"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {editingId === msgId ? (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm rounded border border-white/30 bg-black/20 text-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveEdit(msgId)}
                          className="p-1 bg-emerald-500 rounded text-white hover:bg-emerald-400"
                          title="Guardar"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 bg-zinc-600 rounded text-white hover:bg-zinc-500"
                          title="Cancelar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none prose-p:my-0 prose-ul:list-disc prose-ul:pl-4 prose-ol:list-decimal prose-ol:pl-4 prose-a:text-emerald-600 dark:prose-a:text-emerald-400 font-semibold hover:underline">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Auto-suggest Menciones Popup */}
        {showMentions && filteredMentions.length > 0 && (
          <div className="absolute bottom-20 left-6 z-20 w-64 max-h-60 overflow-y-auto rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
            <div className="px-3 py-2 text-xs font-semibold text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-1 sticky top-0 bg-white dark:bg-zinc-900">
              <AtSign className="h-3.5 w-3.5 text-emerald-500" /> Mencionar...
            </div>
            {filteredMentions.map((opt) => (
              <button
                key={opt.name}
                onClick={() => insertMention(`@${opt.name}`)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 transition-colors text-zinc-800 dark:text-zinc-200 border-b border-zinc-50 dark:border-zinc-800/40 last:border-b-0"
              >
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-white ${opt.type === 'bot' ? 'bg-emerald-600' : 'bg-blue-600 font-bold text-xs'}`}>
                  {opt.type === 'bot' ? <Bot className="h-4 w-4" /> : opt.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs truncate">@{opt.name}</div>
                  <div className="text-[9px] text-zinc-400 truncate">{opt.label}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Formulario de envío / Input estilo WhatsApp */}
        <div className="p-3 sm:p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
          <form onSubmit={handleSend} className="flex items-center gap-2 max-w-5xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Escribe un mensaje o menciona a alguien con @..."
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

      {/* Modal de Creación de Grupos e Invitación de Miembros */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-between items-center">
              <span className="font-bold text-sm text-zinc-850 dark:text-zinc-150 flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-emerald-500" /> Crear Nuevo Grupo de Chat
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowCreateGroupModal(false);
                  setInvitedUsers([]);
                  setNewGroupName('');
                  setUserSearchText('');
                  setSearchedUsers([]);
                }}
                className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateGroup} className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500">Nombre del Grupo</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ej: Brigadistas de Emergencia, COPASST, etc."
                  className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col min-h-0 relative">
                <label className="text-xs font-bold text-zinc-500">Buscar y Agregar Usuarios</label>
                <div className="relative">
                  <input
                    type="text"
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                    placeholder="Escribe nombre o correo..."
                    className="w-full rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {userSearchText.trim().length >= 2 && searchedUsers.length === 0 && (
                    <div className="absolute top-11 left-0 right-0 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-20 text-[11px] text-zinc-400 text-center">
                      No se encontraron usuarios coincidentes
                    </div>
                  )}
                  {searchedUsers.length > 0 && (
                    <div className="absolute top-11 left-0 right-0 max-h-40 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-20 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-850">
                      {searchedUsers.map(u => (
                        <button
                          key={u._id || u.id}
                          type="button"
                          onClick={() => {
                            if (!invitedUsers.some(iu => (iu._id || iu.id) === (u._id || u.id))) {
                              setInvitedUsers(prev => [...prev, u]);
                            }
                            setUserSearchText('');
                            setSearchedUsers([]);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2.5 transition-colors"
                        >
                          <div className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-400">
                            {u.name[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 truncate">{u.name}</div>
                            <div className="text-[9px] text-zinc-400 truncate">{u.email}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de Invitados Seleccionados */}
              {invitedUsers.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500">Invitados Seleccionados ({invitedUsers.length})</label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-h-28 overflow-y-auto">
                    {invitedUsers.map(u => (
                      <div
                        key={u._id || u.id}
                        className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-emerald-300/40"
                      >
                        <span>{u.name}</span>
                        <button
                          type="button"
                          onClick={() => setInvitedUsers(prev => prev.filter(iu => (iu._id || iu.id) !== (u._id || u.id)))}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!newGroupName.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition-colors mt-auto shrink-0"
              >
                Crear Grupo e Invitar Miembros
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
