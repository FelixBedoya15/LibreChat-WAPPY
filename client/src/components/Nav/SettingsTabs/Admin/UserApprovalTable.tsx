import React, { useState, useEffect, useMemo } from 'react';
import { useToastContext } from '@librechat/client';
import { useLocalize } from '~/hooks';
import axios from 'axios';
import * as XLSX from 'xlsx';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import BulkUpdateDatesModal from './BulkUpdateDatesModal';
import UserChatsModal from './UserChatsModal';

function formatLastActivity(lastActivity: string | null) {
    if (!lastActivity) return null;
    const diffMs = new Date().getTime() - new Date(lastActivity).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return { label: 'Ahora', color: 'text-green-600 dark:text-green-400 font-medium', order: 0 };
    if (diffMins < 60) return { label: `Hace ${diffMins} min`, color: 'text-green-600 dark:text-green-400', order: diffMins };
    if (diffHours < 24) return { label: `Hace ${diffHours}h`, color: 'text-blue-600 dark:text-blue-400', order: diffHours * 60 };
    if (diffDays < 7) return { label: `Hace ${diffDays}d`, color: 'text-yellow-600 dark:text-yellow-400', order: diffDays * 1440 };
    if (diffDays < 30) return { label: `Hace ${Math.floor(diffDays / 7)} sem`, color: 'text-orange-600 dark:text-orange-400', order: diffDays * 1440 };
    return { label: `Hace ${Math.floor(diffDays / 30)} mes(es)`, color: 'text-red-600 dark:text-red-400', order: diffDays * 1440 };
}

export default function UserManagementTable() {
    const localize = useLocalize();
    const { showToast } = useToastContext();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isChatsModalOpen, setIsChatsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userForChats, setUserForChats] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);

    // ── Filters ──────────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterActivity, setFilterActivity] = useState('');

    const fetchUsers = async () => {
        try {
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
            // Text search: name or email
            const q = searchQuery.toLowerCase();
            if (q && !((user.name || '').toLowerCase().includes(q) || (user.email || '').toLowerCase().includes(q))) {
                return false;
            }
            // Role filter
            if (filterRole && user.role !== filterRole) return false;
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
    }, [users, searchQuery, filterRole, filterStatus, filterActivity]);

    const hasFilters = searchQuery || filterRole || filterStatus || filterActivity;

    const clearFilters = () => {
        setSearchQuery('');
        setFilterRole('');
        setFilterStatus('');
        setFilterActivity('');
    };

    // ── Selection (operates on filteredUsers) ─────────────────────────────────
    const toggleUserSelection = (userId) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) newSelected.delete(userId);
        else newSelected.add(userId);
        setSelectedUsers(newSelected);
    };

    const toggleAllSelection = () => {
        const filteredIds = filteredUsers.map((u: any) => u._id);
        const allSelected = filteredIds.every(id => selectedUsers.has(id));
        const newSelected = new Set(selectedUsers);
        if (allSelected) {
            filteredIds.forEach(id => newSelected.delete(id));
        } else {
            filteredIds.forEach(id => newSelected.add(id));
        }
        setSelectedUsers(newSelected);
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;
        try {
            await axios.post('/api/admin/users/delete', { userId });
            showToast({ message: 'Usuario eliminado exitosamente', status: 'success' });
            fetchUsers();
        } catch (error) {
            showToast({ message: error.response?.data?.message || 'Error eliminando usuario', status: 'error' });
        }
    };

    const handleEdit = (user) => { setSelectedUser(user); setIsEditModalOpen(true); };

    const handleExportUsers = () => {
        const header = ['Nombre', 'Correo', 'Número Telefónico', 'Usuario', 'Rol', 'Estado', 'Fecha de Creación', 'Activo Desde', 'Inactivo Desde', 'Última Actividad'];
        const rows = users.map((u: any) => [
            u.name || u.username || '',
            u.email || '',
            u.phoneNumber || '',
            u.username || '',
            u.role || '',
            u.accountStatus || '',
            u.createdAt ? new Date(u.createdAt).toISOString() : '',
            u.activeAt ? new Date(u.activeAt).toISOString() : '',
            u.inactiveAt ? new Date(u.inactiveAt).toISOString() : '',
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
        link.setAttribute('download', 'usuarios.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showToast({ message: localize('com_ui_export_success') || 'Usuarios exportados correctamente', status: 'success' });
    };

    const handleImportUsers = async (event) => {
        const file = event.target.files[0];
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
                        const validRole = ['USER', 'ADMIN', 'USER_PRO', 'USER_PLUS', 'USER_GO'].includes(role) ? role : 'USER';
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
        if (!window.confirm(localize(confirmKey as any))) return;
        try {
            await axios.post('/api/admin/users/bulk-update', { userIds: Array.from(selectedUsers), accountStatus });
            showToast({ message: localize(successKey as any), status: 'success' });
            fetchUsers();
            setSelectedUsers(new Set());
        } catch {
            showToast({ message: localize(errorKey as any), status: 'error' });
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

    if (loading) return <div className="p-4">{localize('com_ui_loading')}</div>;

    const filteredIds = filteredUsers.map((u: any) => u._id);
    const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedUsers.has(id));

    const selectStyle = 'text-xs rounded-md border border-gray-300 dark:border-gray-600 bg-surface-primary text-text-primary px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500';

    return (
        <div className="flex flex-col gap-4">

            {/* ── Top action bar ─────────────────────────────────────────── */}
            <div className="flex justify-end">
                <div className="flex gap-2">
                    <input type="file" accept=".xlsx, .xls" className="hidden" id="import-users-file" onChange={handleImportUsers} />
                    <label htmlFor="import-users-file" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer">
                        {localize('com_ui_import_users')}
                    </label>
                    <button onClick={handleExportUsers} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                        {localize('com_ui_export_users')}
                    </button>
                    <button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                        {localize('com_ui_create_user')}
                    </button>
                </div>
            </div>

            {/* ── Search & Filters ──────────────────────────────────────── */}
            <div className="flex flex-col gap-2 bg-surface-secondary rounded-lg border border-light p-3">
                {/* Search bar */}
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder={`${localize('com_ui_search')} ${localize('com_ui_name')?.toLowerCase()} o correo...`}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-surface-primary text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    )}
                </div>

                {/* Filter row */}
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Filtrar:</span>

                    {/* Role filter */}
                    <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className={selectStyle}>
                        <option value="">{localize('com_ui_role')} — Todos</option>
                        <option value="USER">Gratis</option>
                        <option value="USER_GO">Go</option>
                        <option value="USER_PLUS">Plus</option>
                        <option value="USER_PRO">Pro</option>
                        <option value="ADMIN">Admin</option>
                    </select>

                    {/* Status filter */}
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectStyle}>
                        <option value="">{localize('com_ui_status')} — Todos</option>
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                        <option value="pending">Pendiente</option>
                    </select>

                    {/* Activity filter */}
                    <select value={filterActivity} onChange={e => setFilterActivity(e.target.value)} className={selectStyle}>
                        <option value="">Actividad — Cualquiera</option>
                        <option value="1d">Últimas 24h</option>
                        <option value="7d">Últimos 7 días</option>
                        <option value="30d">Últimos 30 días</option>
                        <option value="old">Más de 30 días</option>
                        <option value="none">Sin actividad</option>
                    </select>

                    {hasFilters && (
                        <button onClick={clearFilters} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            Limpiar filtros
                        </button>
                    )}

                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                        {filteredUsers.length} de {users.length} usuarios
                    </span>
                </div>
            </div>

            {/* ── Bulk action bar ───────────────────────────────────────── */}
            {selectedUsers.size > 0 && (
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-2 px-4 rounded-md border border-blue-200 dark:border-blue-800">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        {selectedUsers.size} {localize('com_ui_users_selected')}
                    </span>
                    <div className="flex gap-2 items-center">
                        <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    handleBulkRoleChange(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500"
                            defaultValue=""
                        >
                            <option value="" disabled>Cambiar Rol...</option>
                            <option value="USER" className="text-black bg-white dark:bg-gray-800 dark:text-white">Gratis</option>
                            <option value="USER_GO" className="text-black bg-white dark:bg-gray-800 dark:text-white">Go</option>
                            <option value="USER_PLUS" className="text-black bg-white dark:bg-gray-800 dark:text-white">Plus</option>
                            <option value="USER_PRO" className="text-black bg-white dark:bg-gray-800 dark:text-white">Pro</option>
                            <option value="ADMIN" className="text-black bg-white dark:bg-gray-800 dark:text-white">Admin</option>
                        </select>
                        <button onClick={() => bulkAction('active', 'com_ui_confirm_bulk_activate', 'com_ui_bulk_activate_success', 'com_ui_bulk_activate_error')}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-xs font-medium">
                            {localize('com_ui_activate')}
                        </button>
                        <button onClick={() => bulkAction('inactive', 'com_ui_confirm_bulk_inactivate', 'com_ui_bulk_inactivate_success', 'com_ui_bulk_inactivate_error')}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-medium">
                            {localize('com_ui_inactivate')}
                        </button>
                        <button onClick={() => setIsBulkUpdateModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium">
                            {localize('com_ui_update_dates')}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Table ────────────────────────────────────────────────── */}
            <div className="overflow-x-auto rounded-lg border border-light">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-surface-secondary">
                        <tr>
                            <th className="px-6 py-3 w-4">
                                <input
                                    type="checkbox"
                                    checked={allFilteredSelected}
                                    onChange={toggleAllSelection}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">{localize('com_ui_last_activity')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">{localize('com_ui_name')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">{localize('com_ui_email')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">{localize('com_ui_username')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">{localize('com_ui_role')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">{localize('com_ui_status')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">{localize('com_ui_actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-surface-primary divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-400 italic">
                                    {hasFilters ? 'No se encontraron usuarios con los filtros aplicados.' : localize('com_ui_nothing_found')}
                                </td>
                            </tr>
                        ) : filteredUsers.map((user: any) => {
                            const activity = formatLastActivity(user.lastActivity);
                            const effectiveStatus = (user.inactiveAt && new Date() >= new Date(user.inactiveAt)) ? 'inactive' : user.accountStatus;
                            const statusStyle = effectiveStatus === 'active'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : effectiveStatus === 'inactive'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
                            return (
                                <tr key={user._id} className={selectedUsers.has(user._id) ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-surface-hover'}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.has(user._id)}
                                            onChange={() => toggleUserSelection(user._id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm" title={user.lastActivity ? new Date(user.lastActivity).toLocaleString() : ''}>
                                        {activity
                                            ? <span className={activity.color}>{activity.label}</span>
                                            : <span className="text-gray-400 italic">Sin actividad</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{user.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">{
                                        { USER: 'Gratis', USER_GO: 'Go', USER_PLUS: 'Plus', USER_PRO: 'Pro', ADMIN: 'Admin' }[user.role] || user.role
                                    }</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyle}`}>
                                            {{
                                                active: 'Activo',
                                                inactive: 'Inactivo',
                                                pending: 'Pendiente'
                                            }[effectiveStatus] || effectiveStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                        <button onClick={() => handleEdit(user)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                            {localize('com_ui_edit')}
                                        </button>
                                        <button onClick={() => { setUserForChats(user); setIsChatsModalOpen(true); }} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                                            Chats
                                        </button>
                                        <button onClick={() => handleDelete(user._id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                            {localize('com_ui_delete')}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

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
