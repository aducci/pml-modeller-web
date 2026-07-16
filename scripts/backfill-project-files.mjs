// Idempotent data backfill: every Project must have at least one ProjectFile.
// Runs on every deploy (see package.json's "build" script) — a no-op once
// every project already has a file, so it's safe to leave in the pipeline
// permanently rather than treating this as a one-off manual step.
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const projectsWithoutFiles = await db.project.findMany({
    where: { files: { none: {} } },
    select: { id: true, name: true, pmlSource: true, createdByUserId: true, updatedByUserId: true },
  });

  if (projectsWithoutFiles.length === 0) {
    console.log('backfill-project-files: nothing to do, every project already has a file.');
    return;
  }

  for (const project of projectsWithoutFiles) {
    await db.projectFile.create({
      data: {
        projectId: project.id,
        name: 'Main',
        pmlSource: project.pmlSource,
        createdByUserId: project.createdByUserId,
        updatedByUserId: project.updatedByUserId,
      },
    });
  }

  console.log(`backfill-project-files: created a "Main" file for ${projectsWithoutFiles.length} project(s).`);
}

main()
  .catch((err) => {
    console.error('backfill-project-files failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
