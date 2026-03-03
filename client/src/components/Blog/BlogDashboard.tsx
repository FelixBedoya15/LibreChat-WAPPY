import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { Newspaper, Shield } from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';

export default function BlogDashboard() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToastContext();
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await axios.get('/api/blog');
                setPosts(response.data.filter((p: any) => p.isPublished));
            } catch (error) {
                console.error('Error fetching blog posts:', error);
                showToast({ message: 'Error cargando las publicaciones. Intenta de nuevo más tarde.', status: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
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
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-lg shrink-0 mt-1 md:mt-0">
                            <Newspaper className="w-8 h-8 md:w-10 md:h-10 text-indigo-600 dark:text-indigo-300" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">Blog (Nuevo)</h1>
                            <p className="mt-1 text-sm md:text-base text-gray-500 dark:text-gray-400">
                                Explora las últimas publicaciones, artículos y novedades de nuestro equipo.
                            </p>
                        </div>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={() => navigate('/blog/admin')}
                            className="group flex items-center px-3 py-2 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white rounded-full transition-all duration-300 shadow-sm font-medium text-sm self-start md:self-auto"
                        >
                            <Shield className="w-5 h-5 flex-shrink-0" />
                            <span className="max-w-0 overflow-hidden opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-2 transition-all duration-300 whitespace-nowrap">
                                Administrar Publicaciones
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Posts grid */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-6xl mx-auto">
                    {posts.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <Newspaper className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No hay publicaciones</h3>
                            <p className="mt-1 text-gray-500 dark:text-gray-400">Actualmente no hay artículos disponibles en el blog.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {posts.map((post: any) => (
                                <div
                                    key={post._id}
                                    className="group flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                                    onClick={() => navigate(`/blog/${post._id}`)}
                                >
                                    <div className="h-48 w-full bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
                                        {post.thumbnail ? (
                                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700">
                                                <img src={post.thumbnail.startsWith('http') || post.thumbnail.startsWith('/') ? post.thumbnail : `/images/${post.thumbnail.split('/').pop()}`} alt="Miniatura" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                                            <Newspaper className="w-16 h-16 text-indigo-500/50 dark:text-indigo-400/50" />
                                        </div>)}
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-tight">
                                            {post.title}
                                        </h3>
                                        {post.tags && post.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-3">
                                                {post.tags.slice(0, 3).map((tag: string, i: number) => (
                                                    <span key={i} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs rounded-md font-medium">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {post.tags.length > 3 && (
                                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-md font-medium">
                                                        +{post.tags.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div className="mt-auto pt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                            <span>{new Date(post.createdAt || new Date()).toLocaleDateString()}</span>
                                            {post.author?.name && <span>{post.author.name}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
