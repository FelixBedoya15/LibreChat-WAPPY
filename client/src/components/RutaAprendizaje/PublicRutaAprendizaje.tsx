import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { BookOpen, CheckCircle, Clock, Play, GraduationCap, LogOut, Award, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import RutaCertificate from './RutaCertificate';

interface WorkerSession {
    companyId: string;
    companyName: string;
    nombre: string;
    cedula: string;
    cargo: string;
}

export default function PublicRutaAprendizaje() {
    const { companyId } = useParams<{ companyId: string }>();
    const navigate = useNavigate();
    const { showToast } = useToastContext();

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
                    cargo: response.data.worker.cargo
                };

                localStorage.setItem('wappy_worker_session', JSON.stringify(newSession));
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
        setSession(null);
        setCourses([]);
        setCoursesProgress({});
    };

    // If not authenticated, render the worker login page
    if (!session) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
                {/* Visual Glows */}
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
                    <div className="text-center space-y-3 mb-8">
                        <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-full mb-1 border border-emerald-500/20">
                            <GraduationCap className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Ruta de Aprendizaje</h1>
                        <p className="text-sm text-slate-400">
                            Portal oficial de capacitación de <span className="text-emerald-400 font-bold">{companyDetails?.companyName || 'Cargando...'}</span>
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1">
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-400">Tu Nombre Completo</label>
                            <input
                                type="text"
                                required
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white rounded-xl px-4 py-3 outline-none transition-all text-sm"
                                placeholder="Ej: Juan Pérez Gómez"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-400">Cédula de Ciudadanía</label>
                            <input
                                type="text"
                                required
                                value={cedula}
                                onChange={(e) => setCedula(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white rounded-xl px-4 py-3 outline-none transition-all text-sm font-mono"
                                placeholder="Ej: 1012345678"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoggingIn || !companyDetails}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl py-3.5 font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                        >
                            {isLoggingIn ? (
                                <div className="h-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    Ingresar al Portal <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                        <p className="text-[10px] text-slate-500 leading-normal flex items-start gap-2 text-left">
                            <ShieldAlert className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                            <span>
                                Este es un portal seguro para trabajadores. Tus datos de ingreso serán validados contra la nómina activa de la empresa.
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Render course dashboard for authenticated worker
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
            
            {/* Header Navbar */}
            <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                            <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-white text-base sm:text-lg">Rutas de Capacitación</h2>
                            <p className="text-xs text-emerald-400 font-medium">Trabajador: {session.nombre}</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-red-900/30 hover:text-red-400 rounded-lg text-xs font-bold transition-all text-slate-300"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Cerrar Sesión</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-6">
                
                {/* Greeting Card */}
                <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
                            <UserCheck className="w-4 h-4" /> Sesión Activa
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black text-white">Hola, {session.nombre.split(' ')[0]}</h1>
                        <p className="text-sm text-slate-400">
                            Completa las lecciones de tus rutas y obtén tus certificados de asistencia válidos ante el Ministerio del Trabajo.
                        </p>
                    </div>
                    <div className="bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700 text-left shrink-0">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Organización</p>
                        <p className="text-sm font-extrabold text-white">{session.companyName}</p>
                        <p className="text-xs text-slate-400">{session.cargo}</p>
                    </div>
                </div>

                {/* Courses Listing */}
                <div className="space-y-4">
                    <h3 className="font-extrabold text-lg text-white">Mis Programas Asignados</h3>

                    {loadingCourses ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl h-44 animate-pulse" />
                            ))}
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="p-12 bg-slate-900/40 border border-slate-800 rounded-2xl text-center max-w-md mx-auto">
                            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                            <h4 className="font-bold text-lg text-white">Sin asignaciones</h4>
                            <p className="text-sm text-slate-400 mt-1">No tienes rutas de capacitación publicadas en este momento.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map(course => {
                                const progress = coursesProgress[course._id] || { completedCount: 0, isCompleted: false };
                                const totalLessons = course.lessons?.length || 0;
                                const pct = totalLessons > 0 ? Math.round((progress.completedCount / totalLessons) * 100) : 0;
                                const isCompleted = progress.isCompleted;

                                return (
                                    <div 
                                        key={course._id} 
                                        className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all"
                                    >
                                        <div>
                                            {/* Thumbnail */}
                                            <div className="h-32 bg-slate-950 relative overflow-hidden">
                                                {course.thumbnail ? (
                                                    <img 
                                                        src={course.thumbnail} 
                                                        alt={course.title} 
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
                                                        <BookOpen className="w-8 h-8 text-slate-600" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                                            </div>

                                            {/* Title & tags */}
                                            <div className="p-4 space-y-2">
                                                <h4 className="font-bold text-white text-base leading-snug line-clamp-2">{course.title}</h4>
                                                <div className="flex flex-wrap gap-1">
                                                    <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                                                        {totalLessons} lecciones
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress bar and buttons */}
                                        <div className="p-4 pt-0 space-y-4">
                                            {/* Progress bar */}
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-400">Progreso</span>
                                                    <span className={`font-extrabold ${isCompleted ? 'text-emerald-400' : 'text-slate-300'}`}>{pct}%</span>
                                                </div>
                                                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                                    <div className={`h-full transition-all duration-300 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>

                                            {/* Action button */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/sgsst-public/ruta-aprendizaje/${companyId}/course/${course._id}`)}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                                                >
                                                    <Play className="w-3.5 h-3.5 fill-white" /> {isCompleted ? 'Repasar' : pct > 0 ? 'Continuar' : 'Empezar'}
                                                </button>
                                                
                                                {isCompleted && (
                                                    <button
                                                        onClick={() => setSelectedCertificateCourse(course)}
                                                        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                                                        title="Descargar Certificado de Asistencia"
                                                    >
                                                        <Award className="w-4 h-4" /> Certificado
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
            <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-xs text-slate-500 mt-12">
                <p>&copy; {new Date().getFullYear()} Somos SGSST. Plataforma de capacitación legal activa.</p>
            </footer>

            {/* Certificate Print View Modal */}
            {selectedCertificateCourse && (
                <RutaCertificate
                    course={selectedCertificateCourse}
                    worker={{
                        nombre: session.nombre,
                        cedula: session.cedula,
                        cargo: session.cargo
                    }}
                    company={{
                        companyName: session.companyName,
                        nit: companyDetails?.nit || '',
                        logo: companyDetails?.logo || null,
                        legalRepresentative: companyDetails?.legalRepresentative
                    }}
                    onClose={() => setSelectedCertificateCourse(null)}
                />
            )}
        </div>
    );
}
