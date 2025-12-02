import { useQuery } from '@tanstack/react-query';
import { useRecoilValue } from 'recoil';
import store from '~/store';
import { PermissionTypes, Permissions, SystemRoles } from 'librechat-data-provider';
import axios from 'axios';

export default function useRolePermissions() {
    const user = useRecoilValue(store.user);

    const { data: roleDefinitions } = useQuery(['roleDefinitions'], async () => {
        const response = await axios.get('/api/roles');
        return response.data; // Assuming array of { name, permissions }
    }, {
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
        refetchOnWindowFocus: false,
    });

    const hasPermission = (permissionType: PermissionTypes, permission: string = Permissions.USE) => {
        if (!user) return false;
        if (user.role === SystemRoles.ADMIN) return true;

        if (!roleDefinitions) {
            // Fallback or loading state - maybe deny by default until loaded?
            // Or allow if it's a critical feature? 
            // Safer to deny or return false.
            return false;
        }

        if (!Array.isArray(roleDefinitions)) {
            console.error('roleDefinitions is not an array:', roleDefinitions);
            return false;
        }

        const userRoleDef = roleDefinitions.find((r: any) => r.name === user.role);
        if (!userRoleDef) return false;

        // Check specific permission
        // Structure: roleDef.permissions[permissionType][permission]
        return userRoleDef.permissions?.[permissionType]?.[permission] === true;
    };

    const hasEndpointPermission = (endpointKey: string) => {
        if (!user) return false;
        if (user.role === SystemRoles.ADMIN) return true;
        if (!roleDefinitions) return false;

        const userRoleDef = roleDefinitions.find((r: any) => r.name === user.role);
        if (!userRoleDef) return false;

        // Check ENDPOINTS permission type
        // Structure: roleDef.permissions[PermissionTypes.ENDPOINTS][endpointKey]
        // Also check generic USE permission for endpoints?
        const endpointsPerms = userRoleDef.permissions?.[PermissionTypes.ENDPOINTS];
        if (!endpointsPerms) return false;

        // If generic USE is false, disable all?
        if (endpointsPerms[Permissions.USE] === false) return false;

        // Check specific endpoint key (openAI, google, etc.)
        // If key is missing, default to true or false? 
        // Based on my roles.ts update, I added them explicitly.
        return endpointsPerms[endpointKey] === true;
    };

    return { hasPermission, hasEndpointPermission };
}
