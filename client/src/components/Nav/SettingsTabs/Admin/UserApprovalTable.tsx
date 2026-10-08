import React, { useState, useEffect, useMemo } from 'react';
import { useToastContext } from '@librechat/client';
import { useLocalize } from '~/hooks';
import axios from 'axios';
import * as XLSX from 'xlsx';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import BulkUpdateDatesModal from './BulkUpdateDatesModal';
import UserChatsModal from './UserChatsModal';
import { 
    Search, 
    Filter, 
    Download, 
    Upload, 
    Plus, 
    FileSpreadsheet, 
    Edit, 
    MessageSquare, 
    Trash2, 
    Calendar, 
    Clock, 
    Shield, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    Sparkles, 
    Crown, 
    X, 
    RefreshCw,
    UserCheck,
    Briefcase,
    Zap,
    Users
} from 'lucide-react';
import { cn } from '~/utils';

function formatLastActivity(lastActivity: string | null) {
    if (!lastActivity) return null;
    const diffMs = new Date().getTime() - new Date(lastActivity).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return { label: 'Ahora', color: 'text-emerald-600 dark:text-emerald-400 font-semibold', dot: 'bg-emerald-500' };
    if (diffMins < 60) return { label: `Hace ${diffMins} min`, color: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' };
    if (diffHours < 24) return { label: `Hace ${diffHours}h`, color: 'text-teal-600 dark:text-teal-400', dot: 'bg-teal-500' };
    if (diffDays < 7) return { label: `Hace ${diffDays}d`, color: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' };
    if (diffDays < 30) return { label: `Hace ${Math.floor(diffDays / 7)} sem`, color: 'text-orange-600 dark:text-orange-400', dot: 'bg-orange-500' };
    return { label: `Hace ${Math.floor(diffDays / 30)} m`, color: 'text-slate-400 dark:text-zinc-500', dot: 'bg-slate-400' };
}

export default function UserManagementTable() {
    const localize = useLocalize();
    const { showToast } = useToastContext();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isChatsModalOpen, setIsChatsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [userForChats, setUserForChats] = useState<any>(null);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);

    // ── Filters ──────────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterPlan, setFilterPlan] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterActivity, setFilterActivity] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/admin/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            showToast({ message: 'Error fetching users', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    // ── Filtered list (client-side) ───────────────────────────────────────────
    const filteredUsers = useMemo(() => {
        return users.filter((user: any) => {
            // Text search: name, email, phone, departamento, ciudad, username
            const q = searchQuery.toLowerCase().trim();
            if (q && !(
                (user.name || '').toLowerCase().includes(q) || 
                (user.email || '').toLowerCase().includes(q) ||
                (user.username || '').toLowerCase().includes(q) ||
                (user.phoneNumber || '').toLowerCase().includes(q) ||
                (user.departamento || user.department || '').toLowerCase().includes(q) ||
                (user.ciudad || user.city || '').toLowerCase().includes(q)
            )) {
                return false;
            }
            // Role filter
            if (filterRole && user.role !== filterRole) return false;
            // Plan filter
            if (filterPlan && user.plan !== filterPlan) return false;
            // Status filter
            const effectiveStatus = (user.inactiveAt && new Date() >= new Date(user.inactiveAt))
                ? 'inactive'
                : user.accountStatus;
            if (filterStatus && effectiveStatus !== filterStatus) return false;
            // Activity filter
            if (filterActivity) {
                if (filterActivity === 'none' && user.lastActivity) return false;
                if (filterActivity !== 'none') {
                    if (!user.lastActivity) return false;
                    const diffDays = Math.floor((new Date().getTime() - new Date(user.lastActivity).getTime()) / 86400000);
                    if (filterActivity === '1d' && diffDays >= 1) return false;
                    if (filterActivity === '7d' && diffDays >= 7) return false;
                    if (filterActivity === '30d' && diffDays >= 30) return false;
                    if (filterActivity === 'old' && diffDays < 30) return false;
                }
            }
            return true;
        });
    }, [users, searchQuery, filterRole, filterPlan, filterStatus, filterActivity]);

    const hasFilters = searchQuery || filterRole || filterPlan || filterStatus || filterActivity;

    const clearFilters = () => {
        setSearchQuery('');
        setFilterRole('');
        setFilterPlan('');
        setFilterStatus('');
        setFilterActivity('');
    };

    // ── Selection ────────────────────────────────────────────────────────────
    const toggleUserSelection = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) newSelected.delete(userId);
        else newSelected.add(userId);
        setSelectedUsers(newSelected);
    };

    const toggleAllSelection = () => {
        const filteredIds = filteredUsers.map((u: any) => u._id);
        const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedUsers.has(id));
        const newSelected = new Set(selectedUsers);
        if (allSelected) {
            filteredIds.forEach(id => newSelected.delete(id));
        } else {
            filteredIds.forEach(id => newSelected.add(id));
        }
        setSelectedUsers(newSelected);
    };

    const handleDelete = async (userId: string) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario permanentemente?')) return;
        try {
            await axios.post('/api/admin/users/delete', { userId });
            showToast({ message: 'Usuario eliminado exitosamente', status: 'success' });
            fetchUsers();
        } catch (error: any) {
            showToast({ message: error.response?.data?.message || 'Error eliminando usuario', status: 'error' });
        }
    };

    const handleEdit = (user: any) => { setSelectedUser(user); setIsEditModalOpen(true); };

    const handleExportUsers = () => {
        const header = ['Nombre', 'Correo', 'Número Telefónico', 'Departamento', 'Ciudad', 'Usuario', 'Rol', 'Plan', 'Estado', 'Fecha de Registro', 'Fecha de Activación', 'Fecha de Vencimiento', 'Última Actividad'];
        const rows = users.map((u: any) => [
            u.name || u.username || '',
            u.email || '',
            u.phoneNumber || '',
            u.departamento || u.department || '',
            u.ciudad || u.city || '',
            u.username || '',
            u.role || '',
            u.plan || '',
            u.accountStatus || '',
            u.createdAt ? new Date(u.createdAt).toISOString() : '',
            u.activeAt ? new Date(u.activeAt).toISOString() : '',
            u.inactiveAt || u.planExpiresAt ? new Date(u.inactiveAt || u.planExpiresAt).toISOString() : '',
            u.lastActivity ? new Date(u.lastActivity).toISOString() : ''
        ]);
        
        const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Usuarios');
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `usuarios_wappy_${new Date().toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast({ message: localize('com_ui_export_success') || 'Usuarios exportados correctamente', status: 'success' });
    };

    const handleExportCompanyInfo = async () => {
        try {
            showToast({ message: 'Preparando exportación de información empresarial...', status: 'info' });
            const response = await axios.get('/api/admin/company-info');
            const data = response.data;

            if (!data || data.length === 0) {
                showToast({ message: 'No hay información empresarial para exportar', status: 'warning' });
                return;
            }

            const header = [
                'Usuario', 'Correo Usuario', 'Razón Social', 'NIT', 'Representante Legal', 
                'Número de Trabajadores', 'ARL', 'Actividad Económica', 'Nivel de Riesgo', 
                'CIIU', 'Dirección', 'Ciudad', 'Teléfono Contacto', 'Email Contacto', 
                'Sector', 'Responsable SST', 'Teléfono Responsable SST',
                'Nivel Formación', 'Número Licencia', 'Estado Curso 50h', 'Vencimiento Licencia',
                'Consentimiento Rep. Legal', 'Consentimiento Resp. SST'
            ];

            const truncate = (val: any) => {
                if (typeof val !== 'string') return val;
                if (val.length <= 32760) return val;
                return val.substring(0, 32760) + '... [TRUNCADO POR LÍMITE DE EXCEL]';
            };

            const rows = data.map((info: any) => [
                truncate(info.userName || ''),
                truncate(info.userEmail || ''),
                truncate(info.companyName || ''),
                truncate(info.nit || ''),
                truncate(info.legalRepresentative || ''),
                info.workerCount || 0,
                truncate(info.arl || ''),
                truncate(info.economicActivity || ''),
                truncate(info.riskLevel || ''),
                truncate(info.ciiu || ''),
                truncate(info.address || ''),
                truncate(info.city || ''),
                truncate(info.phone || ''),
                truncate(info.email || ''),
                truncate(info.sector || ''),
                truncate(info.responsibleSST || ''),
                truncate(info.responsibleSSTPhone || ''),
                truncate(info.formationLevel || ''),
                truncate(info.licenseNumber || ''),
                truncate(info.courseStatus || ''),
                truncate(info.licenseExpiry || ''),
                truncate(info.legalRepConsent || 'No'),
                truncate(info.sstRespConsent || 'No')
            ]);

            const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Información Empresarial');

            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `informacion_empresarial_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast({ message: 'Información empresarial exportada correctamente', status: 'success' });
        } catch (error: any) {
            console.error('Error exporting company info:', error);
            const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Error desconocido';
            showToast({ message: `Error exportando información empresarial: ${errorMessage}`, status: 'error' });
        }
    };

    const handleImportUsers = async (event: any) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                const dataRows = rows.slice(1);
                let successCount = 0, errorCount = 0;
                showToast({ message: localize('com_ui_processing') || 'Procesando archivo excel...', status: 'info' });
                
                for (const row of dataRows) {
                    if (!row || !row[1]) continue;
                    
                    const name = row[0] ? String(row[0]).trim() : undefined;
                    const email = row[1] ? String(row[1]).trim() : undefined;
                    const phoneNumber = row[2] ? String(row[2]).trim() : undefined;
                    const username = row[3] ? String(row[3]).trim() : (email ? email.split('@')[0] : undefined);
                    const role = row[4] ? String(row[4]).toUpperCase().trim() : 'USER';
                    const status = row[5] ? String(row[5]).toLowerCase().trim() : 'active';
                    
                    if (!email) continue;
                    
                    try {
                        const validRole = ['USER', 'ADMIN', 'USER_PRO', 'USER_PLUS', 'USER_GO', 'USER_IPEVAR', 'USER_CUSTOM'].includes(role) ? role : 'USER';
                        const validStatus = ['active', 'inactive', 'pending', 'activo', 'inactivo', 'pendiente'].includes(status) 
                            ? (status === 'activo' ? 'active' : status === 'inactivo' ? 'inactive' : status === 'pendiente' ? 'pending' : status) 
                            : 'active';
                            
                        await axios.post('/api/admin/users/create', {
                            name,
                            username,
                            email,
                            password: username || email.split('@')[0],
                            role: validRole,
                            accountStatus: validStatus,
                            phoneNumber
                        });
                        successCount++;
                    } catch { errorCount++; }
                }
                
                if (successCount > 0) { showToast({ message: `${localize('com_ui_import_success') || 'Usuarios importados'}: ${successCount}`, status: 'success' }); fetchUsers(); }
                if (errorCount > 0) { showToast({ message: `${localize('com_ui_import_error') || 'Errores de importación'}: ${errorCount}`, status: 'warning' }); }
                
            } catch (error) {
                console.error('Error importing excel:', error);
                showToast({ message: 'Error procesando el archivo Excel', status: 'error' });
            }
        };
        reader.readAsArrayBuffer(file);
        event.target.value = '';
    };

    const bulkAction = async (accountStatus: string, confirmKey: string, successKey: string, errorKey: string) => {
        if (!window.confirm(localize(confirmKey as any) || '¿Confirmar actualización masiva?')) return;
        try {
            await axios.post('/api/admin/users/bulk-update', { userIds: Array.from(selectedUsers), accountStatus });
            showToast({ message: localize(successKey as any) || 'Usuarios actualizados', status: 'success' });
            fetchUsers();
            setSelectedUsers(new Set());
        } catch {
            showToast({ message: localize(errorKey as any) || 'Error actualizando usuarios', status: 'error' });
        }
    };

    const handleBulkRoleChange = async (newRole: string) => {
        if (!window.confirm(`¿Estás seguro de que quieres cambiar el rol de ${selectedUsers.size} usuario(s) a ${newRole}?`)) return;
        try {
            await axios.post('/api/admin/users/bulk-update', { userIds: Array.from(selectedUsers), role: newRole });
            showToast({ message: 'Roles actualizados exitosamente', status: 'success' });
            fetchUsers();
            setSelectedUsers(new Set());
        } catch {
            showToast({ message: 'Error actualizando roles', status: 'error' });
        }
    };

    const renderPlanBadge = (plan: string, role?: string) => {
        const normalizedPlan = (plan || '').toLowerCase();
        switch (normalizedPlan) {
            case 'pro':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/60 shadow-2xs">
                        <Crown className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                        <span>Wappy Pro</span>
                    </span>
                );
            case 'plus':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700/60 shadow-2xs">
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        <span>Plus</span>
                    </span>
                );
            case 'go':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-700/60 shadow-2xs">
                        <Zap className="w-3 h-3 text-sky-500" />
                        <span>Go</span>
                    </span>
                );
            case 'ipevar':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/60 shadow-2xs">
                        <Shield className="w-3 h-3 text-emerald-500" />
                        <span>Wappy Vital</span>
                    </span>
                );
            case 'custom':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-700/60 shadow-2xs">
                        <span>A la Medida</span>
                    </span>
                );
            case 'admin':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-300 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-700/60 shadow-2xs">
                        <Shield className="w-3 h-3 text-violet-500" />
                        <span>Administrador</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                        <span>Invitado</span>
                    </span>
                );
        }
    };

    const renderExpiryInfo = (expiryDate: string | null, plan: string) => {
        if (!expiryDate) {
            if (plan === 'admin' || plan === 'ipevar') {
                return (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Permanente</span>
                    </span>
                );
            }
            return <span className="text-slate-400 dark:text-zinc-500 text-xs italic">Sin vencimiento</span>;
        }

        const date = new Date(expiryDate);
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return (
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                        {date.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </span>
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded-md mt-0.5 w-fit">
                        Venció hace {Math.abs(diffDays)}d
                    </span>
                </div>
            );
        } else if (diffDays <= 7) {
            return (
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {date.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded-md mt-0.5 w-fit">
                        Vence en {diffDays}d
                    </span>
                </div>
            );
        } else {
            return (
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200">
                        {date.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        {diffDays} días restantes
                    </span>
                </div>
            );
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <RefreshCw className="w-8 h-8 text-teal-600 dark:text-teal-400 animate-spin mb-3" />
                <span className="text-sm font-semibold text-slate-600 dark:text-zinc-300">Cargando base de usuarios...</span>
            </div>
        );
    }

    const filteredIds = filteredUsers.map((u: any) => u._id);
    const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedUsers.has(id));

    const selectStyle = 'text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 px-3 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer shadow-2xs';

    return (
        <div className="flex flex-col gap-5 w-full">

            {/* ── Top action bar (WAPPY Button Styles) ─────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-bold text-xs">
                        <Users className="w-3.5 h-3.5" />
                        <span>{users.length} Usuarios Registrados</span>
                    </div>
                    {filteredUsers.length !== users.length && (
                        <span className="text-xs text-slate-500 dark:text-zinc-400">
                            ({filteredUsers.length} en el filtro)
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <input type="file" accept=".xlsx, .xls" className="hidden" id="import-users-file" onChange={handleImportUsers} />
                    <label 
                        htmlFor="import-users-file" 
                        title={localize('com_ui_import_users') || 'Importar Excel'}
                        className="group flex h-9 min-w-[36px] items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 px-2.5 shadow-2xs transition-all duration-300 active:scale-95 cursor-pointer"
                    >
                        <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[160px] group-hover:opacity-100 sm:flex">
                            <span className="text-xs font-bold">{localize('com_ui_import_users') || 'Importar Excel'}</span>
                        </div>
                        <span className="sm:hidden text-xs font-bold ml-1.5">{localize('com_ui_import_users') || 'Importar Excel'}</span>
                    </label>

                    <button 
                        onClick={handleExportUsers} 
                        title={localize('com_ui_export_users') || 'Exportar Usuarios'}
                        className="group flex h-9 min-w-[36px] items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 px-2.5 shadow-2xs transition-all duration-300 active:scale-95 cursor-pointer"
                    >
                        <Download className="w-4 h-4 text-slate-600 dark:text-zinc-300 shrink-0" />
                        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[160px] group-hover:opacity-100 sm:flex">
                            <span className="text-xs font-bold">{localize('com_ui_export_users') || 'Exportar Usuarios'}</span>
                        </div>
                        <span className="sm:hidden text-xs font-bold ml-1.5">{localize('com_ui_export_users') || 'Exportar Usuarios'}</span>
                    </button>

                    <button 
                        onClick={handleExportCompanyInfo} 
                        title="Exportar Info Empresarial"
                        className="group flex h-9 min-w-[36px] items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 border border-orange-200/80 dark:border-orange-800/80 px-2.5 shadow-2xs transition-all duration-300 active:scale-95 cursor-pointer"
                    >
                        <FileSpreadsheet className="w-4 h-4 shrink-0" />
                        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[200px] group-hover:opacity-100 sm:flex">
                            <span className="text-xs font-bold">Exportar Info Empresarial</span>
                        </div>
                        <span className="sm:hidden text-xs font-bold ml-1.5">Exportar Info Empresarial</span>
                    </button>

                    <button 
                        onClick={() => setIsCreateModalOpen(true)} 
                        title={localize('com_ui_create_user') || 'Crear Usuario'}
                        className="group flex h-9 min-w-[36px] items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200/80 dark:border-teal-800/80 px-2.5 shadow-2xs transition-all duration-300 active:scale-95 cursor-pointer"
                    >
                        <Plus className="w-4 h-4 shrink-0" />
                        <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-2 group-hover:max-w-[160px] group-hover:opacity-100 sm:flex">
                            <span className="text-xs font-bold">{localize('com_ui_create_user') || 'Crear Usuario'}</span>
                        </div>
                        <span className="sm:hidden text-xs font-bold ml-1.5">{localize('com_ui_create_user') || 'Crear Usuario'}</span>
                    </button>
                </div>
            </div>

            {/* ── Search & Filters card (Somos SST Design) ───────────────────────────── */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 p-4 shadow-2xs backdrop-blur-xs">
                {/* Search input */}
                <div className="relative w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nombre, correo, usuario, teléfono, departamento o ciudad..."
                        className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all shadow-2xs"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Filter selects row */}
                <div className="flex flex-wrap gap-2.5 items-center">
                    <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5" /> Filtrar por:
                    </span>

                    {/* Plan filter */}
                    <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} className={selectStyle}>
                        <option value="">Plan — Todos</option>
                        <option value="free">Invitado (Free)</option>
                        <option value="go">Go</option>
                        <option value="plus">Plus</option>
                        <option value="pro">Wappy Pro ⭐</option>
                        <option value="ipevar">Wappy Vital</option>
                        <option value="custom">A la Medida</option>
                        <option value="admin">Administrador</option>
                    </select>

                    {/* Role filter */}
                    <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className={selectStyle}>
                        <option value="">Rol — Todos</option>
                        <option value="USER">USER (Invitado)</option>
                        <option value="USER_GO">USER_GO (Go)</option>
                        <option value="USER_PLUS">USER_PLUS (Plus)</option>
                        <option value="USER_PRO">USER_PRO (Wappy Pro)</option>
                        <option value="USER_IPEVAR">USER_IPEVAR (Vital)</option>
                        <option value="USER_CUSTOM">USER_CUSTOM (A la Medida)</option>
                        <option value="ADMIN">ADMIN</option>
                    </select>

                    {/* Status filter */}
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectStyle}>
                        <option value="">Estado — Todos</option>
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                        <option value="pending">Pendiente</option>
                    </select>

                    {/* Activity filter */}
                    <select value={filterActivity} onChange={e => setFilterActivity(e.target.value)} className={selectStyle}>
                        <option value="">Actividad — Cualquier fecha</option>
                        <option value="1d">Últimas 24 horas</option>
                        <option value="7d">Últimos 7 días</option>
                        <option value="30d">Últimos 30 días</option>
                        <option value="old">Más de 30 días</option>
                        <option value="none">Sin actividad reciente</option>
                    </select>

                    {hasFilters && (
                        <button 
                            onClick={clearFilters} 
                            className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold ml-1 cursor-pointer"
                        >
                            <X className="h-3.5 w-3.5" />
                            Limpiar filtros
                        </button>
                    )}
                </div>
            </div>

            {/* ── Bulk action bar ───────────────────────────────────────── */}
            {selectedUsers.size > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-teal-50 dark:bg-teal-950/40 p-3 px-4 rounded-2xl border border-teal-500/30 animate-in fade-in shadow-xs">
                    <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-600 text-white text-xs font-bold">
                            {selectedUsers.size}
                        </span>
                        <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                            {selectedUsers.size} {localize('com_ui_users_selected') || 'usuario(s) seleccionados'}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    handleBulkRoleChange(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                            className="bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer focus:outline-none focus:border-teal-500"
                            defaultValue=""
                        >
                            <option value="" disabled>Asignar Rol...</option>
                            <option value="USER">Invitado (Free)</option>
                            <option value="USER_GO">Go</option>
                            <option value="USER_PLUS">Plus</option>
                            <option value="USER_PRO">Wappy Pro</option>
                            <option value="USER_IPEVAR">Wappy Vital</option>
                            <option value="USER_CUSTOM">A la Medida</option>
                            <option value="ADMIN">Administrador</option>
                        </select>

                        <button 
                            onClick={() => bulkAction('active', 'com_ui_confirm_bulk_activate', 'com_ui_bulk_activate_success', 'com_ui_bulk_activate_error')}
                            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{localize('com_ui_activate') || 'Activar'}</span>
                        </button>

                        <button 
                            onClick={() => bulkAction('inactive', 'com_ui_confirm_bulk_inactivate', 'com_ui_bulk_inactivate_success', 'com_ui_bulk_inactivate_error')}
                            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{localize('com_ui_inactivate') || 'Inactivar'}</span>
                        </button>

                        <button 
                            onClick={() => setIsBulkUpdateModalOpen(true)}
                            className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{localize('com_ui_update_dates') || 'Actualizar Fechas'}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ── Table container ────────────────────────────────────────────────── */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs custom-admin-scrollbar">
                <table className="min-w-full divide-y divide-slate-200/80 dark:divide-zinc-800">
                    <thead className="bg-slate-50/90 dark:bg-zinc-800/80">
                        <tr>
                            <th className="px-4 py-3.5 w-10 text-center">
                                <input
                                    type="checkbox"
                                    checked={allFilteredSelected}
                                    onChange={toggleAllSelection}
                                    className="rounded border-slate-300 dark:border-zinc-600 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                />
                            </th>
                            <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                Usuario
                            </th>
                            <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                Correo / Contacto
                            </th>
                            <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                Plan & Rol
                            </th>
                            <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                Activación
                            </th>
                            <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                Vencimiento
                            </th>
                            <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                {localize('com_ui_last_activity') || 'Última Actividad'}
                            </th>
                            <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                {localize('com_ui_status') || 'Estado'}
                            </th>
                            <th className="px-4 py-3.5 text-center text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                                {localize('com_ui_actions') || 'Acciones'}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-900 divide-y divide-slate-100 dark:divide-zinc-800/80">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-400 dark:text-zinc-500 italic">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <AlertCircle className="w-6 h-6 text-slate-400" />
                                        <span>{hasFilters ? 'No se encontraron usuarios con los filtros aplicados.' : 'No hay usuarios disponibles.'}</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredUsers.map((user: any) => {
                            const activity = formatLastActivity(user.lastActivity);
                            const effectiveStatus = (user.inactiveAt && new Date() >= new Date(user.inactiveAt)) ? 'inactive' : user.accountStatus;
                            const isSelected = selectedUsers.has(user._id);

                            return (
                                <tr 
                                    key={user._id} 
                                    className={cn(
                                        "transition-colors duration-150",
                                        isSelected 
                                            ? "bg-teal-50/60 dark:bg-teal-950/20" 
                                            : "hover:bg-slate-50/80 dark:hover:bg-zinc-800/40"
                                    )}
                                >
                                    {/* Checkbox */}
                                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleUserSelection(user._id)}
                                            className="rounded border-slate-300 dark:border-zinc-600 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                        />
                                    </td>

                                    {/* Usuario */}
                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                        <div className="flex items-center gap-2.5">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs shadow-2xs border border-slate-200/60 dark:border-zinc-700">
                                                {(user.name || user.username || user.email || 'U')[0].toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800 dark:text-zinc-100">
                                                    {user.name || user.username || 'Sin Nombre'}
                                                </span>
                                                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                                                    @{user.username || 'usuario'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Correo / Contacto */}
                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-700 dark:text-zinc-300 font-medium">
                                                {user.email}
                                            </span>
                                            {user.phoneNumber && (
                                                <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                                                    📞 {user.phoneNumber}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Plan & Rol */}
                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                        <div className="flex flex-col gap-1 items-start">
                                            {renderPlanBadge(user.plan, user.role)}
                                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                                                {user.role}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Activación */}
                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                        {user.activeAt ? (
                                            <div className="flex flex-col">
                                                <span className="text-xs font-semibold text-slate-800 dark:text-zinc-100 flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-emerald-500" />
                                                    {new Date(user.activeAt).toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                                </span>
                                                <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                                                    {new Date(user.activeAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-zinc-500 italic">
                                                No activado
                                            </span>
                                        )}
                                    </td>

                                    {/* Vencimiento */}
                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                        {renderExpiryInfo(user.inactiveAt || user.planExpiresAt, user.plan)}
                                    </td>

                                    {/* Última Actividad */}
                                    <td className="px-4 py-3.5 whitespace-nowrap" title={user.lastActivity ? new Date(user.lastActivity).toLocaleString() : ''}>
                                        {activity ? (
                                            <div className="inline-flex items-center gap-1.5 text-xs">
                                                <span className={cn("w-2 h-2 rounded-full", activity.dot)} />
                                                <span className={activity.color}>{activity.label}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 dark:text-zinc-500 text-xs italic">Sin actividad</span>
                                        )}
                                    </td>

                                    {/* Estado */}
                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                        {effectiveStatus === 'active' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span>Activo</span>
                                            </span>
                                        ) : effectiveStatus === 'inactive' ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300">
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                <span>Inactivo</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-300">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                <span>Pendiente</span>
                                            </span>
                                        )}
                                    </td>

                                    {/* Acciones (WAPPY Micro-Buttons Expansibles) */}
                                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                                        <div className="inline-flex items-center justify-center gap-1.5">
                                            {/* Micro-Botón Editar */}
                                            <button 
                                                onClick={() => handleEdit(user)} 
                                                className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-all duration-300 px-1.5 shadow-2xs active:scale-95 cursor-pointer"
                                                title="Editar Usuario"
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                                                    <span className="text-[10px] font-bold">Editar</span>
                                                </div>
                                            </button>

                                            {/* Micro-Botón Chats */}
                                            <button 
                                                onClick={() => { setUserForChats(user); setIsChatsModalOpen(true); }} 
                                                className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-all duration-300 px-1.5 shadow-2xs active:scale-95 cursor-pointer"
                                                title="Ver Chats"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                                                    <span className="text-[10px] font-bold">Chats</span>
                                                </div>
                                            </button>

                                            {/* Micro-Botón Eliminar */}
                                            <button 
                                                onClick={() => handleDelete(user._id)} 
                                                className="group flex h-7 min-w-[28px] items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-all duration-300 px-1.5 shadow-2xs active:scale-95 cursor-pointer"
                                                title="Eliminar Usuario"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                <div className="hidden max-w-0 items-center overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 ease-in-out group-hover:ml-1 group-hover:max-w-[100px] group-hover:opacity-100 sm:flex">
                                                    <span className="text-[10px] font-bold">Eliminar</span>
                                                </div>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            <CreateUserModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onUserCreated={fetchUsers} />
            <EditUserModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={selectedUser} onUserUpdated={fetchUsers} />
            <BulkUpdateDatesModal
                isOpen={isBulkUpdateModalOpen}
                onClose={() => setIsBulkUpdateModalOpen(false)}
                userIds={Array.from(selectedUsers)}
                onSuccess={() => { fetchUsers(); setSelectedUsers(new Set()); }}
            />
            <UserChatsModal isOpen={isChatsModalOpen} onClose={() => setIsChatsModalOpen(false)} userId={userForChats?._id} userName={userForChats?.name || userForChats?.username} />
        </div>
    );
}
