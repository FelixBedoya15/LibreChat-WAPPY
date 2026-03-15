import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Send, Loader2, Building, User, Mail, Phone, MessageSquare, CheckCircle2 } from 'lucide-react';
import { ThemeSelector } from '@librechat/client';
import { useToastContext } from '@librechat/client';

export default function ContactPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToastContext();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        plan: '',
        message: ''
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const planParam = params.get('plan');
        if (planParam) {
            setFormData(prev => ({ ...prev, plan: planParam }));
        }
    }, [location]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post('/api/contact', formData);
            setSuccess(true);
        } catch (error: any) {
            showToast({
                message: error?.response?.data?.error || 'Ocurrió un error al enviar tu solicitud. Inténtalo de nuevo.',
                status: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="relative min-h-screen bg-surface-secondary flex items-center justify-center p-6">
                <div className="fixed bottom-0 left-0 z-50 p-4 md:m-4">
                    <ThemeSelector />
                </div>
                <div className="max-w-md w-full rounded-3xl border border-green-500/30 bg-surface-primary/60 backdrop-blur-xl p-8 text-center shadow-xl">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-black text-text-primary mb-3">¡Solicitud Enviada!</h2>
                    <p className="text-text-secondary mb-8">
                        Hemos recibido tu información correctamente. Nuestro equipo se pondrá en contacto contigo muy pronto.
                    </p>
                    <button
                        onClick={() => navigate('/planes')}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-green-700 shadow-md"
                    >
                        Volver a los planes
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-surface-secondary">
            {/* Theme Selector */}
            <div className="fixed bottom-0 left-0 z-50 p-4 md:m-4">
                <ThemeSelector />
            </div>

            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-border-medium/50 bg-surface-secondary/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
                    <button
                        onClick={() => navigate('/planes')}
                        className="flex items-center gap-2 rounded-xl bg-surface-primary px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-surface-hover hover:text-text-primary"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </button>
                </div>
            </div>

            <div className="mx-auto max-w-3xl px-6 py-12 md:py-20">
                <div className="text-center mb-10">
                    <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-border-medium/60 bg-surface-primary px-5 py-2 text-sm font-medium text-text-secondary">
                        <Building className="h-5 w-5 text-indigo-500" />
                        Soluciones Corporativas
                    </div>
                    <h1 className="mt-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-500 bg-clip-text text-4xl md:text-5xl font-extrabold tracking-tight text-transparent">
                        Contacta con Ventas
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-base text-text-secondary">
                        Déjanos tus datos y un asesor se comunicará contigo para ajustar WAPPY IA a las necesidades de tu organización.
                    </p>
                </div>

                <div className="rounded-3xl border border-border-light bg-surface-primary/80 backdrop-blur-sm p-6 md:p-10 shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-primary flex items-center gap-2">
                                    <User className="h-4 w-4 text-text-tertiary" /> Nombre completo
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-border-light bg-surface-secondary px-4 py-3 text-sm text-text-primary focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    placeholder="Ej. Juan Pérez"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-primary flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-text-tertiary" /> Correo electrónico
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-border-light bg-surface-secondary px-4 py-3 text-sm text-text-primary focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    placeholder="juan@empresa.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-primary flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-text-tertiary" /> Teléfono
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-border-light bg-surface-secondary px-4 py-3 text-sm text-text-primary focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    placeholder="+57 300 000 0000"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-primary flex items-center gap-2">
                                    <Building className="h-4 w-4 text-text-tertiary" /> Empresa
                                </label>
                                <input
                                    type="text"
                                    name="company"
                                    required
                                    value={formData.company}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-border-light bg-surface-secondary px-4 py-3 text-sm text-text-primary focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    placeholder="Nombre de tu empresa"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-text-primary">Plan de interés</label>
                            <select
                                name="plan"
                                value={formData.plan}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-border-light bg-surface-secondary px-4 py-3 text-sm text-text-primary focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none"
                            >
                                <option value="">Selecciona un plan...</option>
                                <option value="intermediacion">Intermediación de Riesgos Laborales</option>
                                <option value="empresas">Plan Empresas</option>
                                <option value="asesores">Plan Asesores Independientes SST</option>
                                <option value="otro">Otro / Personalizado</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-text-primary flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-text-tertiary" /> Mensaje adicional
                            </label>
                            <textarea
                                name="message"
                                rows={4}
                                value={formData.message}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-border-light bg-surface-secondary px-4 py-3 text-sm text-text-primary focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                                placeholder="Cuéntanos un poco más sobre tus necesidades..."
                            ></textarea>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 text-base font-bold text-white transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-70"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" /> Procesando...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5" /> Enviar solicitud
                                    </>
                                )}
                            </button>
                            <p className="mt-4 text-center text-xs text-text-tertiary">
                                Al enviar este formulario, aceptas nuestra <a href="/privacy" className="underline hover:text-indigo-500">Política de Privacidad</a>.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
