export function buildProjectScopeWhere(userId: string, organizationId: string, allowLegacyPersonalRows: boolean) {
  if (!allowLegacyPersonalRows) {
    return { organizationId };
  }

  return {
    OR: [
      { organizationId },
      { userId, organizationId: null },
    ],
  };
}
