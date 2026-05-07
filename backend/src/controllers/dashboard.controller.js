const prisma = require('../lib/prisma');

const getDashboard = async (req, res, next) => {
  const userId = req.user.id;
  const now = new Date();

  try {
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true, role: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    const [totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks, myTasks, recentTasks] =
      await Promise.all([
        prisma.task.count({ where: { projectId: { in: projectIds } } }),
        prisma.task.count({ where: { projectId: { in: projectIds }, status: 'TODO' } }),
        prisma.task.count({ where: { projectId: { in: projectIds }, status: 'IN_PROGRESS' } }),
        prisma.task.count({ where: { projectId: { in: projectIds }, status: 'DONE' } }),
        prisma.task.count({
          where: {
            projectId: { in: projectIds },
            dueDate: { lt: now },
            status: { not: 'DONE' },
          },
        }),
        prisma.task.findMany({
          where: { assigneeId: userId, status: { not: 'DONE' } },
          include: {
            project: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true } },
          },
          orderBy: { dueDate: 'asc' },
          take: 5,
        }),
        prisma.task.findMany({
          where: { projectId: { in: projectIds } },
          include: {
            project: { select: { id: true, name: true } },
            assignee: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

    const projectStats = await Promise.all(
      memberships.map(async (m) => {
        const project = await prisma.project.findUnique({
          where: { id: m.projectId },
          select: { id: true, name: true, ownerId: true },
        });
        const [total, done, overdue] = await Promise.all([
          prisma.task.count({ where: { projectId: m.projectId } }),
          prisma.task.count({ where: { projectId: m.projectId, status: 'DONE' } }),
          prisma.task.count({
            where: {
              projectId: m.projectId,
              dueDate: { lt: now },
              status: { not: 'DONE' },
            },
          }),
        ]);
        return {
          project,
          role: m.role,
          isOwner: project.ownerId === userId,
          total,
          done,
          overdue,
          progress: total > 0 ? Math.round((done / total) * 100) : 0,
        };
      })
    );

    res.json({
      summary: {
        totalProjects: projectIds.length,
        totalTasks,
        todoTasks,
        inProgressTasks,
        doneTasks,
        overdueTasks,
      },
      myTasks,
      recentTasks,
      projectStats,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
