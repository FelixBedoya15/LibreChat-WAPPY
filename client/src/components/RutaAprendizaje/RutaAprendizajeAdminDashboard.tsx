import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { BookOpen, Plus, Edit, Trash2, CheckCircle, XCircle, ArrowLeft, Eye, QrCode, Copy, Check, Download, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { sanitizeSlug } from '~/utils/slug';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    course: any;
}

const ShareModal = ({ isOpen, onClose, course }: ShareModalProps) => {
    const [copied, setCopied] = useState(false);
    const { showToast } = useToastContext();

    if (!isOpen || !course) return null;

    const companyId = course.companyId;
    const courseId = course._id;
    // URL point of entry for worker enrollment
    const shareUrl = `${window.location.protocol}//${window.location.host}/sgsst-public/ruta-aprendizaje/${companyId}/course/${courseId}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        showToast({ message: 'Enlace de inscripción copiado al portapapeles', status: 'success' });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadQR = () => {
        const svgElement = document.getElementById(`qr-svg-${courseId}`);
        if (!svgElement) return;

        const svgString = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);
        
        const image = new Image();
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 500;
            canvas.height = 500;
            const context = canvas.getContext('2d');
            if (context) {
                context.fillStyle = '#FFFFFF';
                context.fillRect(0, 0, 500, 500);
                context.drawImage(image, 25, 25, 450, 450);
                
                const pngURL = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = pngURL;
                downloadLink.download = `QR_Curso_${course.title.replace(/\s+/g, '_')}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            }
        };
        image.src = blobURL;
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700 animate-fade-in relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <XCircle className="w-6 h-6" />
                </button>

                <div className="text-center space-y-4">
                    <div className="inline-flex p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                        <QrCode className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-xl text-gray-900 dark:text-white">Compartir Curso</h3>
                        <p className="text-sm text-gray-500 mt-1">Comparte este código QR o enlace con tus trabajadores para que puedan iniciar su capacitación.</p>
                    </div>

                    {/* QR Code Container */}
                    <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700 inline-block">
                        <QRCodeSVG
                            id={`qr-svg-${courseId}`}
                            value={shareUrl}
                            size={200}
                            bgColor={"#ffffff"}
                            fgColor={"#0f172a"}
                            level={"L"}
                            includeMargin={false}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={handleDownloadQR}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-semibold transition-colors"
                        >
                            <Download className="w-4 h-4" /> Guardar QR
                        </button>
                        <a
                            href={shareUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg text-sm font-semibold transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" /> Probar Enlace
                        </a>
                    </div>

                    {/* Share Link Input */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
                        <input
                            type="text"
                            readOnly
                            value={shareUrl}
                            className="flex-1 text-xs bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 select-all outline-none"
                        />
                        <button
                            onClick={handleCopy}
                            className="p-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex-shrink-0"
                            title="Copiar Enlace"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function RutaAprendizajeAdminDashboard() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedShareCourse, setSelectedShareCourse] = useState<any>(null);
    const { showToast } = useToastContext();
    const navigate = useNavigate();

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/ruta-aprendizaje/admin/courses');
            setCourses(response.data);
        } catch (error: any) {
            console.error('Error fetching admin courses:', error);
            showToast({ message: 'Error al cargar los cursos.', status: 'error' });
            if (error.response?.status === 403) {
                navigate('/ruta-aprendizaje');
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
            await axios.delete(`/api/ruta-aprendizaje/admin/courses/${id}`);
            showToast({ message: 'Curso de ruta de aprendizaje eliminado.', status: 'success' });
            fetchCourses();
        } catch (error) {
            console.error('Error deleting course:', error);
            showToast({ message: 'Error al eliminar el curso.', status: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh] bg-white dark:bg-gray-900">
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
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3">
                        <button
                            onClick={() => navigate('/ruta-aprendizaje')}
                            className="rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0 mt-1 sm:mt-0"
                            aria-label="Back"
                        >
                            <ArrowLeft className="h-6 w-6 text-gray-900 dark:text-gray-300" />
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">Administración de Rutas</h1>
                            <p className="mt-1 text-sm md:text-base text-gray-500 dark:text-gray-400">
                                Diseña cursos personalizados para el plan de capacitación oficial de tu organización.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/ruta-aprendizaje/admin/courses/new')}
                        className="group flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-300 shadow-sm font-semibold text-sm self-start sm:self-auto"
                    >
                        <Plus className="w-5 h-5 flex-shrink-0" />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                            Crear Curso
                        </span>
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
                                                    <p>Aún no hay cursos creados para las rutas de aprendizaje de tu empresa.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        courses.map((course: any) => (
                                            <tr key={course._id} className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                    <div className="flex items-center gap-3">
                                                        {course.thumbnail ? (
                                                            <img src={course.thumbnail.startsWith('http') || course.thumbnail.startsWith('/') ? course.thumbnail : `/images/${course.thumbnail.split('/').pop()}`} alt="thumb" className="w-10 h-10 rounded object-cover bg-gray-100" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-500">
                                                                <BookOpen className="w-5 h-5" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className="line-clamp-2 max-w-[260px] block">{course.title}</span>
                                                            {course.tags && course.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-1">
                                                                    {course.tags.map((tag: string, i: number) => (
                                                                        <span key={i} className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/40">
                                                                            {tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
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
                                                <td className="px-6 py-4 whitespace-nowrap text-xs">
                                                    {new Date(course.updatedAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => setSelectedShareCourse(course)}
                                                            className="group flex items-center p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-full transition-all duration-300"
                                                            title="Compartir curso / QR"
                                                        >
                                                            <QrCode className="w-4 h-4 flex-shrink-0" />
                                                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1 transition-all duration-300 whitespace-nowrap text-xs font-medium">
                                                                Compartir QR
                                                            </span>
                                                        </button>
                                                        <button 
                                                            onClick={() => navigate(`/ruta-aprendizaje/${course._id}/${sanitizeSlug(course.title)}`)}
                                                            className="group flex items-center p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-all duration-300"
                                                        >
                                                            <Eye className="w-4 h-4 flex-shrink-0" />
                                                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1 transition-all duration-300 whitespace-nowrap text-xs font-medium">
                                                                Ver Curso
                                                            </span>
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/ruta-aprendizaje/admin/courses/${course._id}`)}
                                                            className="group flex items-center p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all duration-300"
                                                        >
                                                            <Edit className="w-4 h-4 flex-shrink-0" />
                                                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1 transition-all duration-300 whitespace-nowrap text-xs font-medium">
                                                                Editar
                                                            </span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCourse(course._id, course.title)}
                                                            className="group flex items-center p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-300"
                                                        >
                                                            <Trash2 className="w-4 h-4 flex-shrink-0" />
                                                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-1 transition-all duration-300 whitespace-nowrap text-xs font-medium">
                                                                Eliminar
                                                            </span>
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

            {/* Share & QR Code Modal */}
            <ShareModal
                isOpen={!!selectedShareCourse}
                onClose={() => setSelectedShareCourse(null)}
                course={selectedShareCourse}
            />
        </div>
    );
}
