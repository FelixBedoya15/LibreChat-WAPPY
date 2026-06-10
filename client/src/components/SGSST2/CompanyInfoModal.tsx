import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
    X, Building2, Save, User, MapPin, Phone, Mail,
    Briefcase, Shield, Hash, FileText, Users, Activity,
    Award, Calendar, UserCheck, Image as ImageIcon,
    Plus, Trash2, CheckCircle
} from 'lucide-react';

import { useAuthContext } from '~/hooks';
import { useToastContext } from '@librechat/client';
import { cn } from '~/utils';
import { AnimatedIcon } from '~/components/ui/AnimatedIcon';
import SignaturePad from './SignaturePad';
import { PenTool } from 'lucide-react';
import SingleSelect from './SingleSelect';

export interface SedeData {
    nombre: string;
    address: string;
    city: string;
    departamento: string;
    phone: string;
    email: string;
    generalActivities: string;
}

interface CompanyInfoData {
    _id?: string;
    isActive?: boolean;
    companyName: string;
    companyType: string;
    nit: string;
    legalRepresentative: string;
    legalRepresentativeId: string;
    workerCount: number;
    arl: string;
    economicActivity: string;
    riskLevel: string;
    ciiu: string;
    address: string;
    city: string;
    departamento: string;
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
    logoBase64?: string | null;
    sedes: SedeData[];
}


const INITIAL_DATA: CompanyInfoData = {
    companyName: '',
    companyType: 'Persona Jurídica',
    nit: '',
    legalRepresentative: '',
    legalRepresentativeId: '',
    workerCount: 0,
    arl: '',
    economicActivity: '',
    riskLevel: '',
    ciiu: '',
    address: '',
    city: '',
    departamento: '',
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
    logoBase64: null,
    sedes: [],
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
    const [companies, setCompanies] = useState<CompanyInfoData[]>([]);
    const [data, setData] = useState<CompanyInfoData>(INITIAL_DATA);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeSignatureField, setActiveSignatureField] = useState<'legalRepSignature' | 'sstRespSignature' | null>(null);

    const showToastRef = React.useRef(showToast);
    useEffect(() => {
        showToastRef.current = showToast;
    }, [showToast]);

    const loadCompanies = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch('/api/sgsst/company-info/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataArr = await res.json();
            if (Array.isArray(dataArr) && dataArr.length > 0) {
                setCompanies(dataArr);
                const active = dataArr.find(c => c.isActive) || dataArr[0];
                
                const draftKey = `wappy_company_draft_${active._id || 'new'}`;
                const draftStr = localStorage.getItem(draftKey);
                if (draftStr) {
                    try {
                        const parsed = JSON.parse(draftStr);
                        setData(parsed);
                        showToastRef.current({ message: 'Se ha recuperado un borrador guardado automáticamente.', status: 'info' });
                    } catch (e) {
                        setData(active);
                    }
                } else {
                    setData(active);
                }
                syncSignaturesToLocal(active);
            } else {
                setCompanies([]);
                const draftKey = `wappy_company_draft_new`;
                const draftStr = localStorage.getItem(draftKey);
                if (draftStr) {
                    try {
                        const parsed = JSON.parse(draftStr);
                        setData(parsed);
                        showToastRef.current({ message: 'Se ha recuperado un borrador guardado automáticamente.', status: 'info' });
                    } catch (e) {
                        setData(INITIAL_DATA);
                    }
                } else {
                    setData(INITIAL_DATA);
                }
            }
        } catch (err) {
            console.error('Error loading companies:', err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (isOpen) {
            loadCompanies();
        }
    }, [isOpen, loadCompanies]);

    useEffect(() => {
        if (loading) return;
        
        const timer = setTimeout(() => {
            const isInitial = Object.keys(INITIAL_DATA).every(key => {
                const val = data[key as keyof CompanyInfoData];
                const initVal = INITIAL_DATA[key as keyof CompanyInfoData];
                if (Array.isArray(val)) {
                    return val.length === 0;
                }
                return val === initVal;
            });
            
            if (isInitial) return;

            const draftKey = `wappy_company_draft_${data._id || 'new'}`;
            localStorage.setItem(draftKey, JSON.stringify(data));
        }, 1000);

        return () => clearTimeout(timer);
    }, [data, loading]);

    const syncSignaturesToLocal = (info: CompanyInfoData) => {
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
                window.dispatchEvent(new Event('storage'));
            }
        } catch (err) { }
    };

    const handleChange = useCallback((field: keyof CompanyInfoData, value: string | number | null) => {
        setData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleAddSede = useCallback(() => {
        setData(prev => ({
            ...prev,
            sedes: [...(prev.sedes || []), { nombre: '', address: '', city: '', departamento: '', phone: '', email: '', generalActivities: '' }]
        }));
    }, []);

    const handleSedeChange = useCallback((index: number, field: keyof SedeData, value: string) => {
        setData(prev => {
            const newSedes = [...(prev.sedes || [])];
            newSedes[index] = { ...newSedes[index], [field]: value };
            return { ...prev, sedes: newSedes };
        });
    }, []);

    const handleRemoveSede = useCallback((index: number) => {
        setData(prev => ({
            ...prev,
            sedes: (prev.sedes || []).filter((_, i) => i !== index)
        }));
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

    const handleSelectCompany = (comp: CompanyInfoData) => {
        const draftKey = `wappy_company_draft_${comp._id || 'new'}`;
        const draftStr = localStorage.getItem(draftKey);
        if (draftStr) {
            try {
                const parsed = JSON.parse(draftStr);
                setData(parsed);
                showToast({ message: 'Se ha recuperado un borrador guardado automáticamente.', status: 'info' });
            } catch (e) {
                setData(comp);
            }
        } else {
            setData(comp);
        }
    };

    const handleNewCompany = () => {
        const draftKey = `wappy_company_draft_new`;
        const draftStr = localStorage.getItem(draftKey);
        if (draftStr) {
            try {
                const parsed = JSON.parse(draftStr);
                setData(parsed);
                showToast({ message: 'Se ha recuperado un borrador guardado automáticamente.', status: 'info' });
            } catch (e) {
                setData(INITIAL_DATA);
            }
        } else {
            setData(INITIAL_DATA);
        }
    };

    const handleActivateCompany = async (id: string) => {
        if (!token) return;
        try {
            const res = await fetch(`/api/sgsst/company-info/${id}/activate`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showToast({ message: 'Empresa activada correctamente. Recargando el sistema...', status: 'success' });
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (err) {
            showToast({ message: 'Error al activar empresa', status: 'error' });
        }
    };

    const handleSave = useCallback(async () => {
        if (!token) return;
        setSaving(true);
        try {
            syncSignaturesToLocal(data);

            const isNew = !data._id;
            const url = isNew ? '/api/sgsst/company-info' : `/api/sgsst/company-info/${data._id}`;
            const method = isNew ? 'POST' : 'PUT';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            
            if (res.ok) {
                showToast({ message: 'Información de la empresa guardada', status: 'success', severity: 'success' });
                const draftKey = `wappy_company_draft_${data._id || 'new'}`;
                localStorage.removeItem(draftKey);

                if (data.isActive || companies.length === 0 || companies.find(c => c._id === data._id)?.isActive) {
                    if (data.logoBase64) {
                        localStorage.setItem('wappy_sst_global_logo', data.logoBase64);
                    } else {
                        localStorage.removeItem('wappy_sst_global_logo');
                    }
                    window.dispatchEvent(new Event('storage'));
                }

                await loadCompanies();
            } else {
                const errData = await res.json();
                showToast({ message: errData.error || 'Error al guardar', status: 'error' });
            }
        } catch (err) {
            showToast({ message: 'Error de red al guardar', status: 'error' });
        } finally {
            setSaving(false);
        }
    }, [data, token, showToast, loadCompanies, companies]);

    if (!isOpen) return null;

    const REQUIRED_FIELDS = [
        'companyName', 'companyType', 'nit', 'legalRepresentative', 'legalRepresentativeId', 'workerCount',
        'arl', 'economicActivity', 'riskLevel', 'ciiu',
        'address', 'city', 'departamento', 'phone', 'email',
        'sector', 'responsibleSST', 'responsibleSSTPhone', 'generalActivities',
        'formationLevel', 'licenseNumber', 'courseStatus', 'licenseExpiry',
    ] as const;

    const FIELD_LABELS: Record<string, string> = {
        companyName: 'Razón Social',
        companyType: 'Tipo de Empresa',
        nit: 'NIT / Cédula',
        legalRepresentative: 'Representante Legal',
        legalRepresentativeId: 'Cédula del Representante Legal',
        workerCount: 'Número de Trabajadores',
        arl: 'ARL',
        economicActivity: 'Actividad Económica',
        riskLevel: 'Nivel de Riesgo',
        ciiu: 'Código CIIU',
        address: 'Dirección',
        city: 'Ciudad',
        departamento: 'Departamento',
        phone: 'Teléfono',
        email: 'Correo Electrónico',
        sector: 'Sector',
        responsibleSST: 'Responsable SG-SST',
        responsibleSSTPhone: 'Contacto del Responsable',
        generalActivities: 'Descripción de Actividades',
        formationLevel: 'Nivel de Formación',
        licenseNumber: 'Número de Licencia SST',
        courseStatus: 'Fecha Curso 50/20H',
        licenseExpiry: 'Vigencia de Licencia',
    };

    const missingFields = REQUIRED_FIELDS.filter(field => {
        const val = data[field as keyof CompanyInfoData];
        if (typeof val === 'string') {
            const v = val.trim();
            return v === '' || v === 'N/A' || v === 'No registrado';
        }
        return val === undefined || val === null || val === 0 || isNaN(val as number);
    });

    const isFormValid = missingFields.length === 0;

    const inputClass = 'w-full rounded-xl border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500';
    const labelClass = 'mb-1 flex items-center gap-1.5 text-xs font-medium text-text-secondary after:content-["*"] after:ml-0.5 after:text-red-500';

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative mx-4 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border-medium bg-surface-secondary shadow-2xl">
                
                {/* Header with Company Switcher */}
                <div className="border-b border-border-medium px-6 py-4 bg-surface-tertiary">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-teal-500/10 p-2">
                                <Building2 className="h-5 w-5 text-teal-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-text-primary">{t('com_ui_company_info_title', 'Perfiles de Empresa (Multi-Empresa)')}</h2>
                                <p className="text-xs text-text-secondary">Gestiona hasta 3 empresas de forma aislada. La empresa Activa será utilizada por la IA.</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="rounded-xl p-1.5 text-text-secondary hover:bg-surface-hover">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {companies.map(c => (
                            <div 
                                key={c._id}
                                onClick={() => handleSelectCompany(c)}
                                className={cn(
                                    "flex flex-col px-4 py-2 rounded-xl border cursor-pointer transition-all min-w-[160px]",
                                    data._id === c._id 
                                        ? "border-teal-500 bg-teal-500/5 shadow-sm" 
                                        : "border-border-medium bg-surface-primary hover:border-teal-400"
                                )}
                            >
                                <span className="text-sm font-bold text-text-primary truncate" title={c.companyName}>{c.companyName || 'Sin Nombre'}</span>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-text-secondary">NIT: {c.nit || 'N/A'}</span>
                                    {c.isActive && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-teal-600 bg-teal-100 dark:bg-teal-900/30 px-1.5 py-0.5 rounded-full">
                                            <CheckCircle className="h-3 w-3" /> Activa
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {companies.length < 3 && (
                            <button 
                                onClick={handleNewCompany}
                                className={cn(
                                    "flex items-center justify-center gap-2 px-4 py-4 rounded-xl border border-dashed cursor-pointer transition-all min-w-[160px]",
                                    !data._id && companies.length > 0 
                                        ? "border-teal-500 bg-teal-500/5 text-teal-600" 
                                        : "border-border-medium text-text-secondary hover:border-teal-400 hover:text-teal-500"
                                )}
                            >
                                <Plus className="h-4 w-4" />
                                <span className="text-sm font-semibold">Nueva Empresa</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading ? (
                        <div className="flex h-32 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            
                            {data._id && !data.isActive && (
                                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-amber-800 dark:text-amber-200">
                                        <Shield className="h-5 w-5" />
                                        <div>
                                            <p className="font-bold text-sm">Esta empresa NO es la activa</p>
                                            <p className="text-xs opacity-90">Debes activarla para que el sistema y los agentes de IA comiencen a trabajar con su Matriz IPEVAR, Hitos y Documentos.</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleActivateCompany(data._id!)}
                                        className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                                    >
                                        Activar esta Empresa
                                    </button>
                                </div>
                            )}

                            {/* General Info */}
                            <div>
                                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
                                    <Building2 className="h-4 w-4" /> {t('com_ui_company_data_general', 'Datos Generales')}
                                </h3>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <div className="md:col-span-3">
                                        <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-text-secondary"><ImageIcon className="h-3.5 w-3.5 text-teal-500" />Logotipo de la Empresa (Opcional)</label>
                                        <div className="flex flex-col md:flex-row items-center gap-4 rounded-xl border border-border-medium bg-surface-primary p-4">
                                            {data.logoBase64 ? (
                                                <div className="relative group rounded-xl border border-border-medium p-2 bg-white dark:bg-zinc-800 shadow-sm transition-all hover:border-red-400">
                                                    <img src={data.logoBase64} alt="Logotipo Empresa" className="h-16 w-16 object-contain rounded-lg" />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChange('logoBase64', null)}
                                                        className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-md"
                                                        title="Eliminar Logotipo"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="h-16 w-16 rounded-xl border-2 border-dashed border-border-medium flex items-center justify-center bg-surface-secondary text-text-secondary shadow-inner shrink-0">
                                                    <Building2 className="h-6 w-6 text-text-secondary/60" />
                                                </div>
                                            )}
                                            <div className="flex-1 text-center md:text-left space-y-1">
                                                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg active:scale-95 shrink-0">
                                                    <ImageIcon className="h-4 w-4" />
                                                    <span>SELECCIONAR IMAGEN</span>
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onload = (readerEvent) => {
                                                                    handleChange('logoBase64', readerEvent.target?.result as string);
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                            e.target.value = '';
                                                        }} 
                                                        className="hidden" 
                                                    />
                                                </label>
                                                <p className="text-[10.5px] text-text-secondary font-medium">Recomendado: imagen cuadrada o rectangular horizontal, formato PNG/JPG, peso menor a 1MB. Se utilizará para estampar tu marca en los portales QR y reportes.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className={labelClass}><Building2 className="h-3 w-3" />{t('com_ui_company_name', 'Razón Social')}</label>
                                        <input className={inputClass} value={data.companyName} onChange={e => handleChange('companyName', e.target.value)} placeholder={t('com_ui_company_name_placeholder', 'Nombre de la empresa')} />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Building2 className="h-3 w-3" />Tipo de Empresa</label>
                                        <SingleSelect value={data.companyType || 'Persona Jurídica'} onChange={val => handleChange('companyType', val)} placeholder="Seleccione..." options={['Persona Jurídica', 'Persona Natural']} />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Hash className="h-3 w-3" />{data.companyType === 'Persona Natural' ? 'Cédula de Ciudadanía' : 'NIT'}</label>
                                        <input className={inputClass} value={data.nit} onChange={e => handleChange('nit', e.target.value)} placeholder={data.companyType === 'Persona Natural' ? 'Ej. 123456789' : '123456789-0'} />
                                    </div>
                                    <div>
                                        <label className={labelClass}><User className="h-3 w-3" />{t('com_ui_company_legal_rep', 'Representante Legal')}</label>
                                        <input className={inputClass} value={data.legalRepresentative} onChange={e => handleChange('legalRepresentative', e.target.value)} placeholder={t('com_ui_company_legal_rep_placeholder', 'Nombre completo')} />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Hash className="h-3 w-3" />Cédula Rep. Legal</label>
                                        <input className={inputClass} value={data.legalRepresentativeId || ''} onChange={e => handleChange('legalRepresentativeId', e.target.value)} placeholder="Ej. 12345678" />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Users className="h-3 w-3" />{t('com_ui_company_workers', 'Número de Trabajadores')}</label>
                                        <input className={inputClass} type="number" min="0" value={data.workerCount || ''} onChange={e => handleChange('workerCount', parseInt(e.target.value) || 0)} placeholder="0" />
                                    </div>
                                    <div className="md:col-span-3">
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
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <div>
                                        <label className={labelClass}><Shield className="h-3 w-3" />ARL</label>
                                        <SingleSelect value={data.arl} onChange={val => handleChange('arl', val)} placeholder={t('com_ui_select_arl', 'Seleccionar ARL')} options={ARL_OPTIONS} />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Activity className="h-3 w-3" />{t('com_ui_risk_level', 'Nivel de Riesgo')}</label>
                                        <SingleSelect value={data.riskLevel} onChange={val => handleChange('riskLevel', val)} placeholder={t('com_ui_select_level', 'Seleccionar nivel')} options={RISK_LEVELS} />
                                    </div>
                                    <div>
                                        <label className={labelClass}><Hash className="h-3 w-3" />Código CIIU</label>
                                        <input className={inputClass} value={data.ciiu} onChange={e => handleChange('ciiu', e.target.value)} placeholder="Ej: 4711" />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className={labelClass}><Briefcase className="h-3 w-3" />{t('com_ui_economic_activity', 'Actividad Económica')}</label>
                                        <input className={inputClass} value={data.economicActivity} onChange={e => handleChange('economicActivity', e.target.value)} placeholder={t('com_ui_economic_activity_placeholder', 'Descripción de la actividad')} />
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
                                    <div className="md:col-span-3">
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
                                        <label className={labelClass}><MapPin className="h-3 w-3" />Departamento</label>
                                        <input className={inputClass} value={data.departamento || ''} onChange={e => handleChange('departamento', e.target.value)} placeholder="Ej. Antioquia" />
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

                            {/* Sedes Adicionales */}
                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                                        <Building2 className="h-4 w-4" /> Sedes Adicionales
                                    </h3>
                                    <button
                                        onClick={handleAddSede}
                                        className="flex items-center gap-1.5 rounded-lg bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-600 transition-colors hover:bg-teal-500/20"
                                    >
                                        <Plus className="h-3 w-3" /> Agregar Sede
                                    </button>
                                </div>
                                
                                {(!data.sedes || data.sedes.length === 0) ? (
                                    <div className="rounded-xl border border-dashed border-border-medium bg-surface-primary/50 p-6 text-center">
                                        <p className="text-sm text-text-secondary">No hay sedes adicionales registradas.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {data.sedes.map((sede, idx) => (
                                            <div key={idx} className="relative rounded-xl border border-border-medium bg-surface-primary p-4 shadow-sm">
                                                <button
                                                    onClick={() => handleRemoveSede(idx)}
                                                    className="absolute right-3 top-3 rounded-full bg-red-50 p-1.5 text-red-500 hover:bg-red-100 transition-colors"
                                                    title="Eliminar Sede"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                
                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mt-2">
                                                    <div>
                                                        <label className={labelClass}>Nombre de la Sede</label>
                                                        <input className={inputClass} value={sede.nombre} onChange={e => handleSedeChange(idx, 'nombre', e.target.value)} placeholder="Ej. Sede Norte" />
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>Dirección</label>
                                                        <input className={inputClass} value={sede.address} onChange={e => handleSedeChange(idx, 'address', e.target.value)} placeholder="Dirección de la sede" />
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>Ciudad</label>
                                                        <input className={inputClass} value={sede.city} onChange={e => handleSedeChange(idx, 'city', e.target.value)} placeholder="Ciudad" />
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>Departamento</label>
                                                        <input className={inputClass} value={sede.departamento || ''} onChange={e => handleSedeChange(idx, 'departamento', e.target.value)} placeholder="Ej. Cundinamarca" />
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>Teléfono</label>
                                                        <input className={inputClass} value={sede.phone} onChange={e => handleSedeChange(idx, 'phone', e.target.value)} placeholder="Teléfono" />
                                                    </div>
                                                    <div>
                                                        <label className={labelClass}>Correo Electrónico</label>
                                                        <input className={inputClass} type="email" value={sede.email} onChange={e => handleSedeChange(idx, 'email', e.target.value)} placeholder="correo@sede.com" />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label className={labelClass}>Actividades de la Sede</label>
                                                        <textarea
                                                            className={cn(inputClass, 'min-h-[60px] resize-y')}
                                                            value={sede.generalActivities}
                                                            onChange={e => handleSedeChange(idx, 'generalActivities', e.target.value)}
                                                            placeholder="Describa las actividades específicas de esta sede..."
                                                            rows={2}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border-medium px-6 py-4">
                    <div className="flex-1 mr-4">
                        <div className="text-xs text-text-secondary">
                            {data._id ? `Editando: ${data.companyName || 'Sin Nombre'}` : 'Creando Nueva Empresa'}
                        </div>
                        {!isFormValid && missingFields.length > 0 && (
                            <div className="mt-1 text-xs text-red-500">
                                <span className="font-semibold">Faltan:</span>{' '}
                                <span className="hidden md:inline">
                                    {missingFields.map(f => FIELD_LABELS[f] || f).join(', ')}
                                </span>
                                <span className="inline md:hidden font-medium bg-red-500/10 dark:bg-red-500/20 border border-red-500/20 px-2 py-0.5 rounded-md">
                                    {missingFields.length} campos obligatorios
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                const draftKey = `wappy_company_draft_${data._id || 'new'}`;
                                localStorage.removeItem(draftKey);
                                onClose();
                            }}
                            className="rounded-xl border border-border-medium px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover"
                        >
                            {t('com_ui_cancel', 'Cancelar')}
                        </button>
                        <button
                            onClick={() => handleSave()}
                            disabled={saving || !isFormValid}
                            title={!isFormValid ? `Faltan: ${missingFields.map(f => FIELD_LABELS[f] || f).join(', ')}` : ''}
                            className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="h-4 w-4" />
                            {saving ? t('com_ui_saving', 'Guardando...') : t('com_ui_save', 'Guardar Empresa')}
                        </button>
                    </div>
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
        </div>,
        document.body
    );
};

export default CompanyInfoModal;
