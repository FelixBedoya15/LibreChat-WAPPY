import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { 
    Video, 
    CheckCircle, 
    Clock, 
    Shield, 
    Info, 
    ChevronLeft, 
    ChevronRight, 
    Zap, 
    X, 
    History, 
    Radio, 
    Calendar,
    Sparkles,
    Check
} from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { OpenSidebar } from '~/components/Chat/Menus';
import type { ContextType } from '~/common';

// --- Utilities ---
const cleanMeetLink = (link?: string) => {
    if (!link) return '#';
    let url = link.trim();
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    const match = url.match(urlRegex);
    if (match && match[0]) {
        url = match[0];
    }
    url = url.replace(/[.,;)"'>]+$/, '');
    if (url && !/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }
    return url;
};

export const getEventTiming = (dateTime?: string | Date) => {
    if (!dateTime) return { isLive: false, isPast: false, isUpcoming: true };
    const eventTime = new Date(dateTime).getTime();
    const now = Date.now();
    const liveDuration = 2 * 60 * 60 * 1000; // 2 hours live window

    if (now >= eventTime && now <= eventTime + liveDuration) {
        return { isLive: true, isPast: false, isUpcoming: false };
    }
    if (now > eventTime + liveDuration) {
        return { isLive: false, isPast: true, isUpcoming: false };
    }
    return { isLive: false, isPast: false, isUpcoming: true };
};

// --- Sub-components ---

const EventModal = ({ 
    event, 
    onClose, 
    onRegister, 
    registering 
}: { 
    event: any; 
    onClose: () => void; 
    onRegister: () => void; 
    registering: boolean; 
}) => {
    if (!event) return null;

    const { isLive, isPast } = getEventTiming(event.dateTime);

    const formattedDate = new Date(event.dateTime).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}>
            <div 
                className="bg-surface-primary border border-border-light dark:border-white/10 rounded-2xl overflow-hidden w-full max-w-4xl shadow-2xl relative flex flex-col md:flex-row animate-fade-in scale-95 md:scale-100"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/80 text-white rounded-full p-2 backdrop-blur-md transition-colors">
                    <X size={20} />
                </button>

                {/* Image Section */}
                <div className="w-full md:w-2/5 h-56 md:h-auto relative bg-surface-tertiary flex-shrink-0">
                    {event.thumbnail ? (
                        <img 
                            src={event.thumbnail.startsWith('http') || event.thumbnail.startsWith('/') ? event.thumbnail : `/images/${event.thumbnail.split('/').pop()}`} 
                            alt={event.title} 
                            className={`w-full h-full object-cover ${isPast ? 'filter grayscale-[20%]' : ''}`}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-tertiary to-surface-secondary">
                            <Video className="w-16 h-16 text-text-tertiary" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-surface-primary" />
                </div>

                {/* Content Section */}
                <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col max-h-[80vh] md:max-h-[70vh]">
                    <div className="flex flex-wrap items-center gap-2 mb-3 shrink-0">
                        {isPast ? (
                            <span className="bg-slate-500/20 text-slate-400 text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-widest border border-slate-500/30 flex items-center gap-1">
                                <History size={12} /> Evento Finalizado
                            </span>
                        ) : isLive ? (
                            <span className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-widest flex items-center gap-1 animate-pulse shadow-md shadow-rose-500/30">
                                <Radio size={12} /> En Vivo Ahora
                            </span>
                        ) : (
                            <span className="bg-[#10b981]/15 text-[#10b981] text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-widest border border-[#10b981]/25 flex items-center gap-1">
                                <Sparkles size={12} /> Próximo Evento
                            </span>
                        )}

                        {event.tags && event.tags.map((tag: string, i: number) => (
                            <span key={i} className="bg-surface-tertiary text-text-secondary text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-border-light dark:border-white/5">
                                {tag}
                            </span>
                        ))}
                    </div>
                    
                    <h2 className="text-2xl md:text-3xl font-black text-text-primary mb-2 leading-tight shrink-0">
                        {event.title}
                    </h2>

                    <div className={`text-sm font-bold mb-4 flex items-center gap-1.5 shrink-0 ${isPast ? 'text-text-tertiary' : isLive ? 'text-rose-500' : 'text-green-500'}`}>
                        <Clock size={16} />
                        {formattedDate}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto pr-2 mb-6 no-scrollbar">
                        <p className="text-sm md:text-base text-text-secondary leading-relaxed whitespace-pre-wrap">
                            {event.description || 'Sesión virtual por Google Meet sobre temáticas clave de SST y prevención.'}
                        </p>

                        {isPast && (
                            <div className="mt-4 p-4 bg-slate-500/10 border border-slate-500/20 rounded-xl">
                                <div className="text-xs font-bold text-text-secondary flex items-center gap-1.5 mb-1">
                                    <History size={14} className="text-slate-400" />
                                    Este evento ya fue realizado
                                </div>
                                <p className="text-xs text-text-tertiary">
                                    {event.isRegistered 
                                        ? 'Estuviste inscrito en este evento. ¡Gracias por tu participación!' 
                                        : 'La fecha programada para este taller ha concluido y las inscripciones se encuentran cerradas.'}
                                </p>
                            </div>
                        )}

                        {event.isRegistered && !isPast && (
                            <div className="mt-5 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <h4 className="text-sm font-bold text-[#10b981] mb-2 flex items-center gap-1.5">
                                    <CheckCircle size={16} /> ¡Ya estás inscrito!
                                </h4>
                                <p className="text-xs text-text-secondary mb-3">
                                    Te hemos enviado un correo de confirmación. Puedes ingresar a la reunión a través de este enlace:
                                </p>
                                <a 
                                    href={cleanMeetLink(event.meetLink)} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="inline-flex items-center gap-2 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors shadow-lg shadow-green-500/20"
                                >
                                    <Video size={14} /> Entrar a Google Meet
                                </a>
                                {event.meetPassword && (
                                    <p className="text-[11px] text-text-tertiary mt-2">
                                        Clave de conexión: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{event.meetPassword}</code>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pt-5 border-t border-border-light dark:border-white/5 flex items-center justify-between shrink-0">
                        {isPast ? (
                            <div className="w-full flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 text-xs text-text-tertiary font-semibold">
                                    <Check size={14} /> Inscripciones Cerradas
                                </span>
                                <button 
                                    onClick={onClose}
                                    className="bg-surface-secondary hover:bg-surface-hover text-text-primary px-5 py-2.5 rounded-xl font-bold text-sm transition-colors border border-border-light dark:border-white/10"
                                >
                                    Cerrar
                                </button>
                            </div>
                        ) : event.isRegistered ? (
                            <div className="w-full flex items-center justify-between">
                                <span className="inline-flex items-center gap-1.5 text-xs text-green-500 font-bold">
                                    <CheckCircle size={14} /> Inscripción Confirmada
                                </span>
                                <a
                                    href={cleanMeetLink(event.meetLink)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-[#10b981] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#059669] transition-all shadow-md shadow-[#10b981]/20"
                                >
                                    <Video size={16} /> {isLive ? 'Entrar Ahora' : 'Ir a Sala Meet'}
                                </a>
                            </div>
                        ) : (
                            <>
                                <button 
                                    onClick={onRegister}
                                    disabled={registering}
                                    className="flex items-center gap-2 bg-[#10b981] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#059669] disabled:bg-gray-400 transition-all hover:scale-105 shadow-lg shadow-[#10b981]/20"
                                >
                                    <CheckCircle size={18} /> Registrarme en Meet
                                </button>
                                
                                <p className="text-xs text-right text-text-tertiary max-w-[200px]">
                                    Recibirás la invitación por correo y se agendará en tu Centro de Control.
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const EventCard = ({ event, onMoreInfo }: { event: any; onMoreInfo: () => void }) => {
    const { isLive, isPast } = getEventTiming(event.dateTime);

    const formattedDate = new Date(event.dateTime).toLocaleString('es-CO', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

    return (
        <div 
            onClick={onMoreInfo}
            className={`group relative flex-none w-56 sm:w-64 md:w-80 aspect-video rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 shadow-lg border ${
                isPast 
                    ? 'border-border-light dark:border-white/5 opacity-80 hover:opacity-100' 
                    : isLive 
                        ? 'border-rose-500/50 shadow-rose-500/10' 
                        : 'border-border-light dark:border-white/5 hover:border-[#10b981]/30'
            }`}
        >
            {/* Thumbnail */}
            <div className="absolute inset-0 bg-surface-tertiary">
                {event.thumbnail ? (
                    <img 
                        src={event.thumbnail.startsWith('http') || event.thumbnail.startsWith('/') ? event.thumbnail : `/images/${event.thumbnail.split('/').pop()}`} 
                        alt={event.title} 
                        className={`w-full h-full object-cover ${isPast ? 'filter grayscale-[25%]' : ''}`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-tertiary to-surface-secondary">
                        <Video className="w-10 h-10 text-text-tertiary" />
                    </div>
                )}
            </div>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-85 group-hover:opacity-100 transition-opacity" />

            {/* Content Overlay */}
            <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-end transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    {isPast ? (
                        <span className="bg-slate-700/90 text-gray-200 text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1 backdrop-blur-sm">
                            <History size={10} /> Finalizado
                        </span>
                    ) : isLive ? (
                        <span className="bg-rose-600 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1 animate-pulse">
                            <Radio size={10} /> En Vivo
                        </span>
                    ) : (
                        <span className="bg-blue-600 text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1">
                            <Clock size={10} /> {formattedDate}
                        </span>
                    )}

                    {event.isRegistered && (
                        <span className="bg-[#10b981] text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1">
                            <CheckCircle size={10} /> Inscrito
                        </span>
                    )}

                    {event.tags && event.tags[0] && (
                        <span className="bg-white/20 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            {event.tags[0]}
                        </span>
                    )}
                </div>

                <h3 className="text-white font-bold text-xs sm:text-sm md:text-base line-clamp-2 drop-shadow-md">
                    {event.title}
                </h3>
            </div>
            
            {/* Hover Action Info */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/50 hover:bg-black/70 backdrop-blur-md p-1.5 rounded-full border border-white/20 transition-colors">
                    <Info size={14} className="text-white" />
                </div>
            </div>
        </div>
    );
};

const EventRow = ({ 
    title, 
    subtitle,
    events, 
    onMoreInfo,
    isPastRow = false 
}: { 
    title: string; 
    subtitle?: string;
    events: any[]; 
    onMoreInfo: (event: any) => void;
    isPastRow?: boolean;
}) => {
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
            rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    if (events.length === 0) return null;

    return (
        <div className="mb-6 sm:mb-8 md:mb-12 group/row relative">
            <div className="px-4 sm:px-6 md:px-12 mb-3 sm:mb-4">
                <h2 className="text-sm sm:text-lg md:text-2xl font-black text-text-primary tracking-tight flex items-center gap-2 sm:gap-3">
                    <span className={`w-1 h-4 sm:w-1.5 sm:h-6 rounded-full ${isPastRow ? 'bg-slate-400' : 'bg-[#10b981]'}`} />
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-xs sm:text-sm text-text-secondary mt-0.5 ml-3 sm:ml-4 font-normal">
                        {subtitle}
                    </p>
                )}
            </div>
            
            {/* Scroll Buttons */}
            <button 
                onClick={() => scroll('left')}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 opacity-0 group-hover/row:opacity-100 transition-all hover:bg-black/80 hover:scale-110 hidden sm:flex items-center justify-center text-white shadow-2xl"
                aria-label="Scroll left"
            >
                <ChevronLeft size={24} />
            </button>
            <button 
                onClick={() => scroll('right')}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 opacity-0 group-hover/row:opacity-100 transition-all hover:bg-black/80 hover:scale-110 hidden sm:flex items-center justify-center text-white shadow-2xl"
                aria-label="Scroll right"
            >
                <ChevronRight size={24} />
            </button>

            <div 
                ref={rowRef}
                className="flex gap-3 sm:gap-4 overflow-x-auto px-4 sm:px-6 md:px-12 pb-4 pt-2 no-scrollbar scroll-smooth"
            >
                {events.map(event => (
                    <EventCard key={event._id} event={event} onMoreInfo={() => onMoreInfo(event)} />
                ))}
            </div>
        </div>
    );
};

const FeaturedHero = ({ 
    event, 
    onMoreInfo, 
    onRegister, 
    registering 
}: { 
    event: any; 
    onMoreInfo: () => void; 
    onRegister: () => void; 
    registering: boolean; 
}) => {
    if (!event) return null;

    const { isLive, isPast } = getEventTiming(event.dateTime);

    const formattedDate = new Date(event.dateTime).toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <div className="relative w-full h-screen overflow-hidden flex flex-col justify-end pb-16 sm:pb-20 md:pb-28">
            {/* Background Image */}
            <div className="absolute inset-0">
                {event.thumbnail ? (
                    <img 
                        src={event.thumbnail.startsWith('http') || event.thumbnail.startsWith('/') ? event.thumbnail : `/images/${event.thumbnail.split('/').pop()}`} 
                        alt={event.title} 
                        className={`w-full h-full object-cover ${isPast ? 'filter grayscale-[20%]' : ''}`}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-primary" />
                )}
                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 sm:from-black/80 via-black/50 sm:via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-primary via-surface-primary/20 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative px-4 sm:px-6 md:px-12 max-w-4xl z-10 pt-24">
                <div className="flex items-center gap-2 mb-3 sm:mb-4 animate-fade-in">
                    {isPast ? (
                        <span className="bg-slate-700 text-gray-200 text-[8px] sm:text-[10px] md:text-xs font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded uppercase tracking-widest flex items-center gap-1 sm:gap-1.5 shadow-lg border border-white/10">
                            <History size={12} className="hidden sm:block" /> EVENTO REALIZADO
                        </span>
                    ) : isLive ? (
                        <span className="bg-rose-600 text-white text-[8px] sm:text-[10px] md:text-xs font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded uppercase tracking-widest flex items-center gap-1 sm:gap-1.5 shadow-lg animate-pulse">
                            <Radio size={12} className="hidden sm:block" /> EN VIVO AHORA
                        </span>
                    ) : (
                        <span className="bg-[#10b981] text-white text-[8px] sm:text-[10px] md:text-xs font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded uppercase tracking-widest flex items-center gap-1 sm:gap-1.5 shadow-lg">
                            <Zap size={12} className="fill-white hidden sm:block" /> PRÓXIMO EVENTO
                        </span>
                    )}

                    {event.tags && event.tags[0] && (
                        <span className="bg-white/10 backdrop-blur-md text-white text-[8px] sm:text-[10px] md:text-xs font-black px-1.5 sm:px-2 py-0.5 sm:py-1 rounded uppercase tracking-widest border border-white/10 shadow-lg">
                            {event.tags[0]}
                        </span>
                    )}
                </div>
                
                <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-white mb-2 leading-tight drop-shadow-2xl line-clamp-3">
                    {event.title}
                </h1>

                <div className={`text-sm sm:text-base font-bold mb-4 flex items-center gap-1.5 shrink-0 ${isPast ? 'text-gray-300' : isLive ? 'text-rose-400' : 'text-green-400'}`}>
                    <Clock size={16} />
                    {formattedDate}
                </div>
                
                <p className="text-xs sm:text-base md:text-xl text-gray-200/90 mb-6 sm:mb-8 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow-md max-w-2xl">
                    {event.description || (isPast 
                        ? 'Este taller virtual ya fue realizado. Consulta más detalles o explora los próximos eventos de Wappy.' 
                        : 'Regístrate para asegurar tu cupo al evento virtual por Google Meet y recibir los detalles de conexión por email.')}
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                    {isPast ? (
                        <>
                            <button 
                                onClick={onMoreInfo}
                                className="flex items-center justify-center gap-2 sm:gap-3 bg-white text-black px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-xl font-black text-sm sm:text-lg hover:bg-gray-200 transition-all transform active:scale-95 shadow-xl"
                            >
                                <Info size={18} /> Ver Resumen del Evento
                            </button>
                        </>
                    ) : event.isRegistered ? (
                        <a
                            href={cleanMeetLink(event.meetLink)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 sm:gap-3 bg-[#10b981] hover:bg-[#059669] text-white px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-xl font-black text-sm sm:text-lg transition-all transform active:scale-95 shadow-xl shadow-green-600/20"
                        >
                            <Video size={18} /> {isLive ? 'Entrar a Google Meet' : 'Ir al Enlace de Meet'}
                        </a>
                    ) : (
                        <button 
                            onClick={onRegister}
                            disabled={registering}
                            className="flex items-center justify-center gap-2 sm:gap-3 bg-[#10b981] hover:bg-[#059669] text-white px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-xl font-black text-sm sm:text-lg disabled:bg-gray-400 transition-all transform active:scale-95 shadow-xl shadow-green-600/20"
                        >
                            <CheckCircle size={18} /> Inscribirme Ahora
                        </button>
                    )}

                    {!isPast && (
                        <button 
                            onClick={onMoreInfo}
                            className="flex items-center justify-center gap-2 sm:gap-3 bg-gray-500/40 backdrop-blur-xl text-white px-5 sm:px-8 py-2.5 sm:py-3.5 rounded-xl font-black text-sm sm:text-lg hover:bg-gray-500/60 transition-all border border-white/10 active:scale-95 shadow-xl"
                        >
                            <Info size={18} /> Ver Detalles
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export default function EventsMeetDashboard() {
    const [events, setEvents] = useState<any[]>([]);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [pastEvents, setPastEvents] = useState<any[]>([]);
    const [categorizedUpcoming, setCategorizedUpcoming] = useState<Record<string, any[]>>({});
    const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
    const [featuredEvent, setFeaturedEvent] = useState<any>(null);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [filterTab, setFilterTab] = useState<'all' | 'upcoming' | 'past'>('all');
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);

    const { showToast } = useToastContext();
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const isAdmin = user?.role === 'ADMIN';
    const { navVisible, setNavVisible } = useOutletContext<ContextType>();

    const fetchEvents = async () => {
        try {
            const response = await axios.get('/api/events');
            const data: any[] = response.data || [];
            setEvents(data);

            const upcoming: any[] = [];
            const past: any[] = [];

            data.forEach((evt: any) => {
                const { isPast } = getEventTiming(evt.dateTime);
                if (isPast) {
                    past.push(evt);
                } else {
                    upcoming.push(evt);
                }
            });

            // Upcoming sorted chronological (closest first)
            upcoming.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
            // Past sorted reverse chronological (most recently completed first)
            past.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

            setUpcomingEvents(upcoming);
            setPastEvents(past);

            // Categorize ONLY UPCOMING events by tags/categories
            const categories: Record<string, any[]> = {};
            const order: string[] = [];

            upcoming.forEach((evt: any) => {
                const tags: string[] = evt.tags || [];
                if (tags.length === 0) {
                    const key = 'General';
                    if (!categories[key]) { categories[key] = []; order.push(key); }
                    categories[key].push(evt);
                } else {
                    tags.forEach((tag: string) => {
                        const key = tag.trim();
                        if (!key) return;
                        if (!categories[key]) { categories[key] = []; order.push(key); }
                        categories[key].push(evt);
                    });
                }
            });

            setCategorizedUpcoming(categories);
            setCategoryOrder(order);

            // Featured Hero: Priority 1: Upcoming featured, 2: Nearest upcoming, 3: Past featured, 4: Most recent past
            const featured = 
                upcoming.find((e: any) => e.isFeatured) || 
                upcoming[0] || 
                past.find((e: any) => e.isFeatured) || 
                past[0] || 
                null;
                
            setFeaturedEvent(featured);

            // Keep selected event synced if open
            if (selectedEvent) {
                const updated = data.find((e: any) => e._id === selectedEvent._id);
                if (updated) setSelectedEvent(updated);
            }

        } catch (error) {
            console.error('Error fetching events:', error);
            showToast({ message: 'Error al cargar los eventos.', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleRegister = async (eventId: string) => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            setRegistering(true);
            const response = await axios.post(`/api/events/${eventId}/register`);
            showToast({ message: response.data.message || 'Registro exitoso.', status: 'success' });
            await fetchEvents();
        } catch (error: any) {
            console.error('Registration error:', error);
            showToast({ 
                message: error.response?.data?.message || 'Error al completar el registro al evento.', 
                status: 'error' 
            });
        } finally {
            setRegistering(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full bg-surface-primary">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#10b981]"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-surface-primary text-text-primary overflow-hidden">
            {/* Header / Nav Overlay */}
            <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-16 sm:p-6 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-3 sm:gap-4 pointer-events-auto">
                    {!navVisible && (
                        <div className="hidden md:block">
                            <OpenSidebar setNavVisible={setNavVisible} />
                        </div>
                    )}
                    <div className="flex items-center gap-2 sm:gap-3 bg-surface-primary/40 dark:bg-black/20 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-border-light dark:border-white/5 shadow-xl">
                        <Video className="text-[#10b981] w-5 h-5 sm:w-6 sm:h-6" />
                        <h1 className="font-black tracking-tight text-sm sm:text-base md:text-xl">Eventos por Meet</h1>
                    </div>
                </div>

                {isAdmin ? (
                    <button
                        onClick={() => navigate('/events-meet/admin')}
                        className="pointer-events-auto group flex items-center gap-2 sm:gap-3 bg-surface-primary/40 dark:bg-white/10 backdrop-blur-md px-4 sm:px-5 py-1.5 sm:py-2.5 border border-border-light dark:border-white/10 hover:bg-surface-hover dark:hover:bg-white/20 text-text-primary rounded-full transition-all duration-300 shadow-xl"
                    >
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[#10b981]" />
                        <span className="font-bold text-[10px] sm:text-xs md:text-sm uppercase tracking-wider">Administrar</span>
                    </button>
                ) : !user ? (
                    <button
                        onClick={() => navigate('/login')}
                        className="pointer-events-auto group flex items-center gap-2 sm:gap-3 bg-[#10b981] hover:bg-[#059669] text-white px-5 sm:px-6 py-1.5 sm:py-2.5 rounded-full transition-all duration-300 shadow-xl shadow-[#10b981]/10 hover:scale-105"
                    >
                        <span className="font-bold text-xs sm:text-sm uppercase tracking-wider">Iniciar Sesión</span>
                    </button>
                ) : null}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                {/* Hero Section */}
                {featuredEvent ? (
                    <FeaturedHero 
                        event={featuredEvent} 
                        onMoreInfo={() => setSelectedEvent(featuredEvent)} 
                        onRegister={() => handleRegister(featuredEvent._id)}
                        registering={registering}
                    />
                ) : (
                    <div className="h-64 flex items-center justify-center text-text-secondary border-b border-border-medium">
                        No hay eventos programados en este momento.
                    </div>
                )}

                {/* Filter Tabs & Content Section */}
                <div className="relative -mt-8 sm:-mt-16 md:-mt-24 pb-24 z-30 space-y-6">
                    {/* Filter Pills */}
                    <div className="px-4 sm:px-6 md:px-12 flex flex-wrap items-center gap-2 mb-2">
                        <button
                            onClick={() => setFilterTab('all')}
                            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                filterTab === 'all'
                                    ? 'bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20 scale-105'
                                    : 'bg-surface-primary/60 dark:bg-white/10 text-text-secondary hover:text-text-primary backdrop-blur-md border border-border-light dark:border-white/10'
                            }`}
                        >
                            Todos los Eventos ({events.length})
                        </button>
                        <button
                            onClick={() => setFilterTab('upcoming')}
                            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                                filterTab === 'upcoming'
                                    ? 'bg-[#10b981] text-white shadow-lg shadow-[#10b981]/20 scale-105'
                                    : 'bg-surface-primary/60 dark:bg-white/10 text-text-secondary hover:text-text-primary backdrop-blur-md border border-border-light dark:border-white/10'
                            }`}
                        >
                            <Calendar size={13} />
                            Próximos en Vivo ({upcomingEvents.length})
                        </button>
                        <button
                            onClick={() => setFilterTab('past')}
                            className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                                filterTab === 'past'
                                    ? 'bg-slate-700 text-white shadow-lg scale-105'
                                    : 'bg-surface-primary/60 dark:bg-white/10 text-text-secondary hover:text-text-primary backdrop-blur-md border border-border-light dark:border-white/10'
                            }`}
                        >
                            <History size={13} />
                            Eventos Realizados ({pastEvents.length})
                        </button>
                    </div>

                    {/* UPCOMING EVENTS ROWS (Categorized) */}
                    {(filterTab === 'all' || filterTab === 'upcoming') && (
                        <>
                            {categoryOrder.length > 0 ? (
                                categoryOrder.map(title => (
                                    <EventRow
                                        key={title}
                                        title={title}
                                        events={categorizedUpcoming[title] || []}
                                        onMoreInfo={setSelectedEvent}
                                    />
                                ))
                            ) : filterTab === 'upcoming' ? (
                                <div className="mx-4 sm:mx-6 md:mx-12 p-8 rounded-2xl bg-surface-secondary border border-border-medium text-center">
                                    <Clock size={32} className="mx-auto text-text-tertiary mb-2" />
                                    <h3 className="font-bold text-base text-text-primary">No hay eventos próximos agendados</h3>
                                    <p className="text-xs text-text-secondary mt-1">
                                        Próximamente anunciaremos nuevas sesiones y talleres virtuales.
                                    </p>
                                </div>
                            ) : null}
                        </>
                    )}

                    {/* PAST / COMPLETED EVENTS ROW (Dedicated list for finished events) */}
                    {(filterTab === 'all' || filterTab === 'past') && pastEvents.length > 0 && (
                        <div className={`${filterTab === 'all' ? 'pt-4 border-t border-border-light dark:border-white/5' : ''}`}>
                            <EventRow
                                title="Eventos Realizados"
                                subtitle="Consulta el historial de talleres y sesiones virtuales que ya se llevaron a cabo"
                                events={pastEvents}
                                onMoreInfo={setSelectedEvent}
                                isPastRow={true}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Event Detail Modal */}
            <EventModal 
                event={selectedEvent} 
                onClose={() => setSelectedEvent(null)} 
                onRegister={() => selectedEvent && handleRegister(selectedEvent._id)}
                registering={registering}
            />

            {/* Global Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.8s ease-out forwards;
                }
            ` }} />
        </div>
    );
}
