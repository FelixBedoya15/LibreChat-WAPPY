import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { BookOpen, CheckCircle, Clock, Shield } from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { OpenSidebar } from '~/components/Chat/Menus';
import type { ContextType } from '~/common';

export default function TrainingDashboard() {
    const [courses, setCourses] = useState([]);
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
                setCourses(response.data);
            } catch (error) {
                console.error('Error fetching courses:', error);
                showToast({ message: 'Error loading courses. Please try again later.', status: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [showToast]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-blue-200 dark:bg-blue-800 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <div className="flex-none p-6 md:p-8 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start md:items-center gap-4">
                        {!navVisible && (
                            <div className="hidden md:block shrink-0 -ml-2 mr-2">
                                <OpenSidebar setNavVisible={setNavVisible} />
                            </div>
                        )}
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg shrink-0 mt-1 md:mt-0">
                            <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">Aula de estudio</h1>
                            <p className="mt-1 text-sm md:text-base text-gray-500 dark:text-gray-400">
                                Bienvenido a tu plataforma de capacitación. Selecciona un curso para continuar.
                            </p>
                        </div>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={() => navigate('/training/admin')}
                            className="group flex items-center px-3 py-2 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white rounded-full transition-all duration-300 shadow-sm font-medium text-sm self-start md:self-auto"
                        >
                            <Shield className="w-5 h-5 flex-shrink-0" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                Administrar Cursos
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Courses grid */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-6xl mx-auto">
                    {courses.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No hay cursos disponibles</h3>
                            <p className="mt-1 text-gray-500 dark:text-gray-400">Actualmente no hay cursos publicados en la plataforma.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course: any) => {
                                const progress = course.progress || { percentage: 0, completedCount: 0, totalLessons: 0, isCompleted: false };

                                return (
                                    <div
                                        key={course._id}
                                        className="group flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                                        onClick={() => navigate(`/training/${course._id}`)}
                                    >
                                        {/* Thumbnail Area */}
                                        <div className="h-48 w-full bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                                            {course.thumbnail ? (
                                                <div className="w-full h-full bg-gray-200 dark:bg-gray-700">
                                                    <img src={course.thumbnail.startsWith('http') || course.thumbnail.startsWith('/') ? course.thumbnail : `/images/${course.thumbnail.split('/').pop()}`} alt="Miniatura del Curso" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                                                <BookOpen className="w-16 h-16 text-blue-500/50 dark:text-blue-400/50" />
                                            </div>
                                            )}

                                            {/* Status Badge */}
                                            {progress.isCompleted ? (
                                                <div className="absolute top-3 right-3 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded shadow flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> Completado
                                                </div>
                                            ) : progress.percentage > 0 ? (
                                                <div className="absolute top-3 right-3 px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded shadow flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> En progreso
                                                </div>
                                            ) : null}
                                        </div>

                                        {/* Content Area */}
                                        <div className="p-5 flex-1 flex flex-col">
                                            {/* Tags */}
                                            {course.tags && course.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {course.tags.slice(0, 2).map((tag: string, i: number) => (
                                                        <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {course.title}
                                            </h3>

                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex-1 line-clamp-3">
                                                {course.description || 'Sin descripción disponible.'}
                                            </p>

                                            {/* Progress Bar LearnDash style */}
                                            <div className="mt-auto">
                                                <div className="flex justify-between text-xs mb-1.5 font-medium">
                                                    <span className={progress.isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
                                                        {progress.percentage}% Completado
                                                    </span>
                                                    <span className="text-gray-400 dark:text-gray-500">
                                                        {progress.completedCount}/{progress.totalLessons} Pasos
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                                    <div
                                                        className={`h-2.5 rounded-full transition-all duration-500 ${progress.isCompleted ? 'bg-green-500' : 'bg-blue-600'}`}
                                                        style={{ width: `${progress.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
