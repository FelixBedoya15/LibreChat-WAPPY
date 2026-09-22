import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users,
  Shield,
  CheckCircle,
  AlertTriangle,
  Loader2,
  PenTool,
  RotateCcw,
  Send,
  Calendar,
  Award,
  Sparkles,
  ArrowRight,
  HeartHandshake,
  Flame,
  Car,
} from 'lucide-react';
import PublicWorkerHeader from './PublicWorkerHeader';

export default function PublicComites() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  const [company, setCompany] = useState<any>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  // Form State
  const [tipoComite, setTipoComite] = useState<'copasst' | 'cocolab' | 'brigada' | 'pesv'>('copasst');
  const [accion, setAccion] = useState<'asistencia_reunion' | 'inspeccion_seguridad' | 'simulacro_brigada'>('asistencia_reunion');
  const [nombre, setNombre] = useState('');
  const [cedula, setCedula] = useState(localStorage.getItem('wappy_worker_cedula') || '');
  const [cargo, setCargo] = useState('');
  const [rolEnComite, setRolEnComite] = useState('Miembro Principal');
  const [temasTratados, setTemasTratados] = useState('');
  const [compromisos, setCompromisos] = useState('');

  // Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{ success: boolean; message?: string; recordId?: string } | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await axios.get(`/api/public-sgsst/company/${companyId}`);
        setCompany(res.data);
      } catch (err) {
        console.error('Error fetching company:', err);
      } finally {
        setLoadingCompany(false);
      }
    };
    if (companyId) fetchCompany();
  }, [companyId]);

  // Canvas drawing handlers (mouse & touch)
  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f766e';
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !cedula.trim()) {
      alert('Por favor ingresa tu nombre y cédula.');
      return;
    }

    const signatureData = hasSignature && canvasRef.current ? canvasRef.current.toDataURL('image/png') : null;

    setSubmitting(true);
    try {
      const payload = {
        tipoComite,
        accion,
        trabajadorNombre: nombre.trim(),
        trabajadorCedula: cedula.trim(),
        trabajadorCargo: cargo.trim(),
        rolEnComite,
        temasTratados: temasTratados.trim(),
        compromisos: compromisos.trim(),
        firma: signatureData,
      };

      const res = await axios.post(`/api/public-sgsst/comites/${companyId}`, payload);
      setSubmittedResult({ success: true, recordId: res.data.recordId });
      localStorage.setItem('wappy_worker_cedula', cedula.trim());
    } catch (err: any) {
      console.error('Error submitting comite record:', err);
      alert(err.response?.data?.error || 'Error al enviar el registro de asistencia.');
    } finally {
      setSubmitting(false);
    }
  };

  const comitesMetadata = {
    copasst: {
      name: 'COPASST',
      fullName: 'Comité Paritario de Seguridad y Salud en el Trabajo',
      norm: 'Res. 2013/1986 • Dec. 1072/15 Art. 2.2.4.6.8',
      icon: Users,
      color: 'from-teal-600 to-emerald-600',
      pts: '+25 pts',
      roles: ['Presidente', 'Secretario', 'Miembro Principal Trabajadores', 'Miembro Suplente Trabajadores', 'Representante Empleador', 'Asistente Invitado'],
    },
    cocolab: {
      name: 'COCOLAB',
      fullName: 'Comité de Convivencia Laboral',
      norm: 'Res. 652/2012 • Ley 1010/2006 • Ley 2365/2024',
      icon: HeartHandshake,
      color: 'from-indigo-600 to-violet-600',
      pts: '+25 pts',
      roles: ['Presidente', 'Secretario', 'Representante Trabajadores', 'Representante Empleador', 'Invitado'],
    },
    brigada: {
      name: 'Brigada de Emergencias',
      fullName: 'Brigada de Prevención y Atención de Emergencias',
      norm: 'Res. 2400/1979 Art. 223 • Dec. 1072/15 Art. 2.2.4.6.25',
      icon: Flame,
      color: 'from-amber-600 to-rose-600',
      pts: '+35 pts',
      roles: ['Líder de Brigada', 'Brigadista Primeros Auxilios', 'Brigadista Evacuación', 'Brigadista Control de Fuego', 'Brigadista Integral'],
    },
    pesv: {
      name: 'Comité PESV',
      fullName: 'Comité de Seguridad Vial (Plan Estratégico)',
      norm: 'Res. 20223040040595 de 2022 (Paso 2) • Ley 2050/2020',
      icon: Car,
      color: 'from-cyan-600 to-blue-600',
      pts: '+40 pts',
      roles: ['Líder del PESV', 'Representante de Conductores', 'Jefe de Operaciones / Mantenimiento', 'Miembro del Comité'],
    },
  };

  const activeMeta = comitesMetadata[tipoComite];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-text-primary flex flex-col font-sans transition-colors">
      <PublicWorkerHeader
        companyId={companyId || ''}
        companyName={company?.companyName || 'Somos SST'}
        companyLogo={company?.logoUrl}
        currentModule="comites"
        workerCedula={cedula}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        {/* Pantalla de éxito */}
        {submittedResult && (
          <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-text-primary">¡Asistencia Registrada!</h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-md mx-auto">
                Tu firma y participación en el <strong>{activeMeta.fullName}</strong> han sido recibidas con éxito y selladas con fecha y hora.
              </p>
            </div>

            <div className="p-4 bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl text-xs text-teal-900 dark:text-teal-200 text-left flex items-start gap-3">
              <Award className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Puntos de Gamificación</p>
                <p className="mt-0.5 text-teal-800 dark:text-teal-300">
                  Tu participación sumará <strong>{activeMeta.pts}</strong> a tu Pasaporte SST una vez validada la lista de asistencia por el coordinador.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSubmittedResult(null)}
                className="flex-1 py-3 rounded-2xl font-semibold border border-border-medium bg-surface-secondary/60 hover:bg-surface-hover text-text-primary transition-colors"
              >
                Registrar otra persona
              </button>
              <button
                type="button"
                onClick={() => navigate(`/sgsst-public/colaborador/${companyId}/${cedula}`)}
                className="flex-1 py-3 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Ver Mi Pasaporte SST</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Formulario */}
        {!submittedResult && (
          <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs uppercase tracking-wider">
                <Shield className="w-4 h-4" /> Comités & Liderazgo SST
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-text-primary mt-1">
                Firma de Asistencia & Actas
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                Registra formalmente tu participación en los comités institucionales y brigadas de emergencia.
              </p>
            </div>

            {/* Selector de Comité */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-wide">1. Selecciona el Comité</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['copasst', 'cocolab', 'brigada', 'pesv'] as const).map(c => {
                  const item = comitesMetadata[c];
                  const isSelected = tipoComite === c;
                  const Icon = item.icon;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setTipoComite(c);
                        setRolEnComite(item.roles[0]);
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/20'
                          : 'border-border-medium hover:bg-surface-hover text-text-secondary'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-bold">{item.name}</span>
                      <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400">{item.pts}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-surface-secondary/40 border border-border-medium/60 text-xs">
                <span className="text-text-secondary font-medium truncate">{activeMeta.fullName}</span>
                <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[10px] font-bold">
                  {activeMeta.norm}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Tipo de Actividad */}
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wide block mb-1.5">
                  2. Tipo de Actividad
                </label>
                <select
                  value={accion}
                  onChange={e => setAccion(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                >
                  <option value="asistencia_reunion">Reunión Mensual / Ordinaria</option>
                  <option value="inspeccion_seguridad">Inspección Periódica de Seguridad</option>
                  <option value="simulacro_brigada">Entrenamiento o Práctica de Emergencia</option>
                </select>
              </div>

              {/* Datos del Participante */}
              <div className="space-y-3 pt-2 border-t border-border-medium/60">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wide block">
                  3. Datos del Participante
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary">Nombre Completo:</span>
                    <input
                      type="text"
                      value={nombre}
                      onChange={e => setNombre(e.target.value)}
                      placeholder="Ej: Laura Gómez"
                      required
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary">Cédula:</span>
                    <input
                      type="text"
                      value={cedula}
                      onChange={e => setCedula(e.target.value)}
                      placeholder="Número sin puntos"
                      required
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary">Cargo en la Empresa:</span>
                    <input
                      type="text"
                      value={cargo}
                      onChange={e => setCargo(e.target.value)}
                      placeholder="Ej: Operario de Ensamble"
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary">Rol en este Comité:</span>
                    <select
                      value={rolEnComite}
                      onChange={e => setRolEnComite(e.target.value)}
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    >
                      {activeMeta.roles.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Temas Tratados / Observaciones */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wide block">
                  4. Temas Tratados / Compromisos
                </label>
                <textarea
                  rows={2}
                  value={temasTratados}
                  onChange={e => setTemasTratados(e.target.value)}
                  placeholder="Resumen de puntos abordados en la reunión..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              {/* Firma Manuscrita */}
              <div className="space-y-2 pt-2 border-t border-border-medium/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-teal-600" /> 5. Firma Digital Manuscrita
                  </label>
                  {hasSignature && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-[11px] font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Limpiar firma
                    </button>
                  )}
                </div>

                <div className="border border-border-medium rounded-2xl overflow-hidden bg-white shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={150}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-32 touch-none cursor-crosshair"
                  />
                </div>
                <p className="text-[10px] text-text-tertiary text-center">
                  Dibuja tu firma con el dedo o puntero sobre el recuadro blanco.
                </p>
              </div>

              {/* Botón de Envío */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Guardando Asistencia...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" /> Firmar y Registrar Asistencia
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer Unificado WAPPY */}
      <footer className="py-4 text-center text-[11px] text-text-tertiary border-t border-border-medium/40 mt-auto">
        Plataforma Inteligente de Seguridad y Salud en el Trabajo &mdash; Somos SST / WAPPY
      </footer>
    </div>
  );
}
