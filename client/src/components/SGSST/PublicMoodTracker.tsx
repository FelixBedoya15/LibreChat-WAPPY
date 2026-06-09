import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, Smile, Meh, Frown, Send, CheckCircle, MessageSquare, Loader2, Building2, ChevronRight, AlertCircle, Heart } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

interface Message {
  sender: 'user' | 'agent';
  text: string;
}

export default function PublicMoodTracker() {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<any>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [step, setStep] = useState<number>(1); // 1: Welcome/Mood, 2: Stressors/Option, 3: Chat, 4: Success

  // Form State
  const [department, setDepartment] = useState('');
  const [selectedMood, setSelectedMood] = useState<'happy' | 'neutral' | 'sad' | null>(null);
  const [telemetryId, setTelemetryId] = useState<string | null>(null);
  const [submittingMood, setSubmittingMood] = useState(false);

  // Stressors State
  const [selectedStressors, setSelectedStressors] = useState<string[]>([]);
  const stressorsList = [
    { id: 'sobrecarga', label: 'Sobrecarga de trabajo' },
    { id: 'liderazgo', label: 'Clima laboral / Relaciones' },
    { id: 'entorno', label: 'Entorno físico / Herramientas' },
    { id: 'personal', label: 'Asuntos personales / familiares' },
    { id: 'funciones', label: 'Falta de claridad en funciones' },
    { id: 'fatiga', label: 'Fatiga física o mental' },
  ];

  // Chat State
  const [chatToken, setChatToken] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [parentMessageId, setParentMessageId] = useState<string>('00000000-0000-0000-0000-000000000000');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await axios.get(`/api/public-sgsst/company/${companyId}`);
        setCompany(res.data);
      } catch (error) {
        console.error('Error fetching company info:', error);
      } finally {
        setLoadingCompany(false);
      }
    };
    if (companyId) {
      fetchCompany();
    }
  }, [companyId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleMoodSelect = async (mood: 'happy' | 'neutral' | 'sad') => {
    setSelectedMood(mood);
    setSubmittingMood(true);

    try {
      const res = await axios.post(`/api/public-sgsst/mood/${companyId}`, {
        mood,
        department,
      });

      if (res.data.success) {
        setTelemetryId(res.data.telemetryId);
        if (mood === 'happy') {
          // Happy bypasses stressors and chat, goes straight to success
          setStep(4);
        } else {
          setStep(2);
        }
      }
    } catch (error) {
      console.error('Error registering mood:', error);
      alert('Hubo un error al registrar tu estado de ánimo. Por favor, intenta de nuevo.');
    } finally {
      setSubmittingMood(false);
    }
  };

  const toggleStressor = (id: string) => {
    setSelectedStressors((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSkipChat = async () => {
    if (!telemetryId) return;

    try {
      await axios.post(`/api/public-sgsst/mood/update/${telemetryId}`, {
        stressors: selectedStressors,
        details: 'El usuario decidió no iniciar el chat anónimo.',
      });
      setStep(4);
    } catch (error) {
      console.error('Error updating stressors:', error);
      setStep(4); // Proceed to success anyway
    }
  };

  const handleStartChat = async () => {
    if (!companyId || !telemetryId) return;
    setIsTyping(true);

    try {
      const res = await axios.post(`/api/public-sgsst/mood/chat/${companyId}`);
      if (res.data.success) {
        setChatToken(res.data.token);
        setAgentId(res.data.agentId);
        setConversationId(res.data.conversationId);

        // Prepopulate first message from Specialist Agent
        setMessages([
          {
            sender: 'agent',
            text: 'Hola. Lamento escuchar que hoy te sientes estresado o cansado. Estoy aquí como tu Terapeuta Ocupacional y de Salud Mental para escucharte en un espacio 100% privado y anónimo. ¿Te gustaría contarme qué te preocupa o cómo te has sentido en el trabajo últimamente?',
          },
        ]);
        setStep(3);
      }
    } catch (error: any) {
      console.error('Error initializing chat:', error);
      alert(error.response?.data?.error || 'No se pudo iniciar el chat con el especialista.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !chatToken || !agentId || !conversationId) return;

    const userText = inputText.trim();
    setInputText('');
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setIsTyping(true);

    // Generate a temporary response placeholder for streaming
    let agentMessageId = '';
    setMessages((prev) => [...prev, { sender: 'agent', text: '' }]);

    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${chatToken}`,
        },
        body: JSON.stringify({
          text: userText,
          conversationId,
          parentMessageId,
          endpoint: 'agents',
          agent_id: agentId,
          endpointOption: {
            endpoint: 'agents',
            agent: agentId,
            model: 'gemini-3.1-flash-lite',
          },
          isPublicChat: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep partial line in buffer

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;

            const dataStr = trimmed.slice(5).trim();
            try {
              const parsed = JSON.parse(dataStr);

              // ── Error event ──────────────────────────────────────────────
              if (parsed.error && parsed.text) {
                let userFriendlyError = parsed.text;
                try {
                  const parsedErr = JSON.parse(parsed.text);
                  if (parsedErr.type === 'input_length') {
                    userFriendlyError = 'El mensaje es demasiado largo para ser procesado.';
                  } else if (parsedErr.type === 'google_error') {
                    userFriendlyError =
                      'El proveedor de IA (Google Gemini) está experimentando problemas o límites de cuota. Por favor, intenta de nuevo en unos minutos.';
                  }
                } catch {
                  // not JSON
                }
                accumulatedText = 'Lo siento, ha ocurrido un inconveniente: ' + userFriendlyError;
                setMessages((prev) => {
                  const updated = [...prev];
                  if (updated.length > 0)
                    updated[updated.length - 1] = { sender: 'agent', text: accumulatedText };
                  return updated;
                });
                continue;
              }

              // ── Final message (LibreChat sends { final: true, responseMessage: {...} }) ──
              if (parsed.final) {
                const finalMsgId = parsed.responseMessage?.messageId;
                if (finalMsgId) setParentMessageId(finalMsgId);
                // Fallback: use responseMessage.text if no streaming text was received
                if (!accumulatedText && parsed.responseMessage?.text) {
                  accumulatedText = parsed.responseMessage.text;
                  setMessages((prev) => {
                    const updated = [...prev];
                    if (updated.length > 0)
                      updated[updated.length - 1] = { sender: 'agent', text: accumulatedText };
                    return updated;
                  });
                }
                continue;
              }

              // ── Determine the event type ─────────────────────────────────
              // LibreChat encodes the event name INSIDE the JSON as `parsed.event`,
              // not as a separate SSE `event:` header line.
              const eventType: string = parsed.event ?? '';

              if (eventType === 'on_message_delta') {
                // Nested under data.delta or directly under delta
                const content = parsed.data?.delta?.content ?? parsed.delta?.content;
                const textChunk = Array.isArray(content) ? content[0]?.text : content?.text;
                if (textChunk) {
                  accumulatedText += textChunk;
                  setMessages((prev) => {
                    const updated = [...prev];
                    if (updated.length > 0)
                      updated[updated.length - 1] = { sender: 'agent', text: accumulatedText };
                    return updated;
                  });
                }
              } else if (eventType === 'clear_step_maps') {
                accumulatedText = '';
                setMessages((prev) => {
                  const updated = [...prev];
                  if (updated.length > 0)
                    updated[updated.length - 1] = { sender: 'agent', text: '' };
                  return updated;
                });
              } else if (eventType === 'finalMessage' || eventType === 'message') {
                // Some configurations deliver the full text here
                const finalText = parsed.text ?? parsed.data?.text;
                if (finalText && !accumulatedText) {
                  accumulatedText = finalText;
                  setMessages((prev) => {
                    const updated = [...prev];
                    if (updated.length > 0)
                      updated[updated.length - 1] = { sender: 'agent', text: accumulatedText };
                    return updated;
                  });
                }
                const msgId = parsed.messageId ?? parsed.data?.messageId;
                if (msgId) setParentMessageId(msgId);
              }
            } catch (e) {
              // Ignore parsing errors of incomplete/non-JSON lines
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in chat stream:', error);
      setMessages((prev) => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].text === '') {
          updated[updated.length - 1] = {
            sender: 'agent',
            text: 'Lo siento, he experimentado una interrupción en mi conexión. ¿Podrías volver a escribirme?',
          };
        }
        return updated;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleFinishChat = async () => {
    if (!telemetryId) return;

    try {
      // Calculate a brief context summary of the chat
      const chatDetails = messages
        .map((m) => `${m.sender === 'user' ? 'Trabajador' : 'Psicólogo'}: ${m.text}`)
        .join('\n')
        .slice(0, 1000); // Truncate to avoid large payloads

      await axios.post(`/api/public-sgsst/mood/update/${telemetryId}`, {
        stressors: selectedStressors,
        details: `Conversación anónima entablada. Resumen chat:\n${chatDetails}`,
      });
    } catch (error) {
      console.error('Error saving final chat summary:', error);
    } finally {
      setStep(4);
    }
  };

  if (loadingCompany) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center p-6 text-center text-white">
        <Shield className="w-16 h-16 text-[#0e9f6e] animate-pulse mb-4" />
        <h2 className="text-xl font-bold font-sans tracking-wide">Cargando Termómetro Psicosocial...</h2>
        <p className="text-gray-400 mt-2 text-sm">Conectando de forma segura y anónima</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center p-6 text-center text-white">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold">Enlace No Válido</h2>
        <p className="text-gray-400 mt-2 text-sm">El QR o enlace escaneado no corresponde a ninguna empresa activa en el sistema.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] font-sans text-gray-100 flex flex-col relative overflow-hidden">
      {/* Abstract Glowing Backgrounds */}
      <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-gradient-to-br from-[#0e9f6e]/15 to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-gradient-to-br from-[#8b5cf6]/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0e1322]/80 backdrop-blur-md p-4 sticky top-0 z-30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {company.logo ? (
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-700 bg-white p-1 shrink-0">
              <img src={company.logo} alt={company.companyName} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#0e9f6e]/15 border border-[#0e9f6e]/30 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-[#0e9f6e]" />
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">Termómetro Psicosocial</h1>
            <p className="text-[10px] text-[#0e9f6e] font-semibold tracking-wider uppercase">{company.companyName}</p>
          </div>
        </div>
        <div className="bg-[#0e9f6e]/10 border border-[#0e9f6e]/30 rounded-full px-3 py-1 flex items-center gap-1.5 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-[#0e9f6e] animate-ping" />
          <span className="text-[10px] text-[#0e9f6e] font-bold tracking-wide uppercase">100% Anónimo</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full z-10">
        
        {/* STEP 1: WELCOME & MOOD SELECT */}
        {step === 1 && (
          <div className="w-full space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-[#0e9f6e]/10 border border-[#0e9f6e]/20 mb-2">
                <Heart className="w-8 h-8 text-[#0e9f6e]" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">¿Cómo te sientes hoy?</h2>
              <p className="text-xs text-gray-400 leading-relaxed px-4">
                Queremos saber cómo estás. Tu respuesta es estrictamente anónima y ayuda a mejorar el clima laboral de tu organización.
              </p>
            </div>

            {/* Department input */}
            <div className="bg-[#0e1322]/60 border border-gray-800 rounded-2xl p-4 space-y-2.5 backdrop-blur-sm">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-[#0e9f6e]" />
                Área o Departamento (Opcional)
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ej: Operaciones, Administración, Ventas..."
                className="w-full bg-[#0b0f19] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#0e9f6e] transition-all"
              />
            </div>

            {/* Mood selector cards */}
            <div className="grid grid-cols-1 gap-3.5">
              <button
                onClick={() => handleMoodSelect('happy')}
                disabled={submittingMood}
                className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500/10 to-transparent hover:from-emerald-500/15 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl text-left transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform">
                    <Smile className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-200">Feliz / Motivado</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Me siento valorado y con energía hoy.</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-500/60 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => handleMoodSelect('neutral')}
                disabled={submittingMood}
                className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/10 to-transparent hover:from-yellow-500/15 border border-yellow-500/20 hover:border-yellow-500/40 rounded-2xl text-left transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/10 rounded-xl group-hover:scale-110 transition-transform">
                    <Meh className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-yellow-200">Tranquilo / Estable</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Mi día transcurre con normalidad.</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-yellow-500/60 group-hover:text-yellow-400 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={() => handleMoodSelect('sad')}
                disabled={submittingMood}
                className="group relative flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-transparent hover:from-purple-500/15 border border-purple-500/20 hover:border-purple-500/40 rounded-2xl text-left transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-xl group-hover:scale-110 transition-transform">
                    <Frown className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-purple-200">Estresado / Agotado</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">Siento sobrecarga, cansancio o malestar.</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-500/60 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>

            {submittingMood && (
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin text-[#0e9f6e]" />
                Registrando respuesta...
              </div>
            )}
          </div>
        )}

        {/* STEP 2: STRESSORS & CHAT OPTION */}
        {step === 2 && (
          <div className="w-full space-y-6 animate-fadeIn">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-white">¿Qué factores influyen hoy?</h2>
              <p className="text-xs text-gray-400">
                Selecciona las razones principales de tu estado de ánimo (opcional):
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {stressorsList.map((stressor) => {
                const isSelected = selectedStressors.includes(stressor.id);
                return (
                  <button
                    key={stressor.id}
                    onClick={() => toggleStressor(stressor.id)}
                    className={`p-3 text-left rounded-xl border text-xs font-semibold transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#8b5cf6]/20 border-[#8b5cf6] text-purple-200'
                        : 'bg-[#0e1322]/40 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    {stressor.label}
                  </button>
                );
              })}
            </div>

            {/* Special Agent Invitation Box */}
            <div className="p-4 bg-gradient-to-b from-[#8b5cf6]/10 to-transparent border border-[#8b5cf6]/20 rounded-2xl space-y-4 backdrop-blur-sm">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-purple-200 uppercase tracking-wide">Especialista en Riesgo Psicosocial</h3>
                  <p className="text-[11px] text-gray-400 leading-relaxed mt-1">
                    ¿Quieres recibir pautas prácticas y desahogarte? Puedes chatear en privado con nuestra Inteligencia Artificial experta. Nadie sabrá quién eres.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSkipChat}
                  className="flex-1 bg-gray-800/40 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-all"
                >
                  Solo enviar reporte
                </button>
                <button
                  onClick={handleStartChat}
                  className="flex-1 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-[#8b5cf6]/10 transition-all flex items-center justify-center gap-1.5"
                >
                  Hablar con IA
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PRIVATE CHAT */}
        {step === 3 && (
          <div className="w-full h-[75vh] flex flex-col bg-[#0e1322]/80 border border-gray-800 rounded-2xl overflow-hidden backdrop-blur-sm animate-fadeIn">
            {/* Chat Header */}
            <div className="p-3.5 bg-gray-900/60 border-b border-gray-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-bold text-xs text-purple-300">
                  🧠
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Especialista Psicosocial</h3>
                  <p className="text-[9px] text-gray-400">Canal Confidencial Anónimo</p>
                </div>
              </div>
              <button
                onClick={handleFinishChat}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
              >
                Terminar
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#8b5cf6] text-white rounded-tr-none'
                        : 'bg-gray-800/80 text-gray-100 border border-gray-700 rounded-tl-none'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                    ) : (
                      msg.text ? (
                        <ReactMarkdown className="prose dark:prose-invert text-xs max-w-none break-words prose-p:leading-relaxed prose-p:my-1 prose-p:text-gray-100 prose-headings:text-white prose-strong:text-white prose-ul:my-1 prose-li:my-0.5 whitespace-pre-wrap">
                          {msg.text}
                        </ReactMarkdown>
                      ) : (
                        <span className="flex items-center gap-1.5 text-gray-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                          Escribiendo...
                        </span>
                      )
                    )}
                  </div>
                </div>
              ))}
              {isTyping && messages[messages.length - 1]?.text !== '' && (
                <div className="flex justify-start">
                  <div className="bg-gray-800/80 border border-gray-700 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-gray-900/60 border-t border-gray-800 flex gap-2 shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                disabled={isTyping}
                className="flex-1 bg-[#0b0f19] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#8b5cf6] disabled:opacity-50 transition-all"
              />
              <button
                type="submit"
                disabled={isTyping || !inputText.trim()}
                className="bg-purple-600 hover:bg-purple-500 text-white p-2.5 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: SUCCESS */}
        {step === 4 && (
          <div className="w-full text-center space-y-5 animate-fadeIn">
            <div className="inline-flex p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-extrabold text-white">¡Gracias por participar!</h2>
            
            <div className="bg-[#0e1322]/60 border border-gray-800 rounded-2xl p-5 text-xs text-gray-300 leading-relaxed max-w-sm mx-auto backdrop-blur-sm">
              {selectedMood === 'happy' ? (
                <p>
                  Nos alegra mucho que te sientas feliz y motivado en el trabajo. Tu actitud positiva contribuye enormemente a construir un gran equipo. ¡Que tengas un excelente resto de jornada laboral!
                </p>
              ) : (
                <p>
                  Tu reporte y tus comentarios han sido registrados con éxito de forma 100% confidencial. Esto nos sirve para proponer mejoras en la carga y el ambiente laboral de la organización. ¡Cuídate y recuerda que tu salud mental es lo primero!
                </p>
              )}
            </div>

            <button
              onClick={() => {
                setStep(1);
                setSelectedMood(null);
                setTelemetryId(null);
                setSelectedStressors([]);
                setMessages([]);
                setParentMessageId('00000000-0000-0000-0000-000000000000');
              }}
              className="mt-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 font-bold py-2.5 px-6 rounded-xl text-xs transition-all"
            >
              Registrar otra respuesta
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="p-4 border-t border-gray-900 bg-[#070a12] text-center text-[10px] text-gray-500 shrink-0">
        En cumplimiento con la ética de Batería de Riesgo Psicosocial.
        <br />
        Desarrollado de forma segura por <span className="text-gray-400 font-semibold">WAPPY IA</span>
      </footer>
    </div>
  );
}
