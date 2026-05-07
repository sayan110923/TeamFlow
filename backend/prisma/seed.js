const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@demo.com',
      password: adminPassword,
    },
  });

  const memberPassword = await bcrypt.hash('member123', 10);
  const member = await prisma.user.upsert({
    where: { email: 'member@demo.com' },
    update: {},
    create: {
      name: 'Jane Member',
      email: 'member@demo.com',
      password: memberPassword,
    },
  });

  const project = await prisma.project.upsert({
    where: { id: 'demo-project-1' },
    update: {},
    create: {
      id: 'demo-project-1',
      name: 'Demo Project',
      description: 'A sample project to showcase the app',
      ownerId: admin.id,
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: admin.id } },
    update: {},
    create: {
      projectId: project.id,
      userId: admin.id,
      role: 'ADMIN',
    },
  });

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId: project.id, userId: member.id } },
    update: {},
    create: {
      projectId: project.id,
      userId: member.id,
      role: 'MEMBER',
    },
  });

  const tasks = [
    {
      title: 'Set up project repository',
      description: 'Initialize Git repo and configure CI/CD',
      status: 'DONE',
      priority: 'HIGH',
      projectId: project.id,
      creatorId: admin.id,
      assigneeId: admin.id,
    },
    {
      title: 'Design database schema',
      description: 'Create ERD and finalize table structures',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: project.id,
      creatorId: admin.id,
      assigneeId: member.id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Build REST API endpoints',
      description: 'Implement CRUD operations for all resources',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: project.id,
      creatorId: admin.id,
      assigneeId: member.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Write unit tests',
      description: 'Achieve 80% code coverage',
      status: 'TODO',
      priority: 'LOW',
      projectId: project.id,
      creatorId: admin.id,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  console.log('Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
