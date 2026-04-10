import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X, Building2, Save, User, MapPin, Phone, Mail,
    Briefcase, Shield, Hash, FileText, Users, Activity,
    Award, Calendar, UserCheck, Image as ImageIcon
} from 'lucide-react';

import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { cn } from '~/utils';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import SignaturePad from './SignaturePad';
import { PenTool } from 'lucide-react';
import SingleSelect from './SingleSelect';

interface CompanyInfoData {
    companyName: string;
    nit: string;
    legalRepresentative: string;
    workerCount: number;
    arl: string;
    economicActivity: string;
    riskLevel: string;
    ciiu: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    generalActivities: string;
    sector: string;
    responsibleSST: string;
    responsibleSSTPhone: string;
    formationLevel: string;
    licenseNumber: string;
    courseStatus: string;
    licenseExpiry: string;
    legalRepSignature: string | null;
    legalRepConsent: string;
    sstRespSignature: string | null;
    sstRespConsent: string;
}


const INITIAL_DATA: CompanyInfoData = {
    companyName: '',
    nit: '',
    legalRepresentative: '',
    workerCount: 0,
    arl: '',
    economicActivity: '',
    riskLevel: '',
    ciiu: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    generalActivities: '',
    sector: '',
    responsibleSST: '',
    responsibleSSTPhone: '',
    formationLevel: '',
    licenseNumber: '',
    courseStatus: '',
    licenseExpiry: '',
    legalRepSignature: null,
    legalRepConsent: 'No',
    sstRespSignature: null,
    sstRespConsent: 'No',
};


const ARL_OPTIONS = [
    'Sura', 'Positiva', 'Colmena', 'Bolívar', 'Alfa',
    'Aurora', 'Colpatria', 'Liberty', 'Mapfre', 'Otra',
];

const RISK_LEVELS = ['I', 'II', 'III', 'IV', 'V'];

const SECTOR_OPTIONS = [
    'Agricultura', 'Comercio', 'Construcción', 'Educación', 'Financiero',
    'Industrial', 'Minería', 'Salud', 'Servicios', 'Tecnología',
    'Transporte', 'Otro',
];

interface CompanyInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CompanyInfoModal: React.FC<CompanyInfoModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { token } = useAuthContext();
    const { showToast } = useToastContext();
    const [data, setData] = useState<CompanyInfoData>(INITIAL_DATA);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeSignatureField, setActiveSignatureField] = useState<'legalRepSignature' | 'sstRespSignature' | null>(null);

    // Load data on open
    useEffect(() => {
        if (!isOpen || !token) return;
        setLoading(true);
        fetch('/api/sgsst/company-info', {
            headers: { 'Authorization': `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(info => {
                if (info && info.companyName !== undefined) {
                    setData(prev => ({ ...prev, ...info }));

                    // Sync loaded signatures to localStorage for LiveEditor auto-injector
                    try {
                        const namedSigsStr = localStorage.getItem('wappy_signatures');
                        const namedSignatures: Record<string, string> = namedSigsStr ? JSON.parse(namedSigsStr) : {};
                        let updated = false;

                        if (info.legalRepConsent === 'Sí' && info.legalRepSignature && info.legalRepresentative) {
                            namedSignatures[info.legalRepresentative.trim().toUpperCase()] = info.legalRepSignature;
                            updated = true;
                        }
                        if (info.sstRespConsent === 'Sí' && info.sstRespSignature && info.responsibleSST) {
                            namedSignatures[info.responsibleSST.trim().toUpperCase()] = info.sstRespSignature;
                            updated = true;
                        }

                        if (updated) {
                            localStorage.setItem('wappy_signatures', JSON.stringify(namedSignatures));
                            // Dispatch event if we want LiveEditor to know immediately
                            window.dispatchEvent(new Event('storage'));
                        }
                    } catch (err) {
                        console.error('Error syncing signatures to local storage:', err);
                    }
                }
            })
            .catch(err => console.error('Error loading company info:', err))
            .finally(() => setLoading(false));
    }, [isOpen, token]);

    const handleChange = useCallback((field: keyof CompanyInfoData, value: string | number | null) => {
        setData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleFirmaUpload = useCallback((field: 'legalRepSignature' | 'sstRespSignature', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
                handleChange(field, readerEvent.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    }, [handleChange]);

    const handleSave = useCallback(async () => {
        if (!token) return;
        setSaving(true);
        try {
            // First sync to localStorage for the AI editor
            try {
                const namedSigsStr = localStorage.getItem('wappy_signatures');
                const namedSignatures: Record<string, string> = namedSigsStr ? JSON.parse(namedSigsStr) : {};
                let updated = false;

                if (data.legalRepConsent === 'Sí' && data.legalRepSignature && data.legalRepresentative) {
                    namedSignatures[data.legalRepresentative.trim().toUpperCase()] = data.legalRepSignature;
                    updated = true;
                }
                if (data.sstRespConsent === 'Sí' && data.sstRespSignature && data.responsibleSST) {
                    namedSignatures[data.responsibleSST.trim().toUpperCase()] = data.sstRespSignature;
                    updated = true;
                }

                if (updated) {
                    localStorage.setItem('wappy_signatures', JSON.stringify(namedSignatures));
                    window.dispatchEvent(new Event('storage'));
                }
            } catch (e) { }

            const res = await fetch('/api/sgsst/company-info', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                showToast({ message: 'Información de la empresa guardada', status: 'success' });
                onClose();
            } else {
                showToast({ message: 'Error al guardar', status: 'error' });
            }
        } catch (err) {
            showToast({ message: 'Error de red al guardar', status: 'error' });
        } finally {
            setSaving(false);
        }
    }, [data, token, showToast, onClose]);

    if (!isOpen) return null;

    const REQUIRED_FIELDS = [
        'companyName', 'nit', 'legalRepresentative', 'workerCount',
        'arl', 'economicActivity', 'riskLevel', 'ciiu',
        'address', 'city', 'phone', 'email',
        'sector', 'responsibleSST', 'responsibleSSTPhone', 'generalActivities',
        'formationLevel', 'licenseNumber', 'courseStatus', 'licenseExpiry',
    ] as const;

    const isFormValid = REQUIRED_FIELDS.every(field => {
        const val = data[field as keyof CompanyInfoData];
        if (typeof val === 'string') {
            const t = val.trim();
            return t !== '' && t !== 'N/A' && t !== 'No registrado';
        }
        return val !== undefined && val !== null && val !== 0 && !isNaN(val as number);
    });


    const inputClass = 'w-full rounded-xl border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500';
    const labelClass = 'mb-1 flex items-center gap-1.5 text-xs font-medium text-text-secondary after:content-["*"] after:ml-0.5 after:text-red-500';
    const selectClass = cn(inputClass, 'appearance-none cursor-pointer');

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border-medium bg-surface-secondary shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border-medium px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-teal-500/10 p-2">
                            <Building2 className="h-5 w-5 text-teal-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">{t('com_ui_company_info_title', 'Información de la Empresa')}</h2>
                            <p className="text-xs text-text-secondary">{t('com_ui_company_info_desc', 'Estos datos se usarán en todos los informes generados por IA')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-xl p-1.5 text-text-secondary hover:bg-surface-hover">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading ? (
                        <div className="flex h-32 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* General Info */}
                            <div>
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
                                    <Building2 className="h-4 w-4" /> {t('com_ui_company_data_general', 'Datos Generales')}
                                </h3>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <label className={labelClass}><Building2 className="h-3 w-3" />{t('com_ui_company_name', 'Razón Social')}</label>
                                        <input className={inputClass} value={data.companyName} onChange={e => handleChange('companyName', e.target.value)} placeholder={t('com_ui_company_name_placeholder', 'Nombre de la empresa')} />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Hash className="h-3 w-3" />NIT</label>
                                        <input className={inputClass} value={data.nit} onChange={e => handleChange('nit', e.target.value)} placeholder="123456789-0" />
                                    </div>
                                    <div>
                                        <label className={labelClass}><User className="h-3 w-3" />{t('com_ui_company_legal_rep', 'Representante Legal')}</label>
                                        <input className={inputClass} value={data.legalRepresentative} onChange={e => handleChange('legalRepresentative', e.target.value)} placeholder={t('com_ui_company_legal_rep_placeholder', 'Nombre completo')} />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Users className="h-3 w-3" />{t('com_ui_company_workers', 'Número de Trabajadores')}</label>
                                        <input className={inputClass} type="number" min="0" value={data.workerCount || ''} onChange={e => handleChange('workerCount', parseInt(e.target.value) || 0)} placeholder="0" />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Briefcase className="h-3 w-3" />{t('com_ui_company_sector', 'Sector')}</label>
                                        <SingleSelect value={data.sector} onChange={val => handleChange('sector', val)} placeholder={t('com_ui_select_sector', 'Seleccionar sector')} options={SECTOR_OPTIONS} />
                                    </div>
                                </div>
                            </div>

                            {/* SST Info */}
                            <div>
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
                                    <Shield className="h-4 w-4" /> {t('com_ui_company_sst_info', 'Información SST')}
                                </h3>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div>
                                        <label className={labelClass}><Shield className="h-3 w-3" />ARL</label>
                                        <SingleSelect value={data.arl} onChange={val => handleChange('arl', val)} placeholder={t('com_ui_select_arl', 'Seleccionar ARL')} options={ARL_OPTIONS} />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Activity className="h-3 w-3" />{t('com_ui_risk_level', 'Nivel de Riesgo')}</label>
                                        <SingleSelect value={data.riskLevel} onChange={val => handleChange('riskLevel', val)} placeholder={t('com_ui_select_level', 'Seleccionar nivel')} options={RISK_LEVELS} />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Briefcase className="h-3 w-3" />{t('com_ui_economic_activity', 'Actividad Económica')}</label>
                                        <input className={inputClass} value={data.economicActivity} onChange={e => handleChange('economicActivity', e.target.value)} placeholder={t('com_ui_economic_activity_placeholder', 'Descripción de la actividad')} />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Hash className="h-3 w-3" />Código CIIU</label>
                                        <input className={inputClass} value={data.ciiu} onChange={e => handleChange('ciiu', e.target.value)} placeholder="Ej: 4711" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}><UserCheck className="h-3 w-3" />{t('com_ui_sst_responsible', 'Responsable del SG-SST')}</label>
                                        <input className={inputClass} value={data.responsibleSST} onChange={e => handleChange('responsibleSST', e.target.value)} placeholder={t('com_ui_sst_responsible_placeholder', 'Nombre del responsable')} />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Phone className="h-3 w-3" />{t('com_ui_sst_responsible_phone', 'Contacto del Responsable')}</label>
                                        <input className={inputClass} value={data.responsibleSSTPhone} onChange={e => handleChange('responsibleSSTPhone', e.target.value)} placeholder="+57 300 000 0000" />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Briefcase className="h-3 w-3" />Nivel de Formación</label>
                                        <input className={inputClass} value={data.formationLevel} onChange={e => handleChange('formationLevel', e.target.value)} placeholder="Técnico, Tecnólogo, Profesional, Especialista" />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Award className="h-3 w-3" />Número de Licencia SST</label>
                                        <input className={inputClass} value={data.licenseNumber} onChange={e => handleChange('licenseNumber', e.target.value)} placeholder="Ej: 1234 de 2024" />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Calendar className="h-3 w-3" />Vigencia de Licencia</label>
                                        <input type="date" className={inputClass} value={data.licenseExpiry} onChange={e => handleChange('licenseExpiry', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className={labelClass}><FileText className="h-3 w-3" />Curso 50H / Actualización 20H</label>
                                        <input type="date" className={inputClass} value={data.courseStatus} onChange={e => handleChange('courseStatus', e.target.value)} />
                                    </div>

                                </div>
                            </div>

                            {/* Firmas y Consentimiento */}
                            <div>
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
                                    <UserCheck className="h-4 w-4" /> Firmas Digitales y Consentimiento
                                </h3>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {/* Legal Representative */}
                                    <div className="rounded-xl border border-border-medium bg-surface-primary p-4">
                                        <h4 className="font-semibold text-sm mb-3">Firma Representante Legal</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase leading-tight">Consentimiento Informado para uso de Firma Digital</label>
                                                <SingleSelect value={data.legalRepConsent || 'No'} onChange={val => handleChange('legalRepConsent', val)} placeholder="Seleccione..." options={['Sí', 'No']} />
                                                <p className="text-[10px] text-text-secondary mt-1">Habilita el uso automático de la firma en los informes generados.</p>
                                            </div>
                                            <div className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-border-medium rounded-xl relative hover:bg-surface-secondary/50 transition-colors">
                                                {data.legalRepSignature ? (
                                                    <div className="relative group w-full flex items-center justify-center">
                                                        <img src={data.legalRepSignature} alt="Firma Representante Legal" className="max-h-16 object-contain" />
                                                        <button
                                                            onClick={() => handleChange('legalRepSignature', null)}
                                                            className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/2 -translate-y-1/2"
                                                        >
                                                            <AnimatedIcon name="trash" size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-2 w-full">
                                                        <label className="cursor-pointer text-center flex items-center justify-center gap-2 px-3 py-2 bg-surface-hover hover:bg-surface-tertiary rounded-lg text-text-secondary w-full transition-colors font-medium border border-border-light">
                                                            <ImageIcon size={16} className="text-indigo-400" />
                                                            <span className="text-xs uppercase">Cargar Archivo</span>
                                                            <input type="file" accept="image/*" onChange={(e) => handleFirmaUpload('legalRepSignature', e)} className="hidden" />
                                                        </label>
                                                        <button 
                                                            onClick={() => setActiveSignatureField('legalRepSignature')}
                                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg w-full transition-colors font-medium border border-indigo-200 dark:border-indigo-800"
                                                        >
                                                            <PenTool size={16} />
                                                            <span className="text-xs uppercase">Dibujar en Pantalla</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* SST Responsible */}
                                    <div className="rounded-xl border border-border-medium bg-surface-primary p-4">
                                        <h4 className="font-semibold text-sm mb-3">Firma Responsable SG-SST</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase leading-tight">Consentimiento Informado para uso de Firma Digital</label>
                                                <SingleSelect value={data.sstRespConsent || 'No'} onChange={val => handleChange('sstRespConsent', val)} placeholder="Seleccione..." options={['Sí', 'No']} />
                                                <p className="text-[10px] text-text-secondary mt-1">Habilita el uso automático de la firma en los informes generados.</p>
                                            </div>
                                            <div className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-border-medium rounded-xl relative hover:bg-surface-secondary/50 transition-colors">
                                                {data.sstRespSignature ? (
                                                    <div className="relative group w-full flex items-center justify-center">
                                                        <img src={data.sstRespSignature} alt="Firma Responsable SG-SST" className="max-h-16 object-contain" />
                                                        <button
                                                            onClick={() => handleChange('sstRespSignature', null)}
                                                            className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/2 -translate-y-1/2"
                                                        >
                                                            <AnimatedIcon name="trash" size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-2 w-full">
                                                        <label className="cursor-pointer text-center flex items-center justify-center gap-2 px-3 py-2 bg-surface-hover hover:bg-surface-tertiary rounded-lg text-text-secondary w-full transition-colors font-medium border border-border-light">
                                                            <ImageIcon size={16} className="text-indigo-400" />
                                                            <span className="text-xs uppercase">Cargar Archivo</span>
                                                            <input type="file" accept="image/*" onChange={(e) => handleFirmaUpload('sstRespSignature', e)} className="hidden" />
                                                        </label>
                                                        <button 
                                                            onClick={() => setActiveSignatureField('sstRespSignature')}
                                                            className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg w-full transition-colors font-medium border border-indigo-200 dark:border-indigo-800"
                                                        >
                                                            <PenTool size={16} />
                                                            <span className="text-xs uppercase">Dibujar en Pantalla</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div>
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
                                    <MapPin className="h-4 w-4" /> {t('com_ui_contact_location', 'Contacto y Ubicación')}
                                </h3>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                    <div>
                                        <label className={labelClass}><MapPin className="h-3 w-3" />{t('com_ui_address', 'Dirección')}</label>
                                        <input className={inputClass} value={data.address} onChange={e => handleChange('address', e.target.value)} placeholder={t('com_ui_address_placeholder', 'Dirección de la empresa')} />
                                    </div>
                                    <div>
                                        <label className={labelClass}><MapPin className="h-3 w-3" />{t('com_ui_city', 'Ciudad')}</label>
                                        <input className={inputClass} value={data.city} onChange={e => handleChange('city', e.target.value)} placeholder={t('com_ui_city', 'Ciudad')} />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Phone className="h-3 w-3" />{t('com_ui_phone', 'Teléfono')}</label>
                                        <input className={inputClass} value={data.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+57 300 123 4567" />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Mail className="h-3 w-3" />{t('com_ui_email', 'Correo Electrónico')}</label>
                                        <input className={inputClass} type="email" value={data.email} onChange={e => handleChange('email', e.target.value)} placeholder="empresa@ejemplo.com" />
                                    </div>
                                </div>
                            </div>

                            {/* Activities */}
                            <div>
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
                                    <FileText className="h-4 w-4" /> {t('com_ui_activities', 'Actividades')}
                                </h3>
                                <div>
                                    <label className={labelClass}><FileText className="h-3 w-3" />{t('com_ui_activities_desc', 'Descripción de Actividades Generales')}</label>
                                    <textarea
                                        className={cn(inputClass, 'min-h-[80px] resize-y')}
                                        value={data.generalActivities}
                                        onChange={e => handleChange('generalActivities', e.target.value)}
                                        placeholder={t('com_ui_activities_placeholder', 'Describa las actividades principales que se desarrollan en la empresa...')}
                                        rows={3}
                                    />
                                    <p className="mt-1.5 text-xs italic text-amber-500/90">
                                        ⚠️ Describa con el mayor detalle posible las actividades de su empresa. Esta información alimenta todos los informes, diagnósticos, políticas y análisis generados por IA en el sistema.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-border-medium px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-xl border border-border-medium px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover"
                    >
                        {t('com_ui_cancel', 'Cancelar')}
                    </button>
                    <button
                        onClick={() => handleSave()}
                        disabled={saving || !isFormValid}
                        title={!isFormValid ? "Debe completar todos los campos obligatorios (*)" : ""}
                        className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? t('com_ui_saving', 'Guardando...') : t('com_ui_save', 'Guardar')}
                    </button>
                </div>
            </div>

            <SignaturePad
                isOpen={!!activeSignatureField}
                onClose={() => setActiveSignatureField(null)}
                title={activeSignatureField === 'legalRepSignature' ? 'Firma: Representante Legal' : 'Firma: Responsable SG-SST'}
                onSave={(base64) => {
                    if (activeSignatureField) {
                        handleChange(activeSignatureField, base64);
                    }
                }}
            />
        </div>
    );
};

export default CompanyInfoModal;
