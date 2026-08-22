import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Sparkles, MessageCircle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface AmbassadorPublicData {
  name: string;
  slug: string;
  phone?: string;
  phoneClean?: string;
  email?: string;
}

export default function AmbassadorLandingBanner() {
  const location = useLocation();
  const navigate = useNavigate();
  const [ambassador, setAmbassador] = useState<AmbassadorPublicData | null>(null);

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const urlRef = searchParams.get('ref');
      const storedRef = typeof window !== 'undefined' ? localStorage.getItem('wappy_ref') : null;
      const activeRef = (urlRef || storedRef || '').trim();

      if (!activeRef) return;

      if (urlRef) {
        localStorage.setItem('wappy_ref', urlRef);
      }

      axios.get(`/api/referrals/public/ambassador-info/${encodeURIComponent(activeRef)}`)
        .then((res) => {
          if (res.data && res.data.name) {
            setAmbassador(res.data);
          }
        })
        .catch(() => {
          setAmbassador({
            name: activeRef.charAt(0).toUpperCase() + activeRef.slice(1),
            slug: activeRef,
          });
        });
    } catch (e) {
      console.warn('Error fetching ambassador public banner:', e);
    }
  }, [location.search]);

  if (!ambassador) return null;

  const isRegisterPage = location.pathname.includes('/register');

  const waUrl = ambassador.phoneClean
    ? `https://api.whatsapp.com/send?phone=${ambassador.phoneClean}&text=${encodeURIComponent(`Hola ${ambassador.name} 👋 Estoy conociendo WAPPY IA a través de tu enlace y me gustaría hacerte unas preguntas.`)}`
    : null;

  return (
    <div className="w-full max-w-md mx-auto mb-5 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="bg-gradient-to-br from-teal-950/90 via-slate-900/90 to-teal-900/90 border-2 border-teal-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl text-white backdrop-blur-md relative overflow-hidden">
        {/* Decorative ambient glow */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
        
        {/* Header Tag */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-teal-500/30">
          <div className="flex items-center gap-1.5 text-teal-400 font-extrabold text-[11px] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Invitación Especial WAPPY SST</span>
          </div>
          <span className="bg-teal-500/20 text-teal-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-teal-500/30">
            15 Días Gratis
          </span>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <div className="text-xs text-slate-300">
            Estás navegando por invitación de tu asesor comercial:
          </div>
          <div className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span>{ambassador.name}</span>
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
          </div>

          <div className="text-[11px] text-teal-200/90 flex items-start gap-1.5 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
            <span>
              {isRegisterPage 
                ? 'Tu registro activará de inmediato los 15 días de prueba PRO con acceso total a Agentes y Matrices.' 
                : 'Crea tu cuenta gratuita hoy y recibe 15 días de prueba PRO con acompañamiento directo.'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-2 mt-3 pt-3 border-t border-teal-500/20">
          {!isRegisterPage && (
            <button
              type="button"
              onClick={() => navigate(`/register?ref=${ambassador.slug}`)}
              className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <span>Crear Cuenta Gratis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full ${!isRegisterPage ? 'sm:w-auto' : 'w-full'} py-2 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Chatear con mi Asesor</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
