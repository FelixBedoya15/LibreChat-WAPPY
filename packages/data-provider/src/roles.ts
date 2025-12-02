import { z } from 'zod';
import {
  Permissions,
  PermissionTypes,
  permissionsSchema,
  agentPermissionsSchema,
  promptPermissionsSchema,
  memoryPermissionsSchema,
  runCodePermissionsSchema,
  bookmarkPermissionsSchema,
  webSearchPermissionsSchema,
  fileSearchPermissionsSchema,
  multiConvoPermissionsSchema,
  temporaryChatPermissionsSchema,
  peoplePickerPermissionsSchema,
  fileCitationsPermissionsSchema,
} from './permissions';

/**
 * Enum for System Defined Roles
 */
export enum SystemRoles {
  /**
   * The Admin role
   */
  ADMIN = 'ADMIN',
  /**
   * The default user role
   */
  USER = 'USER',
  /**
   * The User Plus role
   */
  USER_PLUS = 'USER_PLUS',
  /**
   * The User Pro role
   */
  USER_PRO = 'USER_PRO',
}

export const roleSchema = z.object({
  name: z.string(),
  permissions: permissionsSchema,
});

export type TRole = z.infer<typeof roleSchema>;

const defaultRolesSchema = z.object({
  [SystemRoles.ADMIN]: roleSchema.extend({
    name: z.literal(SystemRoles.ADMIN),
    permissions: permissionsSchema.extend({
      [PermissionTypes.PROMPTS]: promptPermissionsSchema.extend({
        [Permissions.SHARED_GLOBAL]: z.boolean().default(true),
        [Permissions.USE]: z.boolean().default(true),
        [Permissions.CREATE]: z.boolean().default(true),
        // [Permissions.SHARE]: z.boolean().default(true),
      }),
      [PermissionTypes.BOOKMARKS]: bookmarkPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.MEMORIES]: memoryPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
        [Permissions.CREATE]: z.boolean().default(true),
        [Permissions.UPDATE]: z.boolean().default(true),
        [Permissions.READ]: z.boolean().default(true),
        [Permissions.OPT_OUT]: z.boolean().default(true),
      }),
      [PermissionTypes.AGENTS]: agentPermissionsSchema.extend({
        [Permissions.SHARED_GLOBAL]: z.boolean().default(true),
        [Permissions.USE]: z.boolean().default(true),
        [Permissions.CREATE]: z.boolean().default(true),
        // [Permissions.SHARE]: z.boolean().default(true),
      }),
      [PermissionTypes.MULTI_CONVO]: multiConvoPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.TEMPORARY_CHAT]: temporaryChatPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.RUN_CODE]: runCodePermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.WEB_SEARCH]: webSearchPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.PEOPLE_PICKER]: peoplePickerPermissionsSchema.extend({
        [Permissions.VIEW_USERS]: z.boolean().default(true),
        [Permissions.VIEW_GROUPS]: z.boolean().default(true),
        [Permissions.VIEW_ROLES]: z.boolean().default(true),
      }),
      [PermissionTypes.MARKETPLACE]: z.object({
        [Permissions.USE]: z.boolean().default(false),
      }),
      [PermissionTypes.FILE_SEARCH]: fileSearchPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.FILE_CITATIONS]: fileCitationsPermissionsSchema.extend({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.LIVE_CHAT]: z.object({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.LIVE_ANALYSIS]: z.object({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.ARTIFACTS]: z.object({
        [Permissions.USE]: z.boolean().default(true),
      }),
      [PermissionTypes.ENDPOINTS]: z.object({
        [Permissions.USE]: z.boolean().default(true),
        // Default endpoints enabled
        'openAI': z.boolean().default(true),
        'google': z.boolean().default(true),
        'anthropic': z.boolean().default(true),
        'wappy': z.boolean().default(true),
      }).catchall(z.boolean()),
    }),
  }),
  [SystemRoles.USER]: roleSchema.extend({
    name: z.literal(SystemRoles.USER),
    permissions: permissionsSchema,
  }),
  [SystemRoles.USER_PLUS]: roleSchema.extend({
    name: z.literal(SystemRoles.USER_PLUS),
    permissions: permissionsSchema,
  }),
  [SystemRoles.USER_PRO]: roleSchema.extend({
    name: z.literal(SystemRoles.USER_PRO),
    permissions: permissionsSchema,
  }),
});

export const roleDefaults = defaultRolesSchema.parse({
  [SystemRoles.ADMIN]: {
    name: SystemRoles.ADMIN,
    permissions: {
      [PermissionTypes.PROMPTS]: {
        [Permissions.SHARED_GLOBAL]: true,
        [Permissions.USE]: true,
        [Permissions.CREATE]: true,
      },
      [PermissionTypes.BOOKMARKS]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.MEMORIES]: {
        [Permissions.USE]: true,
        [Permissions.CREATE]: true,
        [Permissions.UPDATE]: true,
        [Permissions.READ]: true,
        [Permissions.OPT_OUT]: true,
      },
      [PermissionTypes.AGENTS]: {
        [Permissions.SHARED_GLOBAL]: true,
        [Permissions.USE]: true,
        [Permissions.CREATE]: true,
      },
      [PermissionTypes.MULTI_CONVO]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.TEMPORARY_CHAT]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.RUN_CODE]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.WEB_SEARCH]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.PEOPLE_PICKER]: {
        [Permissions.VIEW_USERS]: true,
        [Permissions.VIEW_GROUPS]: true,
        [Permissions.VIEW_ROLES]: true,
      },
      [PermissionTypes.MARKETPLACE]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.FILE_SEARCH]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.FILE_CITATIONS]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.LIVE_CHAT]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.LIVE_ANALYSIS]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.ARTIFACTS]: {
        [Permissions.USE]: true,
      },
      [PermissionTypes.ENDPOINTS]: {
        [Permissions.USE]: true,
        'openAI': true,
        'google': true,
        'anthropic': true,
        'wappy': true,
      },
    },
  },
  [SystemRoles.USER]: {
    name: SystemRoles.USER,
    permissions: {
      [PermissionTypes.PROMPTS]: {},
      [PermissionTypes.BOOKMARKS]: {},
      [PermissionTypes.MEMORIES]: {},
      [PermissionTypes.AGENTS]: {},
      [PermissionTypes.MULTI_CONVO]: {},
      [PermissionTypes.TEMPORARY_CHAT]: {},
      [PermissionTypes.RUN_CODE]: {},
      [PermissionTypes.WEB_SEARCH]: {},
      [PermissionTypes.PEOPLE_PICKER]: {
        [Permissions.VIEW_USERS]: false,
        [Permissions.VIEW_GROUPS]: false,
        [Permissions.VIEW_ROLES]: false,
      },
      [PermissionTypes.MARKETPLACE]: {
        [Permissions.USE]: false,
      },
      [PermissionTypes.FILE_SEARCH]: {},
      [PermissionTypes.FILE_CITATIONS]: {},
      [PermissionTypes.LIVE_CHAT]: { [Permissions.USE]: true },
      [PermissionTypes.LIVE_ANALYSIS]: { [Permissions.USE]: true },
      [PermissionTypes.ARTIFACTS]: { [Permissions.USE]: true },
      [PermissionTypes.ENDPOINTS]: {
        [Permissions.USE]: true,
        'openAI': true,
        'google': true,
        'anthropic': true,
        'wappy': true,
      },
    },
  },
  [SystemRoles.USER_PLUS]: {
    name: SystemRoles.USER_PLUS,
    permissions: {
      [PermissionTypes.PROMPTS]: {},
      [PermissionTypes.BOOKMARKS]: {},
      [PermissionTypes.MEMORIES]: {},
      [PermissionTypes.AGENTS]: {},
      [PermissionTypes.MULTI_CONVO]: {},
      [PermissionTypes.TEMPORARY_CHAT]: {},
      [PermissionTypes.RUN_CODE]: {},
      [PermissionTypes.WEB_SEARCH]: {},
      [PermissionTypes.PEOPLE_PICKER]: {
        [Permissions.VIEW_USERS]: false,
        [Permissions.VIEW_GROUPS]: false,
        [Permissions.VIEW_ROLES]: false,
      },
      [PermissionTypes.MARKETPLACE]: {
        [Permissions.USE]: false,
      },
      [PermissionTypes.FILE_SEARCH]: {},
      [PermissionTypes.FILE_CITATIONS]: {},
      [PermissionTypes.LIVE_CHAT]: { [Permissions.USE]: true },
      [PermissionTypes.LIVE_ANALYSIS]: { [Permissions.USE]: true },
      [PermissionTypes.ARTIFACTS]: { [Permissions.USE]: true },
      [PermissionTypes.ENDPOINTS]: {
        [Permissions.USE]: true,
        'openAI': true,
        'google': true,
        'anthropic': true,
        'wappy': true,
      },
    },
  },
  [SystemRoles.USER_PRO]: {
    name: SystemRoles.USER_PRO,
    permissions: {
      [PermissionTypes.PROMPTS]: {},
      [PermissionTypes.BOOKMARKS]: {},
      [PermissionTypes.MEMORIES]: {},
      [PermissionTypes.AGENTS]: {},
      [PermissionTypes.MULTI_CONVO]: {},
      [PermissionTypes.TEMPORARY_CHAT]: {},
      [PermissionTypes.RUN_CODE]: {},
      [PermissionTypes.WEB_SEARCH]: {},
      [PermissionTypes.PEOPLE_PICKER]: {
        [Permissions.VIEW_USERS]: false,
        [Permissions.VIEW_GROUPS]: false,
        [Permissions.VIEW_ROLES]: false,
      },
      [PermissionTypes.MARKETPLACE]: {
        [Permissions.USE]: false,
      },
      [PermissionTypes.FILE_SEARCH]: {},
      [PermissionTypes.FILE_CITATIONS]: {},
      [PermissionTypes.LIVE_CHAT]: { [Permissions.USE]: true },
      [PermissionTypes.LIVE_ANALYSIS]: { [Permissions.USE]: true },
      [PermissionTypes.ARTIFACTS]: { [Permissions.USE]: true },
      [PermissionTypes.ENDPOINTS]: {
        [Permissions.USE]: true,
        'openAI': true,
        'google': true,
        'anthropic': true,
        'wappy': true,
      },
    },
  },
});
