import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { ArrowLeft, Clock, User, Share2 } from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { UpgradeWall } from '~/components/SGSST/UpgradeWall';

export default function BlogPostViewer() {
    const { postId } = useParams();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToastContext();
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const isFreePlan = user?.role === 'USER';

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const response = await axios.get(`/api/blog/${postId}`);
                setPost(response.data);
            } catch (error) {
                console.error('Error fetching blog post:', error);
                showToast({ message: 'Error cargando la publicación. Intenta de nuevo más tarde.', status: 'error' });
                navigate('/blog');
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
    }, [postId, navigate, showToast]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[60vh]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-16 w-16 bg-indigo-200 dark:bg-indigo-800 rounded-full mb-4"></div>
                    <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (isFreePlan) {
        return (
            <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-y-auto w-full p-4 relative">
                {/* Back Button Wrapper */}
                <div className="mb-4">
                    <button
                        onClick={() => navigate('/blog')}
                        className="group flex items-center gap-2 p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Volver al Blog</span>
                    </button>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <UpgradeWall
                        title="Blog Exclusivo"
                        description="Para acceder a nuestros valiosos artículos, actualizaciones operativas y reportes mensuales debes contar con un plan Go, Plus o Admin. ¡Sube de nivel y mantente informado!"
                    />
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Publicación no encontrada</h2>
                <button
                    onClick={() => navigate('/blog')}
                    className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" /> Volver al Blog
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 overflow-y-auto w-full">

            {/* Clean top bar with back button */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 md:px-8 py-3 flex items-center justify-between flex-shrink-0">
                <button
                    onClick={() => navigate('/blog')}
                    className="group flex items-center gap-2 p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium hidden sm:inline">Volver al Blog</span>
                </button>
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        showToast({ message: 'Enlace copiado al portapapeles', status: 'success' });
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Compartir</span>
                </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-10 lg:p-12">

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold tracking-wider uppercase">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-gray-900 dark:text-gray-50 mb-4">
                    {post.title}
                </h1>

                {/* Meta */}
                <div className="flex items-center gap-5 text-sm text-gray-500 dark:text-gray-400 flex-wrap mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
                    {post.author?.name && (
                        <div className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            {post.author.name}
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {new Date(post.createdAt).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </div>

                {/* Thumbnail — only if provided */}
                {post.thumbnail && (
                    <div className="mb-8 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm w-full">
                        <img
                            src={post.thumbnail.startsWith('http') || post.thumbnail.startsWith('/') ? post.thumbnail : `/images/${post.thumbnail.split('/').pop()}`}
                            alt={post.title}
                            className="w-full h-auto object-contain"
                        />
                    </div>
                )}

                {/* Main HTML Content */}
                <div
                    className="prose prose-lg dark:prose-invert prose-indigo max-w-none text-gray-800 dark:text-gray-200 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Footer Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
                        <h3 className="text-xl font-bold mb-6">Etiquetas Relacionadas</h3>
                        <div className="flex flex-wrap gap-3">
                            {post.tags.map((tag: string, i: number) => (
                                <span key={i} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors cursor-pointer">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
