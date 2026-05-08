const { validationResult } = require('express-validator');
const prisma = require('../lib/prisma');

const listProjects = async (req, res, next) => {
  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId: req.user.id },
      include: {
        project: {
          include: {
            _count: { select: { tasks: true, members: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const projects = memberships.map((m) => ({
      ...m.project,
      myRole: m.role,
    }));

    res.json(projects);
  } catch (err) {
    next(err);
  }
};

const createProject = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  try {
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: req.user.id,
        members: {
          create: { userId: req.user.id, role: 'ADMIN' },
        },
      },
      include: {
        _count: { select: { tasks: true, members: true } },
      },
    });

    res.status(201).json({ ...project, myRole: 'ADMIN' });
  } catch (err) {
    next(err);
  }
};

const getProject = async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.projectId },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
        _count: { select: { tasks: true } },
      },
    });

    res.json({ ...project, myRole: req.membership.role });
  } catch (err) {
    next(err);
  }
};

const updateProject = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, description } = req.body;
  try {
    const project = await prisma.project.update({
      where: { id: req.params.projectId },
      data: { name, description },
    });
    res.json(project);
  } catch (err) {
    next(err);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.projectId } });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

const listMembers = async (req, res, next) => {
  try {
    const members = await prisma.projectMember.findMany({
      where: { projectId: req.params.projectId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json(members);
  } catch (err) {
    next(err);
  }
};

const addMember = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, role = 'MEMBER' } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: req.params.projectId, userId: user.id } },
    });
    if (existing) return res.status(409).json({ error: 'User is already a member' });

    const member = await prisma.projectMember.create({
      data: { projectId: req.params.projectId, userId: user.id, role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json(member);
  } catch (err) {
    next(err);
  }
};

const updateMemberRole = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { role } = req.body;
  const { projectId, userId } = req.params;

  if (role === 'MEMBER') {
    const adminCount = await prisma.projectMember.count({
      where: { projectId, role: 'ADMIN' },
    });
    const targetMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (adminCount === 1 && targetMember?.role === 'ADMIN') {
      return res.status(400).json({ error: 'Cannot demote the last admin' });
    }
  }

  try {
    const member = await prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    res.json(member);
  } catch (err) {
    next(err);
  }
};

const removeMember = async (req, res, next) => {
  const { projectId, userId } = req.params;

  try {
    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
    res.json({ message: 'Member removed' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  listMembers,
  addMember,
  updateMemberRole,
  removeMember,
};
