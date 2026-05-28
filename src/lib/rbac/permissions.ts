import "server-only";

import { redirect } from "next/navigation";
import { getSession } from "@/src/lib/auth/session";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "OPERATOR" | "FINANCE" | "VIEWER";

export type Team = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TeamMembership = {
  id: string;
  userId: string;
  teamId: string;
  role: "OWNER" | "MEMBER" | "VIEWER";
  createdAt: Date;
};

export type Permission =
  | "dashboard:view"
  | "assets:view"
  | "assets:write"
  | "assets:delete"
  | "finance:view"
  | "renewals:view"
  | "audit:view"
  | "teams:view"
  | "teams:manage"
  | "automation:view"
  | "automation:manage"
  | "operations:view";

export type GovernanceUser = {
  id: string;
  email: string;
  role: UserRole;
  memberships: Array<
    TeamMembership & {
      team: Team;
    }
  >;
};

const permissionsByRole: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    "dashboard:view",
    "assets:view",
    "assets:write",
    "assets:delete",
    "finance:view",
    "renewals:view",
    "audit:view",
    "teams:view",
    "teams:manage",
    "automation:view",
    "automation:manage",
    "operations:view",
  ],
  ADMIN: [
    "dashboard:view",
    "assets:view",
    "assets:write",
    "assets:delete",
    "finance:view",
    "renewals:view",
    "audit:view",
    "teams:view",
    "teams:manage",
    "automation:view",
    "automation:manage",
    "operations:view",
  ],
  OPERATOR: [
    "dashboard:view",
    "assets:view",
    "assets:write",
    "renewals:view",
    "teams:view",
    "automation:view",
    "automation:manage",
    "operations:view",
  ],
  FINANCE: [
    "dashboard:view",
    "assets:view",
    "finance:view",
    "renewals:view",
    "teams:view",
    "automation:view",
  ],
  VIEWER: ["dashboard:view", "assets:view", "teams:view"],
};

export function hasPermission(
  role: UserRole | undefined,
  permission: Permission,
) {
  return Boolean(role && permissionsByRole[role]?.includes(permission));
}

export function getRolePermissions(role: UserRole | undefined) {
  return role ? permissionsByRole[role] ?? [] : [];
}

async function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

export async function getCurrentUser(): Promise<GovernanceUser | null> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const prisma = await getPrismaClient();

  if (!prisma) {
    return {
      id: session.userId,
      email: session.email,
      role:
        session.email === "admin@serverassethub.local"
          ? "SUPER_ADMIN"
          : "VIEWER",
      memberships: [],
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.email },
    include: {
      teamMemberships: {
        include: { team: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user) {
    return {
      id: session.userId,
      email: session.email,
      role:
        session.email === "admin@serverassethub.local"
          ? "SUPER_ADMIN"
          : "VIEWER",
      memberships: [],
    };
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    memberships: user.teamMemberships,
  };
}

export async function requirePermission(permission: Permission) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!hasPermission(user.role, permission)) {
    redirect("/dashboard?restricted=1");
  }

  return user;
}

export function roleLabel(role: UserRole) {
  return role.replace("_", " ");
}
