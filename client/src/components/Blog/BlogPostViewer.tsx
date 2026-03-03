import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { ArrowLeft, Clock, User, Share2, Tag } from 'lucide-react';

export default function BlogPostViewer() {
    const { postId } = useParams();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToastContext();
    const navigate = useNavigate();

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
            {/* Header image / Banner */}
            <div className="relative w-full h-64 md:h-80 lg:h-96 bg-gray-200 dark:bg-gray-800 flex-shrink-0">
                {post.thumbnail ? (
                    <img
                        src={post.thumbnail.startsWith('http') || post.thumbnail.startsWith('/') ? post.thumbnail : `/images/${post.thumbnail.split('/').pop()}`}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/90 to-purple-800/90 flex flex-col items-center justify-center text-center p-6">
                        <Tag className="w-16 h-16 text-white/20 mb-4" />
                    </div>
                )}

                {/* Gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                <div className="absolute top-4 left-4 z-10">
                    <button
                        onClick={() => navigate('/blog')}
                        className="group flex items-center p-2 md:p-3 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full transition-all duration-300 gap-2 border border-white/10"
                    >
                        <ArrowLeft className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
                        <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:mx-1 transition-all duration-300 whitespace-nowrap text-sm font-medium">Volver al Blog</span>
                    </button>
                </div>

                {/* Title area overlaid on image */}
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 lg:p-16 text-white max-w-5xl mx-auto">
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.map((tag: string, i: number) => (
                                <span key={i} className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wider uppercase border border-white/30 text-white">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 drop-shadow-md">
                        {post.title}
                    </h1>

                    <div className="flex items-center gap-6 text-sm md:text-base text-gray-200 flex-wrap">
                        {post.author?.name && (
                            <div className="flex items-center gap-2 font-medium">
                                <User className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
                                {post.author.name}
                            </div>
                        )}
                        <div className="flex items-center gap-2 opacity-90">
                            <Clock className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
                            {new Date(post.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-10 lg:p-16">

                {/* Actions Bar */}
                <div className="flex justify-end mb-8 border-b border-gray-200 dark:border-gray-800 pb-4">
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            showToast({ message: 'Enlace copiado al portapapeles', status: 'success' });
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Compartir Artículo</span>
                    </button>
                </div>

                {/* Main Markdown Content - We use Prose for styling */}
                <div
                    className="prose prose-lg dark:prose-invert prose-indigo max-w-none text-gray-800 dark:text-gray-200 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Footer of the post */}
                <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
                    <h3 className="text-xl font-bold mb-6">Etiquetas Relacionadas</h3>
                    <div className="flex flex-wrap gap-3">
                        {post.tags?.map((tag: string, i: number) => (
                            <span key={i} className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-colors cursor-pointer">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
