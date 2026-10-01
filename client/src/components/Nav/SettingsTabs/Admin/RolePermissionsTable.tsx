import React, { useState, useEffect } from 'react';
import { useToastContext } from '@librechat/client';
import { SystemRoles, PermissionTypes, Permissions } from 'librechat-data-provider';
import axios from 'axios';
import { ShieldCheck, RefreshCw } from 'lucide-react';

const ROLES = [SystemRoles.USER, SystemRoles.USER_GO, SystemRoles.USER_PLUS, SystemRoles.USER_PRO, 'USER_IPEVAR', 'USER_CUSTOM', SystemRoles.ADMIN];

const renderRoleName = (role: string) => {
    return {
        [SystemRoles.USER]: 'Invitado',
        [SystemRoles.USER_GO]: 'Go',
        [SystemRoles.USER_PLUS]: 'Plus',
        [SystemRoles.USER_PRO]: 'Wappy Pro',
        'USER_IPEVAR': 'Wappy Vital',
        'IPEVAR': 'Wappy Vital Legacy',
        'USER_CUSTOM': 'A la Medida',
        [SystemRoles.ADMIN]: 'Admin',
    }[role] || role;
};

const PERMISSION_LABELS = {
    [PermissionTypes.AGENTS]: 'Constructor de Agentes',
    [PermissionTypes.PROMPTS]: 'Indicaciones (Prompts)',
    [PermissionTypes.MEMORIES]: 'Memorias',
    [PermissionTypes.BOOKMARKS]: 'Marcadores',
    [PermissionTypes.WEB_SEARCH]: 'Búsqueda Web',
    [PermissionTypes.RUN_CODE]: 'Intérprete de Código',
    [PermissionTypes.FILE_SEARCH]: 'Búsqueda de Archivos',
    [PermissionTypes.ARTIFACTS]: 'Artefactos',
    [PermissionTypes.LIVE_CHAT]: 'Live Chat General',
    [PermissionTypes.LIVE_ANALYSIS]: 'Live Analysis',
    [PermissionTypes.ENDPOINTS]: 'Modelos (Endpoints)',
    [PermissionTypes.ATTACHMENTS]: 'Adjuntar Archivos',
    [PermissionTypes.PARAMETERS]: 'Parámetros (Temp, Top P)',
    [PermissionTypes.SGSST]: 'SST Bio-Individual',
};

const ENDPOINT_KEYS = ['openAI', 'google', 'anthropic', 'wappy', 'agents', 'NVIDIA'];

export default function RolePermissionsTable() {
    const { showToast } = useToastContext();
    const [rolePermissions, setRolePermissions] = useState<any>({});
    const [loading, setLoading] = useState(true);

    const fetchPermissions = async () => {
        try {
            const response = await axios.get('/api/roles');
            const permissionsMap: any = {};
            response.data.forEach((role: any) => {
                permissionsMap[role.name] = role.permissions;
            });
            setRolePermissions(permissionsMap);
        } catch (error) {
            console.error('Error fetching role permissions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const handleToggle = async (roleName: string, permissionType: string, permissionKey: string, currentValue: boolean) => {
        const newValue = !currentValue;

        // Optimistic update
        setRolePermissions((prev: any) => ({
            ...prev,
            [roleName]: {
                ...prev[roleName],
                [permissionType]: {
                    ...prev[roleName]?.[permissionType],
                    [permissionKey]: newValue
                }
            }
        }));

        try {
            await axios.post('/api/roles/update', {
                roleName,
                updates: {
                    permissions: {
                        [permissionType]: {
                            [permissionKey]: newValue
                        }
                    }
                }
            });
            showToast({ message: 'Permiso actualizado exitosamente', status: 'success' });
        } catch (error) {
            console.error('Error updating permission:', error);
            showToast({ message: 'Error actualizando permiso', status: 'error' });
            // Revert on error
            setRolePermissions((prev: any) => ({
                ...prev,
                [roleName]: {
                    ...prev[roleName],
                    [permissionType]: {
                        ...prev[roleName]?.[permissionType],
                        [permissionKey]: currentValue
                    }
                }
            }));
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <RefreshCw className="w-8 h-8 text-teal-600 animate-spin mb-3" />
                <span className="text-sm font-semibold text-slate-600 dark:text-zinc-300">Cargando matriz de permisos...</span>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs custom-admin-scrollbar">
            <table className="min-w-full divide-y divide-slate-200/80 dark:divide-zinc-800 text-xs">
                <thead className="bg-slate-50/90 dark:bg-zinc-800/80">
                    <tr>
                        <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                            Característica / Permiso
                        </th>
                        {ROLES.map(role => (
                            <th key={role} className="px-5 py-3.5 text-center text-[11px] font-bold text-slate-600 dark:text-zinc-300 uppercase tracking-wider">
                                {renderRoleName(role)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-slate-100 dark:divide-zinc-800/80">
                    {Object.entries(PERMISSION_LABELS).map(([type, label]) => (
                        <React.Fragment key={type}>
                            <tr className="bg-slate-50/60 dark:bg-zinc-800/30">
                                <td colSpan={ROLES.length + 1} className="px-6 py-2.5 text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>{label}</span>
                                </td>
                            </tr>
                            {/* Standard USE permission */}
                            <tr className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                                <td className="px-6 py-3.5 whitespace-nowrap text-xs font-medium text-slate-700 dark:text-zinc-200 pl-10">
                                    Habilitar Módulo
                                </td>
                                {ROLES.map(role => {
                                    const isEnabled = rolePermissions[role]?.[type]?.[Permissions.USE] ?? false;
                                    return (
                                        <td key={`${role}-${type}`} className="px-5 py-3.5 whitespace-nowrap text-center">
                                            <input
                                                type="checkbox"
                                                checked={isEnabled}
                                                onChange={() => handleToggle(role, type, Permissions.USE, isEnabled)}
                                                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-zinc-600 rounded cursor-pointer"
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                            {/* Specific Endpoint Toggles */}
                            {type === PermissionTypes.ENDPOINTS && ENDPOINT_KEYS.map(endpoint => (
                                <tr key={endpoint} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                                    <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-500 dark:text-zinc-400 pl-12 font-mono">
                                        Proveedor: {endpoint.charAt(0).toUpperCase() + endpoint.slice(1)}
                                    </td>
                                    {ROLES.map(role => {
                                        const isEnabled = rolePermissions[role]?.[type]?.[endpoint] ?? false;
                                        return (
                                            <td key={`${role}-${endpoint}`} className="px-5 py-3 whitespace-nowrap text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isEnabled}
                                                    onChange={() => handleToggle(role, type, endpoint, isEnabled)}
                                                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-zinc-600 rounded cursor-pointer"
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
