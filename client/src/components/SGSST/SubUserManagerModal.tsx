import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Users,
    UserPlus,
    Shield,
    Key,
    CheckCircle2,
    XCircle,
    Trash2,
    Edit3,
    Building2,
    AlertCircle,
    Eye,
    EyeOff,
    RefreshCw,
    Lock,
    UserCheck,
    Search,
    X,
    Check,
    HelpCircle,
    Sparkles,
    ChevronRight
} from 'lucide-react';
import { useToastContext } from '@librechat/client';
import { useAuthContext } from '~/hooks';

export interface SubUser {
    _id: string;
    name: string;
    email: string;
    workerDocument: string;
    workerId?: string;
    assignedCompany: string;
    company?: {
        _id: string;
        companyName: string;
        nit: string;
    };
    subUserPermissions: string[];
    subUserStatus: 'active' | 'suspended';
    createdAt: string;
    updatedAt: string;
}

export interface AvailableWorker {
    id: string;
    identificacion: string;
    nombre: string;
    email: string;
    cargo: string;
    companyId: string;
    companyName: string;
    hasSubUser: boolean;
    subUserId?: string;
    subUserEmail?: string;
    subUserStatus?: string;
}

export interface CompanyItem {
    _id: string;
    companyName: string;
    nit: string;
    isActive?: boolean;
}

export interface PermissionOption {
    id: string;
    label: string;
    description: string;
    category: 'Perfil & Salud' | 'Inspecciones & Campo' | 'Seguridad & Comités' | 'General / AI';
}

export const AVAILABLE_PERMISSIONS: PermissionOption[] = [
    {
        id: 'sgsst:perfil_sociodemografico_self',
        label: 'Auto-reporte Sociodemográfico (Propio)',
        description: 'Llenar y actualizar su propia ficha sociodemográfica, salud y firma digital.',
        category: 'Perfil & Salud'
    },
    {
        id: 'sgsst:perfil_sociodemografico_all',
        label: 'Gestión Sociodemográfica Completa',
        description: 'Ver y registrar la información de todos los trabajadores de la empresa.',
        category: 'Perfil & Salud'
    },
    {
        id: 'sgsst:reporte_actos',
        label: 'Reporte de Actos y Condiciones',
        description: 'Diligenciar y consultar reportes de actos o condiciones inseguras.',
        category: 'Inspecciones & Campo'
    },
    {
        id: 'sgsst:permiso_alturas',
        label: 'Permisos de Trabajo en Alturas',
        description: 'Crear, consultar y firmar permisos de trabajo seguro en alturas.',
        category: 'Inspecciones & Campo'
    },
    {
        id: 'sgsst:analisis_trabajo_seguro',
        label: 'Análisis de Trabajo Seguro (ATS)',
        description: 'Diligenciar y revisar análisis de trabajo seguro por tarea.',
        category: 'Inspecciones & Campo'
    },
    {
        id: 'sgsst:participacion_ipevar',
        label: 'Participación IPEVAR / Peligros',
        description: 'Reportar riesgos y participar en la identificación de peligros.',
        category: 'Seguridad & Comités'
    },
    {
        id: 'sgsst:programa_capacitaciones',
        label: 'Programa de Capacitaciones',
        description: 'Consultar cronograma de capacitaciones y registrar asistencias.',
        category: 'Seguridad & Comités'
    },
    {
        id: 'sgsst:matriz_peligros',
        label: 'Matriz GTC-45 / IPEVAR',
        description: 'Acceso de consulta y edición a la matriz de peligros general.',
        category: 'Seguridad & Comités'
    },
    {
        id: 'sgsst:investigacion_atel',
        label: 'Investigación de Accidentes (ATEL)',
        description: 'Registro e investigación de incidentes y accidentes de trabajo.',
        category: 'Seguridad & Comités'
    },
    {
        id: 'chat:wappy_general',
        label: 'Asistente IA WAPPY & SST',
        description: 'Permite interactuar con los agentes de IA de WAPPY.',
        category: 'General / AI'
    }
];

const PRESET_ROLES = [
    {
        id: 'self_only',
        name: 'Auto-reporte de Salud',
        description: 'Solo puede ver y actualizar su propia ficha de salud y firmar su consentimiento.',
        permissions: ['sgsst:perfil_sociodemografico_self']
    },
    {
        id: 'field_inspector',
        name: 'Inspector SST / Campo',
        description: 'Puede diligenciar actos/condiciones, permisos de alturas, ATS y auto-reporte.',
        permissions: [
            'sgsst:perfil_sociodemografico_self',
            'sgsst:reporte_actos',
            'sgsst:permiso_alturas',
            'sgsst:analisis_trabajo_seguro',
            'sgsst:participacion_ipevar'
        ]
    },
    {
        id: 'sst_assistant',
        name: 'Asistente SST Completo',
        description: 'Acceso a todos los módulos operativos y matrices de la empresa asignada.',
        permissions: AVAILABLE_PERMISSIONS.map(p => p.id)
    },
    {
        id: 'custom',
        name: 'Personalizado',
        description: 'Selecciona manualmente los módulos y capacidades permitidos.',
        permissions: []
    }
];

interface SubUserManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialWorkerDoc?: string;
}

export default function SubUserManagerModal({ isOpen, onClose, initialWorkerDoc }: SubUserManagerModalProps) {
    const { token } = useAuthContext();
    const { showToast } = useToastContext();

    const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>('list');
    const [subUsers, setSubUsers] = useState<SubUser[]>([]);
    const [availableWorkers, setAvailableWorkers] = useState<AvailableWorker[]>([]);
    const [companies, setCompanies] = useState<CompanyItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchFilter, setSearchFilter] = useState('');

    // Form state for creating / editing
    const [editingSubUser, setEditingSubUser] = useState<SubUser | null>(null);
    const [selectedWorkerDoc, setSelectedWorkerDoc] = useState<string>('');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [selectedPresetRole, setSelectedPresetRole] = useState<string>('self_only');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['sgsst:perfil_sociodemografico_self']);
    const [formStatus, setFormStatus] = useState<'active' | 'suspended'>('active');

    // Load initial data
    const loadData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [subRes, workersRes, compRes] = await Promise.all([
                fetch('/api/sgsst/subusers', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/sgsst/subusers/available-workers', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/sgsst/company-info/all', { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (subRes.ok) {
                const subData = await subRes.json();
                setSubUsers(Array.isArray(subData) ? subData : []);
            }
            if (workersRes.ok) {
                const workersData = await workersRes.json();
                setAvailableWorkers(Array.isArray(workersData) ? workersData : []);
            }
            if (compRes.ok) {
                const compData = await compRes.json();
                setCompanies(Array.isArray(compData) ? compData : []);
                if (compData.length > 0 && !selectedCompanyId) {
                    const activeComp = compData.find((c: CompanyItem) => c.isActive) || compData[0];
                    setSelectedCompanyId(activeComp._id);
                }
            }
        } catch (error) {
            console.error('[SubUserManagerModal] Error loading data:', error);
            showToast({ message: 'Error al cargar información de sub-usuarios', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [token, showToast, selectedCompanyId]);

    useEffect(() => {
        if (isOpen) {
            loadData();
            if (initialWorkerDoc) {
                // Pre-select worker if triggered from a specific row
                handleStartCreateForWorker(initialWorkerDoc);
            }
        }
    }, [isOpen, initialWorkerDoc]);

    const handleStartCreateForWorker = (doc: string) => {
        const worker = availableWorkers.find(w => w.identificacion === doc);
        setSelectedWorkerDoc(doc);
        if (worker) {
            setFormName(worker.nombre || '');
            setFormEmail(worker.email || '');
            setSelectedCompanyId(worker.companyId || (companies[0]?._id || ''));
        }
        setFormPassword(doc); // Default password as document number
        setSelectedPresetRole('self_only');
        setSelectedPermissions(['sgsst:perfil_sociodemografico_self']);
        setEditingSubUser(null);
        setActiveTab('create');
    };

    const handleStartCreateNew = () => {
        setEditingSubUser(null);
        setSelectedWorkerDoc('');
        setFormName('');
        setFormEmail('');
        setFormPassword('');
        setSelectedPresetRole('self_only');
        setSelectedPermissions(['sgsst:perfil_sociodemografico_self']);
        setFormStatus('active');
        setActiveTab('create');
    };

    const handleStartEdit = (su: SubUser) => {
        setEditingSubUser(su);
        setSelectedWorkerDoc(su.workerDocument);
        setSelectedCompanyId(su.assignedCompany);
        setFormName(su.name || '');
        setFormEmail(su.email || '');
        setFormPassword(''); // Empty means don't change
        setSelectedPermissions(su.subUserPermissions || []);
        setFormStatus(su.subUserStatus || 'active');

        // Check if permissions match any preset
        const matchingPreset = PRESET_ROLES.find(preset => {
            if (preset.id === 'custom') return false;
            if (preset.permissions.length !== su.subUserPermissions.length) return false;
            return preset.permissions.every(p => su.subUserPermissions.includes(p));
        });
        setSelectedPresetRole(matchingPreset ? matchingPreset.id : 'custom');

        setActiveTab('edit');
    };

    const handleSelectWorker = (doc: string) => {
        setSelectedWorkerDoc(doc);
        const worker = availableWorkers.find(w => w.identificacion === doc);
        if (worker) {
            setFormName(worker.nombre || '');
            if (worker.email && !formEmail) {
                setFormEmail(worker.email);
            }
            if (worker.companyId) {
                setSelectedCompanyId(worker.companyId);
            }
            if (!formPassword) {
                setFormPassword(doc);
            }
        }
    };

    const handlePresetRoleChange = (roleId: string) => {
        setSelectedPresetRole(roleId);
        const preset = PRESET_ROLES.find(r => r.id === roleId);
        if (preset && preset.id !== 'custom') {
            setSelectedPermissions([...preset.permissions]);
        }
    };

    const handleTogglePermission = (permId: string) => {
        setSelectedPresetRole('custom');
        setSelectedPermissions(prev => {
            if (prev.includes(permId)) {
                return prev.filter(p => p !== permId);
            } else {
                return [...prev, permId];
            }
        });
    };

    const handleGenerateRandomPassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
        let pass = '';
        for (let i = 0; i < 10; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormPassword(pass);
        setShowPassword(true);
    };

    const handleSaveSubUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        if (!formEmail || !formEmail.includes('@')) {
            showToast({ message: 'Ingrese un correo electrónico válido', type: 'warning' });
            return;
        }

        if (activeTab === 'create' && (!formPassword || formPassword.length < 6)) {
            showToast({ message: 'La contraseña debe tener al menos 6 caracteres', type: 'warning' });
            return;
        }

        if (!selectedWorkerDoc) {
            showToast({ message: 'Debe seleccionar un trabajador registrado en el Perfil Sociodemográfico', type: 'warning' });
            return;
        }

        if (!selectedCompanyId) {
            showToast({ message: 'Debe seleccionar una empresa asignada', type: 'warning' });
            return;
        }

        setIsSaving(true);
        try {
            if (activeTab === 'create') {
                const res = await fetch('/api/sgsst/subusers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        email: formEmail,
                        password: formPassword,
                        name: formName,
                        workerDocument: selectedWorkerDoc,
                        assignedCompany: selectedCompanyId,
                        subUserPermissions: selectedPermissions
                    })
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || 'Error al crear sub-usuario');
                }

                showToast({ message: 'Sub-usuario creado exitosamente', type: 'success' });
            } else if (activeTab === 'edit' && editingSubUser) {
                const payload: any = {
                    name: formName,
                    assignedCompany: selectedCompanyId,
                    subUserPermissions: selectedPermissions,
                    subUserStatus: formStatus
                };
                if (formPassword && formPassword.trim().length >= 6) {
                    payload.password = formPassword.trim();
                }

                const res = await fetch(`/api/sgsst/subusers/${editingSubUser._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || 'Error al actualizar sub-usuario');
                }

                showToast({ message: 'Sub-usuario actualizado exitosamente', type: 'success' });
            }

            await loadData();
            setActiveTab('list');
        } catch (error: any) {
            console.error('[SubUserManagerModal] Error saving subuser:', error);
            showToast({ message: error.message || 'Error al guardar sub-usuario', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSubUser = async (subUser: SubUser) => {
        if (!token) return;
        const confirmDelete = window.confirm(`¿Estás seguro de eliminar el acceso de ${subUser.name} (${subUser.email})? El trabajador seguirá registrado en el Perfil Sociodemográfico pero ya no podrá ingresar a la plataforma.`);
        if (!confirmDelete) return;

        try {
            const res = await fetch(`/api/sgsst/subusers/${subUser._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al eliminar');
            }

            showToast({ message: 'Acceso de sub-usuario eliminado', type: 'success' });
            await loadData();
        } catch (error: any) {
            console.error('[SubUserManagerModal] Error deleting subuser:', error);
            showToast({ message: error.message || 'Error al eliminar sub-usuario', type: 'error' });
        }
    };

    const handleToggleStatus = async (subUser: SubUser) => {
        if (!token) return;
        const nextStatus = subUser.subUserStatus === 'active' ? 'suspended' : 'active';
        try {
            const res = await fetch(`/api/sgsst/subusers/${subUser._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ subUserStatus: nextStatus })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al cambiar estado');
            }

            showToast({
                message: nextStatus === 'active' ? 'Sub-usuario activado' : 'Sub-usuario suspendido temporalmente',
                type: 'success'
            });
            await loadData();
        } catch (error: any) {
            showToast({ message: error.message || 'Error al actualizar estado', type: 'error' });
        }
    };

    // Filter subusers list
    const filteredSubUsers = useMemo(() => {
        if (!searchFilter.trim()) return subUsers;
        const q = searchFilter.toLowerCase().trim();
        return subUsers.filter(su =>
            su.name?.toLowerCase().includes(q) ||
            su.email?.toLowerCase().includes(q) ||
            su.workerDocument?.includes(q) ||
            su.company?.companyName?.toLowerCase().includes(q)
        );
    }, [subUsers, searchFilter]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-teal-600 text-white shadow-md shadow-teal-500/20">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                Gestión de Sub-Usuarios y Accesos Delegados
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700">
                                    Somos SST
                                </span>
                            </h2>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                Otorga accesos a trabajadores del Perfil Sociodemográfico para diligenciar información y reportes.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                activeTab === 'list'
                                    ? 'bg-teal-600 text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800'
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            Sub-usuarios Activos ({subUsers.length})
                        </button>

                        <button
                            onClick={handleStartCreateNew}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                activeTab === 'create'
                                    ? 'bg-teal-600 text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/60 dark:hover:bg-gray-800'
                            }`}
                        >
                            <UserPlus className="w-4 h-4" />
                            Crear Nuevo Acceso
                        </button>

                        {activeTab === 'edit' && editingSubUser && (
                            <button
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-teal-600 text-white shadow-sm"
                            >
                                <Edit3 className="w-4 h-4" />
                                Editando: {editingSubUser.name}
                            </button>
                        )}
                    </div>

                    {activeTab === 'list' && (
                        <div className="relative w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, cédula o email..."
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
                            <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
                            <p className="text-sm">Cargando sub-usuarios y trabajadores...</p>
                        </div>
                    ) : activeTab === 'list' ? (
                        /* List Tab */
                        <div>
                            {filteredSubUsers.length === 0 ? (
                                <div className="text-center py-14 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
                                    <Shield className="w-12 h-12 text-teal-500 mx-auto mb-3 opacity-60" />
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                        No hay sub-usuarios registrados aún
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-5">
                                        Crea cuentas de acceso para tus trabajadores registrados en el Perfil Sociodemográfico para que puedan ingresar y reportar su información.
                                    </p>
                                    <button
                                        onClick={handleStartCreateNew}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
                                    >
                                        <UserPlus className="w-4 h-4" />
                                        Crear Primer Sub-Usuario
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredSubUsers.map((su) => {
                                        const isSuspended = su.subUserStatus === 'suspended';
                                        return (
                                            <div
                                                key={su._id}
                                                className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
                                                    isSuspended
                                                        ? 'border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/10 opacity-80'
                                                        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/60 hover:shadow-md'
                                                }`}
                                            >
                                                <div>
                                                    {/* Card Top */}
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${
                                                                isSuspended ? 'bg-gray-500' : 'bg-gradient-to-br from-teal-500 to-emerald-600'
                                                            }`}>
                                                                {su.name ? su.name.substring(0, 2).toUpperCase() : 'SU'}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                                                                    {su.name}
                                                                </h4>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                    {su.email}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                                            isSuspended
                                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                        }`}>
                                                            {isSuspended ? (
                                                                <>
                                                                    <XCircle className="w-3 h-3" />
                                                                    Suspendido
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    Activo
                                                                </>
                                                            )}
                                                        </span>
                                                    </div>

                                                    {/* Worker & Company info */}
                                                    <div className="space-y-1 my-3 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                                                        <div className="flex items-center gap-1.5">
                                                            <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                                            <span>Cédula / Doc: <strong className="font-medium text-gray-900 dark:text-white">{su.workerDocument}</strong></span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                                            <span>Empresa: <strong className="font-medium text-gray-900 dark:text-white">{su.company?.companyName || 'Empresa Asignada'}</strong></span>
                                                        </div>
                                                    </div>

                                                    {/* Badges of Permissions */}
                                                    <div className="mb-3">
                                                        <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                                                            Módulos Autorizados ({su.subUserPermissions?.length || 0}):
                                                        </p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {(su.subUserPermissions || []).slice(0, 4).map((p) => {
                                                                const permInfo = AVAILABLE_PERMISSIONS.find(ap => ap.id === p);
                                                                return (
                                                                    <span
                                                                        key={p}
                                                                        className="text-[10px] px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60"
                                                                    >
                                                                        {permInfo ? permInfo.label.split('(')[0].trim() : p}
                                                                    </span>
                                                                );
                                                            })}
                                                            {(su.subUserPermissions?.length || 0) > 4 && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                                                    +{su.subUserPermissions.length - 4} más
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800/80 mt-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(su)}
                                                        className={`text-xs font-medium px-2.5 py-1 rounded transition-colors ${
                                                            isSuspended
                                                                ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                                                : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                                        }`}
                                                    >
                                                        {isSuspended ? 'Activar Acceso' : 'Suspender Acceso'}
                                                    </button>

                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleStartEdit(su)}
                                                            className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                            title="Editar permisos y clave"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSubUser(su)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                                            title="Eliminar cuenta de acceso"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Create / Edit Form */
                        <form onSubmit={handleSaveSubUser} className="space-y-6 max-w-3xl mx-auto">
                            
                            {/* Step 1: Worker & Company Selection */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-teal-600" />
                                    1. Selección de Trabajador del Perfil Sociodemográfico
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Company Selector */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Empresa Asignada:
                                        </label>
                                        <select
                                            value={selectedCompanyId}
                                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                                            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                            required
                                        >
                                            {companies.map(c => (
                                                <option key={c._id} value={c._id}>
                                                    {c.companyName} ({c.nit})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Worker Selector */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Trabajador Registrado:
                                        </label>
                                        {activeTab === 'create' ? (
                                            <select
                                                value={selectedWorkerDoc}
                                                onChange={(e) => handleSelectWorker(e.target.value)}
                                                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                                required
                                            >
                                                <option value="">-- Selecciona un trabajador --</option>
                                                {availableWorkers
                                                    .filter(w => !selectedCompanyId || w.companyId === selectedCompanyId)
                                                    .map(w => (
                                                        <option key={w.identificacion} value={w.identificacion} disabled={w.hasSubUser}>
                                                            {w.nombre} (CC: {w.identificacion}) {w.cargo ? `- ${w.cargo}` : ''} {w.hasSubUser ? '✓ (Ya tiene cuenta)' : ''}
                                                        </option>
                                                    ))}
                                            </select>
                                        ) : (
                                            <div className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 font-medium">
                                                {formName} (Cédula: {selectedWorkerDoc})
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Credentials */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Key className="w-4 h-4 text-teal-600" />
                                    2. Credenciales de Inicio de Sesión
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Nombre Completo:
                                        </label>
                                        <input
                                            type="text"
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                            placeholder="Nombre del colaborador"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                            Correo Electrónico (Login):
                                        </label>
                                        <input
                                            type="email"
                                            value={formEmail}
                                            onChange={(e) => setFormEmail(e.target.value)}
                                            disabled={activeTab === 'edit'}
                                            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:opacity-60"
                                            placeholder="ejemplo@empresa.com"
                                            required
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                {activeTab === 'create' ? 'Contraseña Inicial:' : 'Nueva Contraseña (Dejar en blanco para conservar):'}
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => selectedWorkerDoc && setFormPassword(selectedWorkerDoc)}
                                                    className="text-[11px] text-teal-600 hover:text-teal-700 font-medium"
                                                >
                                                    Usar Cédula como Clave
                                                </button>
                                                <span className="text-gray-300 dark:text-gray-600">|</span>
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateRandomPassword}
                                                    className="text-[11px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                                                >
                                                    <Sparkles className="w-3 h-3" /> Generar Clave Segura
                                                </button>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formPassword}
                                                onChange={(e) => setFormPassword(e.target.value)}
                                                className="w-full pl-3 pr-10 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                                placeholder={activeTab === 'create' ? 'Mínimo 6 caracteres' : '•••••••• (conservar actual)'}
                                                required={activeTab === 'create'}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3: Preset Roles & Granular Permissions */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-teal-600" />
                                    3. Roles y Permisos Granulares de Acceso
                                </h3>

                                {/* Presets Selector */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Plantilla de Rol Rápido:
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                        {PRESET_ROLES.map(role => {
                                            const isSelected = selectedPresetRole === role.id;
                                            return (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => handlePresetRoleChange(role.id)}
                                                    className={`p-3 rounded-lg border text-left transition-all ${
                                                        isSelected
                                                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 shadow-sm ring-1 ring-teal-500'
                                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-semibold text-xs">{role.name}</span>
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-teal-600" />}
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2">
                                                        {role.description}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Granular Checkboxes by Category */}
                                <div className="space-y-3 pt-2">
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                        Capacidades y Módulos Específicos:
                                    </label>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {AVAILABLE_PERMISSIONS.map((perm) => {
                                            const isChecked = selectedPermissions.includes(perm.id);
                                            return (
                                                <div
                                                    key={perm.id}
                                                    onClick={() => handleTogglePermission(perm.id)}
                                                    className={`p-3 rounded-lg border cursor-pointer select-none transition-all flex items-start gap-2.5 ${
                                                        isChecked
                                                            ? 'border-teal-500/80 bg-teal-50/50 dark:bg-teal-950/20 text-gray-900 dark:text-white'
                                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 opacity-80 hover:opacity-100'
                                                    }`}
                                                >
                                                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                        isChecked
                                                            ? 'bg-teal-600 border-teal-600 text-white'
                                                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                                    }`}>
                                                        {isChecked && <Check className="w-3 h-3" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-semibold leading-tight">{perm.label}</span>
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                                                {perm.category}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                                                            {perm.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Form Footer Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('list')}
                                    className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            {activeTab === 'create' ? 'Crear Cuenta de Sub-Usuario' : 'Guardar Cambios'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
