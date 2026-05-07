const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { loadProject } = require('../middleware/project.middleware');
const taskController = require('../controllers/task.controller');

router.use(authenticate);

// Tasks scoped to a project
router.get('/project/:projectId', loadProject, taskController.listTasks);
router.post(
  '/project/:projectId',
  loadProject,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('dueDate').optional().isISO8601().toDate(),
    body('assigneeId').optional().isString(),
  ],
  taskController.createTask
);

// Single task operations (no project middleware needed — we verify membership inside)
router.get('/:taskId', taskController.getTask);
router.put(
  '/:taskId',
  [
    body('title').optional().trim().notEmpty(),
    body('status').optional().isIn(['TODO', 'IN_PROGRESS', 'DONE']),
    body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH']),
    body('dueDate').optional().isISO8601().toDate(),
    body('assigneeId').optional(),
  ],
  taskController.updateTask
);
router.delete('/:taskId', taskController.deleteTask);

module.exports = router;
