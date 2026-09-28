import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '~/hooks';
import './marketing.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  const [isScrolled, setIsScrolled] = useState(false);
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Form states for Demo Modal
  const [demoName, setDemoName] = useState('');
  const [demoEmail, setDemoEmail] = useState('');
  const [demoCompany, setDemoCompany] = useState('');
  const [demoTeamSize, setDemoTeamSize] = useState('1–5');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleStartTrial = () => {
    if (isAuthenticated) {
      navigate('/c/new');
    } else {
      navigate('/signup');
    }
  };

  const handleLogin = () => {
    if (isAuthenticated) {
      navigate('/c/new');
    } else {
      navigate('/login');
    }
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDemoModalOpen(false);
    showToast(lang === 'es' ? '¡Solicitud recibida! Te contactaremos en minutos.' : 'Demo request received! We will reach out shortly.');
    setDemoName('');
    setDemoEmail('');
    setDemoCompany('');
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  return (
    <div className="mkt">
      {/* Floating Navbar */}
      <nav className="nav">
        <div className={`nav-inner ${isScrolled ? 'scrolled' : ''}`}>
          <a className="nav-logo" aria-label="Wappy" href="/landing">
            <img src="/marketing/wappy-wordmark.png" alt="Wappy" />
          </a>

          <div className="nav-links">
            <a href="#features">{lang === 'es' ? 'Producto' : 'Product'}</a>
            <a href="#pricing">{lang === 'es' ? 'Precios' : 'Pricing'}</a>
            <a href="#faq">FAQ</a>
            <a href="#app">{lang === 'es' ? 'Móvil' : 'Mobile'}</a>
          </div>

          <div className="nav-cta">
            <div className="lang-toggle" role="group" aria-label="Language">
              <button
                type="button"
                className={lang === 'es' ? 'active' : ''}
                onClick={() => setLang('es')}
                aria-pressed={lang === 'es'}
              >
                ES
              </button>
              <button
                type="button"
                className={lang === 'en' ? 'active' : ''}
                onClick={() => setLang('en')}
                aria-pressed={lang === 'en'}
              >
                EN
              </button>
            </div>

            <button type="button" className="btn btn-ghost nav-signin" onClick={handleLogin}>
              {isAuthenticated ? (lang === 'es' ? 'Ir al Chat' : 'Go to Chat') : (lang === 'es' ? 'Iniciar sesión' : 'Sign in')}
            </button>

            <button type="button" className="btn btn-lime btn-sm" onClick={() => setIsDemoModalOpen(true)}>
              {lang === 'es' ? 'Agendar demo' : 'Book a demo'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="cloud" style={{ top: 90, left: -60, width: 300, height: 120 }}></div>
        <div className="cloud" style={{ top: 240, right: -40, width: 260, height: 110 }}></div>
        <div className="cloud" style={{ bottom: 60, left: '18%', width: 240, height: 100, opacity: 0.5 }}></div>

        <div className="wrap hero-inner">
          <span className="trial">
            <span className="tdot"></span>
            {lang === 'es' ? 'Prueba gratis de 7 días · sin tarjeta' : '7-day free trial · no credit card required'}
          </span>

          <h1 className="display">
            {lang === 'es' ? (
              <>
                Habla con cada cliente,<br />
                <span className="t2">desde una sola bandeja veloz.</span>
              </>
            ) : (
              <>
                Talk to every customer,<br />
                <span className="t2">from one fast shared inbox.</span>
              </>
            )}
          </h1>

          <p className="sub">
            {lang === 'es'
              ? 'Wappy unifica WhatsApp, Instagram, email y chat web en una sola bandeja — con IA, automatizaciones y un centro de ayuda integrado.'
              : 'Wappy brings WhatsApp, Instagram, email, and live web chat into a single inbox — with AI, automations, and an integrated help center.'}
          </p>

          <div className="hero-cta">
            <button className="btn btn-primary" onClick={handleStartTrial}>
              {lang === 'es' ? 'Empezar prueba de 7 días' : 'Start 7-day free trial'}
              <span className="pip">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </button>
            <button className="btn btn-glass" onClick={() => setIsDemoModalOpen(true)}>
              {lang === 'es' ? 'Agendar demo' : 'Book a demo'}
            </button>
          </div>

          <div className="hero-badges">
            <a className="store-badge" href="#app">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                <path d="M16 1.6c.06.9-.3 1.8-.86 2.43-.6.66-1.55 1.17-2.48 1.1-.07-.88.35-1.8.88-2.36C14.08 2.1 15.1 1.64 16 1.6zM18.9 8.5c-.8.5-1.3 1.4-1.3 2.4 0 1.2.7 2.2 1.7 2.6-.2.6-.5 1.3-.9 1.9-.6.9-1.2 1.8-2.1 1.8-.9 0-1.2-.5-2.2-.5s-1.4.5-2.2.5c-.9 0-1.6-1-2.2-1.9-1.3-1.9-2.3-5.3-1-7.6.7-1.2 1.8-1.9 3-1.9.9 0 1.7.6 2.2.6.5 0 1.5-.7 2.6-.6.5 0 1.8.2 2.7 1.2z"></path>
              </svg>
              <div>
                <div className="s1">Download on the</div>
                <div className="s2">App Store</div>
              </div>
            </a>
            <a className="store-badge" href="#app">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                <path d="M3.6 2.4 13 12 3.6 21.6c-.3-.3-.5-.7-.5-1.3V3.7c0-.6.2-1 .5-1.3zM14.3 13.3l2.5 2.5-9.6 5.5 7.1-8zM17.9 9.8l3 1.7c.9.5.9 1.5 0 2l-3 1.7-2.7-2.7 2.7-2.7zM7.2 2.7l9.6 5.5-2.5 2.5-7.1-8z"></path>
              </svg>
              <div>
                <div className="s1">Get it on</div>
                <div className="s2">Google Play</div>
              </div>
            </a>
          </div>
        </div>

        {/* Floating Interactive Stage */}
        <div className="wrap">
          <div className="hero-stage">
            {/* Float Card 1: WhatsApp Inquiry */}
            <div className="float" style={{ top: 0, left: '2%', width: 300, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ width: 36, height: 36, borderRadius: 9999, background: '#E8EAFF', color: '#4852ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                  AW
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Amelia Wright</div>
                  <div style={{ fontSize: 11, color: '#9A9AA8' }}>WhatsApp · {lang === 'es' ? 'Abierto' : 'Open'}</div>
                </div>
                <span style={{ background: '#C7F303', color: '#0E1300', fontSize: 11, fontWeight: 700, borderRadius: 9999, padding: '2px 7px' }}>
                  2
                </span>
              </div>
              <div style={{ background: '#F2F3F5', borderRadius: '4px 12px 12px 12px', padding: '8px 11px', fontSize: 12.5 }}>
                {lang === 'es' ? 'Mi pago con tarjeta se rechazó dos veces hoy…' : 'My card payment got declined twice today…'}
              </div>
            </div>

            {/* Float Card 2: Copilot AI Suggestion */}
            <div className="float" style={{ top: 120, right: '3%', width: 280, padding: 14, animationDelay: '1.4s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                <span style={{ width: 24, height: 24, borderRadius: 7, background: '#C7F303', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2">
                    <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"></path>
                  </svg>
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>Copilot</span>
                <span style={{ fontSize: 11, color: '#9A9AA8' }}>{lang === 'es' ? 'sugerido' : 'suggested'}</span>
              </div>
              <div style={{ background: '#C7F303', borderRadius: 12, padding: '9px 12px', fontSize: 12.5, fontWeight: 500, color: '#0E1300' }}>
                {lang === 'es' ? 'Subí el límite que lo bloqueaba — inténtalo de nuevo 💚' : 'I raised the threshold that was blocking it — try again 💚'}
              </div>
            </div>

            {/* Float Card 3: CSAT */}
            <div className="float" style={{ bottom: 0, left: '32%', width: 230, padding: 16, animationDelay: '0.7s' }}>
              <div style={{ fontSize: 11, color: '#9A9AA8', fontWeight: 600 }}>
                {lang === 'es' ? 'CSAT esta semana' : 'CSAT this week'}
              </div>
              <div className="display" style={{ fontWeight: 600, fontSize: 34, letterSpacing: '-0.03em', color: '#40AD5A' }}>
                97%
              </div>
              <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
                <span style={{ flex: 1, height: 6, borderRadius: 9999, background: '#40AD5A' }}></span>
                <span style={{ flex: 1, height: 6, borderRadius: 9999, background: '#40AD5A' }}></span>
                <span style={{ flex: 1, height: 6, borderRadius: 9999, background: '#D6F4DF' }}></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Bento Grid: Soporte que escala contigo */}
      <section className="band">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Por qué cambian los equipos' : 'Why teams switch'}
            </span>
            <h2 className="display">{lang === 'es' ? 'Soporte que escala contigo' : 'Support that scales with you'}</h2>
          </div>

          <div className="bento">
            <div className="cell big">
              <div>
                <div style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '.06em', opacity: 0.5 }}>
                  {lang === 'es' ? 'Omnicanal' : 'Omnichannel'}
                </div>
                <div className="display" style={{ fontSize: 30, marginTop: 8, lineHeight: 1.08 }}>
                  {lang === 'es' ? 'Conecta cada canal que tus clientes ya usan.' : 'Connect every channel your customers already use.'}
                </div>
              </div>

              <div className="chan-cards">
                <div className="chan-card">
                  <span className="cdot" style={{ background: '#25D366' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff">
                      <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.3-1.2l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 1 1 12 20z"></path>
                    </svg>
                  </span>
                  <div>
                    <div className="cn">WhatsApp</div>
                    <div className="cs">{lang === 'es' ? 'Conectado' : 'Connected'}</div>
                  </div>
                </div>

                <div className="chan-card">
                  <span className="cdot" style={{ background: '#0A7CFF' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff">
                      <path d="M12 2C6.5 2 2 6.1 2 11.2c0 2.9 1.4 5.5 3.7 7.2V22l3.4-1.9c.9.3 1.9.4 2.9.4 5.5 0 10-4.1 10-9.3S17.5 2 12 2zm1 12.5-2.5-2.7-4.9 2.7 5.4-5.7 2.6 2.7 4.8-2.7-5.4 5.7z"></path>
                    </svg>
                  </span>
                  <div>
                    <div className="cn">Messenger</div>
                    <div className="cs">{lang === 'es' ? 'Conectado' : 'Connected'}</div>
                  </div>
                </div>

                <div className="chan-card">
                  <span className="cdot" style={{ background: '#E1306C' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="5"></rect>
                      <circle cx="12" cy="12" r="4"></circle>
                      <circle cx="17.5" cy="6.5" r="1" fill="#fff"></circle>
                    </svg>
                  </span>
                  <div>
                    <div className="cn">Instagram</div>
                    <div className="cs">{lang === 'es' ? 'Conectar' : 'Connect'}</div>
                  </div>
                </div>

                <div className="chan-card">
                  <span className="cdot" style={{ background: '#5B6B7B' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                      <path d="m2 7 10 6 10-6"></path>
                    </svg>
                  </span>
                  <div>
                    <div className="cn">Email</div>
                    <div className="cs">{lang === 'es' ? 'Conectado' : 'Connected'}</div>
                  </div>
                </div>

                <div className="chan-card">
                  <span className="cdot" style={{ background: '#C7F303' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2">
                      <path d="M21 12a9 9 0 0 1-9 9 9 9 0 0 1 0-18 9 9 0 0 1 9 9z"></path>
                      <path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 0 1 0 18"></path>
                    </svg>
                  </span>
                  <div>
                    <div className="cn">{lang === 'es' ? 'Widget web' : 'Web widget'}</div>
                    <div className="cs">{lang === 'es' ? 'Conectado' : 'Connected'}</div>
                  </div>
                </div>

                <div className="chan-card" style={{ alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                    {lang === 'es' ? '+ Más canales' : '+ More channels'}
                  </span>
                </div>
              </div>
            </div>

            <div className="cell lime">
              <div className="stat-n">2m 14s</div>
              <div className="stat-l">{lang === 'es' ? 'Primera respuesta mediana' : 'Median first response'}</div>
            </div>

            <div className="cell">
              <div className="stat-n">120+</div>
              <div className="stat-l">{lang === 'es' ? 'Integraciones' : 'Integrations'}</div>
            </div>

            <div className="cell">
              <div className="stat-n">520k</div>
              <div className="stat-l">{lang === 'es' ? 'Mensajes / mes' : 'Messages / mo'}</div>
            </div>

            <div className="cell">
              <div className="stat-n">20+</div>
              <div className="stat-l">{lang === 'es' ? 'Países' : 'Countries'}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Spotlights */}
      <section id="features" className="band" style={{ paddingTop: 30 }}>
        <div className="wrap">
          {/* Feature 1: Bandeja */}
          <div className="feat">
            <div className="feat-copy">
              <span className="eyebrow">
                <span className="dot"></span>
                {lang === 'es' ? 'Bandeja' : 'Inbox'}
              </span>
              <h3>{lang === 'es' ? 'Cada conversación, perfectamente organizada.' : 'Every conversation, perfectly organized.'}</h3>
              <p>
                {lang === 'es'
                  ? 'Asigna, pospón, etiqueta y resuelve con escritura en vivo y temporizadores SLA. Rápida con el teclado, hecha para equipos que responden en segundos.'
                  : 'Assign, snooze, tag, and resolve with live typing indicators and SLA timers. Built for teams that move fast.'}
              </p>
              <ul className="feat-list">
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Respuestas guardadas y macros' : 'Saved replies and macros'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Bandeja de equipo y asignación rápida' : 'Team inboxes and smart assignment'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Temporizadores SLA y estados visuales' : 'SLA timers and visual states'}
                </li>
              </ul>
            </div>

            <div className="feat-art tint-sky">
              <div style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 18, boxShadow: '0 16px 40px rgba(20,40,80,0.14)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #EEF0F3', fontWeight: 700, fontFamily: 'var(--display)' }}>
                  {lang === 'es' ? 'Bandeja de Entrada' : 'Inbox'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', borderBottom: '1px solid #F2F3F5' }}>
                  <span style={{ width: 38, height: 38, borderRadius: 9999, background: '#E8EAFF', color: '#4852ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                    AW
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Amelia Wright</div>
                    <div style={{ fontSize: 12, color: '#9A9AA8' }}>WhatsApp · {lang === 'es' ? 'Abierto' : 'Open'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', borderBottom: '1px solid #F2F3F5' }}>
                  <span style={{ width: 38, height: 38, borderRadius: 9999, background: '#D6F4DF', color: '#0A5818', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                    MR
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Marco Rossi</div>
                    <div style={{ fontSize: 12, color: '#9A9AA8' }}>Email · {lang === 'es' ? 'Resuelto' : 'Resolved'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px' }}>
                  <span style={{ width: 38, height: 38, borderRadius: 9999, background: '#FEF0DC', color: '#F09030', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                    SP
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Sofia Petrova</div>
                    <div style={{ fontSize: 12, color: '#9A9AA8' }}>WhatsApp · {lang === 'es' ? 'Pospuesto' : 'Snoozed'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Copilot con IA */}
          <div className="feat rev">
            <div className="feat-copy">
              <span className="eyebrow">
                <span className="dot"></span>
                {lang === 'es' ? 'Copilot con IA' : 'AI Copilot'}
              </span>
              <h3>{lang === 'es' ? 'Responde en segundos, no en minutos.' : 'Reply in seconds, not minutes.'}</h3>
              <p>
                {lang === 'es'
                  ? 'Copilot redacta respuestas con tu tono a partir de la conversación, resume hilos largos y ajusta el tono — para que cada agente suene como el mejor.'
                  : 'Copilot drafts replies matching your voice, summarizes long conversation threads, and polishes tone — empowering every agent to sound like your best.'}
              </p>
              <ul className="feat-list">
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Respuestas sugeridas en tiempo real' : 'Real-time suggested replies'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Resúmenes inteligentes de conversación' : 'Smart thread summaries'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Ajuste y reescritura de tono' : 'Tone rewriting and polish'}
                </li>
              </ul>
            </div>

            <div className="feat-art tint-lav">
              <div style={{ width: '100%', maxWidth: 340, background: '#fff', borderRadius: 18, boxShadow: '0 16px 40px rgba(20,40,80,0.14)', padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 8, background: '#C7F303', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2">
                      <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"></path>
                    </svg>
                  </span>
                  <span style={{ fontWeight: 700 }}>Copilot</span>
                </div>
                <div style={{ background: '#F2F3F5', borderRadius: 12, padding: 12, fontSize: 13.5, lineHeight: 1.5, marginBottom: 12 }}>
                  {lang === 'es'
                    ? '¡Lamento el pago rechazado! Revisé tu cuenta y subí el límite que lo bloqueaba — inténtalo de nuevo.'
                    : 'Sorry about the payment issue! I checked your account and updated the threshold that blocked it — please try again.'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ flex: 1, height: 38, borderRadius: 9999, background: '#C7F303', color: '#0E1300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {lang === 'es' ? 'Usar respuesta' : 'Use response'}
                  </span>
                  <span style={{ width: 38, height: 38, borderRadius: 9999, border: '1px solid #E7EAEE', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    ↻
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Widget y Centro de ayuda */}
          <div className="feat">
            <div className="feat-copy">
              <span className="eyebrow">
                <span className="dot"></span>
                {lang === 'es' ? 'Widget y Centro de ayuda' : 'Widget & Help Center'}
              </span>
              <h3>{lang === 'es' ? 'Un widget de dos líneas que tus clientes aman.' : 'A two-line widget that your visitors love.'}</h3>
              <p>
                {lang === 'es'
                  ? 'Agrega un lanzador de chat de menos de 30KB a cualquier sitio, con un centro de ayuda buscable incluido. Los clientes se autoatienden; los agentes hacen el resto.'
                  : 'Drop an ultra-lightweight launcher onto any site with a searchable help center built-in. Self-serve first, live agents when needed.'}
              </p>
              <ul className="feat-list">
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Menos de 30KB, carga ultrarrápida asíncrona' : 'Under 30KB, async zero-latency load'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Artículos de ayuda integrados en el widget' : 'Integrated in-widget knowledge base'}
                </li>
                <li>
                  <span className="ck">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? '100% personalizable a tu marca' : 'Fully custom brand styling'}
                </li>
              </ul>
            </div>

            <div className="feat-art tint-mint">
              <div style={{ width: 280, background: 'linear-gradient(160deg, #C7F303, #A8D400)', borderRadius: 20, boxShadow: '0 16px 40px rgba(20,40,80,0.16)', padding: 18 }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22, color: '#0E1300' }}>
                  {lang === 'es' ? 'Hola 👋' : 'Hello 👋'}
                </div>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22, color: 'rgba(14,19,0,0.45)', marginBottom: 14 }}>
                  {lang === 'es' ? '¿Cómo podemos ayudar?' : 'How can we help?'}
                </div>
                <div style={{ background: '#fff', borderRadius: 14, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0E1300', flex: 1 }}>
                    {lang === 'es' ? 'Envíanos un mensaje' : 'Send us a message'}
                  </span>
                  <span style={{ width: 34, height: 34, borderRadius: 9999, background: '#C7F303', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Apps Showcase */}
      <section id="app" className="band" style={{ background: 'var(--sky)', overflow: 'hidden', position: 'relative' }}>
        <div className="cloud" style={{ top: 40, left: -40, width: 240, height: 100 }}></div>
        <div className="cloud" style={{ bottom: 40, right: -30, width: 220, height: 90 }}></div>

        <div className="wrap" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <span className="eyebrow">
            <span className="dot"></span>
            iOS & Android
          </span>
          <h2 className="display" style={{ fontSize: 'clamp(30px,4.6vw,48px)', margin: '14px 0 0' }}>
            {lang === 'es' ? 'Soporte desde tu bolsillo' : 'Customer support from your pocket'}
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(14,19,0,0.62)', maxWidth: 480, margin: '14px auto 0' }}>
            {lang === 'es'
              ? 'Responde, asigna y resuelve donde estés. Apps nativas para iPhone y Android, con acciones deslizables, Copilot y notificaciones push instantáneas.'
              : 'Reply, assign, and resolve on the go. Native iPhone and Android apps with swipe actions, Copilot, and real-time push alerts.'}
          </p>

          <div className="hero-badges" style={{ marginTop: 24 }}>
            <div className="store-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                <path d="M16 1.6c.06.9-.3 1.8-.86 2.43-.6.66-1.55 1.17-2.48 1.1-.07-.88.35-1.8.88-2.36C14.08 2.1 15.1 1.64 16 1.6zM18.9 8.5c-.8.5-1.3 1.4-1.3 2.4 0 1.2.7 2.2 1.7 2.6-.2.6-.5 1.3-.9 1.9-.6.9-1.2 1.8-2.1 1.8-.9 0-1.2-.5-2.2-.5s-1.4.5-2.2.5c-.9 0-1.6-1-2.2-1.9-1.3-1.9-2.3-5.3-1-7.6.7-1.2 1.8-1.9 3-1.9.9 0 1.7.6 2.2.6.5 0 1.5-.7 2.6-.6.5 0 1.8.2 2.7 1.2z"></path>
              </svg>
              <div>
                <div className="s1">Download on the</div>
                <div className="s2">App Store</div>
              </div>
            </div>
            <div className="store-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                <path d="M3.6 2.4 13 12 3.6 21.6c-.3-.3-.5-.7-.5-1.3V3.7c0-.6.2-1 .5-1.3zM14.3 13.3l2.5 2.5-9.6 5.5 7.1-8zM17.9 9.8l3 1.7c.9.5.9 1.5 0 2l-3 1.7-2.7-2.7 2.7-2.7zM7.2 2.7l9.6 5.5-2.5 2.5-7.1-8z"></path>
              </svg>
              <div>
                <div className="s1">Get it on</div>
                <div className="s2">Google Play</div>
              </div>
            </div>
          </div>

          <div className="app-phones">
            {/* Phone 1: iOS */}
            <div className="phone-wrap">
              <div className="phone-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#0E1300">
                  <path d="M16 1.6c.06.9-.3 1.8-.86 2.43-.6.66-1.55 1.17-2.48 1.1-.07-.88.35-1.8.88-2.36C14.08 2.1 15.1 1.64 16 1.6zM18.9 8.5c-.8.5-1.3 1.4-1.3 2.4 0 1.2.7 2.2 1.7 2.6-.2.6-.5 1.3-.9 1.9-.6.9-1.2 1.8-2.1 1.8-.9 0-1.2-.5-2.2-.5s-1.4.5-2.2.5c-.9 0-1.6-1-2.2-1.9-1.3-1.9-2.3-5.3-1-7.6.7-1.2 1.8-1.9 3-1.9.9 0 1.7.6 2.2.6.5 0 1.5-.7 2.6-.6.5 0 1.8.2 2.7 1.2z"></path>
                </svg>
                iOS · iPhone
              </div>
              <div className="phone">
                <div className="phone-screen">
                  <div className="phone-notch">
                    <span></span>
                  </div>
                  <div style={{ padding: '6px 16px 10px', textAlign: 'left', background: '#fff' }}>
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 24, color: '#0E1300' }}>
                      {lang === 'es' ? 'Bandeja' : 'Inbox'}
                    </div>
                    <div style={{ display: 'flex', gap: 6, background: '#E9E9EE', borderRadius: 9, padding: 3, marginTop: 8 }}>
                      <span style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 600, padding: '6px 0', background: '#fff', borderRadius: 7 }}>
                        {lang === 'es' ? 'Tú' : 'You'}
                      </span>
                      <span style={{ flex: 1, textAlign: 'center', fontSize: 11, color: '#6A6A6E', padding: '6px 0' }}>
                        {lang === 'es' ? 'Todos' : 'All'}
                      </span>
                    </div>
                  </div>

                  <div style={{ background: '#F2F3F7', padding: 6, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#fff', borderRadius: 14, marginBottom: 6 }}>
                      <span style={{ width: 38, height: 38, borderRadius: 9999, background: '#E8EAFF', color: '#4852ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, position: 'relative', flex: 'none' }}>
                        AW
                        <span style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 9999, background: '#25D366', border: '2px solid #fff' }}></span>
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Amelia Wright</div>
                        <div style={{ fontSize: 11, color: '#9A9AA8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Pago con tarjeta rechazado…
                        </div>
                        <span style={{ display: 'inline-block', marginTop: 3, fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 9999, background: '#E8EAFF', color: '#4852ED' }}>
                          {lang === 'es' ? 'Abierto' : 'Open'}
                        </span>
                      </div>
                      <span style={{ width: 18, height: 18, borderRadius: 9999, background: '#C7F303', color: '#0E1300', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                        2
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: '#fff', borderRadius: 14, marginBottom: 6 }}>
                      <span style={{ width: 38, height: 38, borderRadius: 9999, background: '#D6F4DF', color: '#0A5818', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, position: 'relative', flex: 'none' }}>
                        MR
                        <span style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 9999, background: '#5B6B7B', border: '2px solid #fff' }}></span>
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>Marco Rossi</div>
                        <div style={{ fontSize: 11, color: '#9A9AA8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          ¡Gracias, funcionó!
                        </div>
                        <span style={{ display: 'inline-block', marginTop: 3, fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 9999, background: '#D6F4DF', color: '#0A5818' }}>
                          {lang === 'es' ? 'Resuelto' : 'Resolved'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 4px' }}>
                      <span style={{ height: 38, padding: '0 16px', borderRadius: 9999, background: '#C7F303', color: '#0E1300', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
                        + Redactar
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', background: '#fff', borderTop: '1px solid #EEF0F3', padding: '8px 0 14px' }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ width: 54, height: 28, margin: '0 auto', borderRadius: 9999, background: '#E8EAFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B40B5" strokeWidth="2">
                          <path d="M22 12h-6l-2 3h-4l-2-3H2"></path>
                          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                        </svg>
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 600, marginTop: 2 }}>{lang === 'es' ? 'Bandeja' : 'Inbox'}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', color: '#9A9AA8', paddingTop: 5 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9A9AA8" strokeWidth="1.8" style={{ margin: '0 auto' }}>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      </svg>
                      <div style={{ fontSize: 9, marginTop: 2 }}>{lang === 'es' ? 'Equipo' : 'Team'}</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center', color: '#9A9AA8', paddingTop: 5 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9A9AA8" strokeWidth="1.8" style={{ margin: '0 auto' }}>
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z"></path>
                      </svg>
                      <div style={{ fontSize: 9, marginTop: 2 }}>{lang === 'es' ? 'Ayuda' : 'Help'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone 2: Android */}
            <div className="phone-wrap">
              <div className="phone-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#0E1300">
                  <path d="M3.6 2.4 13 12 3.6 21.6c-.3-.3-.5-.7-.5-1.3V3.7c0-.6.2-1 .5-1.3zM14.3 13.3l2.5 2.5-9.6 5.5 7.1-8zM17.9 9.8l3 1.7c.9.5.9 1.5 0 2l-3 1.7-2.7-2.7 2.7-2.7zM7.2 2.7l9.6 5.5-2.5 2.5-7.1-8z"></path>
                </svg>
                Android
              </div>
              <div className="phone">
                <div className="phone-screen">
                  <div className="phone-notch">
                    <span style={{ width: 10, height: 10, borderRadius: 9999 }}></span>
                  </div>
                  <div style={{ background: 'linear-gradient(160deg, #5BB8F5, #86CCF6)', height: 54 }}></div>
                  <div style={{ padding: '14px 16px', textAlign: 'left', background: '#F2F3F7', marginTop: -30 }}>
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                      <span style={{ width: 64, height: 64, borderRadius: 9999, background: '#C7F303', color: '#0E1300', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, border: '3px solid #F2F3F7' }}>
                        YO
                      </span>
                      <div style={{ fontSize: 17, fontWeight: 600, marginTop: 6 }}>{lang === 'es' ? 'Tú' : 'You'}</div>
                      <div style={{ fontSize: 11, color: '#9A9AA8' }}>{lang === 'es' ? 'Agente de soporte' : 'Support Agent'}</div>
                    </div>

                    <div style={{ fontSize: 10, fontWeight: 600, color: '#3B40B5', marginBottom: 6 }}>
                      {lang === 'es' ? 'DISPONIBILIDAD' : 'AVAILABILITY'}
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                      <span style={{ flex: 1, height: 36, borderRadius: 9999, background: '#E8EAFF', color: '#3B40B5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11, fontWeight: 600 }}>
                        <span style={{ width: 7, height: 7, borderRadius: 9999, background: '#1E8E3E' }}></span>
                        {lang === 'es' ? 'En línea' : 'Online'}
                      </span>
                      <span style={{ flex: 1, height: 36, borderRadius: 9999, border: '1px solid #E2E4E8', color: '#9A9AA8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                        {lang === 'es' ? 'Ausente' : 'Away'}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ background: '#fff', borderRadius: 16, padding: 12 }}>
                        <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--display)' }}>1,284</div>
                        <div style={{ fontSize: 10, color: '#9A9AA8' }}>{lang === 'es' ? 'Conversaciones' : 'Conversations'}</div>
                      </div>
                      <div style={{ background: '#fff', borderRadius: 16, padding: 12 }}>
                        <div style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--display)', color: '#1E8E3E' }}>97%</div>
                        <div style={{ fontSize: 10, color: '#9A9AA8' }}>CSAT</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Band */}
      <section className="band vid-band">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Míralo en acción' : 'Watch it in action'}
            </span>
            <h2 className="display">{lang === 'es' ? 'Wappy, en movimiento' : 'Wappy in motion'}</h2>
            <p>
              {lang === 'es'
                ? 'Del primer mensaje de un cliente a una conversación resuelta — mira todo el flujo.'
                : 'From the first customer message to full resolution — see the whole flow.'}
            </p>
          </div>

          <div className="vid-shell">
            <span className="vid-tag eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Tour del producto' : 'Product tour'}
            </span>
            <video
              ref={videoRef}
              src="/marketing/wappy-motion.mp4"
              muted
              loop
              autoPlay
              playsInline
              preload="auto"
            />
            <button
              className={`vid-play ${isVideoPlaying ? 'hide' : ''}`}
              aria-label="Play product tour"
              onClick={toggleVideo}
            >
              <span className="pbtn">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="#0E1300">
                  <polygon points="6 4 20 12 6 20 6 4"></polygon>
                </svg>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="band">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Integraciones' : 'Integrations'}
            </span>
            <h2 className="display">{lang === 'es' ? 'Conecta todo tu stack' : 'Connect your entire stack'}</h2>
            <p>
              {lang === 'es'
                ? 'Slack, Shopify, Stripe y más de 120 plataformas — además de webhooks abiertos para cualquier desarrollo a medida.'
                : 'Slack, Shopify, Stripe, and 120+ platforms — plus open webhooks for custom integrations.'}
            </p>
          </div>

          <div className="intg">
            <div className="i">
              <span className="g" style={{ background: '#F4F4F6' }}>
                <svg viewBox="0 0 24 24">
                  <path d="M5.04 15.17a2.52 2.52 0 1 1-2.52-2.52h2.52zM6.3 15.17a2.52 2.52 0 0 1 5.04 0v6.3a2.52 2.52 0 0 1-5.04 0z" fill="#E01E5A"></path>
                  <path d="M8.82 5.04A2.52 2.52 0 1 1 11.34 2.52v2.52zM8.82 6.3a2.52 2.52 0 0 1 0 5.04h-6.3a2.52 2.52 0 0 1 0-5.04z" fill="#36C5F0"></path>
                  <path d="M18.96 8.83a2.52 2.52 0 1 1 2.52 2.52h-2.52zM17.7 8.83a2.52 2.52 0 0 1-5.04 0v-6.3a2.52 2.52 0 0 1 5.04 0z" fill="#2EB67D"></path>
                  <path d="M15.18 18.96a2.52 2.52 0 1 1-2.52 2.52v-2.52zM15.18 17.7a2.52 2.52 0 0 1 0-5.04h6.3a2.52 2.52 0 0 1 0 5.04z" fill="#ECB22E"></path>
                </svg>
              </span>
              Slack
            </div>

            <div className="i">
              <span className="g" style={{ background: '#F4F4F6' }}>
                <svg viewBox="0 0 24 24" fill="#2684FF">
                  <path d="M11.53 11.4 6.77 6.64a.6.6 0 0 0-.85 0l-3.9 3.9a.6.6 0 0 0 0 .85l9.5 9.5a.6.6 0 0 0 .86 0l3.9-3.9-4.75-4.75z"></path>
                  <path d="M12.47 12.6l4.76 4.76a.6.6 0 0 0 .85 0l3.9-3.9a.6.6 0 0 0 0-.85l-9.5-9.5a.6.6 0 0 0-.85 0l-3.9 3.9 4.74 4.75z" opacity=".55"></path>
                </svg>
              </span>
              Jira
            </div>

            <div className="i">
              <span className="g" style={{ background: '#95BF47' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M16.3 5.3c-.1 0-1.7.1-1.7.1s-1.1-1.1-1.3-1.2c-.1-.1-.3 0-.4 0l-.5.2c-.3-.9-.9-1.4-1.8-1.4-.6-.4-1.4.2-1.9 1-.5-.2-.9 0-1 .3-.4.1-.7.2-.7.2-.4.1-.4.1-.5.5C6.7 5.4 5 18.3 5 18.3l8.6 1.6 4.6-1.1S16.4 5.4 16.3 5.3zM12.6 4.4l-.9.3c0-.6-.1-1.3-.4-1.8.6.1 1 .8 1.3 1.5zm-1.6-1.3c.3.5.4 1.2.4 1.8l-1.6.5c.3-1.2.9-1.9 1.2-2.3zm-.8-.5c.1 0 .2 0 .3.1-.5.2-1 .9-1.3 2.3l-1.3.4c.4-1.2 1.2-2.8 2.3-2.8z"></path>
                </svg>
              </span>
              Shopify
            </div>

            <div className="i">
              <span className="g" style={{ background: '#635BFF' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M13.5 9.4c0-.6.5-.9 1.3-.9 1.1 0 2.5.4 3.6 1V6.1c-1.2-.5-2.4-.7-3.6-.7-3 0-4.9 1.5-4.9 4 0 3.9 5.4 3.3 5.4 5 0 .6-.6.9-1.4.9-1.2 0-2.8-.5-4-1.2v3.5c1.4.6 2.7.8 4 .8 3 0 5.1-1.5 5.1-4.1 0-4.2-5.5-3.5-5.5-5.1z"></path>
                </svg>
              </span>
              Stripe
            </div>

            <div className="i">
              <span className="g" style={{ background: '#FF4F00' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M14.4 12a2.4 2.4 0 0 1-.15.83l3.2 1.85a.3.3 0 0 1 .11.4l-1.1 1.9a.3.3 0 0 1-.4.1l-3.2-1.84a2.4 2.4 0 0 1-1.32.66v3.7a.3.3 0 0 1-.3.3H8.74a.3.3 0 0 1-.3-.3v-3.7a2.4 2.4 0 0 1-1.32-.66l-3.2 1.85a.3.3 0 0 1-.4-.11l-1.1-1.9a.3.3 0 0 1 .1-.4l3.2-1.85a2.4 2.4 0 0 1 0-1.66l-3.2-1.85a.3.3 0 0 1-.1-.4l1.1-1.9a.3.3 0 0 1 .4-.11l3.2 1.85a2.4 2.4 0 0 1 1.32-.66v-3.7a.3.3 0 0 1 .3-.3h2.5a.3.3 0 0 1 .3.3v3.7a2.4 2.4 0 0 1 1.32.66l3.2-1.85a.3.3 0 0 1 .4.11l1.1 1.9a.3.3 0 0 1-.11.4l-3.2 1.85c.1.27.16.55.15.83z"></path>
                </svg>
              </span>
              Zapier
            </div>

            <div className="i">
              <span className="g" style={{ background: '#FF7A59' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M16.3 8.6V6.4a1.7 1.7 0 0 0 1-1.5V4.8a1.7 1.7 0 0 0-1.7-1.7h-.05a1.7 1.7 0 0 0-1.7 1.7v.05a1.7 1.7 0 0 0 1 1.5v2.2a4.8 4.8 0 0 0-2.3 1l-6-4.7a1.9 1.9 0 1 0-1 1.3l5.9 4.6a4.8 4.8 0 0 0 .07 5.4l-1.8 1.8a1.6 1.6 0 0 0-.45-.07 1.55 1.55 0 1 0 1.55 1.55c0-.16-.03-.3-.07-.45l1.78-1.78a4.85 4.85 0 1 0 3.77-8.6zm-.8 7.3a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"></path>
                </svg>
              </span>
              HubSpot
            </div>

            <div className="i">
              <span className="g" style={{ background: '#181717' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"></path>
                </svg>
              </span>
              GitHub
            </div>

            <div className="i">
              <span className="g" style={{ background: '#F4F4F6' }}>
                <svg viewBox="0 0 24 24" fill="#00A1E0">
                  <path d="M10.2 6.4a3.5 3.5 0 0 1 5.5-.9 4.2 4.2 0 0 1 6.1 3.8 4 4 0 0 1-2 3.5 4 4 0 0 1-5.3 4.8 4.5 4.5 0 0 1-8.2-.4 3.8 3.8 0 0 1-.8.08A3.7 3.7 0 0 1 4 13.9a3.6 3.6 0 0 1 1.9-6.7 4 4 0 0 1 4.3-.8z"></path>
                </svg>
              </span>
              Salesforce
            </div>

            <div className="i">
              <span className="g" style={{ background: '#F4F4F6' }}>
                <svg viewBox="0 0 24 24" fill="#000">
                  <path d="M4.5 3.8 14 4.9c.8.07 1 .1 1.5.46l2 1.6c.3.24.4.3.4.55v12.7c0 .43-.16.68-.7.72l-11 .66c-.4.02-.6-.04-.82-.3l-2.4-3.1c-.24-.32-.34-.56-.34-.85V4.9c0-.5.22-.92 1.16-1.1z"></path>
                  <path d="M14.3 5.8c.08-.42-.2-.5-.46-.5l-8.7.5 1.9 1.6c.2.16.4.16.7.14l6.56-.4z" fill="#fff"></path>
                </svg>
              </span>
              Notion
            </div>

            <div className="i">
              <span className="g" style={{ background: '#5E6AD2' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M3 13.5 10.5 21A9 9 0 0 1 3 13.5zM3.05 11.2 12.8 21a9 9 0 0 0 2.2-.5L3.55 9a9 9 0 0 0-.5 2.2zM4.3 7.3 16.7 19.7a9 9 0 0 0 1.5-1.1L5.4 5.8A9 9 0 0 0 4.3 7.3zM6.6 4.6 19.4 17.4A9 9 0 0 0 6.6 4.6z"></path>
                </svg>
              </span>
              Linear
            </div>

            <div className="i">
              <span className="g" style={{ background: '#1F8DED' }}>
                <svg viewBox="0 0 24 24" fill="#fff">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4 13.4c0 .3-.2.5-.5.5-.3 0-2-1.4-3.5-1.4S9 15.9 8.5 15.9c-.3 0-.5-.2-.5-.5V8.6c0-.3.2-.5.5-.5s.5.2.5.5v6c.6-.4 1.9-1 3-1s2.4.6 3 1v-6c0-.3.2-.5.5-.5s.5.2.5.5z"></path>
                </svg>
              </span>
              Intercom
            </div>

            <div className="i">
              <span className="g" style={{ background: '#0E1300' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#C7F303" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="8 7 3 12 8 17"></polyline>
                  <polyline points="16 7 21 12 16 17"></polyline>
                </svg>
              </span>
              Webhooks
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Amado por los equipos' : 'Loved by teams'}
            </span>
            <h2 className="display">{lang === 'es' ? 'No solo lo decimos nosotros' : 'Don’t just take our word for it'}</h2>
          </div>

          <div className="tgrid">
            <div className="tcard">
              <div className="stars">★★★★★</div>
              <p>
                {lang === 'es'
                  ? '“Wappy redujo a la mitad nuestro tiempo de primera respuesta. Las sugerencias de Copilot son increíblemente buenas.”'
                  : '“Wappy cut our first response time in half. The Copilot suggestions are ridiculously accurate.”'}
              </p>
              <div className="who">
                <span className="av" style={{ background: '#E8EAFF', color: '#4852ED' }}>AG</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Ana García</div>
                  <div style={{ fontSize: 12.5, color: '#9A9AA8' }}>Head of Support</div>
                </div>
              </div>
            </div>

            <div className="tcard">
              <div className="stars">★★★★★</div>
              <p>
                {lang === 'es'
                  ? '“Reemplazamos tres herramientas distintas con Wappy. Una sola bandeja para todo el equipo y mucho menos caos.”'
                  : '“We replaced three separate tools with Wappy. One single inbox for the whole company, zero chaos.”'}
              </p>
              <div className="who">
                <span className="av" style={{ background: '#D6F4DF', color: '#0A5818' }}>MR</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Marco Rossi</div>
                  <div style={{ fontSize: 12.5, color: '#9A9AA8' }}>{lang === 'es' ? 'Fundador' : 'Founder'}</div>
                </div>
              </div>
            </div>

            <div className="tcard">
              <div className="stars">★★★★★</div>
              <p>
                {lang === 'es'
                  ? '“Con la app móvil nunca perdemos un ticket urgente — ni siquiera los fines de semana o fuera de oficina.”'
                  : '“With the mobile app we never miss a critical VIP customer ticket — even on weekends.”'}
              </p>
              <div className="who">
                <span className="av" style={{ background: '#FEF0DC', color: '#F09030' }}>SL</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Sofia Lind</div>
                  <div style={{ fontSize: 12.5, color: '#9A9AA8' }}>Support Lead</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lifestyle Section */}
      <section className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="life">
            <img className="bg" src="/marketing/ref-lifestyle-1.png" alt="Lifestyle Customer Support" />
            <div className="scrim"></div>
            <div className="life-copy">
              <span className="eyebrow">
                <span className="dot"></span>
                {lang === 'es' ? 'Conversaciones reales' : 'Real conversations'}
              </span>
              <h2>{lang === 'es' ? 'Encuentra a tus clientes donde ya están.' : 'Meet your customers right where they are.'}</h2>
              <p>
                {lang === 'es'
                  ? 'Tus clientes están chateando en su teléfono ahora mismo. Wappy te pone en el mismo hilo — rápido, cercano y con tu marca.'
                  : 'Your customers are messaging on their phones right now. Wappy puts you in the exact same thread — fast, personal, on-brand.'}
              </p>
              <div className="hero-cta" style={{ justifyContent: 'flex-start', marginTop: 24 }}>
                <button className="btn btn-lime" onClick={handleStartTrial}>
                  {lang === 'es' ? 'Empezar prueba de 7 días' : 'Start 7-day free trial'}
                </button>
              </div>
            </div>

            <div className="life-float" style={{ top: 36, right: 36, width: 250 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                <span style={{ width: 24, height: 24, borderRadius: 7, background: '#C7F303', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2">
                    <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"></path>
                  </svg>
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>Copilot</span>
              </div>
              <div style={{ background: '#C7F303', borderRadius: 12, padding: '9px 12px', fontSize: 12.5, fontWeight: 500, color: '#0E1300' }}>
                {lang === 'es' ? '¡Gracias por las fotos! 🔥 Me encanta cómo captaste la luz ✨' : 'Thanks for the photos! 🔥 Love how you captured the lighting ✨'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              FAQ
            </span>
            <h2 className="display">{lang === 'es' ? 'Preguntas, respondidas' : 'Questions, answered'}</h2>
          </div>

          <div className="faq">
            <div className={`qa ${openFaq === 0 ? 'open' : ''}`}>
              <button onClick={() => setOpenFaq(openFaq === 0 ? null : 0)} aria-expanded={openFaq === 0}>
                {lang === 'es' ? '¿En qué se diferencia Wappy de una bandeja compartida?' : 'How does Wappy differ from a standard shared email inbox?'}
                <span className="q-ico">+</span>
              </button>
              <div className="a">
                <p>
                  {lang === 'es'
                    ? 'Wappy unifica cada canal — WhatsApp, Instagram, Messenger, email, chat web — en una vista centralizada de hilos, con IA Copilot, automatizaciones avanzadas, centro de ayuda integrado y analíticas en tiempo real que una simple bandeja de correo no puede ofrecer.'
                    : 'Wappy unifies every single channel — WhatsApp, Instagram, Messenger, email, web chat — into one fast view with AI Copilot, automations, and built-in help center.'}
                </p>
              </div>
            </div>

            <div className={`qa ${openFaq === 1 ? 'open' : ''}`}>
              <button onClick={() => setOpenFaq(openFaq === 1 ? null : 1)} aria-expanded={openFaq === 1}>
                {lang === 'es' ? '¿Qué canales de mensajería soporta?' : 'Which messaging channels does Wappy support?'}
                <span className="q-ico">+</span>
              </button>
              <div className="a">
                <p>
                  {lang === 'es'
                    ? 'WhatsApp (Cloud API oficial y WhatsApp Web), Facebook Messenger, Instagram Direct, correo electrónico corporativo y el widget web integrable — con más integraciones en camino. Puedes conectar múltiples cuentas por canal.'
                    : 'WhatsApp official Cloud API, Facebook Messenger, Instagram Direct, email, and live web chat — with support for multiple accounts per channel.'}
                </p>
              </div>
            </div>

            <div className={`qa ${openFaq === 2 ? 'open' : ''}`}>
              <button onClick={() => setOpenFaq(openFaq === 2 ? null : 2)} aria-expanded={openFaq === 2}>
                {lang === 'es' ? '¿Cuánto cuesta y cómo funciona la prueba?' : 'How much does it cost and how does the trial work?'}
                <span className="q-ico">+</span>
              </button>
              <div className="a">
                <p>
                  {lang === 'es'
                    ? 'Los planes empiezan en $29/mes (Starter) y escalan a Growth ($99/mes) y Scale ($249/mes). Cada plan comienza con una prueba gratis de 7 días completa, sin necesidad de ingresar tarjeta de crédito.'
                    : 'Plans start at $29/mo (Starter) up to Growth ($99) and Scale ($249). Every plan includes a 7-day unrestricted trial with no credit card required.'}
                </p>
              </div>
            </div>

            <div className={`qa ${openFaq === 3 ? 'open' : ''}`}>
              <button onClick={() => setOpenFaq(openFaq === 3 ? null : 3)} aria-expanded={openFaq === 3}>
                {lang === 'es' ? '¿Mis datos y conversaciones están seguros?' : 'Is our customer data secure and compliant?'}
                <span className="q-ico">+</span>
              </button>
              <div className="a">
                <p>
                  {lang === 'es'
                    ? 'Totalmente. Todos los datos están cifrados tanto en tránsito como en reposo (AES-256 y TLS 1.3), con control granular de acceso por roles, registros detallados de auditoría y copias de seguridad continuas.'
                    : 'Yes — all communications are encrypted in transit and at rest with role-based permissions and complete audit logging.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="band" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">
              <span className="dot"></span>
              {lang === 'es' ? 'Precios' : 'Pricing'}
            </span>
            <h2 className="display">{lang === 'es' ? 'Precios simples y escalables' : 'Simple, scalable pricing'}</h2>
            <p>
              {lang === 'es'
                ? 'Cada plan empieza con una prueba gratis de 7 días. Sin tarjeta para comenzar.'
                : 'Every plan starts with a 7-day free trial. No credit card required.'}
            </p>
          </div>

          <div className="price">
            {/* Starter */}
            <div className="pcard">
              <div className="pn">Starter</div>
              <div className="pp">$29<span>{lang === 'es' ? '/mes' : '/mo'}</span></div>
              <div style={{ fontSize: 13, color: '#9A9AA8', marginBottom: 4 }}>
                {lang === 'es' ? 'Para equipos pequeños' : 'For small teams'}
              </div>
              <div className="ptrial">
                <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#1E8E3E', display: 'inline-block' }}></span>
                {lang === 'es' ? 'Prueba gratis de 7 días' : '7-day free trial'}
              </div>
              <ul>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? '2 asientos de agente' : '2 agent seats'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? '3 canales (WhatsApp, email, web)' : '3 channels (WhatsApp, email, web)'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? '1.000 conversaciones / mes' : '1,000 conversations / mo'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Bandeja compartida y widget web' : 'Shared inbox and web widget'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Centro de ayuda (1 colección)' : 'Help Center (1 collection)'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Apps iOS y Android' : 'iOS & Android mobile apps'}
                </li>
              </ul>
              <button className="btn btn-glass btn-sm" style={{ marginTop: 'auto', justifyContent: 'center', border: '1px solid var(--line)' }} onClick={handleStartTrial}>
                {lang === 'es' ? 'Empezar prueba gratis' : 'Start free trial'}
              </button>
            </div>

            {/* Growth (Featured) */}
            <div className="pcard feat-plan">
              <span className="pbadge">{lang === 'es' ? 'Más popular' : 'Most Popular'}</span>
              <div className="pn">Growth</div>
              <div className="pp">$99<span>{lang === 'es' ? '/mes' : '/mo'}</span></div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
                {lang === 'es' ? 'Para equipos en crecimiento' : 'For growing teams'}
              </div>
              <div className="ptrial">
                <span style={{ width: 6, height: 6, borderRadius: 9999, background: 'var(--lime)', display: 'inline-block' }}></span>
                {lang === 'es' ? 'Prueba gratis de 7 días' : '7-day free trial'}
              </div>
              <ul>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <strong>{lang === 'es' ? 'Todo lo de Starter, más:' : 'Everything in Starter, plus:'}</strong>
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? '10 asientos · los 5 canales omnicanal' : '10 seats · all 5 channels'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? '10.000 conversaciones / mes' : '10,000 conversations / mo'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Copilot con IA y automatizaciones' : 'AI Copilot and automations'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Colecciones de ayuda ilimitadas' : 'Unlimited help collections'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Bot Builder y analíticas avanzadas' : 'Bot Builder & advanced analytics'}
                </li>
              </ul>
              <button className="btn btn-lime btn-sm" style={{ marginTop: 'auto', justifyContent: 'center' }} onClick={handleStartTrial}>
                {lang === 'es' ? 'Empezar prueba gratis' : 'Start free trial'}
              </button>
            </div>

            {/* Scale */}
            <div className="pcard">
              <div className="pn">Scale</div>
              <div className="pp">$249<span>{lang === 'es' ? '/mes' : '/mo'}</span></div>
              <div style={{ fontSize: 13, color: '#9A9AA8', marginBottom: 4 }}>
                {lang === 'es' ? 'Para alto volumen y empresas' : 'For high volume & scale'}
              </div>
              <div className="ptrial">
                <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#1E8E3E', display: 'inline-block' }}></span>
                {lang === 'es' ? 'Prueba gratis de 7 días' : '7-day free trial'}
              </div>
              <ul>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  <strong>{lang === 'es' ? 'Todo lo de Growth, más:' : 'Everything in Growth, plus:'}</strong>
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Asientos y conversaciones ilimitados' : 'Unlimited seats & conversations'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Roles y permisos granulares' : 'Granular roles & permissions'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Centros de ayuda multi-marca' : 'Multi-brand help centers'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Reportes programados y SLAs' : 'Scheduled reports & SLAs'}
                </li>
                <li>
                  <span className="pck">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
                  {lang === 'es' ? 'Soporte prioritario y onboarding VIP' : 'Dedicated support & onboarding'}
                </li>
              </ul>
              <button className="btn btn-glass btn-sm" style={{ marginTop: 'auto', justifyContent: 'center', border: '1px solid var(--line)' }} onClick={handleStartTrial}>
                {lang === 'es' ? 'Empezar prueba gratis' : 'Start free trial'}
              </button>
            </div>
          </div>

          <div className="price-note">
            {lang === 'es'
              ? 'Todos los planes incluyen el widget integrable, el Centro de ayuda y las apps móviles.'
              : 'All plans include the embeddable widget, help center, and mobile apps.'}{' '}
            <button
              type="button"
              className="legal-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => setIsCompareModalOpen(true)}
            >
              {lang === 'es' ? 'Comparar todas las funciones →' : 'Compare all features →'}
            </button>
          </div>
        </div>
      </section>

      {/* Final Banner */}
      <section className="final">
        <span className="trial" style={{ marginBottom: 18 }}>
          <span className="tdot"></span>
          {lang === 'es' ? 'Prueba gratis de 7 días · sin tarjeta' : '7-day free trial · no credit card required'}
        </span>
        <h2>{lang === 'es' ? 'Empieza gratis en 2 minutos.' : 'Get started in 2 minutes.'}</h2>
        <p>
          {lang === 'es'
            ? 'Trae tus canales, invita a tu equipo y sal en vivo hoy mismo.'
            : 'Connect your channels, invite your team, and go live today.'}
        </p>
        <div className="hero-cta" style={{ marginTop: 28 }}>
          <button className="btn btn-primary" onClick={handleStartTrial}>
            {lang === 'es' ? 'Empezar prueba de 7 días' : 'Start 7-day free trial'}
            <span className="pip">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </button>
          <button className="btn btn-glass" onClick={() => setIsDemoModalOpen(true)}>
            {lang === 'es' ? 'Agendar demo' : 'Book a demo'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="fcloud" style={{ top: 40, left: -50, width: 280, height: 110 }}></div>
        <div className="fcloud" style={{ top: 120, right: -40, width: 240, height: 100 }}></div>

        <div className="wrap">
          <div className="foot-cta">
            <img src="/marketing/wappy-wordmark.png" alt="Wappy" />
            <h3 className="display">{lang === 'es' ? 'Listos cuando tú lo estés.' : 'Ready when you are.'}</h3>
            <p>{lang === 'es' ? 'Empieza tu prueba gratis de 7 días — sin tarjeta de crédito.' : 'Start your 7-day free trial — no credit card needed.'}</p>
            <div className="hero-cta" style={{ marginTop: 22 }}>
              <button className="btn btn-primary" onClick={handleStartTrial}>
                {lang === 'es' ? 'Empezar prueba gratis' : 'Start free trial'}
                <span className="pip">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </span>
              </button>
              <button type="button" className="btn btn-glass" onClick={handleLogin}>
                {isAuthenticated ? (lang === 'es' ? 'Ir al Chat' : 'Go to Chat') : (lang === 'es' ? 'Iniciar sesión' : 'Sign in')}
              </button>
            </div>

            <div className="hero-badges" style={{ marginTop: 18 }}>
              <a className="store-badge" href="#app">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                  <path d="M16 1.6c.06.9-.3 1.8-.86 2.43-.6.66-1.55 1.17-2.48 1.1-.07-.88.35-1.8.88-2.36C14.08 2.1 15.1 1.64 16 1.6zM18.9 8.5c-.8.5-1.3 1.4-1.3 2.4 0 1.2.7 2.2 1.7 2.6-.2.6-.5 1.3-.9 1.9-.6.9-1.2 1.8-2.1 1.8-.9 0-1.2-.5-2.2-.5s-1.4.5-2.2.5c-.9 0-1.6-1-2.2-1.9-1.3-1.9-2.3-5.3-1-7.6.7-1.2 1.8-1.9 3-1.9.9 0 1.7.6 2.2.6.5 0 1.5-.7 2.6-.6.5 0 1.8.2 2.7 1.2z"></path>
                </svg>
                <div>
                  <div className="s1">Download on the</div>
                  <div className="s2">App Store</div>
                </div>
              </a>
              <a className="store-badge" href="#app">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                  <path d="M3.6 2.4 13 12 3.6 21.6c-.3-.3-.5-.7-.5-1.3V3.7c0-.6.2-1 .5-1.3zM14.3 13.3l2.5 2.5-9.6 5.5 7.1-8zM17.9 9.8l3 1.7c.9.5.9 1.5 0 2l-3 1.7-2.7-2.7 2.7-2.7zM7.2 2.7l9.6 5.5-2.5 2.5-7.1-8z"></path>
                </svg>
                <div>
                  <div className="s1">Get it on</div>
                  <div className="s2">Google Play</div>
                </div>
              </a>
            </div>
          </div>

          <div className="foot-top">
            <div className="foot-brand">
              <img src="/marketing/wappy-wordmark.png" alt="Wappy" />
              <p>
                {lang === 'es'
                  ? 'Habla con cada cliente, en cada canal, desde una sola bandeja veloz.'
                  : 'Talk to every customer, on every channel, from one fast inbox.'}
              </p>
            </div>

            <div className="foot-cols">
              <div className="foot-col">
                <h4>{lang === 'es' ? 'Producto' : 'Product'}</h4>
                <a href="#features">{lang === 'es' ? 'Bandeja' : 'Inbox'}</a>
                <a href="#app">{lang === 'es' ? 'App móvil' : 'Mobile app'}</a>
                <a href="#features">{lang === 'es' ? 'Widget web' : 'Web widget'}</a>
                <a href="#pricing">{lang === 'es' ? 'Precios' : 'Pricing'}</a>
              </div>
              <div className="foot-col">
                <h4>{lang === 'es' ? 'Empresa' : 'Company'}</h4>
                <a href="#about">{lang === 'es' ? 'Nosotros' : 'About'}</a>
                <a href="#careers">{lang === 'es' ? 'Empleo' : 'Careers'}</a>
                <a href="/blog">{lang === 'es' ? 'Blog' : 'Blog'}</a>
                <a href="#contact">{lang === 'es' ? 'Contacto' : 'Contact'}</a>
              </div>
              <div className="foot-col">
                <h4>{lang === 'es' ? 'Recursos' : 'Resources'}</h4>
                <a href="#faq">{lang === 'es' ? 'Centro de ayuda' : 'Help Center'}</a>
                <a href="#api">{lang === 'es' ? 'Docs de API' : 'API Docs'}</a>
                <a href="#status">{lang === 'es' ? 'Estado' : 'Status'}</a>
                <a href="#changelog">Changelog</a>
              </div>
              <div className="foot-col">
                <h4>Legal</h4>
                <a href="/terms">{lang === 'es' ? 'Términos' : 'Terms'}</a>
                <a href="/privacy-policy">{lang === 'es' ? 'Privacidad' : 'Privacy'}</a>
                <a href="/cookies">Cookies</a>
              </div>
            </div>
          </div>

          <div className="foot-word">WAPPY</div>

          <div className="foot-bottom">
            <span>© 2026 Wappy. {lang === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}</span>
            <div className="foot-legal">
              <a href="/terms">{lang === 'es' ? 'Términos y condiciones' : 'Terms of service'}</a>
              <a href="/privacy-policy">{lang === 'es' ? 'Privacidad' : 'Privacy policy'}</a>
              <a href="/cookies">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      <div className={`mkt-toast ${toastMessage ? 'show' : ''}`} role="status">
        {toastMessage}
      </div>

      {/* Demo Booking Modal */}
      <div className={`mkt-modal-scrim ${isDemoModalOpen ? 'show' : ''}`} aria-hidden={!isDemoModalOpen}>
        <div className="mkt-modal" role="dialog" aria-modal="true" aria-label="Demo Wappy">
          <button className="mkt-modal-x" onClick={() => setIsDemoModalOpen(false)} aria-label="Close">
            ×
          </button>
          <span className="eyebrow">
            <span className="dot"></span>
            {lang === 'es' ? 'Agendar demo' : 'Book a demo'}
          </span>
          <h3 className="display" style={{ fontSize: 28, margin: '14px 0 6px' }}>
            {lang === 'es' ? 'Mira Wappy en vivo' : 'See Wappy in action'}
          </h3>
          <p style={{ color: '#5a6470', fontSize: 15, margin: '0 0 20px', lineHeight: 1.5 }}>
            {lang === 'es'
              ? 'Elige un horario y le mostramos a tu equipo la bandeja, el Copilot con IA y el widget integrado.'
              : 'Pick a time and we’ll walk your team through the shared inbox, AI Copilot, and widget.'}
          </p>

          <form onSubmit={handleDemoSubmit}>
            <input
              className="fld"
              type="text"
              placeholder={lang === 'es' ? 'Nombre completo' : 'Full name'}
              required
              value={demoName}
              onChange={(e) => setDemoName(e.target.value)}
            />
            <input
              className="fld"
              type="email"
              placeholder={lang === 'es' ? 'Email de trabajo' : 'Work email'}
              required
              value={demoEmail}
              onChange={(e) => setDemoEmail(e.target.value)}
            />
            <input
              className="fld"
              type="text"
              placeholder={lang === 'es' ? 'Empresa' : 'Company'}
              value={demoCompany}
              onChange={(e) => setDemoCompany(e.target.value)}
            />
            <select
              className="fld"
              value={demoTeamSize}
              onChange={(e) => setDemoTeamSize(e.target.value)}
            >
              <option value="1–5">{lang === 'es' ? 'Tamaño del equipo: 1–5' : 'Team size: 1–5'}</option>
              <option value="6–20">{lang === 'es' ? 'Tamaño del equipo: 6–20' : 'Team size: 6–20'}</option>
              <option value="21–50">{lang === 'es' ? 'Tamaño del equipo: 21–50' : 'Team size: 21–50'}</option>
              <option value="50+">{lang === 'es' ? 'Tamaño del equipo: 50+' : 'Team size: 50+'}</option>
            </select>
            <button className="btn btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}>
              {lang === 'es' ? 'Solicitar demo' : 'Request demo'}
              <span className="pip">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0E1300" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </button>
          </form>
          <p style={{ fontSize: 12, color: '#5a6470', textAlign: 'center', margin: '14px 0 0' }}>
            {lang === 'es' ? 'O empieza una ' : 'Or start a '}
            <button
              type="button"
              className="legal-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onClick={() => {
                setIsDemoModalOpen(false);
                handleStartTrial();
              }}
            >
              {lang === 'es' ? 'prueba gratis de 7 días' : '7-day free trial'}
            </button>.
          </p>
        </div>
      </div>

      {/* Plan Comparison Modal */}
      <div className={`mkt-modal-scrim ${isCompareModalOpen ? 'show' : ''}`} aria-hidden={!isCompareModalOpen}>
        <div className="mkt-modal mkt-cmp-modal" role="dialog" aria-modal="true" aria-label="Comparación de planes">
          <button className="mkt-modal-x" onClick={() => setIsCompareModalOpen(false)} aria-label="Close">
            ×
          </button>
          <span className="eyebrow">
            <span className="dot"></span>
            {lang === 'es' ? 'Comparación de planes' : 'Plan comparison'}
          </span>
          <h3 className="display" style={{ fontSize: 26, margin: '14px 0 18px' }}>
            {lang === 'es' ? 'Cada función, lado a lado' : 'Every feature, side by side'}
          </h3>

          <div className="mkt-cmp-scroll">
            <table className="mkt-cmp-table">
              <thead>
                <tr>
                  <th>{lang === 'es' ? 'Función' : 'Feature'}</th>
                  <th>Starter<br /><span>$29</span></th>
                  <th className="hl">Growth<br /><span>$99</span></th>
                  <th>Scale<br /><span>$249</span></th>
                </tr>
              </thead>
              <tbody>
                <tr className="grp">
                  <td colSpan={4}>Core</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Asientos de agente' : 'Agent seats'}</td>
                  <td>2</td>
                  <td className="hl">10</td>
                  <td>{lang === 'es' ? 'Ilimitados' : 'Unlimited'}</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Conversaciones / mes' : 'Conversations / mo'}</td>
                  <td>1.000</td>
                  <td className="hl">10.000</td>
                  <td>{lang === 'es' ? 'Ilimitadas' : 'Unlimited'}</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Canales omnicanal' : 'Omnichannel channels'}</td>
                  <td>3</td>
                  <td className="hl">{lang === 'es' ? 'Los 5' : 'All 5'}</td>
                  <td>{lang === 'es' ? 'Los 5' : 'All 5'}</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Bandeja compartida y widget web' : 'Shared inbox & widget'}</td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Apps iOS y Android' : 'iOS & Android apps'}</td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>

                <tr className="grp">
                  <td colSpan={4}>{lang === 'es' ? 'Centro de ayuda' : 'Help Center'}</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Colecciones de ayuda' : 'Help collections'}</td>
                  <td>1</td>
                  <td className="hl">{lang === 'es' ? 'Ilimitadas' : 'Unlimited'}</td>
                  <td>{lang === 'es' ? 'Multi-marca' : 'Multi-brand'}</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Búsqueda en widget' : 'In-widget search'}</td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>

                <tr className="grp">
                  <td colSpan={4}>{lang === 'es' ? 'Productividad e IA' : 'AI & Productivity'}</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Respuestas guardadas y macros' : 'Saved replies & macros'}</td>
                  <td><span className="cy">✓</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Copilot IA (respuestas, resumen, tono)' : 'AI Copilot (replies, summary, tone)'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Automatizaciones (flujos cuando/entonces)' : 'Automations (when/then)'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Bot Builder y Campañas' : 'Bot Builder & Campaigns'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>

                <tr className="grp">
                  <td colSpan={4}>{lang === 'es' ? 'Insights y Empresa' : 'Insights & Enterprise'}</td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Panel de analíticas' : 'Analytics dashboard'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Integraciones y webhooks' : 'Integrations & webhooks'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cy">✓</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Reportes programados y SLAs' : 'Scheduled reports & SLAs'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cn">–</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Roles y permisos' : 'Roles & permissions'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cn">–</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'SSO y registro de auditoría' : 'SSO & audit logs'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cn">–</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
                <tr>
                  <td>{lang === 'es' ? 'Soporte prioritario y onboarding' : 'Priority support & onboarding'}</td>
                  <td><span className="cn">–</span></td>
                  <td className="hl"><span className="cn">–</span></td>
                  <td><span className="cy">✓</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', minWidth: 160 }} onClick={() => { setIsCompareModalOpen(false); handleStartTrial(); }}>
              {lang === 'es' ? 'Empezar prueba de 7 días' : 'Start 7-day trial'}
            </button>
            <button className="btn btn-glass" style={{ flex: 1, justifyContent: 'center', minWidth: 140, border: '1px solid #e7eaee' }} onClick={() => { setIsCompareModalOpen(false); setIsDemoModalOpen(true); }}>
              {lang === 'es' ? 'Agendar demo' : 'Book demo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
