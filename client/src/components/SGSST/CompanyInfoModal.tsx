import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    X, Building2, Save, User, MapPin, Phone, Mail,
    Briefcase, Shield, Hash, FileText, Users, Activity,
} from 'lucide-react';
import { useAuthContext } from '~/hooks';
import { useToastContext } from '~/Providers';
import { cn } from '~/utils';

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
                }
            })
            .catch(err => console.error('Error loading company info:', err))
            .finally(() => setLoading(false));
    }, [isOpen, token]);

    const handleChange = useCallback((field: keyof CompanyInfoData, value: string | number) => {
        setData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSave = useCallback(async () => {
        if (!token) return;
        setSaving(true);
        try {
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

    const inputClass = 'w-full rounded-lg border border-border-medium bg-surface-primary px-3 py-2 text-sm text-text-primary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';
    const labelClass = 'mb-1 flex items-center gap-1.5 text-xs font-medium text-text-secondary';
    const selectClass = cn(inputClass, 'appearance-none cursor-pointer');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border-medium bg-surface-secondary shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border-medium px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-blue-500/10 p-2">
                            <Building2 className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text-primary">{t('com_ui_company_info_title', 'Información de la Empresa')}</h2>
                            <p className="text-xs text-text-secondary">{t('com_ui_company_info_desc', 'Estos datos se usarán en todos los informes generados por IA')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-hover">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {loading ? (
                        <div className="flex h-32 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
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
                                        <select className={selectClass} value={data.sector} onChange={e => handleChange('sector', e.target.value)}>
                                            <option value="">{t('com_ui_select_sector', 'Seleccionar sector')}</option>
                                            {SECTOR_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
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
                                        <select className={selectClass} value={data.arl} onChange={e => handleChange('arl', e.target.value)}>
                                            <option value="">{t('com_ui_select_arl', 'Seleccionar ARL')}</option>
                                            {ARL_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}><Activity className="h-3 w-3" />{t('com_ui_risk_level', 'Nivel de Riesgo')}</label>
                                        <select className={selectClass} value={data.riskLevel} onChange={e => handleChange('riskLevel', e.target.value)}>
                                            <option value="">{t('com_ui_select_level', 'Seleccionar nivel')}</option>
                                            {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
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
                                        <label className={labelClass}><User className="h-3 w-3" />{t('com_ui_sst_responsible', 'Responsable del SG-SST')}</label>
                                        <input className={inputClass} value={data.responsibleSST} onChange={e => handleChange('responsibleSST', e.target.value)} placeholder={t('com_ui_sst_responsible_placeholder', 'Nombre del responsable')} />
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
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-border-medium px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-border-medium px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-hover"
                    >
                        {t('com_ui_cancel', 'Cancelar')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? t('com_ui_saving', 'Guardando...') : t('com_ui_save', 'Guardar')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompanyInfoModal;
