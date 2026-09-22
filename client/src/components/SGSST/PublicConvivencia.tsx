import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Lock,
  ShieldAlert,
  AlertOctagon,
  CheckCircle,
  FileText,
  Send,
  Loader2,
  HelpCircle,
  Camera,
  X,
  Copy,
  Info,
} from 'lucide-react';
import PublicWorkerHeader from './PublicWorkerHeader';
import useWorkerSession from '~/hooks/useWorkerSession';
import WorkerSessionBadge from './WorkerSessionBadge';

export default function PublicConvivencia() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { worker, isAuthenticated, saveSession, clearSession } = useWorkerSession(companyId);

  const [company, setCompany] = useState<any>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  // Form State
  const [tipoAcoso, setTipoAcoso] = useState<'laboral_ley_1010' | 'sexual_ley_2365'>('laboral_ley_1010');
  const [esAnonimo, setEsAnonimo] = useState(false);
  const [denuncianteNombre, setDenuncianteNombre] = useState('');
  const [denuncianteCedula, setDenuncianteCedula] = useState('');
  const [denuncianteCargo, setDenuncianteCargo] = useState('');
  const [denuncianteContacto, setDenuncianteContacto] = useState('');

  // Auto-fill from worker session
  useEffect(() => {
    if (isAuthenticated && worker && !esAnonimo) {
      if (worker.nombre) setDenuncianteNombre(worker.nombre);
      if (worker.cedula) setDenuncianteCedula(worker.cedula);
      if (worker.cargo) setDenuncianteCargo(worker.cargo);
    }
  }, [isAuthenticated, worker, esAnonimo]);
  
  const [personaReportada, setPersonaReportada] = useState('');
  const [cargoPersonaReportada, setCargoPersonaReportada] = useState('');
  const [descripcionHechos, setDescripcionHechos] = useState('');
  const [fechaHechos, setFechaHechos] = useState('');
  const [lugarHechos, setLugarHechos] = useState('');
  const [testigos, setTestigos] = useState('');
  const [peticionOProteccion, setPeticionOProteccion] = useState('');
  
  const [evidencias, setEvidencias] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; radicado?: string } | null>(null);
  const [copiedRadicado, setCopiedRadicado] = useState(false);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setEvidencias(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personaReportada.trim() || !descripcionHechos.trim()) {
      alert('Por favor indica la persona reportada y describe los hechos sucedidos.');
      return;
    }

    if (!esAnonimo && (!denuncianteNombre.trim() || !denuncianteCedula.trim())) {
      alert('Por favor ingresa tu nombre y cédula, o activa la opción de queja anónima.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        tipoAcoso,
        esAnonimo,
        denuncianteNombre: esAnonimo ? '' : denuncianteNombre.trim(),
        denuncianteCedula: esAnonimo ? '' : denuncianteCedula.trim(),
        denuncianteCargo: esAnonimo ? '' : denuncianteCargo.trim(),
        denuncianteContacto: esAnonimo ? '' : denuncianteContacto.trim(),
        personaReportada: personaReportada.trim(),
        cargoPersonaReportada: cargoPersonaReportada.trim(),
        descripcionHechos: descripcionHechos.trim(),
        fechaHechos,
        lugarHechos: lugarHechos.trim(),
        testigos: testigos.trim(),
        evidencias,
        peticionOProteccion: peticionOProteccion.trim(),
      };

      const res = await axios.post(`/api/public-sgsst/convivencia/${companyId}`, payload);
      setSubmitResult({ success: true, radicado: res.data.radicado });
    } catch (err: any) {
      console.error('Error submitting convivencia record:', err);
      alert(err.response?.data?.error || 'Error al radicar la queja confidencial.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (submitResult?.radicado) {
      navigator.clipboard.writeText(submitResult.radicado);
      setCopiedRadicado(true);
      setTimeout(() => setCopiedRadicado(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-text-primary flex flex-col font-sans transition-colors">
      <PublicWorkerHeader
        companyId={companyId || ''}
        companyName={company?.companyName || 'Somos SST'}
        companyLogo={company?.logoUrl}
        currentModule="convivencia"
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        {/* Pantalla de Éxito / Radicado Confidencial */}
        {submitResult && (
          <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 border border-violet-200 dark:border-violet-800 flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-text-primary">Queja Radicada Confidencialmente</h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-md mx-auto">
                Tu solicitud ha ingresado al canal protegido bajo estrictos protocolos de confidencialidad y no revictimización.
              </p>
            </div>

            {/* Tarjeta de Radicado */}
            <div className="p-4 bg-slate-100 dark:bg-slate-800/60 border border-border-medium rounded-2xl space-y-2">
              <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Número de Radicado Único</p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-xl sm:text-2xl font-black text-violet-600 dark:text-violet-400 tracking-wider">
                  {submitResult.radicado}
                </span>
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="p-1.5 rounded-lg bg-surface-primary hover:bg-surface-hover border border-border-medium text-text-secondary"
                  title="Copiar radicado"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copiedRadicado && <p className="text-[10px] text-emerald-500 font-bold">¡Copiado al portapapeles!</p>}
              <p className="text-[10px] text-text-tertiary">
                Guarda este número para hacer seguimiento del trámite con el equipo encargado.
              </p>
            </div>

            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs text-amber-900 dark:text-amber-200 text-left space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> Garantías Legales:
              </p>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                La legislación colombiana protege a los denunciantes contra represalias o despidos intempestivos. Se activarán las medidas inmediatas de prevención y debido proceso.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/sgsst-public/colaborador/${companyId}`)}
              className="w-full py-3.5 rounded-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md active:scale-95 transition-all"
            >
              Volver al Portal del Colaborador
            </button>
          </div>
        )}

        {/* Formulario */}
        {!submitResult && (
          <div className="bg-surface-primary dark:bg-slate-900 border border-border-medium rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-xs font-black border border-violet-200 dark:border-violet-800 shadow-xs">
                  <Lock className="w-3.5 h-3.5" /> Canal 100% Confidencial y Protegido
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-border-medium">
                  Ley 1010 de 2006 • Ley 2365 de 2024 • Conv. 190 OIT
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-text-primary mt-1">
                Convivencia Laboral & Prevención de Acoso
              </h1>
              <p className="text-xs text-text-secondary mt-1">
                Radicación formal bajo la <strong>Ley 1010 de 2006</strong> (Acoso Laboral) y la <strong>Ley 2365 de 2024</strong> (Acoso Sexual Laboral).
              </p>
            </div>

            {/* Aviso de Confidencialidad y Garantías */}
            <div className="p-4 bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/60 rounded-2xl text-xs text-violet-950 dark:text-violet-200 flex items-start gap-3">
              <Info className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Protocolo de No Revictimización y Reserva</p>
                <p className="text-[11px] text-violet-800 dark:text-violet-300/90 leading-relaxed">
                  Esta queja no será divulgada públicamente. Los casos de presunto acoso sexual laboral cuentan con ruta prioritaria independiente y prohibición expresa de confrontación directa.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Tipo de Queja */}
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wide block mb-2">
                  1. Tipo de Conducta a Reportar
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTipoAcoso('laboral_ley_1010')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      tipoAcoso === 'laboral_ley_1010'
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 ring-2 ring-indigo-500/20'
                        : 'border-border-medium hover:bg-surface-hover text-text-secondary'
                    }`}
                  >
                    <p className="font-bold text-xs">Acoso Laboral (Ley 1010)</p>
                    <p className="text-[10px] text-text-secondary mt-0.5">Maltrato, persecución, discriminación o entorpecimiento persistente.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoAcoso('sexual_ley_2365')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      tipoAcoso === 'sexual_ley_2365'
                        ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500/20'
                        : 'border-border-medium hover:bg-surface-hover text-text-secondary'
                    }`}
                  >
                    <p className="font-bold text-xs text-rose-700 dark:text-rose-400">Acoso Sexual (Ley 2365/2024)</p>
                    <p className="text-[10px] text-text-secondary mt-0.5">Asedio, hostigamiento o conductas lascivas no deseadas (incluso de un solo hecho).</p>
                  </button>
                </div>
              </div>

              {/* Modalidad Anónima o Identificada */}
              <div className="p-3.5 bg-surface-secondary/50 dark:bg-slate-800/40 border border-border-medium rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-text-primary">¿Deseas radicar de forma anónima?</p>
                  <p className="text-[10px] text-text-secondary">Si activas esto, no se solicitará tu nombre ni cédula.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEsAnonimo(!esAnonimo)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${esAnonimo ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${esAnonimo ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Datos del Denunciante si no es anónimo */}
              {!esAnonimo && (
                <div className="space-y-3 pt-2 border-t border-border-medium/60">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wide block">
                    2. Tus Datos de Identificación (Bajo Reserva)
                  </label>
                  {denuncianteNombre && denuncianteCedula && (
                    <WorkerSessionBadge
                      nombre={denuncianteNombre}
                      cedula={denuncianteCedula}
                      cargo={denuncianteCargo}
                      companyName={company?.companyName}
                      onClear={() => {
                        clearSession();
                        setDenuncianteNombre('');
                        setDenuncianteCedula('');
                        setDenuncianteCargo('');
                      }}
                      className="mb-2"
                    />
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-text-secondary">Nombre Completo:</span>
                      <input
                        type="text"
                        value={denuncianteNombre}
                        onChange={e => setDenuncianteNombre(e.target.value)}
                        placeholder="Tu nombre completo"
                        className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-text-secondary">Cédula:</span>
                      <input
                        type="text"
                        value={denuncianteCedula}
                        onChange={e => setDenuncianteCedula(e.target.value)}
                        placeholder="Número de documento"
                        className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-text-secondary">Cargo:</span>
                      <input
                        type="text"
                        value={denuncianteCargo}
                        onChange={e => setDenuncianteCargo(e.target.value)}
                        placeholder="Tu cargo actual"
                        className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-text-secondary">Celular o Correo de Contacto Seguro:</span>
                      <input
                        type="text"
                        value={denuncianteContacto}
                        onChange={e => setDenuncianteContacto(e.target.value)}
                        placeholder="Para notificar avances de forma confidencial"
                        className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Persona Reportada */}
              <div className="space-y-3 pt-2 border-t border-border-medium/60">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wide block">
                  3. Persona Reportada (Presunto Agresor)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary">Nombre de la Persona Reportada:</span>
                    <input
                      type="text"
                      value={personaReportada}
                      onChange={e => setPersonaReportada(e.target.value)}
                      placeholder="Nombre y apellido"
                      required
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary">Cargo o Relación Laboral:</span>
                    <input
                      type="text"
                      value={cargoPersonaReportada}
                      onChange={e => setCargoPersonaReportada(e.target.value)}
                      placeholder="Ej: Supervisor, Jefe Directo, Compañero"
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Hechos y Circunstancias */}
              <div className="space-y-3 pt-2 border-t border-border-medium/60">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wide block">
                  4. Relato Cronológico de los Hechos
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary">Fecha aproximada:</span>
                    <input
                      type="date"
                      value={fechaHechos}
                      onChange={e => setFechaHechos(e.target.value)}
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-text-secondary">Lugar donde ocurrió:</span>
                    <input
                      type="text"
                      value={lugarHechos}
                      onChange={e => setLugarHechos(e.target.value)}
                      placeholder="Ej: Oficina 3, Pasillo, Vía pública"
                      className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-text-secondary">Descripción Detallada de los Hechos:</span>
                  <textarea
                    rows={4}
                    value={descripcionHechos}
                    onChange={e => setDescripcionHechos(e.target.value)}
                    placeholder="Describe claramente lo ocurrido, palabras expresadas, conductas observadas o actitudes manifestadas..."
                    required
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-text-secondary">Testigos (si aplica):</span>
                  <input
                    type="text"
                    value={testigos}
                    onChange={e => setTestigos(e.target.value)}
                    placeholder="Nombres de personas que presenciaron los hechos..."
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-text-secondary">Petición o Medida Cautelar Solicitada:</span>
                  <input
                    type="text"
                    value={peticionOProteccion}
                    onChange={e => setPeticionOProteccion(e.target.value)}
                    placeholder="Ej: Cambio de turno, reubicación de puesto, cese inmediato de hostigamiento"
                    className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-border-medium bg-surface-secondary/40 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Adjuntar Evidencias */}
              <div className="space-y-2 pt-2 border-t border-border-medium/60">
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wide flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-teal-600" /> 5. Adjuntar Evidencias (Fotos, Capturas de Chat, Correos)
                </label>

                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="w-full text-xs file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 dark:file:bg-teal-950/40 dark:file:text-teal-300"
                />

                {evidencias.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {evidencias.map((ev, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-border-medium w-16 h-16 bg-white">
                        <img src={ev} alt={`Evidencia ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEvidencias(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-0.5 bg-black/60 text-white rounded-full hover:bg-rose-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón de Envío */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Radicando de Forma Confidencial...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" /> Radicar Queja Formal y Confidencial
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
