import { PrismaClient, UserRole, AccountStatus, RepositoryVisibility, TaskType, TaskPriority, TaskStatus, WorkerStatus, FindingCategory, SeverityLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Prisma Database Seed for NexusFlow...');

  // 1. Seed Demo Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nexusflow.io' },
    update: {},
    create: {
      name: 'Alex Vance',
      username: 'alexvance',
      email: 'admin@nexusflow.io',
      githubId: 'gh_1001',
      role: UserRole.ADMIN,
      status: AccountStatus.ACTIVE,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      settings: {
        create: {
          theme: 'dark',
          emailNotifications: true,
        },
      },
    },
  });

  console.log(`✅ Seeded User: ${adminUser.username} (${adminUser.email})`);

  // 2. Seed Sample Repositories
  const repo1 = await prisma.repository.upsert({
    where: { fullName: 'facebook/react' },
    update: {},
    create: {
      userId: adminUser.id,
      githubRepoId: BigInt(10270250),
      owner: 'facebook',
      name: 'react',
      fullName: 'facebook/react',
      description: 'The library for web and native user interfaces.',
      visibility: RepositoryVisibility.PUBLIC,
      language: 'JavaScript',
      starsCount: 228000,
      forksCount: 46200,
      openIssues: 720,
      githubUrl: 'https://github.com/facebook/react',
      cloneUrl: 'https://github.com/facebook/react.git',
      statistics: {
        create: {
          linesOfCode: BigInt(450000),
          commitCount: 16500,
          healthScore: 94.5,
        },
      },
    },
  });

  const repo2 = await prisma.repository.upsert({
    where: { fullName: 'vercel/next.js' },
    update: {},
    create: {
      userId: adminUser.id,
      githubRepoId: BigInt(70107786),
      owner: 'vercel',
      name: 'next.js',
      fullName: 'vercel/next.js',
      description: 'The React Framework for the Web.',
      visibility: RepositoryVisibility.PUBLIC,
      language: 'TypeScript',
      starsCount: 122000,
      forksCount: 26100,
      openIssues: 1450,
      githubUrl: 'https://github.com/vercel/next.js',
      cloneUrl: 'https://github.com/vercel/next.js.git',
      statistics: {
        create: {
          linesOfCode: BigInt(890000),
          commitCount: 22400,
          healthScore: 88.0,
        },
      },
    },
  });

  console.log(`✅ Seeded Repositories: ${repo1.fullName}, ${repo2.fullName}`);

  // 3. Seed Worker Nodes
  const worker1 = await prisma.worker.upsert({
    where: { workerId: 'java-worker-node-01' },
    update: { status: WorkerStatus.IDLE, lastHeartbeat: new Date() },
    create: {
      workerId: 'java-worker-node-01',
      hostIdentifier: 'cloud-run-us-central1-a',
      status: WorkerStatus.IDLE,
      activeThreads: 2,
      maxThreads: 16,
      tasksCompleted: 42,
      tasksFailed: 1,
    },
  });

  console.log(`✅ Seeded Worker Node: ${worker1.workerId}`);

  // 4. Seed Tasks
  const task1 = await prisma.task.create({
    data: {
      repositoryId: repo1.id,
      userId: adminUser.id,
      taskType: TaskType.FULL_SCAN,
      priority: TaskPriority.HIGH,
      status: TaskStatus.COMPLETED,
      progress: 100,
      completedAt: new Date(),
      workerId: worker1.id,
    },
  });

  console.log(`✅ Seeded Task: ${task1.id}`);

  // 5. Seed AI Analysis Report
  await prisma.aIAnalysisReport.create({
    data: {
      repositoryId: repo1.id,
      taskId: task1.id,
      overallScore: 92.0,
      securityScore: 95.0,
      performanceScore: 90.0,
      architectureScore: 88.0,
      maintainabilityScore: 93.0,
      documentationScore: 94.0,
      summary: 'Automated AI audit confirms excellent component modularity, strict memory isolation, and high test coverage.',
      modelName: 'gemini-3.6-flash',
      findings: {
        create: [
          {
            category: FindingCategory.PERFORMANCE,
            severity: SeverityLevel.LOW,
            title: 'Unnecessary closure allocations in inner render loops',
            description: 'Inline callbacks in list items can cause minor re-render pressure under heavy loads.',
            filePath: 'packages/react-dom/src/events/DOMPluginEventSystem.js',
            lineNumber: 142,
            recommendation: 'Use useCallback or extract memoized handler functions.',
          },
          {
            category: FindingCategory.SECURITY,
            severity: SeverityLevel.INFO,
            title: 'Strict CSP validation passed',
            description: 'No unsafe-eval or raw innerHTML injections detected in public entry points.',
            recommendation: 'Maintain strict header definitions.',
          },
        ],
      },
    },
  });

  console.log('🎉 Prisma database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
