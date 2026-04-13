import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Shield, AlertTriangle, CheckCircle, User, Phone, Droplet,
    Activity, Heart, Car, Briefcase, Home, Users, Loader2, Send, Key
} from 'lucide-react';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────
interface WorkerData {
    id: string; nombre: string; cargo: string; identificacion: string;
    edad: string; genero: string; estadoCivil: string; nivelEscolaridad: string; direccion: string;
    telefono: string; emergenciaContacto: string; tipoSangre: string;
    enfermedades: string; medicamentos: string; fuma: string; alcohol: string;
    terapiaPsicologica: string; personasCargo: string | number;
    estrato: string; vivienda: string; soatVencimiento: string;
    tecnicomecanicaVencimiento: string; licenciaSST: string;
    licenciaVencimiento: string; curso50h: string; curso20h: string;
}

// ─── Section component ─────────────────────────────────────────────
const SectionTitle = ({ icon: Icon, label }: { icon: React.ElementType; label: string }) => (
    <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
        <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-teal-600" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-teal-700">{label}</span>
    </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
        {children}
    </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className="w-full border border-gray-200 rounded-xl text-sm bg-gray-50 px-3 py-2.5 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all font-medium placeholder-gray-300"
    />
);

const Select = ({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) => (
    <select
        {...props}
        className="w-full border border-gray-200 rounded-xl text-sm bg-gray-50 px-3 py-2.5 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-all font-medium"
    >
        {children}
    </select>
);

// ─── Main Component ────────────────────────────────────────────────
export default function PublicPerfilUpdate() {
    const { companyId, workerId } = useParams<{ companyId: string; workerId: string }>();

    const [company, setCompany] = useState<any>(null);
    const [workerData, setWorkerData] = useState<WorkerData | null>(null);
    const [loadingCompany, setLoadingCompany] = useState(true);
    const [step, setStep] = useState(1); // 1: verify, 2: fill form, 3: success
    const [cedula, setCedula] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState('');
    const [formData, setFormData] = useState<Partial<WorkerData>>({});
    const [submitting, setSubmitting] = useState(false);
    const [habeasData, setHabeasData] = useState(false);

    // Load company
    useEffect(() => {
        (async () => {
            try {
                const res = await axios.get(`/api/public-sgsst/company/${companyId}`);
                setCompany(res.data);
            } catch {
                // no-op
            } finally {
                setLoadingCompany(false);
            }
        })();
    }, [companyId]);

    const isDriver = (cargo: string) => {
        const c = (cargo || '').toLowerCase();
        return c.includes('conductor') || c.includes('chofer') || c.includes('driver');
    };

    const isSSTRole = (cargo: string) => {
        const c = (cargo || '').toLowerCase();
        return c.includes('sst') || c.includes('sgsst') || c.includes('seguridad') || c.includes('salud') || c.includes('higiene');
    };

    const handleVerify = async () => {
        if (!cedula.trim()) { setVerifyError('Ingresa tu cédula.'); return; }
        setVerifying(true);
        setVerifyError('');
        try {
            // Include cedula as query param just in case workerId is undefined
            const res = await axios.get(`/api/public-sgsst/perfil-update/${companyId}/${workerId}?cedula=${cedula}`);
            const w: WorkerData = res.data.worker;
            
            // If we have a specific workerId in URL, still cross-check for extra security
            if (workerId && workerId !== 'undefined' && String(w.identificacion).trim() !== String(cedula).trim()) {
                setVerifyError('La cédula ingresada no coincide con este perfil. Por favor verifica e intenta de nuevo.');
                return;
            }
            
            setWorkerData(w);
            setFormData({
                id: w.id, // Store real ID
                edad: w.edad, genero: w.genero, estadoCivil: w.estadoCivil, nivelEscolaridad: w.nivelEscolaridad, direccion: w.direccion,
                telefono: w.telefono, emergenciaContacto: w.emergenciaContacto,
                tipoSangre: w.tipoSangre, enfermedades: w.enfermedades,
                medicamentos: w.medicamentos, fuma: w.fuma, alcohol: w.alcohol,
                terapiaPsicologica: w.terapiaPsicologica,
                personasCargo: w.personasCargo, estrato: w.estrato, vivienda: w.vivienda,
                soatVencimiento: w.soatVencimiento, tecnicomecanicaVencimiento: w.tecnicomecanicaVencimiento,
                licenciaSST: w.licenciaSST, licenciaVencimiento: w.licenciaVencimiento,
                curso50h: w.curso50h, curso20h: w.curso20h,
            });
            setStep(2);
        } catch (err: any) {
            setVerifyError(err.response?.data?.error || 'No se pudo cargar el perfil. Intenta de nuevo.');
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // Use URL param if available, otherwise fallback to workerData.id found during verification
            const targetWorkerId = (workerId && workerId !== 'undefined') ? workerId : workerData?.id;
            await axios.post(`/api/public-sgsst/perfil-update/${companyId}/${targetWorkerId}`, {
                updates: formData,
                cedula: cedula // Fallback for backend finding logic
            });
            setStep(3);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Error al enviar. Intenta de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    const upd = (field: keyof WorkerData, value: string) =>
        setFormData(prev => ({ ...prev, [field]: value }));

    // ─── Loading ────────────────────────────────────────────────────
    if (loadingCompany) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <Loader2 className="w-12 h-12 text-teal-500 animate-spin mb-4" />
            <h2 className="text-lg font-bold text-gray-800">Cargando portal...</h2>
        </div>
    );

    if (!company) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle className="w-14 h-14 text-red-500 mb-4" />
            <h2 className="text-xl font-bold">Enlace Inválido</h2>
            <p className="text-gray-500 mt-2 text-sm">El QR no está asociado a una empresa válida.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 font-sans text-gray-800 flex flex-col">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur border-b border-gray-100 sticky top-0 z-10 px-5 py-3 shrink-0">
                <div className="flex items-center gap-3 max-w-md mx-auto">
                    {company.logo ? (
                        <img src={company.logo} alt="Logo" className="w-9 h-9 rounded-xl object-contain border border-gray-200 bg-white p-0.5" />
                    ) : (
                        <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                            <Shield className="w-4 h-4 text-teal-600" />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h1 className="font-bold text-sm text-gray-900 leading-tight truncate">{company.companyName}</h1>
                        <p className="text-[11px] text-gray-400">Actualización de Perfil Sociodemográfico</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-5 pb-10 w-full max-w-md mx-auto flex flex-col">

                {/* ─── STEP 1: Verify Identity ─────────────────── */}
                {step === 1 && (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6 text-teal-600">
                            <div className="w-10 h-10 bg-teal-50 rounded-2xl flex items-center justify-center">
                                <Key className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Verificar Identidad</h2>
                                <p className="text-xs text-gray-400">Ingresa tu cédula para acceder a tu perfil</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Field label="Número de Cédula">
                                <Input
                                    type="number"
                                    placeholder="Sin puntos ni comas"
                                    value={cedula}
                                    onChange={e => setCedula(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleVerify()}
                                />
                            </Field>
                        </div>

                        {verifyError && (
                            <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r text-sm text-red-700">
                                {verifyError}
                            </div>
                        )}

                        <button
                            onClick={handleVerify}
                            disabled={verifying}
                            className="mt-6 w-full bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl font-bold tracking-wide shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {verifying ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</> : 'Acceder a mi Perfil'}
                        </button>

                        <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed">
                            Tus datos son verificados de forma segura.<br />Ninguna información personal es compartida con terceros.
                        </p>
                    </div>
                )}

                {/* ─── STEP 2: Update Form ─────────────────────── */}
                {step === 2 && workerData && (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Worker Header */}
                        <div className="flex items-center gap-3 mb-5 p-4 bg-teal-50 rounded-2xl border border-teal-100">
                            <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white font-black text-xl shrink-0">
                                {workerData.nombre.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-gray-900 truncate leading-tight">{workerData.nombre}</p>
                                <p className="text-xs text-teal-700 font-semibold">{workerData.cargo}</p>
                                <p className="text-[11px] text-gray-400">Cédula: {workerData.identificacion}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {/* Datos Básicos */}
                            <SectionTitle icon={User} label="Datos Básicos y Domicilio" />
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Edad (Ej: 35)">
                                    <Input type="number" value={formData.edad || ''} onChange={e => upd('edad', e.target.value)} />
                                </Field>
                                <Field label="Género">
                                    <Select value={formData.genero || ''} onChange={e => upd('genero', e.target.value)}>
                                        <option value="">Seleccionar</option>
                                        <option>Masculino</option>
                                        <option>Femenino</option>
                                        <option>Otro</option>
                                    </Select>
                                </Field>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Estado Civil">
                                    <Select value={formData.estadoCivil || ''} onChange={e => upd('estadoCivil', e.target.value)}>
                                        <option value="">Seleccionar</option>
                                        <option>Soltero/a</option>
                                        <option>Casado/a</option>
                                        <option>Unión Libre</option>
                                        <option>Separado/a</option>
                                        <option>Viudo/a</option>
                                    </Select>
                                </Field>
                                <Field label="Escolaridad">
                                    <Select value={formData.nivelEscolaridad || ''} onChange={e => upd('nivelEscolaridad', e.target.value)}>
                                        <option value="">Seleccionar</option>
                                        <option>Ninguna</option>
                                        <option>Primaria</option>
                                        <option>Secundaria</option>
                                        <option>Técnico</option>
                                        <option>Tecnólogo</option>
                                        <option>Profesional</option>
                                        <option>Posgrado</option>
                                    </Select>
                                </Field>
                            </div>
                            <Field label="Dirección de Domicilio">
                                <Input value={formData.direccion || ''} onChange={e => upd('direccion', e.target.value)} placeholder="Ej: Calle Principal 123, Ciudad" />
                            </Field>

                            {/* Contacto y Emergencia */}
                            <SectionTitle icon={Phone} label="Contacto y Emergencia" />
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Teléfono">
                                    <Input type="tel" value={formData.telefono || ''} onChange={e => upd('telefono', e.target.value)} placeholder="3001234567" />
                                </Field>
                                <Field label="Tipo de Sangre">
                                    <Select value={formData.tipoSangre || ''} onChange={e => upd('tipoSangre', e.target.value)}>
                                        <option value="">Seleccionar</option>
                                        {['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(t => <option key={t}>{t}</option>)}
                                    </Select>
                                </Field>
                            </div>
                            <Field label="Contacto de Emergencia (Nombre y Teléfono)">
                                <Input value={formData.emergenciaContacto || ''} onChange={e => upd('emergenciaContacto', e.target.value)} placeholder="Ej: Esposa - 3154567890" />
                            </Field>

                            {/* Health */}
                            <SectionTitle icon={Activity} label="Salud y Hábitos" />
                            <Field label="Enfermedades Actuales">
                                <Input value={formData.enfermedades || ''} onChange={e => upd('enfermedades', e.target.value)} placeholder="Ej: Hipertensión, Diabetes" />
                            </Field>
                            <Field label="Medicamentos Actuales">
                                <Input value={formData.medicamentos || ''} onChange={e => upd('medicamentos', e.target.value)} placeholder="Ej: Metformina 500mg" />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Fuma">
                                    <Select value={formData.fuma || ''} onChange={e => upd('fuma', e.target.value)}>
                                        <option value="">Seleccionar</option>
                                        <option>No</option>
                                        <option>Sí, diario</option>
                                        <option>Sí, ocasional</option>
                                    </Select>
                                </Field>
                                <Field label="Consume Alcohol">
                                    <Select value={formData.alcohol || ''} onChange={e => upd('alcohol', e.target.value)}>
                                        <option value="">Seleccionar</option>
                                        <option>No</option>
                                        <option>Ocasional</option>
                                        <option>Semanal</option>
                                        <option>Frecuente</option>
                                    </Select>
                                </Field>
                            </div>
                            <Field label="Terapia Psicológica">
                                <Select value={formData.terapiaPsicologica || ''} onChange={e => upd('terapiaPsicologica', e.target.value)}>
                                    <option value="">Seleccionar</option>
                                    <option>No</option>
                                    <option>Sí, actualmente</option>
                                    <option>Sí, en el pasado</option>
                                </Select>
                            </Field>

                            {/* Socioeconomic */}
                            <SectionTitle icon={Home} label="Vivienda y Económico" />
                            <div className="grid grid-cols-3 gap-3">
                                <Field label="Estrato">
                                    <Select value={formData.estrato || ''} onChange={e => upd('estrato', e.target.value)}>
                                        <option value="">—</option>
                                        {['1','2','3','4','5','6'].map(s => <option key={s}>{s}</option>)}
                                    </Select>
                                </Field>
                                <Field label="Vivienda">
                                    <Select value={formData.vivienda || ''} onChange={e => upd('vivienda', e.target.value)}>
                                        <option value="">—</option>
                                        <option>Propia</option>
                                        <option>Arrendada</option>
                                        <option>Familiar</option>
                                    </Select>
                                </Field>
                                <Field label="Personas a cargo">
                                    <Input type="number" min={0} max={20} value={formData.personasCargo as string || ''} onChange={e => upd('personasCargo', e.target.value)} placeholder="0" />
                                </Field>
                            </div>

                            {/* Driver section */}
                            {isDriver(workerData.cargo) && (
                                <>
                                    <SectionTitle icon={Briefcase} label="Conductor — Documentos" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Venc. SOAT">
                                            <Input type="date" value={formData.soatVencimiento || ''} onChange={e => upd('soatVencimiento', e.target.value)} />
                                        </Field>
                                        <Field label="Venc. Tecnicomecánica">
                                            <Input type="date" value={formData.tecnicomecanicaVencimiento || ''} onChange={e => upd('tecnicomecanicaVencimiento', e.target.value)} />
                                        </Field>
                                    </div>
                                </>
                            )}

                            {/* SST role section */}
                            {isSSTRole(workerData.cargo) && (
                                <>
                                    <SectionTitle icon={Shield} label="SG-SST — Licencia y Cursos" />
                                    <Field label="N° Licencia SST">
                                        <Input value={formData.licenciaSST || ''} onChange={e => upd('licenciaSST', e.target.value)} placeholder="Ej: LIC-SST-12345" />
                                    </Field>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Field label="Venc. Licencia">
                                            <Input type="date" value={formData.licenciaVencimiento || ''} onChange={e => upd('licenciaVencimiento', e.target.value)} />
                                        </Field>
                                        <Field label="Curso 50 horas">
                                            <Input type="date" value={formData.curso50h || ''} onChange={e => upd('curso50h', e.target.value)} />
                                        </Field>
                                    </div>
                                    <Field label="Curso 20 horas">
                                        <Input type="date" value={formData.curso20h || ''} onChange={e => upd('curso20h', e.target.value)} />
                                    </Field>
                                </>
                            )}
                        </div>

                        <div className="mt-8 mb-4 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                                    <input type="checkbox" checked={habeasData} onChange={e => setHabeasData(e.target.checked)} className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-gray-300 bg-white checked:border-teal-600 checked:bg-teal-600 transition-all" />
                                    <Shield className="absolute pointer-events-none w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                                <div className="text-[11px] text-gray-500 leading-relaxed font-medium">
                                    <strong className="text-gray-700 block mb-1">Aceptación de Tratamiento de Datos (Ley 1581 Habeas Data)</strong>
                                    Autorizo a la empresa el tratamiento de mis datos personales, sociodemográficos y médicos (sensibles) con fines exclusivos del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) bajo la normativa colombiana vigente.
                                </div>
                            </label>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !habeasData}
                            className="mt-7 w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:opacity-90 text-white py-4 rounded-xl font-bold shadow-lg shadow-teal-500/25 tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</> : <><Send className="w-5 h-5" /> Enviar Actualización</>}
                        </button>
                        <p className="text-[11px] text-gray-400 text-center mt-3 leading-relaxed">
                            Tu solicitud será revisada por el administrador SST antes de ser aprobada.
                        </p>
                    </div>
                )}

                {/* ─── STEP 3: Success ─────────────────────────── */}
                {step === 3 && (
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mt-4 flex flex-col items-center text-center animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mb-5">
                            <CheckCircle className="w-10 h-10 text-teal-600" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">¡Datos Enviados!</h2>
                        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                            Tu solicitud de actualización fue recibida con éxito. El equipo SG-SST la revisará y aprobará próximamente.
                        </p>
                        <div className="mt-6 w-full p-4 bg-teal-50 rounded-2xl border border-teal-100 text-left">
                            <p className="text-xs font-bold text-teal-800 mb-1">¿Qué sigue?</p>
                            <ul className="text-xs text-teal-700 space-y-1 list-disc list-inside">
                                <li>El responsable SST revisará tu solicitud</li>
                                <li>Los datos serán actualizados en el sistema</li>
                                <li>Recibirás confirmación si hay cambios</li>
                            </ul>
                        </div>
                    </div>
                )}
            </main>

            <footer className="shrink-0 p-4 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <Shield className="w-3 h-3 text-teal-500" /> Portal Seguro · Wappy
                </div>
            </footer>
        </div>
    );
}
