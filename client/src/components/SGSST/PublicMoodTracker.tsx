import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { 
  Shield, Smile, Meh, Frown, Send, CheckCircle, 
  MessageSquare, Loader2, Building2, ChevronRight, 
  AlertCircle, Heart, Sparkles, RotateCcw, Award 
} from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import PublicWorkerHeader from './PublicWorkerHeader';
import { useWorkerSession } from '../../hooks/useWorkerSession';

interface Message {
  sender: 'user' | 'agent';
  text: string;
}

const getDeviceId = (): string => {
  try {
    let devId = localStorage.getItem('wappy_mood_device_id');
    if (!devId) {
      devId = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
      localStorage.setItem('wappy_mood_device_id', devId);
    }
    return devId;
  } catch {
    return 'dev_default';
  }
};

const getTodayDateStr = (): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function PublicMoodTracker() {
  const { companyId } = useParams<{ companyId: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isDemoUrl =
    queryParams.get('demo') === '1' ||
    queryParams.get('admin') === '1' ||
    queryParams.get('demo') === 'true';

  const [company, setCompany] = useState<any>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [step, setStep] = useState<number>(1); // 1: Welcome/Mood, 2: Stressors/Option, 3: Chat, 4: Success
  const [alreadyReportedToday, setAlreadyReportedToday] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(isDemoUrl);

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
  const [agentName, setAgentName] = useState<string>('Terapeuta en Salud Mental');
  const [agentModel, setAgentModel] = useState<string | undefined>(undefined);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [parentMessageId, setParentMessageId] = useState<string>('00000000-0000-0000-0000-000000000000');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { session, worker: sessionWorker, isAuthenticated } = useWorkerSession(companyId);
  const [editingCedula, setEditingCedula] = useState(false);

  // Gamification Claim State
  const [claimCedula, setClaimCedula] = useState('');
  const [claimingPoints, setClaimingPoints] = useState(false);
  const [pointsClaimed, setPointsClaimed] = useState(false);
  const [claimMessage, setClaimMessage] = useState('');

  // Auto-fill claimCedula when worker session is detected
  useEffect(() => {
    const defaultCed = sessionWorker?.cedula || session?.cedula;
    if (defaultCed && !claimCedula) {
      setClaimCedula(defaultCed);
    }
  }, [sessionWorker?.cedula, session?.cedula, claimCedula]);

  const handleClaimMoodPoints = async () => {
    if (!claimCedula.trim()) return;
    setClaimingPoints(true);
    try {
      const res = await axios.post(`/api/public-sgsst/mood/claim-points/${companyId}`, {
        cedula: claimCedula.trim(),
        telemetryId,
      });
      if (res.data?.success) {
        setPointsClaimed(true);
        setClaimMessage(res.data.message || '¡+10 Puntos acreditados con éxito!');
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'No fue posible acreditar los puntos. Verifica tu cédula.');
    } finally {
      setClaimingPoints(false);
    }
  };

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await axios.get(`/api/public-sgsst/company/${companyId}`);
        setCompany(res.data);

        // Verificar si ya se reportó hoy desde este dispositivo (omitir si es modo demo)
        if (!isDemoUrl && !isDemoMode) {
          const targetId = res.data?._id || companyId;
          const lastReportDate = localStorage.getItem(`wappy_mood_last_date_${targetId}`);
          if (lastReportDate === getTodayDateStr()) {
            setAlreadyReportedToday(true);
          }
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
      } finally {
        setLoadingCompany(false);
      }
    };
    if (companyId) {
      fetchCompany();
    }
  }, [companyId, isDemoUrl, isDemoMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleUnlockDemo = () => {
    const targetId = company?._id || companyId;
    try {
      localStorage.removeItem(`wappy_mood_last_date_${targetId}`);
    } catch (e) {}
    setIsDemoMode(true);
    setAlreadyReportedToday(false);
    setStep(1);
  };

  const handleResetForNewDemo = () => {
    setSelectedMood(null);
    setSelectedStressors([]);
    setDepartment('');
    setTelemetryId(null);
    setMessages([]);
    setInputText('');
    setParentMessageId('00000000-0000-0000-0000-000000000000');
    setChatError(null);
    const targetId = company?._id || companyId;
    try {
      localStorage.removeItem(`wappy_mood_last_date_${targetId}`);
    } catch (e) {}
    setAlreadyReportedToday(false);
    setStep(1);
  };

  const handleMoodSelect = async (mood: 'happy' | 'neutral' | 'sad') => {
    setSelectedMood(mood);
    setSubmittingMood(true);

    const bypassLock = isDemoMode || isDemoUrl;

    try {
      const targetCompanyId = company?._id || companyId;
      const deviceId = getDeviceId();
      const res = await axios.post(`/api/public-sgsst/mood/${targetCompanyId}`, {
        mood,
        department,
        deviceId,
        isDemo: bypassLock,
      });

      if (res.data.success) {
        setTelemetryId(res.data.telemetryId);
        // Guardar fecha en almacenamiento local solo si no es una demostración o admin
        if (!bypassLock) {
          try {
            localStorage.setItem(`wappy_mood_last_date_${targetCompanyId}`, getTodayDateStr());
          } catch (e) {
            console.warn('Could not save to localStorage', e);
          }
        }

        if (mood === 'happy') {
          // Happy bypasses stressors and chat, goes straight to success
          setStep(4);
        } else {
          setStep(2);
        }
      }
    } catch (error: any) {
      console.error('Error registering mood:', error);
      if (error.response?.data?.alreadyReportedToday || error.response?.status === 429) {
        if (!bypassLock) {
          const targetCompanyId = company?._id || companyId;
          try {
            localStorage.setItem(`wappy_mood_last_date_${targetCompanyId}`, getTodayDateStr());
          } catch (e) {}
          setAlreadyReportedToday(true);
        } else {
          setStep(mood === 'happy' ? 4 : 2);
        }
      } else {
        alert(error.response?.data?.error || 'Hubo un error al registrar tu estado de ánimo. Por favor, intenta de nuevo.');
      }
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
        department: department.trim(),
        generateAICase: true,
      });
      setStep(4);
    } catch (error) {
      console.error('Error updating telemetry:', error);
      setStep(4); // Non-blocking
    }
  };

  const handleStartChat = async () => {
    if (!companyId || !telemetryId) return;
    setStartingChat(true);
    setChatError(null);

    try {
      const targetCompanyId = company?._id || companyId;
      const res = await axios.post(`/api/public-sgsst/mood/chat/${targetCompanyId}`, {}, {
        timeout: 15000,
      });
      if (res.data?.success) {
        setChatToken(res.data.token);
        setAgentId(res.data.agentId);
        if (res.data.agentName) setAgentName(res.data.agentName);
        setAgentModel(res.data.agentModel || 'gemini-3.5-flash-lite');
        setConversationId(res.data.conversationId);

        // Compute labels of selected stressors
        const selectedLabels = selectedStressors.map(
          (id) => stressorsList.find((s) => s.id === id)?.label || id
        );

        // Actualizar estresores y solicitar al backend generar el caso con IA
        axios.post(`/api/public-sgsst/mood/update/${telemetryId}`, {
          stressors: selectedStressors,
          department: department.trim(),
          sessionStarted: true,
        }).catch((e) => console.warn('Could not update initial stressors:', e));

        // Prepopulate context-aware greeting from Specialist Agent
        let greetingText = '';
        if (selectedLabels.length > 0) {
          greetingText = `Hola. Veo que hoy te sientes ${selectedMood === 'sad' ? 'estresado o con sobrecarga' : 'con inquietudes'}${department.trim() ? ` en tu labor en ${department.trim()}` : ''}, y señalaste como factores: ${selectedLabels.join(', ')}. Estoy aquí como tu Terapeuta en Salud Mental para escucharte en un espacio 100% privado, confidencial y seguro. Cuéntame con toda confianza, ¿qué es lo que más te está afectando o cómo te has sentido con esto últimamente?`;
        } else {
          greetingText = `Hola. Veo que hoy te sientes ${selectedMood === 'sad' ? 'estresado o agotado' : 'en una jornada tranquila'}${department.trim() ? ` en el área de ${department.trim()}` : ''}. Estoy aquí como tu Terapeuta en Salud Mental para escucharte en un espacio 100% privado y confidencial. ¿Hay algo en particular que te gustaría compartir o desahogar?`;
        }

        setMessages([
          {
            sender: 'agent',
            text: greetingText,
          },
        ]);
        setStep(3);
      }
    } catch (error: any) {
      console.error('Error initializing chat:', error);
      let errMsg = 'No se pudo conectar con el Terapeuta. Por favor, intenta de nuevo o comunícate con el área de SST.';
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errMsg = 'El servidor tardó en responder. Por favor, intenta de nuevo en unos segundos.';
      } else if (error.response?.data?.error) {
        errMsg = error.response.data.error;
      }
      setChatError(errMsg);
    } finally {
      setStartingChat(false);
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
    let accumulatedText = '';
    setMessages((prev) => [...prev, { sender: 'agent', text: '' }]);

    try {
      const selectedLabels = selectedStressors.map(
        (id) => stressorsList.find((s) => s.id === id)?.label || id
      );

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
            model: 'gemini-3.5-flash-lite',
            model_parameters: {
              model: 'gemini-3.5-flash-lite',
            },
          },
          isPublicChat: true,
          moodContext: {
            mood: selectedMood || 'neutral',
            department: department.trim(),
            stressors: selectedLabels,
          },
        }),
      });

      if (!response.ok) {
        let errMessage = 'Error al comunicarse con el Terapeuta';
        try {
          const errData = await response.json();
          errMessage = errData.error || errData.message || errMessage;
        } catch (e) {}
        throw new Error(errMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

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
      // Solicitar al backend sintetizar un caso de seguimiento SG-SST 100% confidencial
      await axios.post(
        `/api/public-sgsst/mood/finish/${telemetryId}`,
        {
          stressors: selectedStressors,
          department: department.trim(),
          messages: messages.map((m) => ({ sender: m.sender, text: m.text })),
        },
        { timeout: 12000 }
      );
    } catch (error) {
      console.warn('Fallback en finalización de chat:', error);
      try {
        const areaSuffix = department.trim() ? ` en el área de ${department.trim()}` : '';
        const selectedLabels = selectedStressors.map(
          (id) => stressorsList.find((s) => s.id === id)?.label || id
        );
        const stressorsSummary = selectedLabels.length > 0 ? selectedLabels.join(', ') : 'Sobrecarga y ritmo laboral';
        const fallbackRecs: string[] = [];
        if (selectedStressors.includes('sobrecarga')) fallbackRecs.push(`Evaluar volumen de tareas y redistribuir cargas de trabajo operativas${areaSuffix}`);
        if (selectedStressors.includes('liderazgo')) fallbackRecs.push(`Fomentar comunicación asertiva y espacios de escucha con líderes`);
        if (selectedStressors.includes('entorno')) fallbackRecs.push(`Revisar condiciones físicas del puesto y herramientas asignadas${areaSuffix}`);
        if (selectedStressors.includes('personal')) fallbackRecs.push(`Ofrecer orientación y apoyo desde los programas de bienestar laboral`);
        if (selectedStressors.includes('funciones')) fallbackRecs.push(`Clarificar responsabilidades y objetivos operativos${areaSuffix}`);
        if (selectedStressors.includes('fatiga')) fallbackRecs.push(`Programar pausas activas sistemáticas y vigilar límites de jornada`);
        if (fallbackRecs.length === 0) fallbackRecs.push(`Monitorear factores de riesgo psicosocial y pausas activas${areaSuffix}`);

        const tailoredFallbackRec = fallbackRecs.slice(0, 2).join('. ') + '.';
        await axios.post(`/api/public-sgsst/mood/update/${telemetryId}`, {
          stressors: selectedStressors,
          details: `📋 Caso de Seguimiento SG-SST (Confidencial):\n• Factores de Riesgo Laboral: ${stressorsSummary}.\n• Recomendación de Intervención: ${tailoredFallbackRec}\n• Orientación Brindada: El colaborador completó una sesión privada de orientación emocional con el Terapeuta en Salud Mental.`,
        });
      } catch (e) {}
    } finally {
      setStep(4);
    }
  };

  if (loadingCompany) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-800">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4 shadow-sm animate-pulse">
          <Shield className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold font-sans tracking-tight text-slate-900">Cargando Termómetro Psicosocial...</h2>
        <p className="text-slate-500 mt-2 text-xs">Conectando con el portal seguro y confidencial de tu empresa</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-800">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center mb-4 shadow-sm">
          <AlertCircle className="w-8 h-8 text-rose-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Enlace No Válido</h2>
        <p className="text-slate-500 mt-2 text-xs max-w-xs leading-relaxed">El código QR o enlace escaneado no corresponde a ninguna empresa activa en el sistema.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-text-primary flex flex-col transition-colors">
      {/* Header Unificado WAPPY */}
      <PublicWorkerHeader
        companyName={company.companyName}
        companyLogo={company.logo}
        companyId={company._id || companyId}
        currentModule="animo"
        currentApp="termometro"
        title="Termómetro Psicosocial"
        subtitle="100% Anónimo y Voluntario • Bienestar Emocional"
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-5 max-w-md mx-auto w-full z-10 my-auto">
        
        {/* SCREEN: ALREADY REPORTED TODAY */}
        {alreadyReportedToday ? (
          <div className="w-full bg-surface-primary dark:bg-slate-900 rounded-3xl border border-border-medium p-6 sm:p-7 text-center space-y-5 shadow-xl animate-fadeIn">
            <div className="inline-flex p-4 rounded-3xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 shadow-xs">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-text-primary tracking-tight">¡Ya registraste tu reporte hoy!</h2>
              <p className="text-xs text-text-secondary">Tu estado de ánimo fue recibido correctamente</p>
            </div>
            
            <div className="bg-surface-secondary/50 dark:bg-slate-800/40 border border-border-medium rounded-2xl p-5 text-xs text-text-secondary leading-relaxed text-left space-y-3">
              <p>
                Para garantizar la objetividad y transparencia de las estadísticas de bienestar laboral de la empresa, solo se permite registrar un reporte al día desde este equipo.
              </p>
              <div className="p-3 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 rounded-xl text-teal-800 dark:text-teal-300 text-xs font-semibold flex items-center gap-2">
                <span>✨</span>
                <span>¡Gracias por participar y cuidar tu bienestar emocional! Podrás registrarte mañana de nuevo.</span>
              </div>
            </div>

            {/* Desbloqueo directo para administradores o demostraciones */}
            <div className="pt-3 border-t border-border-medium/60 space-y-2">
              <p className="text-[11px] text-text-tertiary font-medium">¿Eres administrador o estás realizando una prueba?</p>
              <button
                onClick={handleUnlockDemo}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Habilitar Modo Demostración (Ilimitado)</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* STEP 1: WELCOME & MOOD SELECT */}
            {step === 1 && (
              <div className="w-full bg-surface-primary dark:bg-slate-900 rounded-3xl border border-border-medium p-6 sm:p-7 shadow-xl space-y-5 animate-fadeIn">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 flex-wrap mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-black border border-teal-200 dark:border-teal-800 shadow-xs">
                      <Award className="w-3.5 h-3.5" /> +10 pts Pasaporte SST
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-border-medium">
                      Res. 2764 de 2022 • Ley 1616 de 2013
                    </span>
                  </div>

                  {isDemoMode && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 rounded-full text-[10px] font-bold tracking-wide uppercase mb-1 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Modo Demostración / Pruebas Activo</span>
                    </div>
                  )}
                  <div className="inline-flex p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 mb-1 shadow-xs">
                    <Heart className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-text-primary">¿Cómo te sientes hoy?</h2>
                  <p className="text-xs text-text-secondary leading-relaxed px-2">
                    Queremos saber cómo estás. Tu respuesta es estrictamente anónima y ayuda a evaluar el clima laboral conforme a la Batería de Riesgo Psicosocial vigente (Res. 2764 de 2022).
                  </p>
                </div>

                {/* Department input */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    Área o Departamento (Opcional)
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Ej: Operaciones, Administración, Ventas..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                </div>

                {/* Mood selector cards */}
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleMoodSelect('happy')}
                    disabled={submittingMood}
                    className="group relative flex items-center justify-between p-4 bg-emerald-50/50 hover:bg-emerald-50/90 border-2 border-emerald-200 hover:border-emerald-400 rounded-2xl text-left transition-all duration-200 shadow-xs hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                        <Smile className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-emerald-950">Feliz / Motivado</h3>
                        <p className="text-[11px] text-emerald-700 mt-0.5">Me siento valorado y con energía hoy.</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleMoodSelect('neutral')}
                    disabled={submittingMood}
                    className="group relative flex items-center justify-between p-4 bg-amber-50/50 hover:bg-amber-50/90 border-2 border-amber-200 hover:border-amber-400 rounded-2xl text-left transition-all duration-200 shadow-xs hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-amber-500 text-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                        <Meh className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-amber-950">Tranquilo / Estable</h3>
                        <p className="text-[11px] text-amber-700 mt-0.5">Mi día transcurre con normalidad.</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  <button
                    onClick={() => handleMoodSelect('sad')}
                    disabled={submittingMood}
                    className="group relative flex items-center justify-between p-4 bg-rose-50/50 hover:bg-rose-50/90 border-2 border-rose-200 hover:border-rose-400 rounded-2xl text-left transition-all duration-200 shadow-xs hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-rose-500 text-white rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                        <Frown className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-rose-950">Estresado / Agotado</h3>
                        <p className="text-[11px] text-rose-700 mt-0.5">Siento sobrecarga, cansancio o malestar.</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-rose-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {submittingMood && (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium pt-1">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    Registrando respuesta...
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: STRESSORS & CHAT OPTION */}
            {step === 2 && (
              <div className="w-full bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm shadow-slate-200/50 space-y-6 animate-fadeIn">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">¿Qué factores influyen hoy?</h2>
                  <p className="text-xs text-slate-500">
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
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {stressor.label}
                      </button>
                    );
                  })}
                </div>

                {/* Special Therapist Invitation Box */}
                <div className="p-5 bg-gradient-to-br from-emerald-50 via-teal-50/30 to-slate-50 border border-emerald-200/90 rounded-2xl space-y-4 shadow-xs">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Heart className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide">Terapeuta en Riesgo Psicosocial</h3>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        ¿Quieres recibir pautas prácticas y desahogarte? Puedes chatear en privado con nuestro Terapeuta Especialista en Salud Mental y Riesgo Psicosocial. Nadie sabrá quién eres.
                      </p>
                    </div>
                  </div>

                  {chatError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 animate-fadeIn shadow-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold">{chatError}</p>
                        <p className="text-[11px] text-rose-600 mt-0.5">Puedes intentar conectarte de nuevo o continuar solo enviando tu reporte.</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSkipChat}
                      disabled={startingChat}
                      className="flex-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs transition-all disabled:opacity-60"
                    >
                      Solo enviar reporte
                    </button>
                    <button
                      onClick={handleStartChat}
                      disabled={startingChat}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      {startingChat ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        <>
                          Hablar con un Terapeuta
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PRIVATE CHAT */}
            {step === 3 && (
              <div className="w-full h-[78vh] flex flex-col bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md animate-fadeIn">
                {/* Chat Header */}
                <div className="p-3.5 bg-emerald-700 text-white flex justify-between items-center shrink-0 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center font-bold text-sm text-white">
                      🧠
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-tight">{agentName}</h3>
                      <p className="text-[10px] text-emerald-100 font-medium">Canal Confidencial y 100% Anónimo</p>
                    </div>
                  </div>
                  <button
                    onClick={handleFinishChat}
                    className="bg-white/15 hover:bg-white/25 border border-white/30 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                  >
                    Terminar
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50 scrollbar-thin">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                    >
                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          msg.sender === 'user'
                            ? 'bg-emerald-600 text-white rounded-tr-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                        }`}
                      >
                        {msg.sender === 'user' ? (
                          <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                        ) : (
                          msg.text ? (
                            <ReactMarkdown className="prose prose-slate text-xs max-w-none break-words prose-p:leading-relaxed prose-p:my-1 prose-headings:text-slate-900 prose-strong:text-slate-900 prose-ul:my-1 prose-li:my-0.5 whitespace-pre-wrap">
                              {msg.text}
                            </ReactMarkdown>
                          ) : (
                            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                              Escribiendo...
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                  {isTyping && messages[messages.length - 1]?.text !== '' && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-xs flex items-center gap-2 shadow-xs">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    disabled={isTyping}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white disabled:opacity-50 transition-all font-medium"
                  />
                  <button
                    type="submit"
                    disabled={isTyping || !inputText.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center shrink-0 shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
              <div className="w-full bg-white rounded-3xl border border-slate-200/80 p-7 text-center space-y-5 shadow-sm shadow-slate-200/50 animate-fadeIn">
                <div className="inline-flex p-4 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mb-1 shadow-xs">
                  <CheckCircle className="w-12 h-12" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">¡Gracias por participar!</h2>
                  <p className="text-xs text-slate-500">Tu respuesta fue registrada con éxito</p>
                </div>
                
                <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-2xl p-5 text-xs text-slate-700 leading-relaxed max-w-sm mx-auto space-y-2">
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

                {/* Gamificación Voluntaria: Reclamar +10 Puntos para Pasaporte SST */}
                <div className="w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-left space-y-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shrink-0">🎯</span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Suma +10 Puntos a tu Pasaporte SST</h4>
                      <p className="text-[11px] text-slate-500">Opcional: tu respuesta de ánimo sigue siendo 100% anónima</p>
                    </div>
                  </div>

                  {pointsClaimed ? (
                    <div className="p-3 rounded-xl bg-emerald-100/80 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{claimMessage || '¡+10 Puntos acreditados a tu Pasaporte SST!'}</span>
                    </div>
                  ) : (sessionWorker || session) && !editingCedula ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-black text-slate-800 truncate">{sessionWorker?.nombre || session?.nombre || 'Colaborador'}</p>
                          <p className="text-[11px] text-slate-500 font-mono">C.C. {claimCedula}</p>
                        </div>
                        <button
                          onClick={handleClaimMoodPoints}
                          disabled={claimingPoints || !claimCedula.trim()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5"
                        >
                          {claimingPoints ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          <span>¡Acreditar +10 Pts!</span>
                        </button>
                      </div>
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => setEditingCedula(true)}
                          className="text-[10px] text-emerald-700 hover:underline font-semibold"
                        >
                          ¿No eres tú? Cambiar cédula
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Ingresa tu cédula para sumar puntos..."
                          value={claimCedula}
                          onChange={(e) => setClaimCedula(e.target.value)}
                          className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-medium shadow-2xs"
                        />
                        <button
                          onClick={handleClaimMoodPoints}
                          disabled={claimingPoints || !claimCedula.trim()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5"
                        >
                          {claimingPoints ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          <span>Reclamar +10 Pts</span>
                        </button>
                      </div>
                      {editingCedula && (
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCedula(false);
                              setClaimCedula(sessionWorker?.cedula || session?.cedula || '');
                            }}
                            className="text-[10px] text-slate-500 hover:underline"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between border-t border-emerald-200/60 text-[11px]">
                    <span className="text-slate-500">¿Quieres revisar tu puntaje y nivel?</span>
                    <a
                      href={`/sgsst-public/colaborador/${companyId}/${claimCedula.trim() || ''}`}
                      className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Ver Mi Pasaporte SST</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="pt-1 flex flex-col items-center gap-2.5">
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 font-semibold shadow-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {isDemoMode
                        ? 'Demostración completada con éxito.'
                        : 'Reporte diario completado. Podrás registrarte de nuevo mañana.'}
                    </span>
                  </div>
                  {isDemoMode && (
                    <button
                      onClick={handleResetForNewDemo}
                      className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 mt-1"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Hacer otra prueba / demostración</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* Footer Unificado WAPPY */}
      <footer className="py-4 text-center text-[11px] text-text-tertiary border-t border-border-medium/40 mt-auto">
        Plataforma Inteligente de Seguridad y Salud en el Trabajo &mdash; Somos SST / WAPPY
      </footer>
    </div>
  );
}
