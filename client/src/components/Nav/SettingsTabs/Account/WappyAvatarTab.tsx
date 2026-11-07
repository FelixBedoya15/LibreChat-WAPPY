import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastContext } from '@librechat/client';
import {
  Bot,
  Sparkles,
  Volume2,
  Save,
  RotateCcw,
  UserCheck,
  Heart,
  Smile,
  Brain,
  Trophy,
  Check,
  Wand2,
  MapPin,
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { cn } from '~/utils';
import {
  TenshiAvatar,
  TenshiAvatarMood,
  triggerTenshiReaction,
} from '~/components/Tenshi/TenshiAvatar';
import { tenshiAudio } from '~/components/Tenshi/tenshiAudio';
import {
  TENSHI_AVATAR_PRESETS,
  TENSHI_VOICES,
  PERSONALITY_ARCHETYPES,
  REGIONAL_VOCAB_OPTIONS,
  getAvatarPresetById,
  TenshiAvatarPreset,
} from '~/components/Tenshi/tenshiAvatarCatalog';
import ExpandableButton from '~/components/Common/ExpandableButton';

interface AvatarFormState {
  avatarId: string;
  name: string;
  gender: 'masculino' | 'femenino' | 'neutro';
  voice: string;
  personality: string;
}

export default function WappyAvatarTab() {
  const { token } = useAuthContext();
  const { showToast } = useToastContext();
  const queryClient = useQueryClient();

  const [collectionTab, setCollectionTab] = useState<'custom' | 'classic'>('custom');
  const [previewMood, setPreviewMood] = useState<TenshiAvatarMood>('idle');
  const [hasCustomOverride, setHasCustomOverride] = useState<boolean>(false);
  const [selectedTraitId, setSelectedTraitId] = useState<string>('amigable');
  const [selectedDialectId, setSelectedDialectId] = useState<string>('');

  const [form, setForm] = useState<AvatarFormState>(() => {
    const initialPreset = getAvatarPresetById(
      typeof window !== 'undefined' ? localStorage.getItem('wappy_active_avatar_id') : 'gato'
    );
    return {
      avatarId: initialPreset.id,
      name: initialPreset.defaultPersonaName,
      gender: initialPreset.defaultGender,
      voice: initialPreset.defaultVoice,
      personality: initialPreset.defaultPersonality,
    };
  });

  const { data: avatarData, isLoading } = useQuery(
    ['tenshiUserAvatar', token],
    async () => {
      const compId =
        typeof window !== 'undefined' ? localStorage.getItem('wappy_active_company_id') || '' : '';
      const q = compId ? `?companyId=${encodeURIComponent(compId)}` : '';
      try {
        const res = await axios.get(`/api/tenshi/user-avatar${q}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return res.data;
      } catch {
        const fallback = await axios.get(`/api/tenshi/config${q}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        return {
          effective: fallback.data?.effectiveAvatar || {
            avatarId: fallback.data?.defaultAvatarId || 'gato',
            name: fallback.data?.name || 'Tenshi',
            gender: fallback.data?.defaultGender || 'masculino',
            voice: fallback.data?.defaultVoice || 'Puck',
            personality:
              fallback.data?.defaultPersonality ||
              'Amigable, carismático, servicial y siempre con buena energía para ayudarte.',
          },
          userCustom: null,
        };
      }
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  useEffect(() => {
    const handleCompanySwitch = () => {
      queryClient.invalidateQueries(['tenshiUserAvatar']);
      queryClient.invalidateQueries(['tenshiConfig']);
    };
    window.addEventListener('wappy-company-changed', handleCompanySwitch);
    window.addEventListener('wappy-company-updated', handleCompanySwitch);
    window.addEventListener('wappy-empresa-cambiada', handleCompanySwitch);
    return () => {
      window.removeEventListener('wappy-company-changed', handleCompanySwitch);
      window.removeEventListener('wappy-company-updated', handleCompanySwitch);
      window.removeEventListener('wappy-empresa-cambiada', handleCompanySwitch);
    };
  }, [queryClient]);

  useEffect(() => {
    if (avatarData?.effective) {
      const eff = avatarData.effective;
      const preset = getAvatarPresetById(eff.avatarId);
      const loadedPersonality = eff.personality || preset.defaultPersonality;
      setForm({
        avatarId: preset.id,
        name: eff.name || preset.defaultPersonaName,
        gender:
          eff.gender === 'femenino' || eff.gender === 'neutro' ? eff.gender : 'masculino',
        voice: eff.voice || preset.defaultVoice,
        personality: loadedPersonality,
      });
      setCollectionTab(preset.collection);
      setHasCustomOverride(Boolean(avatarData.userCustom?.avatarId || avatarData.userCustom?.name));

      const matchedTrait = PERSONALITY_ARCHETYPES.find((a) =>
        loadedPersonality.includes(a.prompt)
      );
      if (matchedTrait) setSelectedTraitId(matchedTrait.id);

      const matchedDialect = REGIONAL_VOCAB_OPTIONS.find((d) =>
        loadedPersonality.includes(d.prompt)
      );
      if (matchedDialect) setSelectedDialectId(matchedDialect.id);
    }
  }, [avatarData]);

  const activePreset = useMemo(() => getAvatarPresetById(form.avatarId), [form.avatarId]);

  const filteredPresets = useMemo(
    () => TENSHI_AVATAR_PRESETS.filter((p) => p.collection === collectionTab),
    [collectionTab]
  );

  const saveMutation = useMutation(
    async (payload: Partial<AvatarFormState> & { resetToDefault?: boolean }) => {
      const compId =
        typeof window !== 'undefined' ? localStorage.getItem('wappy_active_company_id') || '' : '';
      const res = await axios.post(
        '/api/tenshi/user-avatar',
        { ...payload, ...(compId ? { companyId: compId } : {}) },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return res.data;
    },
    {
      onSuccess: (data, variables) => {
        const effective = data?.effective || {
          avatarId: form.avatarId,
          name: form.name,
          gender: form.gender,
          voice: form.voice,
          personality: form.personality,
        };
        try {
          localStorage.setItem('wappy_active_avatar_id', effective.avatarId || 'gato');
          localStorage.setItem('wappy_active_avatar_profile', JSON.stringify(effective));
        } catch (_) {}

        window.dispatchEvent(
          new CustomEvent('wappy-avatar-updated', { detail: effective })
        );

        queryClient.invalidateQueries(['tenshiConfig']);
        queryClient.invalidateQueries(['tenshiConfigAdmin']);
        queryClient.invalidateQueries(['tenshiUserAvatar']);

        tenshiAudio.playSuccess();
        triggerTenshiReaction('success', 2600);

        showToast({
          message: variables.resetToDefault
            ? 'Avatar restaurado a la configuración por defecto de la plataforma'
            : `¡Tu Avatar Wappy (${effective.name}) ha sido guardado y activado!`,
          status: 'success',
        });
      },
      onError: () => {
        showToast({
          message: 'No se pudo guardar la personalización de tu Avatar Wappy',
          status: 'error',
        });
      },
    }
  );

  const handleSelectCharacter = (preset: TenshiAvatarPreset) => {
    tenshiAudio.playBlip();
    setForm((prev) => {
      const prevPreset = getAvatarPresetById(prev.avatarId);
      const isUsingDefaultName = !prev.name?.trim() || prev.name === prevPreset.defaultPersonaName;
      const isUsingDefaultPersonality =
        !prev.personality?.trim() || prev.personality === prevPreset.defaultPersonality;
      const isUsingDefaultVoice = !prev.voice || prev.voice === prevPreset.defaultVoice;

      return {
        avatarId: preset.id,
        name: isUsingDefaultName ? preset.defaultPersonaName : prev.name,
        gender: isUsingDefaultName ? preset.defaultGender : prev.gender,
        voice: isUsingDefaultVoice ? preset.defaultVoice : prev.voice,
        personality: isUsingDefaultPersonality ? preset.defaultPersonality : prev.personality,
      };
    });
    setPreviewMood('greeting');
    setTimeout(() => setPreviewMood('idle'), 2000);
  };

  const handleApplyCharacterDefaults = () => {
    tenshiAudio.playSuccess();
    setForm((prev) => ({
      ...prev,
      name: activePreset.defaultPersonaName,
      gender: activePreset.defaultGender,
      voice: activePreset.defaultVoice,
      personality: activePreset.defaultPersonality,
    }));
    setSelectedDialectId('');
    setPreviewMood('love');
    setTimeout(() => setPreviewMood('idle'), 2200);
    showToast({
      message: `Identidad sugerida de ${activePreset.defaultPersonaName} aplicada`,
      status: 'info',
    });
  };

  const buildCombinedPersonality = (traitId: string, dialectId: string) => {
    const trait = PERSONALITY_ARCHETYPES.find((t) => t.id === traitId);
    const dialect = REGIONAL_VOCAB_OPTIONS.find((d) => d.id === dialectId);
    const parts: string[] = [];
    if (trait) parts.push(trait.prompt);
    if (dialect) parts.push(dialect.prompt);
    return parts.join(' ') || activePreset.defaultPersonality;
  };

  const handleSelectTrait = (traitId: string) => {
    tenshiAudio.playBlip();
    setSelectedTraitId(traitId);
    const combined = buildCombinedPersonality(traitId, selectedDialectId);
    setForm((prev) => ({ ...prev, personality: combined }));
  };

  const handleSelectDialect = (dialectId: string) => {
    tenshiAudio.playBlip();
    const nextDialect = selectedDialectId === dialectId ? '' : dialectId;
    setSelectedDialectId(nextDialect);
    const combined = buildCombinedPersonality(selectedTraitId, nextDialect);
    setForm((prev) => ({ ...prev, personality: combined }));
  };

  const handleTestEmotion = (mood: TenshiAvatarMood) => {
    tenshiAudio.playBlip();
    setPreviewMood(mood);
    triggerTenshiReaction(mood, 2500);
    setTimeout(() => setPreviewMood('idle'), 2500);
  };

  const handleTestVoiceGreeting = () => {
    tenshiAudio.playSuccess();
    setPreviewMood('greeting');
    triggerTenshiReaction('greeting', 2600);
    setTimeout(() => setPreviewMood('idle'), 2600);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const displayName = form.name || activePreset.defaultPersonaName;
        const pLower = (form.personality || '').toLowerCase();
        let sampleText = `¡Hola! Soy ${displayName}, y estoy aquí para ayudarte en todo lo que necesites.`;
        if (pLower.includes('paisa') || selectedDialectId === 'paisa') {
          sampleText = `¡Quiubo pues! Soy ${displayName}, ¡qué alegría saludarte pues! Hágale que aquí estoy pa' ayudarte con mucho gusto.`;
        } else if (pLower.includes('coste') || pLower.includes('caribe') || selectedDialectId === 'costeno') {
          sampleText = `¡Ajá, mi llave! Soy ${displayName}, todo firme y bacano por acá para ayudarte en lo que necesites.`;
        } else if (pLower.includes('cale') || pLower.includes('vallun') || selectedDialectId === 'caleno') {
          sampleText = `¡Oí, ve! Mirá, soy ${displayName}, ¡qué chévere saludarte! De una te ayudo con toda la actitud, ¿oís?`;
        } else if (pLower.includes('rolo') || pLower.includes('bogot') || selectedDialectId === 'rolo') {
          sampleText = `¡Qué más, cómo vas! Soy ${displayName}, fresco que de una te ayudo con lo que necesites.`;
        } else if (pLower.includes('santander') || selectedDialectId === 'santandereano') {
          sampleText = `¡Quiubo mano! Soy ${displayName}, hágale sin miedo que aquí vamos directo al grano.`;
        } else if (pLower.includes('llaner') || selectedDialectId === 'llanero') {
          sampleText = `¡Buen día, pariente! Soy ${displayName}, pa'lante es que vamos camarita.`;
        } else if (pLower.includes('pastus') || pLower.includes('nariñ') || selectedDialectId === 'pastuso') {
          sampleText = `¡Qué fue pues! Soy ${displayName}, aquí estoy con mucho cariño pues para ayudarte.`;
        }
        const utterance = new SpeechSynthesisUtterance(sampleText);
        utterance.lang = 'es-CO';
        utterance.rate = 1.04;
        utterance.pitch = form.gender === 'femenino' ? 1.18 : 0.98;
        window.speechSynthesis.speak(utterance);
      } catch (_) {}
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-slate-500 dark:text-zinc-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        <span>Cargando estudio de personalización de Avatar Wappy...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {/* HERO PREVIEW CARD */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-gradient-to-br from-slate-50/90 via-white to-teal-50/40 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-teal-950/20 p-5 sm:p-6 shadow-sm">
        {/* Ambient Glows */}
        <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-teal-500/10 blur-3xl" />

        <div className="relative flex flex-col md:flex-row items-center gap-6">
          {/* Interactive Avatar Stage */}
          <div className="relative flex flex-col items-center justify-center rounded-2xl border border-emerald-500/25 bg-white/80 dark:bg-zinc-950/70 px-6 py-4 shadow-inner shrink-0">
            <TenshiAvatar
              size={150}
              avatarId={form.avatarId}
              mood={previewMood}
              interactive={true}
              showHaloEffect={true}
              showHUD={true}
            />
            <span className="mt-1 text-[10px] font-medium text-slate-400 dark:text-zinc-500">
              Pasa el cursor o haz clic sobre {form.name || activePreset.defaultPersonaName}
            </span>
          </div>

          {/* Info & Emotion Tester */}
          <div className="flex-1 min-w-0 space-y-3 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold',
                  hasCustomOverride
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                )}
              >
                <UserCheck className="h-3.5 w-3.5" />
                {hasCustomOverride
                  ? 'Personalizado para tu cuenta'
                  : 'Usando avatar predeterminado de WAPPY'}
              </span>

              <span className="inline-flex items-center gap-1 rounded-xl border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 text-xs font-bold text-teal-700 dark:text-teal-300">
                🎙️ Voz: {form.voice} (
                {form.gender === 'femenino'
                  ? 'Femenino'
                  : form.gender === 'neutro'
                  ? 'Neutro'
                  : 'Masculino'}
                )
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-green-500 to-cyan-500 bg-clip-text text-transparent">
                {form.name || activePreset.defaultPersonaName}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-zinc-300 line-clamp-2">
                {form.personality || activePreset.defaultPersonality}
              </p>
            </div>

            {/* Botonera de prueba de emociones + Restaurar */}
            <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-2">
              <ExpandableButton
                type="button"
                size="sm"
                variant="emerald"
                icon={<Smile className="h-3.5 w-3.5" />}
                label="Saludar"
                onClick={() => handleTestEmotion('greeting')}
              />
              <ExpandableButton
                type="button"
                size="sm"
                variant="amber"
                icon={<Brain className="h-3.5 w-3.5" />}
                label="Pensando"
                onClick={() => handleTestEmotion('thinking')}
              />
              <ExpandableButton
                type="button"
                size="sm"
                variant="teal"
                icon={<Trophy className="h-3.5 w-3.5" />}
                label="Celebrar"
                onClick={() => handleTestEmotion('success')}
              />
              <ExpandableButton
                type="button"
                size="sm"
                variant="fuchsia"
                icon={<Heart className="h-3.5 w-3.5" />}
                label="Cariño"
                onClick={() => handleTestEmotion('love')}
              />
              <ExpandableButton
                type="button"
                size="sm"
                variant="purple"
                icon={<Wand2 className="h-3.5 w-3.5" />}
                label="Usar identidad sugerida del personaje"
                onClick={handleApplyCharacterDefaults}
              />
              {hasCustomOverride && (
                <ExpandableButton
                  type="button"
                  size="sm"
                  variant="neutral"
                  icon={<RotateCcw className="h-3.5 w-3.5" />}
                  label="Restaurar por defecto"
                  onClick={() => saveMutation.mutate({ resetToDefault: true })}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: ELIGE TU AVATAR WAPPY */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Bot className="h-4 w-4 text-teal-500" />
              1. Elige tu Personaje Avatar Wappy
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Selecciona entre los trajes especiales o la colección con el uniforme clásico.
            </p>
          </div>

          {/* Collection Selector Pills */}
          <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-zinc-800/90 border border-slate-200/80 dark:border-zinc-700 self-start">
            <button
              type="button"
              onClick={() => setCollectionTab('custom')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                collectionTab === 'custom'
                  ? 'bg-teal-500/15 border border-teal-500/40 text-teal-700 dark:text-teal-300 shadow-2xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              )}
            >
              ✨ Colección Especial (5)
            </button>
            <button
              type="button"
              onClick={() => setCollectionTab('classic')}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                collectionTab === 'classic'
                  ? 'bg-teal-500/15 border border-teal-500/40 text-teal-700 dark:text-teal-300 shadow-2xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              )}
            >
              🦺 Uniforme Clásico (4)
            </button>
          </div>
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {filteredPresets.map((preset) => {
            const isSelected = form.avatarId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectCharacter(preset)}
                className={cn(
                  'group relative flex flex-col items-center justify-between rounded-2xl border p-3 transition-all duration-200 cursor-pointer select-none',
                  isSelected
                    ? 'border-teal-500 bg-teal-500/10 dark:bg-teal-950/40 ring-2 ring-teal-500/30 shadow-md'
                    : 'border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/40 hover:border-teal-500/40 hover:bg-teal-500/5'
                )}
              >
                <div className="w-full flex items-center justify-end min-h-[16px]">
                  {isSelected && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-md bg-teal-500 text-white shrink-0">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div className="my-1 flex items-center justify-center">
                  <TenshiAvatar
                    size={90}
                    avatarId={preset.id}
                    interactive={false}
                    showHaloEffect={isSelected}
                    showHUD={true}
                  />
                </div>

                <div className="w-full text-center mt-1">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-zinc-100 truncate">
                    {preset.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: IDENTIDAD: NOMBRE, SEXO Y VOZ */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-5 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-cyan-500" />
              2. Identidad: Nombre, Sexo y Voz en Vivo
            </h4>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Configura cómo se llama tu asistente, su concordancia gramatical y su timbre de voz en Gemini Live.
            </p>
          </div>
          <ExpandableButton
            type="button"
            size="sm"
            variant="cyan"
            icon={<Volume2 className="h-3.5 w-3.5" />}
            label="Probar saludo"
            onClick={handleTestVoiceGreeting}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre del Avatar */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300 mb-1.5">
              Nombre de tu Avatar
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Tenshi, Suri, Max, Paz, Capi..."
              maxLength={40}
              className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-zinc-100 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">
              Tu avatar se presentará y responderá cuando lo llames por este nombre.
            </p>
          </div>

          {/* Sexo / Concordancia */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300 mb-1.5">
              Sexo / Género Gramatical
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'masculino', label: 'Masculino', desc: 'Listo / Amigo' },
                  { id: 'femenino', label: 'Femenino', desc: 'Lista / Amiga' },
                  { id: 'neutro', label: 'Neutro', desc: 'Lenguaje neutro' },
                ] as const
              ).map((g) => {
                const active = form.gender === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      tenshiAudio.playBlip();
                      setForm((prev) => ({ ...prev, gender: g.id }));
                    }}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all cursor-pointer',
                      active
                        ? 'border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold ring-1 ring-teal-500/30'
                        : 'border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:border-teal-500/40'
                    )}
                  >
                    <span className="text-xs font-bold">{g.label}</span>
                    <span className="text-[10px] opacity-75">{g.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selector de Voz Gemini Live */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300 mb-2">
            Voz de IA en Tiempo Real (Gemini Multimodal Live)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {TENSHI_VOICES.map((v) => {
              const isSelected = form.voice === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    tenshiAudio.playBlip();
                    setForm((prev) => ({ ...prev, voice: v.id }));
                  }}
                  className={cn(
                    'flex flex-col items-start justify-between rounded-xl border p-3 text-left transition-all cursor-pointer',
                    isSelected
                      ? 'border-teal-500 bg-teal-500/10 dark:bg-teal-950/40 ring-1 ring-teal-500/30 shadow-xs'
                      : 'border-slate-200/80 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/50 hover:border-teal-500/40'
                  )}
                >
                  <div className="w-full flex items-center justify-between gap-1 mb-1">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-zinc-100">
                      🎙️ {v.name}
                    </span>
                    <span
                      className={cn(
                        'rounded-md px-1.5 py-0.5 text-[9px] font-bold border',
                        v.gender === 'femenino'
                          ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-700 dark:text-fuchsia-300'
                          : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300'
                      )}
                    >
                      {v.genderLabel}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-teal-700 dark:text-teal-300">
                    {v.tone}
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-2">
                    {v.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: PERSONALIDAD Y VOCABLO REGIONAL */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-5 shadow-xs space-y-4">
        <div>
          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            3. Personalidad y Vocablo Regional
          </h4>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Elige su personalidad y el tipo de vocablo o acento regional colombiano con el que quieres que te hable.
          </p>
        </div>

        {/* Row A: Personalidades */}
        <div className="space-y-1.5">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Estilo de Personalidad
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {PERSONALITY_ARCHETYPES.map((arch) => {
              const isCurrent =
                selectedTraitId === arch.id ||
                (form.personality || '').includes(arch.prompt);
              return (
                <button
                  key={arch.id}
                  type="button"
                  onClick={() => handleSelectTrait(arch.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95',
                    isCurrent
                      ? 'border-purple-500/50 bg-purple-500/15 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30'
                      : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:border-purple-500/40 hover:bg-purple-500/10'
                  )}
                >
                  <span>{arch.emoji}</span>
                  <span>{arch.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row B: Vocablo / Modismo de Zonas de Colombia */}
        <div className="space-y-1.5">
          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            <MapPin className="h-3.5 w-3.5" />
            Vocablo y Modismos por Zona de Colombia
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {REGIONAL_VOCAB_OPTIONS.map((reg) => {
              const isCurrent =
                selectedDialectId === reg.id ||
                (form.personality || '').includes(reg.prompt);
              return (
                <button
                  key={reg.id}
                  type="button"
                  onClick={() => handleSelectDialect(reg.id)}
                  title={reg.region}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95',
                    isCurrent
                      ? 'border-teal-500/50 bg-teal-500/15 text-teal-700 dark:text-teal-300 ring-1 ring-teal-500/30'
                      : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:border-teal-500/40 hover:bg-teal-500/10'
                  )}
                >
                  <span>{reg.emoji}</span>
                  <span>{reg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <textarea
            rows={3}
            value={form.personality}
            onChange={(e) => setForm((prev) => ({ ...prev, personality: e.target.value }))}
            maxLength={600}
            placeholder="Ej: Sé muy alegre y cercano, háblame con modismos paisas ('¡Quiubo pues!', 'parcero', 'hágale pues') y con buen sentido del humor..."
            className="w-full rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3.5 text-xs sm:text-sm text-slate-900 dark:text-zinc-100 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
            <span>Se aplica en tiempo real tanto en el chat escrito como en la voz en vivo.</span>
            <span>{(form.personality || '').length}/600</span>
          </div>
        </div>
      </div>

      {/* FOOTER: SAVE BUTTON */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-500/30 bg-teal-500/5 dark:bg-teal-950/20 p-4">
        <div className="text-xs text-slate-600 dark:text-zinc-300">
          <span className="font-bold text-teal-700 dark:text-teal-300">Sincronización Instantánea:</span>{' '}
          Al guardar, tu nuevo avatar se actualizará inmediatamente en toda la plataforma.
        </div>
        <div className="flex items-center gap-2">
          <ExpandableButton
            type="button"
            size="md"
            variant="teal"
            disabled={saveMutation.isLoading}
            icon={<Save className="h-4 w-4" />}
            label={saveMutation.isLoading ? 'Guardando...' : 'Guardar Mi Avatar Wappy'}
            onClick={() =>
              saveMutation.mutate({
                avatarId: form.avatarId,
                name: (form.name || '').trim() || activePreset.defaultPersonaName,
                gender: form.gender,
                voice: form.voice,
                personality:
                  (form.personality || '').trim() || activePreset.defaultPersonality,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
