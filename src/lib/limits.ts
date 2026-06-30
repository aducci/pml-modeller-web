import { db } from './db';
import type { UsageType } from '@prisma/client';

export const LIMITS = {
  FREE:    { projects: 3,   aiCalls: 10,  snapshots: 3  },
  STARTER: { projects: 20,  aiCalls: 100, snapshots: 10 },
  PRO:     { projects: Infinity, aiCalls: Infinity, snapshots: Infinity }
};

export async function checkLimit(userId: string, type: UsageType) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { projects: true } } },
  });

  if (!user) throw new Error('User not found');

  const plan = user.plan;
  const limit = LIMITS[plan];

  if (limit.projects !== Infinity && (user._count.projects ?? 0) >= limit.projects) {
    throw new Error('Project limit reached');
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usageCount = await db.usageRecord.count({
    where: { userId, type, createdAt: { gte: startOfMonth } },
  });

  const limitMap: Record<UsageType, number> = {
    AI_CALL: limit.aiCalls,
    EXPORT: limit.projects,
    DIAGRAM_RENDER: Infinity,
  };

  if (usageCount >= limitMap[type]) {
    throw new Error(`${type} limit reached`);
  }
}
