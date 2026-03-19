import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { Newspaper, Shield } from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';
import { OpenSidebar } from '~/components/Chat/Menus';
import type { ContextType } from '~/common';

export default function BlogDashboard() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToastContext();
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const isAdmin = user?.role === 'ADMIN';
    const { navVisible, setNavVisible } = useOutletContext<ContextType>();

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
            {/* ═══ Header Section (Wappy Brand Green Style) ═══ */}
            <div className="flex-none p-6 md:px-12 md:py-8 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        {!navVisible && (
                            <button 
                                onClick={() => setNavVisible(true)}
                                className="hidden md:flex shrink-0 p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <OpenSidebar setNavVisible={setNavVisible} />
                            </button>
                        )}
                        <div className="flex items-center gap-4">
                            <div className="p-3.5 bg-[#10b981]/10 dark:bg-[#10b981]/20 rounded-2xl shrink-0 mt-1 md:mt-0 transition-transform group-hover:scale-105">
                                <Newspaper className="w-8 h-8 text-[#10b981]" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Blog</h1>
                                <p className="mt-1 text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                                    Explora las últimas publicaciones y novedades normativas.
                                </p>
                            </div>
                        </div>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={() => navigate('/blog/admin')}
                            className="group flex items-center gap-3 bg-gray-900 dark:bg-gray-800 px-4 py-3 border border-gray-800 dark:border-gray-700 hover:bg-black dark:hover:bg-gray-700 text-white dark:text-gray-100 rounded-2xl transition-all duration-300 shadow-sm self-start md:self-auto"
                        >
                            <Shield className="w-5 h-5 flex-shrink-0 text-[#10b981]" />
                            <span className="font-bold text-sm">
                                Administrar Publicaciones
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Posts grid */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto">
                    {posts.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 shadow-sm">
                            <Newspaper className="mx-auto h-12 w-12 text-gray-400 mb-4 opacity-50" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">No hay publicaciones</h3>
                            <p className="mt-1 text-gray-500 dark:text-gray-400">Actualmente no hay artículos disponibles en el blog.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {posts.map((post: any) => (
                                <div
                                    key={post._id}
                                    className="group flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] hover:border-[#10b981]/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                                    onClick={() => navigate(`/blog/${post._id}`)}
                                >
                                    <div className="h-48 w-full bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                                        {post.thumbnail ? (
                                            <div className="w-full h-full bg-gray-200 dark:bg-gray-800">
                                                <img src={post.thumbnail.startsWith('http') || post.thumbnail.startsWith('/') ? post.thumbnail : `/images/${post.thumbnail.split('/').pop()}`} alt="Miniatura" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            </div>
                                        ) : (<div className="absolute inset-0 flex items-center justify-center bg-[#10b981]/5 group-hover:scale-110 transition-transform duration-500">
                                            <Newspaper className="w-16 h-16 text-[#10b981]/30" />
                                        </div>)}
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white group-hover:text-[#10b981] transition-colors line-clamp-2 leading-tight">
                                            {post.title}
                                        </h3>
                                        {post.tags && post.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-4">
                                                {post.tags.slice(0, 3).map((tag: string, i: number) => (
                                                    <span key={i} className="px-2 py-0.5 text-[10px] font-black tracking-wider uppercase bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-700">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {post.tags.length > 3 && (
                                                    <span className="px-2 py-0.5 text-[10px] font-black tracking-wider uppercase bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-md border border-gray-200 dark:border-gray-700">
                                                        +{post.tags.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div className="mt-auto pt-5 flex items-center justify-between text-xs font-bold tracking-wide text-gray-400 dark:text-gray-500">
                                            <span className="text-[#10b981]">{new Date(post.createdAt || new Date()).toLocaleDateString()}</span>
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
