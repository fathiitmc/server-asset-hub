import "server-only";

export type TeamSummary = {
  id: string;
  name: string;
  slug: string;
  description: string;
  ownerEmail: string;
  memberCount: number;
  assetCount: number;
};

type TeamRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  owner: { email: string } | null;
  members: unknown[];
  assets: unknown[];
};

async function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

export async function listTeams(): Promise<TeamSummary[]> {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return [];
  }

  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: {
      owner: true,
      members: true,
      assets: true,
    },
  });

  return (teams as TeamRecord[]).map((team) => ({
    id: team.id,
    name: team.name,
    slug: team.slug,
    description: team.description ?? "",
    ownerEmail: team.owner?.email ?? "Unassigned",
    memberCount: team.members.length,
    assetCount: team.assets.length,
  }));
}
