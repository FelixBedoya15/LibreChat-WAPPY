import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToastContext } from '@librechat/client';
import { Settings, Save, Sparkles, MessageSquare, Bot, AlertCircle } from 'lucide-react';
import { useAuthContext } from '~/hooks';

export default function TenshiAdminPanel() {
    const { user, token } = useAuthContext();
    const { showToast } = useToastContext();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        name: 'Tenshi',
        description: '',
        model: 'gemini-2.5-flash',
        provider: 'google',
        location: 'bottom-right',
        isActive: true,
        extraKnowledge: '',
        systemPrompt: ''
    });

    const { data: config, isLoading } = useQuery(['tenshiConfigAdmin', token], async () => {
        const res = await axios.get('/api/tenshi/config', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        return res.data;
    }, {
        onSuccess: (data) => {
            setFormData({
                name: data.name || 'Tenshi',
                description: data.description || '',
                model: data.model || 'gemini-2.5-flash',
                provider: data.provider || 'google',
                location: data.location || 'bottom-right',
                isActive: data.isActive !== false,
                extraKnowledge: data.extraKnowledge || '',
                systemPrompt: data.systemPrompt || '',
            });
        }
    });

    const updateConfig = useMutation(
        async (newConfig: typeof formData) => {
            const res = await axios.post('/api/tenshi/config', newConfig, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            return res.data;
        },
        {
            onSuccess: () => {
                showToast({ message: 'Configuración de Tenshi guardada correctamente', status: 'success' });
                queryClient.invalidateQueries(['tenshiConfigAdmin']);
                queryClient.invalidateQueries(['tenshiConfig']);
            },
            onError: () => {
                showToast({ message: 'Error guardando config', status: 'error' });
            }
        }
    );

    if (user?.role !== 'ADMIN') {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="text-center bg-red-50 dark:bg-red-900/20 p-8 rounded-2xl border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-700 dark:text-red-400">Acceso Denegado</h2>
                    <p className="text-red-600 dark:text-red-300 mt-2">Solo los administradores pueden configurar a Tenshi.</p>
                </div>
            </div>
        );
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
        setFormData(prev => ({ ...prev, [e.target.name]: value }));
    };

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-8 overflow-y-auto h-full">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
                <div className="bg-gradient-to-tr from-green-500 to-emerald-400 p-3 rounded-2xl shadow-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Configuración de Tenshi</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Personaliza el chatbot de ayuda nativo de WAPPY IA.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                            <Bot className="w-5 h-5 text-green-500" /> Información Básica
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Asistente</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-900" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción corta</label>
                                <input type="text" name="description" value={formData.description} onChange={handleChange} placeholder="Ej: Asistente virtual experto en SG-SST" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-900" />
                            </div>
                        </div>
                    </div>

                    {/* AI Config */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                            <Settings className="w-5 h-5 text-indigo-500" /> Motor de IA
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Configuración del Proveedor</label>
                                <select name="provider" value={formData.provider} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900">
                                    <option value="google">Google Gemini</option>
                                    <option value="groq">Groq (Rápido)</option>
                                    <option value="openai">OpenAI / NVIDIA</option>
                                    <option value="ollama">Local (Ollama / Wappy)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modelo de IA (ID Exacto)</label>
                                <input type="text" name="model" value={formData.model} onChange={handleChange} placeholder="Ej: gemini-2.5-flash" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900" />
                            </div>
                        </div>
                    </div>

                    {/* Knowledge Base */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                            <MessageSquare className="w-5 h-5 text-blue-500" /> Cerebro y Contexto
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prompt de Sistema (Instrucciones base)</label>
                                <textarea name="systemPrompt" value={formData.systemPrompt} onChange={handleChange} rows={5} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 font-mono text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base de Conocimiento Extra</label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Aquí puedes inyectar directrices temporales o de lanzamientos sin reescribir todo el prompt.</p>
                                <textarea name="extraKnowledge" value={formData.extraKnowledge} onChange={handleChange} rows={4} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Widget Interface */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Interfaz del Widget</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ubicación en pantalla</label>
                                <select name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-900">
                                    <option value="bottom-right">Abajo a la derecha</option>
                                    <option value="bottom-left">Abajo a la izquierda</option>
                                    <option value="top-right">Arriba a la derecha</option>
                                    <option value="top-left">Arriba a la izquierda</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Activar Tenshi</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => updateConfig.mutate(formData)}
                        disabled={updateConfig.isLoading}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                        {updateConfig.isLoading ? 'Guardando...' : (
                            <>
                                <Save className="w-5 h-5" />
                                Guardar Configuración
                            </>
                        )}
                    </button>

                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                        <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Inteligencia Dinámica
                        </h3>
                        <p className="text-xs text-indigo-700 dark:text-indigo-400">
                            Tenshi lee automáticamente los últimos 5 artículos del Blog para estar siempre al día con las novedades, sin que tengas que actualizar su Base de Conocimiento manualmente.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
