import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { BookOpen, CheckCircle, Clock, Play, GraduationCap, LogOut, Award, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import RutaCertificate from './RutaCertificate';
import { useWorkerSession } from '../../hooks/useWorkerSession';
import PublicWorkerHeader from '../SGSST/PublicWorkerHeader';
import WorkerSessionBadge from '../SGSST/WorkerSessionBadge';

interface WorkerSession {
    companyId: string;
    companyName: string;
    nombre: string;
    cedula: string;
    cargo: string;
    firmaDigital?: string | null;
}

export default function PublicRutaAprendizaje() {
    const { companyId } = useParams<{ companyId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToastContext();

    const { session: hookSession, worker: sessionWorker, isAuthenticated } = useWorkerSession(companyId);

    // Session State
    const [session, setSession] = useState<WorkerSession | null>(null);
    const [companyDetails, setCompanyDetails] = useState<any>(null);

    // Form inputs
    const [nombre, setNombre] = useState('');
    const [cedula, setCedula] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Course List and Progress
    const [courses, setCourses] = useState<any[]>([]);
    const [coursesProgress, setCoursesProgress] = useState<Record<string, any>>({});
    const [loadingCourses, setLoadingCourses] = useState(false);

    // Certificate View State
    const [selectedCertificateCourse, setSelectedCertificateCourse] = useState<any>(null);

    // Initial session load & Company detail retrieval
    useEffect(() => {
        const stored = localStorage.getItem('wappy_worker_session');
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as WorkerSession;
                if (parsed.companyId === companyId) {
                    setSession(parsed);
                } else {
                    localStorage.removeItem('wappy_worker_session');
                }
            } catch (e) {
                localStorage.removeItem('wappy_worker_session');
            }
        }

        const fetchCompany = async () => {
            try {
                const response = await axios.get(`/api/ruta-aprendizaje/public/company/${companyId}`);
                setCompanyDetails(response.data);
            } catch (err) {
                console.error(err);
                showToast({ message: 'Error al cargar información de la empresa contratante.', status: 'error' });
            }
        };

        if (companyId) {
            fetchCompany();
        }
    }, [companyId]);

    // Auto-login if worker credentials detected via hook / query param
    useEffect(() => {
        if (!session && companyDetails && (sessionWorker || hookSession)) {
            const resolvedCed = sessionWorker?.cedula || hookSession?.cedula;
            const resolvedNombre = sessionWorker?.nombre || hookSession?.nombre;
            const resolvedCargo = sessionWorker?.cargo || hookSession?.cargo || '';
            if (resolvedCed && resolvedNombre) {
                const autoSession: WorkerSession = {
                    companyId: companyDetails._id || companyId || '',
                    companyName: companyDetails.companyName || hookSession?.companyName || '',
                    nombre: resolvedNombre,
                    cedula: resolvedCed,
                    cargo: resolvedCargo,
                    firmaDigital: hookSession?.firmaDigital || null
                };
                setSession(autoSession);
            }
        }
    }, [session, companyDetails, sessionWorker, hookSession, companyId]);

    // Fetch courses and their progress once logged in
    useEffect(() => {
        if (!session || !companyId) return;

        const loadCoursesAndProgress = async () => {
            setLoadingCourses(true);
            try {
                const resCourses = await axios.get(
                    `/api/ruta-aprendizaje/public/courses/${companyId}?cedula=${session.cedula}&cargo=${encodeURIComponent(session.cargo || '')}`
                );
                const courseList = resCourses.data;
                setCourses(courseList);

                // Fetch progress for each course
                const progressMap: Record<string, any> = {};
                await Promise.all(
                    courseList.map(async (course: any) => {
                        try {
                            const resProgress = await axios.get(
                                `/api/ruta-aprendizaje/public/progress/${companyId}/${course._id}/${session.cedula}`
                            );
                            progressMap[course._id] = resProgress.data;
                        } catch (e) {
                            progressMap[course._id] = { completedCount: 0, isCompleted: false, completedLessons: [] };
                        }
                    })
                );
                setCoursesProgress(progressMap);
            } catch (err) {
                console.error(err);
                showToast({ message: 'Error al recuperar listado de capacitaciones.', status: 'error' });
            } finally {
                setLoadingCourses(false);
            }
        };

        loadCoursesAndProgress();
    }, [session, companyId]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim() || !cedula.trim()) {
            showToast({ message: 'Todos los campos son requeridos', status: 'warning' });
            return;
        }

        if (!companyDetails) {
            showToast({ message: 'Espere a que cargue la información de la empresa', status: 'warning' });
            return;
        }

        setIsLoggingIn(true);
        try {
            // Validate using company name/nit retrieved from company details
            const response = await axios.post('/api/ruta-aprendizaje/public/login', {
                companyId: companyDetails._id,
                nitOrName: companyDetails.nit || companyDetails.companyName,
                nombre: nombre.trim(),
                cedula: cedula.trim()
            });

            if (response.data?.success) {
                const newSession: WorkerSession = {
                    companyId: response.data.companyId,
                    companyName: response.data.companyName,
                    nombre: response.data.worker.nombre,
                    cedula: response.data.worker.cedula,
                    cargo: response.data.worker.cargo,
                    firmaDigital: response.data.worker.firmaDigital || null
                };

                localStorage.setItem('wappy_worker_session', JSON.stringify(newSession));
                localStorage.setItem('wappy_worker_cedula', newSession.cedula);
                setSession(newSession);
                showToast({ message: `¡Bienvenido(a), ${newSession.nombre}!`, status: 'success' });
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.error || 'No se pudo validar tus datos. Comunícate con el administrador de SST.';
            showToast({ message: msg, status: 'error' });
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('wappy_worker_session');
        localStorage.removeItem('wappy_worker_cedula');
        setSession(null);
        setCourses([]);
        setCoursesProgress({});
    };

    // If not authenticated, render the worker login page within the unified Somos SST theme
    if (!session) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-text-primary flex flex-col font-sans transition-colors">
                <PublicWorkerHeader
                    companyId={companyId || ''}
                    companyName={companyDetails?.companyName || 'Somos SST'}
                    companyLogo={companyDetails?.logoUrl || companyDetails?.logo || null}
                    currentModule="lms"
                />

                <main className="flex-1 max-w-lg w-full mx-auto px-4 py-10 flex flex-col justify-center">
                    <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-lg">
                            <GraduationCap className="w-8 h-8" />
                        </div>

                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-text-primary">Rutas de Capacitación</h2>
                            <p className="text-xs sm:text-sm text-text-secondary mt-1">
                                Portal oficial de capacitación de <span className="text-teal-600 dark:text-teal-400 font-bold">{companyDetails?.companyName || 'Somos SST'}</span>
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4 text-left">
                            <div className="space-y-1">
                                <label className="block text-xs font-black uppercase tracking-wider text-text-secondary">
                                    Tu Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="w-full bg-surface-secondary/40 border border-border-medium focus:border-teal-500 text-text-primary rounded-2xl px-4 py-3 outline-none transition-all text-sm font-semibold"
                                    placeholder="Ej: Carlos Alberto Ramírez"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-black uppercase tracking-wider text-text-secondary">
                                    Cédula de Ciudadanía
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={cedula}
                                    onChange={(e) => setCedula(e.target.value)}
                                    className="w-full bg-surface-secondary/40 border border-border-medium focus:border-teal-500 text-text-primary rounded-2xl px-4 py-3 outline-none transition-all text-sm font-mono font-bold"
                                    placeholder="Ej: 79845123"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoggingIn || !companyDetails}
                                className="w-full py-3.5 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {isLoggingIn ? (
                                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>Ingresar al Portal</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="pt-4 border-t border-border-medium/60 text-center">
                            <p className="text-[10px] text-text-tertiary leading-normal flex items-start gap-2 text-left">
                                <ShieldAlert className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                                <span>
                                    Portal oficial para colaboradores. Tus accesos y certificados quedan registrados con validez legal ante el Ministerio del Trabajo.
                                </span>
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Render course dashboard for authenticated worker with Somos SST unified look
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-text-primary flex flex-col font-sans transition-colors">
            {/* Header Universal */}
            <PublicWorkerHeader
                companyId={companyId || ''}
                companyName={session.companyName || companyDetails?.companyName || 'Somos SST'}
                companyLogo={companyDetails?.logoUrl || companyDetails?.logo || null}
                currentModule="lms"
                workerCedula={session.cedula}
            />

            {/* Main Content Area */}
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-6">
                {/* Worker Session Badge */}
                <WorkerSessionBadge
                    nombre={session.nombre}
                    cedula={session.cedula}
                    cargo={session.cargo}
                    companyName={session.companyName}
                    onClear={handleLogout}
                />

                {/* Greeting Banner */}
                <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-teal-500/10 via-emerald-500/5 to-transparent rounded-bl-full pointer-events-none" />
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 text-xs font-black uppercase tracking-wider">
                                <GraduationCap className="w-4 h-4" /> Academia Virtual de Capacitación
                            </div>
                            <h1 className="text-xl sm:text-2xl font-black text-text-primary">
                                Hola, {session.nombre.split(' ')[0]}
                            </h1>
                            <p className="text-xs sm:text-sm text-text-secondary max-w-xl">
                                Completa las lecciones de tus rutas asignadas y obtén tus certificados de asistencia válidos ante el Ministerio del Trabajo.
                            </p>
                        </div>
                        <div className="bg-surface-secondary/70 dark:bg-slate-800/70 px-4 py-3 rounded-2xl border border-border-medium text-left shrink-0">
                            <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Organización</p>
                            <p className="text-sm font-extrabold text-text-primary">{session.companyName}</p>
                            <p className="text-xs text-text-secondary mt-0.5">{session.cargo}</p>
                        </div>
                    </div>
                </div>

                {/* Courses Listing */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-text-primary uppercase tracking-wide flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-teal-500" /> Mis Programas Asignados
                        </h3>
                        <span className="text-xs text-text-secondary font-medium">
                            {courses.length} {courses.length === 1 ? 'ruta disponible' : 'rutas disponibles'}
                        </span>
                    </div>

                    {loadingCourses ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-surface-secondary/50 border border-border-medium rounded-3xl h-56 animate-pulse" />
                            ))}
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="p-10 bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl text-center max-w-md mx-auto shadow-xs space-y-3 animate-in fade-in duration-200">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800">
                                <BookOpen className="w-7 h-7" />
                            </div>
                            <h4 className="font-bold text-base text-text-primary">Sin asignaciones por ahora</h4>
                            <p className="text-xs text-text-secondary">
                                No tienes rutas de capacitación publicadas en este momento. Consulta con el responsable de SST de tu empresa.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {courses.map((course) => {
                                const progress = coursesProgress[course._id] || { completedCount: 0, isCompleted: false };
                                const totalLessons = course.lessons?.length || 0;
                                const pct = totalLessons > 0 ? Math.round((progress.completedCount / totalLessons) * 100) : 0;
                                const isCompleted = progress.isCompleted;

                                return (
                                    <div
                                        key={course._id}
                                        className="group bg-surface-primary dark:bg-slate-900 border border-border-medium hover:border-teal-400 dark:hover:border-teal-600 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
                                    >
                                        <div>
                                            {/* Thumbnail */}
                                            <div className="h-36 bg-surface-secondary dark:bg-slate-950 relative overflow-hidden">
                                                {course.thumbnail ? (
                                                    <img
                                                        src={course.thumbnail}
                                                        alt={course.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-100 dark:from-slate-900 dark:to-teal-950/40">
                                                        <GraduationCap className="w-10 h-10 text-teal-600/40 dark:text-teal-400/40" />
                                                    </div>
                                                )}
                                                <div className="absolute top-2.5 right-2.5">
                                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-surface-primary/90 dark:bg-slate-900/90 text-text-primary backdrop-blur-xs shadow-xs border border-border-medium/60">
                                                        {totalLessons} {totalLessons === 1 ? 'lección' : 'lecciones'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Title & description */}
                                            <div className="p-5 space-y-2">
                                                <h4 className="font-bold text-sm text-text-primary line-clamp-2 leading-snug group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                                    {course.title}
                                                </h4>
                                                {course.description && (
                                                    <p className="text-[11px] text-text-secondary line-clamp-2">
                                                        {course.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Progress bar and buttons */}
                                        <div className="p-5 pt-0 space-y-3">
                                            {/* Progress bar */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-[11px] font-semibold">
                                                    <span className="text-text-secondary">Progreso</span>
                                                    <span className={isCompleted ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-text-primary font-bold'}>
                                                        {pct}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-surface-secondary dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-teal-500 to-emerald-500'}`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Action buttons: expanding Somos SST style */}
                                            <div className="flex items-center gap-2 pt-1">
                                                <button
                                                    onClick={() => navigate(`/sgsst-public/ruta-aprendizaje/${companyId}/course/${course._id}`)}
                                                    title={isCompleted ? 'Repasar Lecciones' : pct > 0 ? 'Continuar Lección' : 'Empezar Capacitación'}
                                                    className="flex-1 group/btn flex items-center justify-center h-9 px-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all duration-300 cursor-pointer"
                                                >
                                                    <Play className="w-3.5 h-3.5 fill-white shrink-0" />
                                                    <span className="ml-1.5 transition-all duration-300 whitespace-nowrap">
                                                        {isCompleted ? 'Repasar' : pct > 0 ? 'Continuar' : 'Empezar'}
                                                    </span>
                                                </button>

                                                {isCompleted && (
                                                    <button
                                                        onClick={() => setSelectedCertificateCourse(course)}
                                                        title="Descargar Certificado de Asistencia"
                                                        className="group/cert flex items-center justify-center h-9 px-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold text-xs shadow-2xs active:scale-95 transition-all duration-300 cursor-pointer"
                                                    >
                                                        <Award className="w-4 h-4 shrink-0" />
                                                        <span className="max-w-0 overflow-hidden opacity-0 group-hover/cert:max-w-xs group-hover/cert:opacity-100 group-hover/cert:ml-1.5 transition-all duration-300 whitespace-nowrap">
                                                            Certificado
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 text-center text-xs text-text-tertiary mt-12 border-t border-border-medium/60">
                <p>&copy; {new Date().getFullYear()} Somos SST. Plataforma de capacitación legal activa.</p>
            </footer>

            {/* Certificate Print View Modal */}
            {selectedCertificateCourse && (
                <RutaCertificate
                    course={selectedCertificateCourse}
                    worker={{
                        nombre: session.nombre,
                        cedula: session.cedula,
                        cargo: session.cargo,
                        signature: coursesProgress[selectedCertificateCourse._id]?.workerSignature || null,
                    }}
                    company={{
                        companyName: session.companyName,
                        nit: companyDetails?.nit || '',
                        logo: companyDetails?.logo || null,
                        legalRepresentative: companyDetails?.legalRepresentative,
                    }}
                    onClose={() => setSelectedCertificateCourse(null)}
                />
            )}
        </div>
    );
}

