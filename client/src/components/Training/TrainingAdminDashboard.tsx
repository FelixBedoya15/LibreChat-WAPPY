import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { BookOpen, Plus, Edit, Trash2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function TrainingAdminDashboard() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToastContext();
    const navigate = useNavigate();

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/training/admin/courses');
            setCourses(response.data);
        } catch (error) {
            console.error('Error fetching admin courses:', error);
            showToast({ message: 'Error al cargar los cursos.', status: 'error' });
            // Redirect if not admin
            if (error.response?.status === 403) {
                navigate('/training');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleDeleteCourse = async (id: string, title: string) => {
        if (!window.confirm(`¿Estás seguro que deseas eliminar el curso "${title}" y todo su progreso asociado? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            await axios.delete(`/api/training/admin/courses/${id}`);
            showToast({ message: 'Curso eliminado exitosamente.', status: 'success' });
            fetchCourses();
        } catch (error) {
            console.error('Error deleting course:', error);
            showToast({ message: 'Error al eliminar el curso.', status: 'error' });
        }
    };

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
            {/* Header section */}
            <div className="flex-none p-6 md:p-8 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/training')}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
                            title="Volver al Aula"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Cursos</h1>
                            <p className="mt-1 text-gray-500 dark:text-gray-400">
                                Administra el contenido, crea nuevas lecciones y publica cursos.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/training/admin/courses/new')}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">Crear Curso</span>
                    </button>
                </div>
            </div>

            {/* Main Content List */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700/50 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-4">Curso</th>
                                        <th scope="col" className="px-6 py-4">Lecciones</th>
                                        <th scope="col" className="px-6 py-4">Estado</th>
                                        <th scope="col" className="px-6 py-4">Última Edición</th>
                                        <th scope="col" className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courses.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center">
                                                    <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                                                    <p>No hay cursos creados. Haz clic en "Crear Curso" para empezar.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        courses.map((course: any) => (
                                            <tr key={course._id} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                    <div className="flex items-center gap-3">
                                                        {course.thumbnail ? (
                                                            <img src={course.thumbnail} alt="thumb" className="w-10 h-10 rounded object-cover bg-gray-100" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-500">
                                                                <BookOpen className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                        <span className="line-clamp-2 max-w-[300px]">{course.title}</span>
                                                    </div>
                                                </th>
                                                <td className="px-6 py-4">
                                                    <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold px-2.5 py-0.5 rounded">
                                                        {course.lessons?.length || 0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {course.isPublished ? (
                                                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
                                                            <CheckCircle className="w-4 h-4" /> Publicado
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs font-medium">
                                                            <XCircle className="w-4 h-4" /> Borrador
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {new Date(course.updatedAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => navigate(`/training/admin/courses/${course._id}`)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                            title="Editar Curso"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCourse(course._id, course.title)}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                            title="Eliminar Curso"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
