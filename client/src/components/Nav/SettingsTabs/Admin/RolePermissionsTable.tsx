import React, { useState, useEffect } from 'react';
import { useToastContext } from '@librechat/client';
import { SystemRoles, PermissionTypes, Permissions } from 'librechat-data-provider';
import axios from 'axios';

const ROLES = [SystemRoles.USER, SystemRoles.USER_PLUS, SystemRoles.USER_PRO, SystemRoles.ADMIN];

const PERMISSION_LABELS = {
    [PermissionTypes.AGENTS]: 'Constructor de Agentes',
    [PermissionTypes.PROMPTS]: 'Indicaciones',
    [PermissionTypes.MEMORIES]: 'Memories',
    [PermissionTypes.BOOKMARKS]: 'Marcadores',
    [PermissionTypes.WEB_SEARCH]: 'Web Buscar',
    [PermissionTypes.RUN_CODE]: 'Intérprete de Código',
    [PermissionTypes.FILE_SEARCH]: 'Búsqueda de Archivos',
    [PermissionTypes.ARTIFACTS]: 'Artefactos',
    [PermissionTypes.LIVE_CHAT]: 'Live Chat General',
    [PermissionTypes.LIVE_ANALYSIS]: 'Live Analysis',
    [PermissionTypes.ENDPOINTS]: 'Modelos (Endpoints)',
    [PermissionTypes.ATTACHMENTS]: 'Adjuntar Archivos',
    [PermissionTypes.PARAMETERS]: 'Parámetros (Temp, Top P, etc)',
    [PermissionTypes.SGSST]: 'Gestor SG-SST',
};

const ENDPOINT_KEYS = ['openAI', 'google', 'anthropic', 'wappy', 'agents', 'NVIDIA'];

export default function RolePermissionsTable() {
    const { showToast } = useToastContext();
    const [rolePermissions, setRolePermissions] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchPermissions = async () => {
        try {
            // In a real implementation, we would fetch current permissions from the backend.
            // For now, we might need to mock or use a specific endpoint if available.
            // Assuming GET /api/roles returns all roles with permissions.
            // If not, we might need to rely on defaults or implement the endpoint.
            const response = await axios.get('/api/roles');
            // Assuming response.data is an array of roles
            const permissionsMap = {};
            response.data.forEach(role => {
                permissionsMap[role.name] = role.permissions;
            });
            setRolePermissions(permissionsMap);
        } catch (error) {
            console.error('Error fetching role permissions:', error);
            // Fallback to defaults if endpoint fails (for dev/demo)
            // showToast({ message: 'Error fetching permissions', status: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    const handleToggle = async (roleName, permissionType, permissionKey, currentValue) => {
        const newValue = !currentValue;

        // Optimistic update
        setRolePermissions(prev => ({
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
            showToast({ message: 'Permission updated', status: 'success' });
        } catch (error) {
            console.error('Error updating permission:', error);
            showToast({ message: 'Error updating permission', status: 'error' });
            // Revert on error
            setRolePermissions(prev => ({
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

    if (loading) return <div>Loading permissions...</div>;

    return (
        <div className="overflow-x-auto rounded-lg border border-light">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-surface-secondary">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">Feature / Permission</th>
                        {ROLES.map(role => (
                            <th key={role} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
                                {role}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-surface-primary divide-y divide-gray-200 dark:divide-gray-700">
                    {Object.entries(PERMISSION_LABELS).map(([type, label]) => (
                        <React.Fragment key={type}>
                            <tr className="bg-surface-secondary">
                                <td colSpan={ROLES.length + 1} className="px-6 py-2 text-xs font-bold text-primary uppercase">
                                    {label}
                                </td>
                            </tr>
                            {/* Standard USE permission */}
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary pl-10">
                                    Enable Feature
                                </td>
                                {ROLES.map(role => {
                                    const isEnabled = rolePermissions[role]?.[type]?.[Permissions.USE] ?? false;
                                    return (
                                        <td key={`${role}-${type}`} className="px-6 py-4 whitespace-nowrap text-center">
                                            <input
                                                type="checkbox"
                                                checked={isEnabled}
                                                onChange={() => handleToggle(role, type, Permissions.USE, isEnabled)}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                        </td>
                                    );
                                })}
                            </tr>
                            {/* Specific Endpoint Toggles */}
                            {type === PermissionTypes.ENDPOINTS && ENDPOINT_KEYS.map(endpoint => (
                                <tr key={endpoint}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary pl-10">
                                        {endpoint.charAt(0).toUpperCase() + endpoint.slice(1)}
                                    </td>
                                    {ROLES.map(role => {
                                        const isEnabled = rolePermissions[role]?.[type]?.[endpoint] ?? false;
                                        return (
                                            <td key={`${role}-${endpoint}`} className="px-6 py-4 whitespace-nowrap text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isEnabled}
                                                    onChange={() => handleToggle(role, type, endpoint, isEnabled)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
