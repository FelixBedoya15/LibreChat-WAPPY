import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Send, Loader2, CheckCircle2, AlertCircle, Building2, User, Mail, Phone, MessageSquare, Briefcase } from 'lucide-react';
import { ThemeSelector } from '@librechat/client';
import { useToastContext } from '@librechat/client';

export default function ContactPage() {
    const navigate = useNavigate();
    const { showToast } = useToastContext();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        plan: 'riesgos',
        message: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post('/api/contact/request', formData);
            setSubmitted(true);
            showToast({
                message: '✅ Solicitud enviada exitosamente. Un asesor se contactará contigo pronto.',
                status: 'success',
            });
        } catch (error: any) {
            console.error('Error submitting contact form:', error);
            showToast({
                message: error.response?.data?.message || 'Error al enviar la solicitud. Por favor intenta de nuevo.',
                status: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-surface-secondary px-6">
                 <div className="fixed bottom-0 left-0 z-50 p-4 md:m-4">
                    <ThemeSelector />
                </div>
                <div className="w-full max-w-md text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="rounded-full bg-green-500/10 p-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        </div>
                    </div>
                    <h1 className="mb-4 text-3xl font-extrabold text-text-primary">¡Solicitud Recibida!</h1>
                    <p className="mb-8 text-text-secondary">
                        Gracias por tu interés en WAPPY IA. Hemos recibido tus datos y un miembro de nuestro equipo se pondrá en contacto contigo en las próximas 24 horas hábiles.
                    </p>
                    <button
                        onClick={() => navigate('/planes')}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-bold text-white transition-all hover:bg-green-700 shadow-lg shadow-green-600/20"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver a Planes
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

            {/* Header Bar */}
            <div className="sticky top-0 z-20 border-b border-border-medium/50 bg-surface-secondary/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
                    <button
                        onClick={() => navigate('/planes')}
                        className="flex items-center gap-2 rounded-xl bg-surface-primary px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:bg-surface-hover hover:text-text-primary"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </button>
                    <div className="flex-1 text-center">
                        <span className="text-sm font-bold text-text-primary uppercase tracking-wider">Contacto Empresarial</span>
                    </div>
                    <div className="w-[100px]" />
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-6 py-12">
                <div className="grid gap-12 lg:grid-cols-2">
                    
                    {/* LEFT CONTENT: Info & Branding */}
                    <div>
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-4 py-1.5 text-sm font-semibold text-violet-600 dark:text-violet-400">
                            <Building2 className="h-4 w-4" />
                            Soluciones Corporativas
                        </div>
                        <h1 className="mb-6 text-4xl font-black tracking-tight text-text-primary lg:text-5xl">
                            Lleva tu empresa al próximo nivel con <span className="text-green-500">WAPPY IA</span>
                        </h1>
                        <p className="mb-8 text-lg text-text-secondary leading-relaxed">
                            Nuestros planes empresariales están diseñados para organizaciones que buscan potencia, seguridad y personalización total. 
                        </p>

                        <div className="space-y-6">
                            {[
                                { icon: CheckCircle2, title: 'Implementación Ágil', desc: 'Desplegamos tu plataforma propia en tiempo récord.' },
                                { icon: ShieldCheck, title: 'Seguridad Empresarial', desc: 'Control total de datos y dominios privados.' },
                                { icon: Users, title: 'Colaboración sin límites', desc: 'Usuarios ilimitados para todo tu equipo de trabajo.' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                                        <item.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-text-primary">{item.title}</h3>
                                        <p className="text-sm text-text-secondary">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 rounded-3xl border border-border-medium/30 bg-surface-primary/40 p-6 backdrop-blur-sm">
                            <h4 className="mb-2 text-sm font-bold text-text-primary">¿Tienes dudas directas?</h4>
                            <p className="text-sm text-text-secondary mb-4">Escríbenos directamente o visítanos.</p>
                            <div className="space-y-2 text-sm text-text-primary font-medium">
                                <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-violet-500" /> info@grupowappy.com</p>
                                <a 
                                    href="https://wa.me/573126417890" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 hover:text-green-500 transition-colors group"
                                >
                                    <MessageSquare className="h-4 w-4 text-green-500 group-hover:scale-110 transition-transform" /> 
                                    +57 (312) 641-7890 (WhatsApp)
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT CONTENT: Glassmorphic Form */}
                    <div className="relative">
                        <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-tr from-green-500/20 via-violet-500/20 to-cyan-500/20 blur-2xl opacity-50" />
                        <div className="relative rounded-[2rem] border border-border-medium/40 bg-surface-primary/80 p-8 shadow-2xl backdrop-blur-xl">
                            <h2 className="mb-8 text-2xl font-bold text-text-primary">Envíanos tu solicitud</h2>
                            
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Nombre */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-tertiary">Nombre Completo</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                                        <input
                                            required
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="Tu nombre aquí"
                                            className="w-full rounded-xl border border-border-medium/50 bg-surface-secondary/50 py-3 pl-11 pr-4 text-sm font-medium text-text-primary outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-tertiary">Correo Electrónico</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                                        <input
                                            required
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="nombre@empresa.com"
                                            className="w-full rounded-xl border border-border-medium/50 bg-surface-secondary/50 py-3 pl-11 pr-4 text-sm font-medium text-text-primary outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    {/* Teléfono */}
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-tertiary">WhatsApp / Tel</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+57..."
                                                className="w-full rounded-xl border border-border-medium/50 bg-surface-secondary/50 py-3 pl-11 pr-4 text-sm font-medium text-text-primary outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 transition-all"
                                            />
                                        </div>
                                    </div>
                                    {/* Empresa */}
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-tertiary">Empresa</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                                            <input
                                                type="text"
                                                name="company"
                                                value={formData.company}
                                                onChange={handleChange}
                                                placeholder="Opcional"
                                                className="w-full rounded-xl border border-border-medium/50 bg-surface-secondary/50 py-3 pl-11 pr-4 text-sm font-medium text-text-primary outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Plan Select */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-tertiary">Plan de Interés</label>
                                    <div className="relative">
                                        <CheckCircle2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                                        <select
                                            name="plan"
                                            value={formData.plan}
                                            onChange={handleChange}
                                            className="w-full appearance-none rounded-xl border border-border-medium/50 bg-surface-secondary/50 py-3 pl-11 pr-4 text-sm font-medium text-text-primary outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 transition-all"
                                        >
                                            <option value="riesgos">Plan Intermediación Riesgos Laborales</option>
                                            <option value="empresas">Plan Empresas (Plus)</option>
                                            <option value="asesores">Plan Asesores Independientes SST</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Mensaje */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-tertiary">Mensaje / Detalles Adicionales</label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-4 top-4 h-4 w-4 text-text-tertiary" />
                                        <textarea
                                            name="message"
                                            rows={4}
                                            value={formData.message}
                                            onChange={handleChange}
                                            placeholder="Cuéntanos más sobre tus necesidades..."
                                            className="w-full rounded-xl border border-border-medium/50 bg-surface-secondary/50 py-3 pl-11 pr-4 text-sm font-medium text-text-primary outline-none focus:border-green-500/50 focus:ring-4 focus:ring-green-500/5 transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Privacy Check */}
                                <p className="text-[10px] text-text-tertiary leading-tight text-center">
                                    Al enviar este formulario, aceptas nuestra <a href="/privacy" className="underline hover:text-green-500">Política de Privacidad</a> y autorizas el tratamiento de tus datos para fines comerciales.
                                </p>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-green-600 py-4 text-sm font-bold text-white transition-all hover:bg-green-700 disabled:opacity-70 shadow-xl shadow-green-600/20"
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                            Enviar Solicitud
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// Reuse ShieldCheck and Users from Lucide for the left side if not imported
function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function Users(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
