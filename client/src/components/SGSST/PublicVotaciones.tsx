import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Vote,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Award,
  Sparkles,
  ArrowRight,
  Shield,
  UserCheck,
  Building2,
  Calendar,
  HeartHandshake,
} from 'lucide-react';
import PublicWorkerHeader from './PublicWorkerHeader';
import useWorkerSession from '~/hooks/useWorkerSession';
import WorkerSessionBadge from './WorkerSessionBadge';

export default function PublicVotaciones() {
  const { companyId } = useParams<{ companyId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { worker, isAuthenticated, saveSession } = useWorkerSession(companyId);

  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [elecciones, setElecciones] = useState<any[]>([]);
  const [selectedEleccionId, setSelectedEleccionId] = useState<string>('');
  const [selectedCandidatoId, setSelectedCandidatoId] = useState<string>('');

  // Identificación del votante (solo para el padrón, nunca se guarda con el voto)
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [yaVoto, setYaVoto] = useState(false);
  const [checkingVoto, setCheckingVoto] = useState(false);

  // Modal Confirmación y Estado
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);

  // Auto-fill worker details from session
  useEffect(() => {
    if (isAuthenticated && worker) {
      if (worker.cedula) setCedula(worker.cedula);
      if (worker.nombre) setNombre(worker.nombre);
    }
  }, [isAuthenticated, worker]);

  // Cargar datos de la empresa y elecciones activas
  useEffect(() => {
    const fetchElecciones = async () => {
      if (!companyId) return;
      setLoading(true);
      try {
        const [resComp, resElec] = await Promise.all([
          axios.get(`/api/public-sgsst/company/${companyId}`),
          axios.get(`/api/public-sgsst/elecciones/${companyId}`),
        ]);

        setCompany(resComp.data);
        const activas = resElec.data.elecciones || [];
        setElecciones(activas);

        // Preseleccionar si viene por URL o tomar la primera
        const targetEleccionId = searchParams.get('eleccionId');
        if (targetEleccionId && activas.some((e: any) => e._id === targetEleccionId)) {
          setSelectedEleccionId(targetEleccionId);
        } else if (activas.length > 0) {
          setSelectedEleccionId(activas[0]._id);
        }
      } catch (err) {
        console.error('Error fetching elecciones:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchElecciones();
  }, [companyId, searchParams]);

  // Verificar si la cédula ya votó en la elección seleccionada
  useEffect(() => {
    const checkEstadoVoto = async () => {
      const cleanCedula = cedula.trim();
      if (!companyId || !selectedEleccionId || !cleanCedula) {
        setYaVoto(false);
        return;
      }

      setCheckingVoto(true);
      try {
        const res = await axios.get(
          `/api/public-sgsst/estado-voto/${companyId}/${selectedEleccionId}/${cleanCedula}`
        );
        setYaVoto(res.data.yaVoto);
      } catch (err) {
        console.error('Error checking estado voto:', err);
      } finally {
        setCheckingVoto(false);
      }
    };

    const timer = setTimeout(checkEstadoVoto, 400);
    return () => clearTimeout(timer);
  }, [companyId, selectedEleccionId, cedula]);

  const activeEleccion = elecciones.find((e) => e._id === selectedEleccionId);

  const handleEmitirVoto = async () => {
    if (!cedula.trim()) {
      alert('Por favor ingresa tu número de cédula para validar tu inclusión en el padrón electoral.');
      return;
    }
    if (!selectedCandidatoId) {
      alert('Por favor selecciona un candidato o la opción de Voto en Blanco.');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`/api/public-sgsst/votar/${companyId}`, {
        eleccionId: selectedEleccionId,
        trabajadorCedula: cedula.trim(),
        trabajadorNombre: nombre.trim(),
        candidatoId: selectedCandidatoId,
        tipoComite: activeEleccion?.tipoComite,
      });

      setShowConfirmModal(false);
      setVoteSuccess(true);
      setYaVoto(true);

      // Persistir sesión si aplica
      saveSession({
        companyId,
        companyName: company?.companyName,
        nombre: nombre.trim(),
        cedula: cedula.trim(),
      });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al registrar tu voto secreto.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCandidateName = (candId: string) => {
    if (candId === 'voto_en_blanco') return 'Voto en Blanco';
    const found = activeEleccion?.candidatos?.find((c: any) => c.id === candId);
    return found ? found.nombre : 'Candidato Seleccionado';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-zinc-100 flex flex-col font-sans transition-colors">
      <PublicWorkerHeader 
        companyId={companyId || ''} 
        companyName={company?.companyName}
        companyLogo={company?.logo}
        currentModule="votaciones"
        title="Elecciones Paritarias SST"
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        <WorkerSessionBadge companyId={companyId || ''} />

        {/* ═══ Encabezado de Democracia Paritaria ═══ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 p-6 sm:p-8 text-white shadow-xl">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <Vote className="w-8 h-8 text-white" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-white/20 backdrop-blur-md mb-2">
                  <Lock className="w-3.5 h-3.5" /> Voto 100% Secreto y Anónimo
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Elecciones Paritarias Digitales
                </h1>
                <p className="text-xs sm:text-sm text-teal-100 mt-1 max-w-xl">
                  Garantía constitucional y reglamentaria de sufragio libre, directo y secreto para representantes de los trabajadores ante el COPASST y Convivencia.
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl text-center self-stretch sm:self-auto">
              <span className="text-[10px] uppercase font-bold text-teal-200 tracking-wider block">Gamificación SST</span>
              <span className="text-lg font-black text-amber-300 flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4" /> +20 pts
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
            <p className="text-sm font-bold">Cargando urnas digitales...</p>
          </div>
        ) : elecciones.length === 0 ? (
          <div className="p-12 rounded-3xl border border-dashed border-slate-300 dark:border-zinc-800 text-center space-y-3 bg-white dark:bg-zinc-900 shadow-sm">
            <Vote className="w-12 h-12 text-slate-300 dark:text-zinc-700 mx-auto" />
            <h3 className="text-base font-bold text-slate-700 dark:text-zinc-200">
              No hay procesos electorales abiertos en este momento
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Tu empresa no tiene elecciones de COPASST o Convivencia activas. Cuando se aperture una convocatoria, podrás votar aquí de manera confidencial.
            </p>
            <button
              onClick={() => navigate(`/sgsst-public/colaborador/${companyId}`)}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100"
            >
              Volver al Portal del Colaborador
            </button>
          </div>
        ) : voteSuccess ? (
          /* ═══ PANTALLA DE ÉXITO ═══ */
          <div className="p-8 sm:p-10 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 text-center space-y-4 shadow-md">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-zinc-100">
              ¡Tu Voto Ha Sido Registrado Exitosamente!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-lg mx-auto">
              Tu participación democrática ha sido acreditada en el padrón electoral, y tu preferencia fue depositada en la urna digital de forma <strong>estrictamente anónima y secreta</strong>, imposible de vincular con tu identidad.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-500" /> ¡Has sumado +20 puntos en tu perfil biocéntrico de prevención!
            </div>
            <div className="pt-4">
              <button
                onClick={() => navigate(`/sgsst-public/colaborador/${companyId}`)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md active:scale-95"
              >
                Volver a mi Panel <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* ═══ FORMULARIO DE SUFRAGIO SECRETO ═══ */
          <div className="space-y-6">
            {/* Selector de Elección si hay más de una */}
            {elecciones.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {elecciones.map((e) => (
                  <button
                    key={e._id}
                    onClick={() => {
                      setSelectedEleccionId(e._id);
                      setSelectedCandidatoId('');
                    }}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all shrink-0 ${
                      selectedEleccionId === e._id
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-600 dark:text-teal-300 shadow-sm'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600'
                    }`}
                  >
                    {e.titulo}
                  </button>
                ))}
              </div>
            )}

            {/* Identificación del Colaborador (Padrón Electoral) */}
            <div className="p-5 rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                    1. Verificación en el Padrón Electoral
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    La cédula solo se utiliza para validar que estés habilitado y evitar doble sufragio. Jamás se asocia a tu voto.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">
                    Número de Cédula de Ciudadanía *
                  </label>
                  <input
                    type="text"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="Ej. 1020304050"
                    disabled={yaVoto}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-zinc-400 block mb-1">
                    Nombre Completo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre..."
                    disabled={yaVoto}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-xs font-semibold"
                  />
                </div>
              </div>

              {checkingVoto ? (
                <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" /> Validando habilitación electoral...
                </div>
              ) : yaVoto ? (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  Ya has emitido tu voto secreto en esta elección. ¡Gracias por participar!
                </div>
              ) : null}
            </div>

            {/* Tarjetón Electoral */}
            {!yaVoto && activeEleccion && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                    <Vote className="w-4 h-4 text-teal-600" />
                    2. Tarjetón Electoral — Selecciona una opción:
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    {activeEleccion.candidatos?.length || 0} Candidatos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Candidatos */}
                  {(activeEleccion.candidatos || []).map((cand: any) => {
                    const isSelected = selectedCandidatoId === cand.id;

                    return (
                      <div
                        key={cand.id}
                        onClick={() => setSelectedCandidatoId(cand.id)}
                        className={`p-4 rounded-3xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 shadow-md ring-2 ring-teal-500/20'
                            : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-sm">
                            {cand.nombre.charAt(0)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black text-slate-800 dark:text-zinc-100 truncate">
                              {cand.nombre}
                            </h4>
                            <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 truncate">
                              {cand.cargo}
                            </p>
                            {cand.propuesta && (
                              <p className="text-xs text-slate-600 dark:text-zinc-300 mt-2 italic line-clamp-2">
                                &ldquo;{cand.propuesta}&rdquo;
                              </p>
                            )}
                          </div>

                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Opción Obligatoria: Voto en Blanco */}
                  <div
                    onClick={() => setSelectedCandidatoId('voto_en_blanco')}
                    className={`p-4 rounded-3xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      selectedCandidatoId === 'voto_en_blanco'
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/30 shadow-md ring-2 ring-teal-500/20'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 font-black text-sm flex items-center justify-center shrink-0">
                        V.B.
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-slate-800 dark:text-zinc-100">
                          Voto en Blanco
                        </h4>
                        <p className="text-xs text-slate-500">
                          Opción legal de disconformidad o neutralidad electoral
                        </p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedCandidatoId === 'voto_en_blanco' ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300'
                      }`}>
                        {selectedCandidatoId === 'voto_en_blanco' && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón de Enviar Voto */}
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => {
                      if (!cedula.trim()) {
                        alert('Ingresa tu cédula primero para verificar tu habilitación.');
                        return;
                      }
                      if (!selectedCandidatoId) {
                        alert('Selecciona una opción del tarjetón electoral.');
                        return;
                      }
                      setShowConfirmModal(true);
                    }}
                    disabled={!selectedCandidatoId || !cedula.trim()}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs shadow-lg transition-all active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    Depositar Voto Secreto en la Urna
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══ MODAL DE CONFIRMACIÓN ═══ */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mx-auto">
              <Vote className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-slate-800 dark:text-zinc-100">
              ¿Confirmar Emisión de Voto Secreto?
            </h3>

            <p className="text-xs text-slate-600 dark:text-zinc-300">
              Estás a punto de emitir tu voto por:
            </p>

            <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-500/30 text-sm font-black text-teal-700 dark:text-teal-300">
              {getCandidateName(selectedCandidatoId)}
            </div>

            <p className="text-[11px] text-slate-400">
              Una vez depositado en la urna digital, tu voto se desacopla de tu cédula para garantizar la reserva constitucional del sufragio. No podrá ser revocado ni modificado.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleEmitirVoto}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md active:scale-95 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirmar y Votar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
