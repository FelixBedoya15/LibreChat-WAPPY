import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToastContext } from '@librechat/client';
import { Newspaper, Shield, Edit, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { useAuthContext } from '~/hooks/AuthContext';

export default function BlogAdminDashboard() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToastContext();
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        if (!isAdmin) {
            navigate('/blog');
            return;
        }

        const fetchPosts = async () => {
            try {
                const response = await axios.get('/api/blog');
                setPosts(response.data);
            } catch (error) {
                console.error('Error fetching blog posts:', error);
                showToast({ message: 'Error loading posts.', status: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [isAdmin, navigate, showToast]);

    const handleDelete = async (postId: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta publicación?')) return;

        try {
            await axios.delete(`/api/blog/${postId}`);
            showToast({ message: 'Publicación eliminada correctamente', status: 'success' });
            setPosts(posts.filter((p: any) => p._id !== postId));
        } catch (error) {
            console.error('Error deleting post:', error);
            showToast({ message: 'Error eliminando la publicación', status: 'error' });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[50vh]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-indigo-200 dark:bg-indigo-800 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <div className="flex-none p-6 md:p-8 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/blog')}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                            aria-label="Volver al Blog"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Shield className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                Administrar Blog
                            </h1>
                            <p className="mt-1 text-sm md:text-base text-gray-500 dark:text-gray-400">
                                Gestiona las entradas del blog de WAPPY IA.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/blog/admin/posts/new')}
                        className="group flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-all duration-300 shadow-md font-medium text-sm self-start md:self-auto"
                    >
                        <Plus className="w-5 h-5 mr-1" />
                        Crear Publicación
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Título</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Creado</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {posts.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                                            No hay publicaciones creadas todavía.
                                        </td>
                                    </tr>
                                ) : (
                                    posts.map((post: any) => (
                                        <tr key={post._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded relative overflow-hidden flex items-center justify-center">
                                                        {post.thumbnail ? (
                                                            <img src={post.thumbnail.startsWith('http') || post.thumbnail.startsWith('/') ? post.thumbnail : `/images/${post.thumbnail.split('/').pop()}`} alt="" className="h-10 w-10 object-cover" />
                                                        ) : (
                                                            <Newspaper className="h-5 w-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{post.title || '(Sin título)'}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{post.author?.name || 'Admin'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${post.isPublished ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                                    {post.isPublished ? 'Publicado' : 'Borrador'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(post.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(`/blog/admin/posts/${post._id}`)}
                                                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/40"
                                                        title="Editar"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(post._id)}
                                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/40"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
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
    );
}
