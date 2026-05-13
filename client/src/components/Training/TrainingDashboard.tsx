import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { BookOpen, CheckCircle, Clock, Shield, Play, Info, ChevronLeft, ChevronRight, Activity, MessageSquare, Zap, FileEdit, GraduationCap } from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { OpenSidebar } from '~/components/Chat/Menus';
import type { ContextType } from '~/common';

// --- Sub-components ---

const CourseCard = ({ course, navigate }: { course: any, navigate: any }) => {
    const progress = course.progress || { percentage: 0, isCompleted: false };
    
    return (
        <div 
            onClick={() => navigate(`/training/${course._id}`)}
            className="group relative flex-none w-64 md:w-80 aspect-video rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 shadow-lg"
        >
            {/* Thumbnail */}
            <div className="absolute inset-0 bg-gray-800">
                {course.thumbnail ? (
                    <img 
                        src={course.thumbnail.startsWith('http') || course.thumbnail.startsWith('/') ? course.thumbnail : `/images/${course.thumbnail.split('/').pop()}`} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <BookOpen className="w-12 h-12 text-gray-700" />
                    </div>
                )}
            </div>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

            {/* Content Overlay */}
            <div className="absolute inset-0 p-4 flex flex-col justify-end transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center gap-2 mb-1">
                    {progress.isCompleted ? (
                        <span className="bg-[#10b981] text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1">
                            <CheckCircle size={8} /> Completado
                        </span>
                    ) : progress.percentage > 0 ? (
                        <span className="bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1">
                            <Clock size={8} /> {progress.percentage}%
                        </span>
                    ) : null}
                    {course.tags && course.tags[0] && (
                        <span className="bg-white/20 backdrop-blur-md text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                            {course.tags[0]}
                        </span>
                    )}
                </div>
                <h3 className="text-white font-bold text-sm md:text-base line-clamp-1 drop-shadow-md">
                    {course.title}
                </h3>
            </div>
            
            {/* Hover Action Info */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-full border border-white/20">
                    <Play size={12} className="text-white fill-white" />
                </div>
            </div>
        </div>
    );
};

const CourseRow = ({ title, courses, navigate }: { title: string, courses: any[], navigate: any }) => {
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (rowRef.current) {
            const { scrollLeft, clientWidth } = rowRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth * 0.8 : scrollLeft + clientWidth * 0.8;
            rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    if (courses.length === 0) return null;

    return (
        <div className="mb-8 md:mb-12 group/row relative">
            <h2 className="text-lg md:text-2xl font-black text-white mb-4 px-6 md:px-12 tracking-tight flex items-center gap-3">
                <span className="w-1.5 h-6 bg-[#10b981] rounded-full" />
                {title}
            </h2>
            
            {/* Scroll Buttons */}
            <button 
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-[calc(100%-2rem)] w-12 bg-black/50 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center text-white"
            >
                <ChevronLeft size={32} />
            </button>
            <button 
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 h-[calc(100%-2rem)] w-12 bg-black/50 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center justify-center text-white"
            >
                <ChevronRight size={32} />
            </button>

            <div 
                ref={rowRef}
                className="flex gap-4 overflow-x-auto px-6 md:px-12 pb-4 no-scrollbar scroll-smooth"
            >
                {courses.map(course => (
                    <CourseCard key={course._id} course={course} navigate={navigate} />
                ))}
            </div>
        </div>
    );
};

const FeaturedHero = ({ course, navigate }: { course: any, navigate: any }) => {
    if (!course) return null;

    return (
        <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
                {course.thumbnail ? (
                    <img 
                        src={course.thumbnail.startsWith('http') || course.thumbnail.startsWith('/') ? course.thumbnail : `/images/${course.thumbnail.split('/').pop()}`} 
                        alt={course.title} 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
                )}
                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col justify-center px-6 md:px-12 max-w-3xl">
                <div className="flex items-center gap-2 mb-4 animate-fade-in">
                    <span className="bg-[#10b981] text-white text-[10px] md:text-xs font-black px-2 py-1 rounded uppercase tracking-widest flex items-center gap-1.5">
                        <Zap size={14} className="fill-white" /> DESTACADO
                    </span>
                    {course.tags && course.tags[0] && (
                        <span className="bg-white/10 backdrop-blur-md text-white text-[10px] md:text-xs font-black px-2 py-1 rounded uppercase tracking-widest border border-white/10">
                            {course.tags[0]}
                        </span>
                    )}
                </div>
                
                <h1 className="text-4xl md:text-7xl font-black text-white mb-6 leading-none drop-shadow-2xl">
                    {course.title}
                </h1>
                
                <p className="text-base md:text-xl text-gray-300 mb-8 line-clamp-3 leading-relaxed drop-shadow-md">
                    {course.description || 'Explora este curso avanzado diseñado para potenciar tus habilidades en Seguridad y Salud en el Trabajo con inteligencia artificial.'}
                </p>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(`/training/${course._id}`)}
                        className="flex items-center gap-3 bg-white text-black px-8 py-3.5 rounded-xl font-black text-lg hover:bg-gray-200 transition-all transform hover:scale-105"
                    >
                        <Play size={20} className="fill-black" /> Iniciar Ahora
                    </button>
                    <button 
                        onClick={() => navigate(`/training/${course._id}`)}
                        className="flex items-center gap-3 bg-gray-500/30 backdrop-blur-xl text-white px-8 py-3.5 rounded-xl font-black text-lg hover:bg-gray-500/50 transition-all border border-white/10"
                    >
                        <Info size={20} /> Más Información
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export default function TrainingDashboard() {
    const [courses, setCourses] = useState([]);
    const [categorizedCourses, setCategorizedCourses] = useState<Record<string, any[]>>({});
    const [featuredCourse, setFeaturedCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToastContext();
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const isAdmin = user?.role === 'ADMIN';
    const { navVisible, setNavVisible } = useOutletContext<ContextType>();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await axios.get('/api/training/courses');
                const data = response.data;
                setCourses(data);

                // Grouping logic
                const categories = {
                    'Somos SST': [],
                    'Chat con IA': [],
                    'Análisis en Vivo': [],
                    'Centro de Inteligencia Predictiva': [],
                    'Editor de Archivos con IA': [],
                    'Seguridad y Salud en el Trabajo': [],
                    'Otros': []
                };

                data.forEach((course: any) => {
                    const title = course.title?.toLowerCase() || '';
                    const tags = course.tags?.map((t: string) => t.toLowerCase()) || [];

                    if (title.includes('somos sst') || tags.includes('somos_sst')) {
                        categories['Somos SST'].push(course);
                    } else if (title.includes('chat') || title.includes('ia') || tags.includes('chat') || tags.includes('ia')) {
                        categories['Chat con IA'].push(course);
                    } else if (title.includes('vivo') || title.includes('live') || tags.includes('vivo') || tags.includes('live')) {
                        categories['Análisis en Vivo'].push(course);
                    } else if (title.includes('predictiv') || tags.includes('predictiva')) {
                        categories['Centro de Inteligencia Predictiva'].push(course);
                    } else if (title.includes('editor') || tags.includes('editor')) {
                        categories['Editor de Archivos con IA'].push(course);
                    } else if (title.includes('sst') || tags.includes('sst')) {
                        categories['Seguridad y Salud en el Trabajo'].push(course);
                    } else {
                        categories['Otros'].push(course);
                    }
                });

                setCategorizedCourses(categories);
                
                // Pick a featured course (latest SST or first available)
                if (data.length > 0) {
                    setFeaturedCourse(data.find((c: any) => c.title?.toLowerCase().includes('sst')) || data[0]);
                }

            } catch (error) {
                console.error('Error fetching courses:', error);
                showToast({ message: 'Error al cargar los cursos.', status: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [showToast]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#10b981]"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white overflow-hidden">
            {/* Header / Nav Overlay */}
            <div className="absolute top-0 left-0 right-0 z-50 p-6 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto">
                    {!navVisible && (
                        <div className="hidden md:block">
                            <OpenSidebar setNavVisible={setNavVisible} />
                        </div>
                    )}
                    <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 shadow-xl">
                        <GraduationCap className="text-[#10b981] w-6 h-6" />
                        <h1 className="font-black tracking-tight text-xl">Aula de estudio</h1>
                    </div>
                </div>

                {isAdmin && (
                    <button
                        onClick={() => navigate('/training/admin')}
                        className="pointer-events-auto group flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2.5 border border-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 shadow-xl"
                    >
                        <Shield className="w-5 h-5 text-[#10b981]" />
                        <span className="font-bold text-sm">Administrar</span>
                    </button>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                {/* Hero Section */}
                <FeaturedHero course={featuredCourse} navigate={navigate} />

                {/* Rows */}
                <div className="relative -mt-20 md:-mt-32 pb-24 z-30">
                    <CourseRow title="Somos SST" courses={categorizedCourses['Somos SST']} navigate={navigate} />
                    <CourseRow title="Chat con IA" courses={categorizedCourses['Chat con IA']} navigate={navigate} />
                    <CourseRow title="Análisis en Vivo" courses={categorizedCourses['Análisis en Vivo']} navigate={navigate} />
                    <CourseRow title="Centro de Inteligencia Predictiva" courses={categorizedCourses['Centro de Inteligencia Predictiva']} navigate={navigate} />
                    <CourseRow title="Editor de Archivos con IA" courses={categorizedCourses['Editor de Archivos con IA']} navigate={navigate} />
                    <CourseRow title="Seguridad y Salud en el Trabajo" courses={categorizedCourses['Seguridad y Salud en el Trabajo']} navigate={navigate} />
                    <CourseRow title="Explora Más" courses={categorizedCourses['Otros']} navigate={navigate} />
                </div>
            </div>

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

