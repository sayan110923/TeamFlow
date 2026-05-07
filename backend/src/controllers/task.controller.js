const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

const getMembership = async (userId, projectId) =>
  prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

const listTasks = async (req, res, next) => {
  const { status, priority, assigneeId, search } = req.query;
  try {
    const where = { projectId: req.params.projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

const createTask = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, status, priority, dueDate, assigneeId } = req.body;
  const { projectId } = req.params;

  try {
    if (assigneeId) {
      const assigneeMembership = await getMembership(assigneeId, projectId);
      if (!assigneeMembership) {
        return res.status(400).json({ error: 'Assignee is not a member of this project' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate,
        projectId,
        creatorId: req.user.id,
        assigneeId: assigneeId || null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

const getTask = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const membership = await getMembership(req.user.id, task.projectId);
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    res.json(task);
  } catch (err) {
    next(err);
  }
};

const updateTask = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const membership = await getMembership(req.user.id, task.projectId);
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    if (membership.role === 'MEMBER') {
      const allowedFields = ['status'];
      const requestedFields = Object.keys(req.body);
      const forbidden = requestedFields.filter((f) => !allowedFields.includes(f));
      if (forbidden.length > 0) {
        return res.status(403).json({ error: 'Members can only update task status' });
      }
    }

    if (assigneeId !== undefined && assigneeId !== null) {
      const assigneeMembership = await getMembership(assigneeId, task.projectId);
      if (!assigneeMembership) {
        return res.status(400).json({ error: 'Assignee is not a member of this project' });
      }
    }

    const updated = await prisma.task.update({
      where: { id: req.params.taskId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const membership = await getMembership(req.user.id, task.projectId);
    if (!membership) return res.status(403).json({ error: 'Access denied' });
    if (membership.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });

    await prisma.task.delete({ where: { id: req.params.taskId } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { listTasks, createTask, getTask, updateTask, deleteTask };
