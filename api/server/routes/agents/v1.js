const express = require('express');
const { generateCheckAccess } = require('@librechat/api');
const { PermissionTypes, Permissions, PermissionBits } = require('librechat-data-provider');
const { requireJwtAuth, configMiddleware, canAccessAgentResource, checkAdmin } = require('~/server/middleware');
const v1 = require('~/server/controllers/agents/v1');
const { getRoleByName } = require('~/models/Role');
const actions = require('./actions');
const tools = require('./tools');

const router = express.Router();
const avatar = express.Router();

const checkAgentAccess = generateCheckAccess({
  permissionType: PermissionTypes.AGENTS,
  permissions: [Permissions.USE],
  getRoleByName,
});
const checkAgentCreate = generateCheckAccess({
  permissionType: PermissionTypes.AGENTS,
  permissions: [Permissions.USE, Permissions.CREATE],
  getRoleByName,
});

const checkGlobalAgentShare = generateCheckAccess({
  permissionType: PermissionTypes.AGENTS,
  permissions: [Permissions.USE, Permissions.CREATE],
  bodyProps: {
    [Permissions.SHARED_GLOBAL]: ['projectIds', 'removeProjectIds'],
  },
  getRoleByName,
});

router.use(requireJwtAuth);

/**
 * Agent actions route.
 * @route GET|POST /agents/actions
 */
router.use('/actions', configMiddleware, actions);

/**
 * Get a list of available tools for agents.
 * @route GET /agents/tools
 */
router.use('/tools', configMiddleware, tools);

/**
 * Reorder agents.
 * @route POST /agents/reorder
 */
router.post('/reorder', checkAgentAccess, v1.reorderAgents);

/**
 * Get all agent categories with counts
 * @route GET /agents/categories
 */
router.get('/categories', v1.getAgentCategories);

/**
 * Get all available agent skills.
 * Excludes skills with scope: 'tenshi' (those are exclusive to the Tenshi widget).
 * @route GET /agents/skills
 */
router.get('/skills', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const yaml = require('js-yaml');
  const SKILLS_DIR = path.join(__dirname, '../../../config/skills');

  if (!fs.existsSync(SKILLS_DIR)) {
    return res.json([]);
  }

  try {
    const files = fs.readdirSync(SKILLS_DIR);
    const skills = [];
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = fs.readFileSync(path.join(SKILLS_DIR, file), 'utf8');
        const match = content.match(/^---([\s\S]*?)---([\s\S]*)$/);
        if (match) {
          try {
            const frontmatter = yaml.load(match[1]);
            // Exclude skills scoped exclusively to Tenshi
            const scope = frontmatter.scope || 'all';
            if (scope === 'tenshi') continue;
            skills.push({
              id: file.replace('.md', ''),
              name: frontmatter.name || file.replace('.md', ''),
              description: frontmatter.description || '',
              triggers: frontmatter.triggers || [],
              scope,
            });
          } catch (e) {
            // ignore parse error
          }
        }
      }
    }
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get details of a specific skill, including its full markdown content.
 * @route GET /agents/skills/:id
 */
router.get('/skills/:id', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const yaml = require('js-yaml');
  const SKILLS_DIR = path.join(__dirname, '../../../config/skills');
  
  if (!/^[a-z0-9_-]+$/.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid skill ID' });
  }
  
  const filePath = path.join(SKILLS_DIR, `${req.params.id}.md`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Skill not found' });
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^---([\s\S]*?)---([\s\S]*)$/);
    if (match) {
      const frontmatter = yaml.load(match[1]);
      return res.json({
        id: req.params.id,
        name: frontmatter.name || req.params.id,
        description: frontmatter.description || '',
        triggers: frontmatter.triggers || [],
        scope: frontmatter.scope || 'all',
        content: match[2].trim(),
      });
    } else {
      return res.json({
        id: req.params.id,
        name: req.params.id,
        description: '',
        triggers: [],
        scope: 'all',
        content: content.trim(),
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Create a new skill (Admin only).
 * @route POST /agents/skills
 */
router.post('/skills', requireJwtAuth, checkAdmin, (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const yaml = require('js-yaml');
  const SKILLS_DIR = path.join(__dirname, '../../../config/skills');
  
  const { name, description, triggers, scope = 'all', content = '' } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  const id = name.toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/(^-|-$)/g, '');
    
  if (!id) {
    return res.status(400).json({ error: 'Invalid name provided' });
  }
  
  const filename = `${id}.md`;
  const filePath = path.join(SKILLS_DIR, filename);
  
  if (fs.existsSync(filePath)) {
    return res.status(400).json({ error: 'A skill with this name already exists' });
  }
  
  try {
    const frontmatter = {
      name: id,
      description: description || '',
      triggers: Array.isArray(triggers) ? triggers : [],
      scope,
    };
    
    const yamlStr = yaml.dump(frontmatter);
    const fileContent = `---\n${yamlStr}---\n\n${content.trim()}\n`;
    
    if (!fs.existsSync(SKILLS_DIR)) {
      fs.mkdirSync(SKILLS_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, fileContent, 'utf8');
    return res.status(201).json({ id, name: id, description, triggers, scope, content });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Update an existing skill (Admin only).
 * @route PUT /agents/skills/:id
 */
router.put('/skills/:id', requireJwtAuth, checkAdmin, (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const yaml = require('js-yaml');
  const SKILLS_DIR = path.join(__dirname, '../../../config/skills');
  
  if (!/^[a-z0-9_-]+$/.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid skill ID' });
  }
  
  const filePath = path.join(SKILLS_DIR, `${req.params.id}.md`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Skill not found' });
  }
  
  const { description, triggers, scope = 'all', content = '' } = req.body;
  
  try {
    const frontmatter = {
      name: req.params.id,
      description: description || '',
      triggers: Array.isArray(triggers) ? triggers : [],
      scope,
    };
    
    const yamlStr = yaml.dump(frontmatter);
    const fileContent = `---\n${yamlStr}---\n\n${content.trim()}\n`;
    
    fs.writeFileSync(filePath, fileContent, 'utf8');
    return res.json({ id: req.params.id, name: req.params.id, description, triggers, scope, content });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Delete a skill (Admin only).
 * @route DELETE /agents/skills/:id
 */
router.delete('/skills/:id', requireJwtAuth, checkAdmin, (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const SKILLS_DIR = path.join(__dirname, '../../../config/skills');
  
  if (!/^[a-z0-9_-]+$/.test(req.params.id)) {
    return res.status(400).json({ error: 'Invalid skill ID' });
  }
  
  const filePath = path.join(SKILLS_DIR, `${req.params.id}.md`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Skill not found' });
  }
  
  try {
    fs.unlinkSync(filePath);
    return res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * Creates an agent.
 * @route POST /agents
 * @param {AgentCreateParams} req.body - The agent creation parameters.
 * @returns {Agent} 201 - Success response - application/json
 */
router.post('/', checkAgentCreate, v1.createAgent);

/**
 * Retrieves basic agent information (VIEW permission required).
 * Returns safe, non-sensitive agent data for viewing purposes.
 * @route GET /agents/:id
 * @param {string} req.params.id - Agent identifier.
 * @returns {Agent} 200 - Basic agent info - application/json
 */
router.get(
  '/:id',
  checkAgentAccess,
  canAccessAgentResource({
    requiredPermission: PermissionBits.VIEW,
    resourceIdParam: 'id',
  }),
  v1.getAgent,
);

/**
 * Retrieves full agent details including sensitive configuration (EDIT permission required).
 * Returns complete agent data for editing/configuration purposes.
 * @route GET /agents/:id/expanded
 * @param {string} req.params.id - Agent identifier.
 * @returns {Agent} 200 - Full agent details - application/json
 */
router.get(
  '/:id/expanded',
  checkAgentAccess,
  canAccessAgentResource({
    requiredPermission: PermissionBits.EDIT,
    resourceIdParam: 'id',
  }),
  (req, res) => v1.getAgent(req, res, true), // Expanded version
);
/**
 * Updates an agent.
 * @route PATCH /agents/:id
 * @param {string} req.params.id - Agent identifier.
 * @param {AgentUpdateParams} req.body - The agent update parameters.
 * @returns {Agent} 200 - Success response - application/json
 */
router.patch(
  '/:id',
  checkGlobalAgentShare,
  canAccessAgentResource({
    requiredPermission: PermissionBits.EDIT,
    resourceIdParam: 'id',
  }),
  v1.updateAgent,
);

/**
 * Duplicates an agent.
 * @route POST /agents/:id/duplicate
 * @param {string} req.params.id - Agent identifier.
 * @returns {Agent} 201 - Success response - application/json
 */
router.post(
  '/:id/duplicate',
  checkAgentCreate,
  canAccessAgentResource({
    requiredPermission: PermissionBits.VIEW,
    resourceIdParam: 'id',
  }),
  v1.duplicateAgent,
);

/**
 * Deletes an agent.
 * @route DELETE /agents/:id
 * @param {string} req.params.id - Agent identifier.
 * @returns {Agent} 200 - success response - application/json
 */
router.delete(
  '/:id',
  checkAgentCreate,
  canAccessAgentResource({
    requiredPermission: PermissionBits.DELETE,
    resourceIdParam: 'id',
  }),
  v1.deleteAgent,
);

/**
 * Reverts an agent to a previous version.
 * @route POST /agents/:id/revert
 * @param {string} req.params.id - Agent identifier.
 * @param {number} req.body.version_index - Index of the version to revert to.
 * @returns {Agent} 200 - success response - application/json
 */
router.post('/:id/revert', checkGlobalAgentShare, v1.revertAgentVersion);

/**
 * Returns a list of agents.
 * @route GET /agents
 * @param {AgentListParams} req.query - The agent list parameters for pagination and sorting.
 * @returns {AgentListResponse} 200 - success response - application/json
 */
router.get('/', checkAgentAccess, v1.getListAgents);

/**
 * Uploads and updates an avatar for a specific agent.
 * @route POST /agents/:agent_id/avatar
 * @param {string} req.params.agent_id - The ID of the agent.
 * @param {Express.Multer.File} req.file - The avatar image file.
 * @param {string} [req.body.metadata] - Optional metadata for the agent's avatar.
 * @returns {Object} 200 - success response - application/json
 */
avatar.post(
  '/:agent_id/avatar/',
  checkAgentAccess,
  canAccessAgentResource({
    requiredPermission: PermissionBits.EDIT,
    resourceIdParam: 'agent_id',
  }),
  v1.uploadAgentAvatar,
);

module.exports = { v1: router, avatar };
