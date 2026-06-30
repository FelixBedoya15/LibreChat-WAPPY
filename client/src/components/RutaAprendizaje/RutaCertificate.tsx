import React from 'react';
import { Award, ShieldCheck, Printer, Calendar, Landmark, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface RutaCertificateProps {
    course: any;
    worker: {
        nombre: string;
        cedula: string;
        cargo?: string;
        signature?: string | null;
    };
    company: {
        companyName: string;
        nit: string;
        logo: string | null;
        legalRepresentative?: string;
    };
    onClose?: () => void;
}

export default function RutaCertificate({ course, worker, company, onClose }: RutaCertificateProps) {
    const today = new Date();
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const formattedDate = `${today.getDate()} de ${months[today.getMonth()]} de ${today.getFullYear()}`;
    const verificationUrl = `${window.location.protocol}//${window.location.host}/sgsst-public/ruta-aprendizaje/${company.nit || 'verificar'}`;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-start overflow-y-auto bg-slate-900/95 p-4 sm:p-6 md:p-10 no-print">
            
            {/* Header controls (Hidden during print) */}
            <div className="w-full max-w-5xl flex items-center justify-between gap-4 mb-6 text-white no-print">
                <div className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-emerald-400" />
                    <div>
                        <h2 className="font-extrabold text-lg sm:text-xl">Certificado Generado</h2>
                        <p className="text-xs text-slate-400">Listo para imprimir o guardar como PDF en orientación horizontal</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-900/20"
                    >
                        <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-sm transition-all"
                        >
                            Cerrar Vista
                        </button>
                    )}
                </div>
            </div>

            {/* Certificate Canvas - Landscape A4 aspect ratio representation */}
            <div 
                id="certificate-to-print"
                className="w-full max-w-5xl aspect-[1.414/1] bg-white border-[16px] border-double border-slate-800 p-8 sm:p-12 md:p-16 flex flex-col justify-between relative shadow-2xl text-slate-800 overflow-hidden select-none"
                style={{ minHeight: '580px' }}
            >
                {/* Background Watermark/Aesthetic elements */}
                <div className="absolute inset-0 bg-[radial-gradient(#0f172a_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-[0.02] pointer-events-none" />
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Top: Logo & Title */}
                <div className="flex items-start justify-between gap-6">
                    <div className="space-y-1">
                        <span className="text-[10px] sm:text-xs font-black tracking-widest text-emerald-600 uppercase">Certificación Oficial</span>
                        <h3 className="font-extrabold text-xl sm:text-2xl md:text-3xl text-slate-800 tracking-tight">SOMOS SGSST</h3>
                    </div>
                    {company.logo ? (
                        <img 
                            src={company.logo} 
                            alt={company.companyName} 
                            className="h-12 sm:h-16 md:h-20 object-contain max-w-[180px]" 
                        />
                    ) : (
                        <div className="h-12 sm:h-16 flex items-center justify-center px-4 py-2 border border-dashed border-slate-300 rounded text-slate-400 font-bold text-xs uppercase">
                            {company.companyName}
                        </div>
                    )}
                </div>

                {/* Center: Award Text */}
                <div className="my-6 text-center space-y-3 sm:space-y-4 md:space-y-6">
                    <span className="text-xs sm:text-sm md:text-base font-medium tracking-[0.2em] text-slate-500 uppercase block">
                        Se otorga la presente constancia de asistencia y aprobación a:
                    </span>
                    
                    <h1 className="font-extrabold text-2xl sm:text-4xl md:text-5xl text-slate-900 tracking-tight font-serif capitalize">
                        {worker.nombre}
                    </h1>

                    <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        Identificado(a) con Cédula de Ciudadanía N° <strong className="text-slate-800 font-extrabold">{worker.cedula}</strong>, por haber completado satisfactoriamente el programa de entrenamiento de seguridad y salud en el trabajo en:
                    </p>

                    <h2 className="font-black text-xl sm:text-2xl md:text-3xl text-emerald-700 tracking-tight leading-tight uppercase py-2 border-y border-slate-100 max-w-2xl mx-auto">
                        {course.title}
                    </h2>
                </div>

                {/* Bottom: Signatures and Metadata */}
                <div className="flex flex-col sm:flex-row items-end justify-between gap-6 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4 text-left">
                        <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                            <QRCodeSVG 
                                value={verificationUrl}
                                size={64}
                                bgColor={"#ffffff"}
                                fgColor={"#0f172a"}
                                level={"L"}
                            />
                        </div>
                        <div className="text-slate-500 text-[10px] sm:text-xs">
                            <div className="flex items-center gap-1 font-semibold text-slate-700">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                Certificado Verificado
                            </div>
                            <p className="mt-0.5 font-mono">ID: {course._id.substring(0, 8)}-{worker.cedula.substring(0, 4)}</p>
                            <p className="mt-0.5">Empresa: {company.companyName}</p>
                            <p>NIT: {company.nit}</p>
                        </div>
                    </div>

                    {/* Legal Representative Signature */}
                    <div className="text-center w-48 sm:w-56">
                        <div className="h-10 sm:h-12 flex items-end justify-center pb-1 relative">
                            {/* Decorative line mimicking signature */}
                            <span className="font-serif italic text-base sm:text-lg text-slate-400 absolute bottom-2 select-none">
                                {company.legalRepresentative || 'Representante Legal'}
                            </span>
                            <div className="w-full h-px bg-slate-400" />
                        </div>
                        <div className="mt-1.5 text-[10px] sm:text-xs text-slate-500 font-semibold tracking-wider uppercase">
                            {company.legalRepresentative || 'Firma Autorizada'}
                            <span className="block font-normal text-[9px] sm:text-[10px] text-slate-400 lowercase tracking-normal">Representante Legal</span>
                        </div>
                    </div>

                    {/* Worker Signature */}
                    <div className="text-center w-48 sm:w-56">
                        <div className="h-10 sm:h-12 flex items-end justify-center pb-1 relative">
                            {worker.signature ? (
                                <img src={worker.signature} alt="Firma Trabajador" className="max-h-10 sm:max-h-12 object-contain" />
                            ) : (
                                <span className="font-serif italic text-base sm:text-lg text-slate-400 absolute bottom-2 select-none">
                                    Firma del Trabajador
                                </span>
                            )}
                            <div className="w-full h-px bg-slate-400" />
                        </div>
                        <div className="mt-1.5 text-[10px] sm:text-xs text-slate-500 font-semibold tracking-wider uppercase truncate">
                            {worker.nombre}
                            <span className="block font-normal text-[9px] sm:text-[10px] text-slate-400 lowercase tracking-normal">Trabajador</span>
                        </div>
                    </div>

                    <div className="text-right text-[10px] sm:text-xs text-slate-500">
                        <div className="flex items-center justify-end gap-1.5 font-bold text-slate-700 mb-0.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            Fecha de Expedición
                        </div>
                        <p>{formattedDate}</p>
                        <div className="flex items-center justify-end gap-1.5 font-bold text-slate-700 mt-2 mb-0.5">
                            <Landmark className="w-3.5 h-3.5 text-emerald-600" />
                            Validez Nacional
                        </div>
                        <p>Resolución 0312 de 2019</p>
                    </div>
                </div>
            </div>

            {/* Print Media CSS */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    /* Hide everything else in the body */
                    body * {
                        visibility: hidden !important;
                    }
                    .no-print {
                        display: none !important;
                        visibility: hidden !important;
                    }
                    /* Show certificate canvas only */
                    #certificate-to-print, #certificate-to-print * {
                        visibility: visible !important;
                    }
                    #certificate-to-print {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 297mm !important;
                        height: 210mm !important;
                        margin: 0 !important;
                        border: 16px double #1e293b !important;
                        padding: 20mm !important;
                        box-shadow: none !important;
                        page-break-inside: avoid !important;
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    /* Force landscape mode */
                    @page {
                        size: A4 landscape;
                        margin: 0;
                    }
                }
            ` }} />
        </div>
    );
}
