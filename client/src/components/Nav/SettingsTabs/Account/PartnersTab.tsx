import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys } from 'librechat-data-provider';
import { Sparkles, Briefcase, Quote, CheckCircle2 } from 'lucide-react';
import { Input, Label, useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';
import { WappyExpandButton } from '../WappyExpandButton';
import ReferralPanel from './ReferralPanel';

function PartnersTab() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthContext();
  const { showToast } = useToastContext();

  const [sstProfile, setSstProfile] = useState({
    profession: '',
    yearsExperience: '',
    sstExperience: '',
    specialties: '',
    quote: '',
    storyParagraph1: '',
    storyParagraph2: '',
  });
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isSavingSstProfile, setIsSavingSstProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setSstProfile({
        profession: (user as any).profession || '',
        yearsExperience: (user as any).yearsExperience || '',
        sstExperience: (user as any).sstExperience || (user as any).bio || '',
        specialties: Array.isArray((user as any).specialties) ? (user as any).specialties.join(', ') : '',
        quote: (user as any).quote || '',
        storyParagraph1: (user as any).storyParagraph1 || '',
        storyParagraph2: (user as any).storyParagraph2 || '',
      });
    }
  }, [user]);

  const handleGenerateBioWithAI = async () => {
    if (!sstProfile.sstExperience && !sstProfile.profession) {
      showToast({
        message: 'Por favor escribe tu profesión o un resumen de tu experiencia en SST primero.',
        status: 'warning',
      });
      return;
    }
    try {
      setIsGeneratingBio(true);
      const res = await axios.post('/api/referrals/profile/generate-bio', {
        name: user?.name,
        profession: sstProfile.profession,
        yearsExperience: sstProfile.yearsExperience,
        sstExperience: sstProfile.sstExperience,
      });
      const data = res.data?.data;
      if (data) {
        setSstProfile((prev) => ({
          ...prev,
          profession: data.profession || prev.profession,
          yearsExperience: data.yearsExperience || prev.yearsExperience,
          specialties: Array.isArray(data.specialties) ? data.specialties.join(', ') : prev.specialties,
          quote: data.quote || prev.quote,
          storyParagraph1: data.storyParagraph1 || prev.storyParagraph1,
          storyParagraph2: data.storyParagraph2 || prev.storyParagraph2,
        }));
        showToast({ message: '¡Perfil profesional generado y pulido con IA con éxito!', status: 'success' });
      }
    } catch (err: any) {
      showToast({ message: err.response?.data?.message || 'Error al generar perfil con IA.', status: 'error' });
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleSaveSstProfile = async () => {
    try {
      setIsSavingSstProfile(true);
      const specsArray = sstProfile.specialties
        ? sstProfile.specialties
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const payload = {
        profession: sstProfile.profession,
        yearsExperience: sstProfile.yearsExperience,
        sstExperience: sstProfile.sstExperience,
        bio: sstProfile.sstExperience,
        specialties: specsArray,
        quote: sstProfile.quote,
        storyParagraph1: sstProfile.storyParagraph1,
        storyParagraph2: sstProfile.storyParagraph2,
      };

      const res = await axios.post('/api/user/update', payload);
      setUser(res.data.user);
      queryClient.invalidateQueries([QueryKeys.memories]);
      showToast({ message: '¡Perfil profesional y memoria IA guardados correctamente!', status: 'success' });
    } catch (err: any) {
      showToast({ message: err.response?.data?.message || 'Error al guardar perfil profesional.', status: 'error' });
    } finally {
      setIsSavingSstProfile(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-2 text-sm text-text-primary">
      {/* PROGRAMA DE PUNTOS, PANEL DE SOCIO COMERCIAL / EMBAJADOR Y SOLICITUD DE AFILIACIÓN */}
      <ReferralPanel />

      {/* PERFIL PROFESIONAL & EXPERIENCIA SST (LANDING DE EMBAJADOR) */}
      <div className="flex flex-col gap-4 p-4 sm:p-6 rounded-2xl border border-teal-500/30 bg-surface-primary shadow-sm relative overflow-hidden">
        <div className="flex flex-col gap-2 pb-3 border-b border-border-light">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-text-primary">Perfil Profesional & Experiencia SST</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 whitespace-nowrap">
              Landing de Embajador
            </span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Personaliza tu presentación profesional. Esta información y tu avatar se mostrarán en tu enlace de
            embajador en la sección <strong className="text-text-primary font-semibold">"Mucho gusto, soy..."</strong>.
          </p>
        </div>

        <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-teal-500/10 border border-teal-500/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-text-primary text-xs">Asistente de Redacción IA (Gemini)</p>
              <p className="text-[11px] text-text-secondary truncate">
                Escribe tu trayectoria o profesión y genera tu presentación con un clic.
              </p>
            </div>
          </div>

          <WappyExpandButton
            type="button"
            variant="orange"
            onClick={handleGenerateBioWithAI}
            disabled={isGeneratingBio}
            isLoading={isGeneratingBio}
            icon={<Sparkles className="w-4 h-4" />}
            label="Redactar / Pulir con IA"
            title="Genera tu biografía y cita profesional automáticamente con IA"
          />
        </div>

        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-text-secondary uppercase">
                Profesión / Especialidad en SST <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="text"
                value={sstProfile.profession}
                onChange={(e) => setSstProfile({ ...sstProfile, profession: e.target.value })}
                placeholder="Ej. Psicólogo Especialista SST, Profesional SST..."
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-text-secondary uppercase">
                Años de Experiencia en el Sector
              </Label>
              <Input
                type="text"
                value={sstProfile.yearsExperience}
                onChange={(e) => setSstProfile({ ...sstProfile, yearsExperience: e.target.value })}
                placeholder="Ej. +8 Años de Experiencia, +5 Años..."
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-bold text-text-secondary uppercase">
              Tu Trayectoria, Sectores y Experiencia en SST
            </Label>
            <textarea
              rows={3}
              value={sstProfile.sstExperience}
              onChange={(e) => setSstProfile({ ...sstProfile, sstExperience: e.target.value })}
              placeholder="Cuéntanos brevemente quién eres: sectores en los que has trabajado (salud, construcción, eléctrico...), licencias, matrices que dominas o tu enfoque preventivo. La IA usará esto para redactar tu presentación."
              className="w-full mt-1 bg-surface-secondary border border-border-light rounded-xl p-3 text-xs text-text-primary outline-none focus:border-teal-500 font-normal leading-relaxed resize-y"
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-text-secondary uppercase">
              Especialidades / Insignias (Separadas por comas)
            </Label>
            <Input
              type="text"
              value={sstProfile.specialties}
              onChange={(e) => setSstProfile({ ...sstProfile, specialties: e.target.value })}
              placeholder="Ej. Especialista SG-SST, Auditor de Riesgos, Asesor IA en SST, Embajador Líder"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-text-secondary uppercase flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-teal-600" />
              <span>Frase / Cita Profesional Representativa</span>
            </Label>
            <Input
              type="text"
              value={sstProfile.quote}
              onChange={(e) => setSstProfile({ ...sstProfile, quote: e.target.value })}
              placeholder="Ej. Al unir la tecnología y la IA con la SST, optimizamos la gestión preventiva..."
              className="mt-1 font-medium italic"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-text-secondary uppercase">
                Párrafo 1: Tu Trayectoria Profesional
              </Label>
              <textarea
                rows={4}
                value={sstProfile.storyParagraph1}
                onChange={(e) => setSstProfile({ ...sstProfile, storyParagraph1: e.target.value })}
                placeholder="Primer párrafo de tu historia que verán los clientes en la landing page..."
                className="w-full mt-1 bg-surface-secondary border border-border-light rounded-xl p-3 text-xs text-text-primary outline-none focus:border-teal-500 font-normal leading-relaxed resize-y"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-text-secondary uppercase">
                Párrafo 2: Tu Visión & WAPPY IA
              </Label>
              <textarea
                rows={4}
                value={sstProfile.storyParagraph2}
                onChange={(e) => setSstProfile({ ...sstProfile, storyParagraph2: e.target.value })}
                placeholder="Segundo párrafo explicando cómo impulsas a profesionales y empresas con WAPPY IA..."
                className="w-full mt-1 bg-surface-secondary border border-border-light rounded-xl p-3 text-xs text-text-primary outline-none focus:border-teal-500 font-normal leading-relaxed resize-y"
              />
            </div>
          </div>

          {/* LIVE PREVIEW BOX */}
          <div className="bg-surface-secondary/70 border border-border-light rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-black text-text-secondary uppercase pb-2 border-b border-border-light">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Vista Previa en tu Landing Page
              </span>
              <span className="text-[10px] text-text-tertiary font-medium lowercase truncate">
                wappy.club/portafolio?ref={user?.username || 'tu-codigo'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-teal-500/40 p-0.5 shrink-0 overflow-hidden bg-surface-primary">
                <img
                  src={
                    user?.avatar ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.name || 'Usuario')}`
                  }
                  alt={user?.name || 'Avatar'}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1 min-w-0 w-full">
                <div className="text-[11px] font-black uppercase text-teal-600 dark:text-teal-400">
                  Embajador Oficial WAPPY
                </div>
                <h4 className="text-base sm:text-lg font-black text-text-primary">
                  Mucho gusto, soy{' '}
                  <span className="text-teal-600 dark:text-teal-400">{user?.name || 'Tu Nombre'}</span>
                </h4>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  {(sstProfile.specialties
                    ? sstProfile.specialties.split(',')
                    : [sstProfile.profession || 'Profesional SST', sstProfile.yearsExperience || '+5 Años Exp.']
                  ).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>

                {sstProfile.quote && (
                  <p className="text-xs italic text-text-secondary bg-surface-primary p-2.5 rounded-xl border border-border-light/60 mt-1">
                    "{sstProfile.quote}"
                  </p>
                )}

                <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                  {sstProfile.storyParagraph1 ||
                    'Aquí aparecerá tu historia profesional y experiencia en SST redactada para tus clientes.'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <WappyExpandButton
              type="button"
              variant="teal"
              onClick={handleSaveSstProfile}
              disabled={isSavingSstProfile}
              isLoading={isSavingSstProfile}
              icon={<CheckCircle2 className="w-4 h-4" />}
              label={isSavingSstProfile ? 'Guardando...' : 'Guardar Perfil Profesional SST'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(PartnersTab);
