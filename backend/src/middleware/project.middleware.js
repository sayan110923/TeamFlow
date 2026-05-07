const prisma = require('../lib/prisma');

const loadProject = async (req, res, next) => {
  const { projectId } = req.params;
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });
    if (!membership) return res.status(403).json({ error: 'Not a member of this project' });

    req.project = project;
    req.membership = membership;
    next();
  } catch (err) {
    next(err);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.membership.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { loadProject, requireAdmin };
