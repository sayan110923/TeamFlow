const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { loadProject, requireAdmin } = require('../middleware/project.middleware');
const projectController = require('../controllers/project.controller');

router.use(authenticate);

// List & create projects
router.get('/', projectController.listProjects);
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('description').optional().trim(),
  ],
  projectController.createProject
);

// Single project operations
router.get('/:projectId', loadProject, projectController.getProject);
router.put(
  '/:projectId',
  loadProject,
  requireAdmin,
  [body('name').optional().trim().notEmpty()],
  projectController.updateProject
);
router.delete('/:projectId', loadProject, requireAdmin, projectController.deleteProject);

// Member management
router.get('/:projectId/members', loadProject, projectController.listMembers);
router.post(
  '/:projectId/members',
  loadProject,
  requireAdmin,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('role').optional().isIn(['ADMIN', 'MEMBER']),
  ],
  projectController.addMember
);
router.put(
  '/:projectId/members/:userId',
  loadProject,
  requireAdmin,
  [body('role').isIn(['ADMIN', 'MEMBER']).withMessage('Role must be ADMIN or MEMBER')],
  projectController.updateMemberRole
);
router.delete('/:projectId/members/:userId', loadProject, requireAdmin, projectController.removeMember);

module.exports = router;
