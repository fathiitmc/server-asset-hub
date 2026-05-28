import "server-only";

export type RegistryOption = {
  id: string;
  name: string;
  slug: string;
};

export type AssetRegistryOptions = {
  providers: RegistryOption[];
  owners: RegistryOption[];
  tags: RegistryOption[];
};

export const defaultProviders = [
  "AWS",
  "Hetzner",
  "Cloudflare",
  "Namecheap",
  "Zoho",
  "DigitalOcean",
  "Google Cloud",
  "Azure",
] as const;

export const defaultOwners = [
  "Personal",
  "Internal",
  "Operations",
  "Finance",
  "Client",
  "Infrastructure",
] as const;

export const defaultTags = [
  "critical",
  "production",
  "finance",
  "ai",
  "temporary",
  "client",
] as const;

function slugify(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "item"
  );
}

function staticOptions(values: readonly string[]): RegistryOption[] {
  return values.map((name) => ({
    id: slugify(name),
    name,
    slug: slugify(name),
  }));
}

async function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

export async function getAssetRegistryOptions(): Promise<AssetRegistryOptions> {
  try {
    const prisma = await getPrismaClient();

    if (!prisma) {
      return {
        providers: staticOptions(defaultProviders),
        owners: staticOptions(defaultOwners),
        tags: staticOptions(defaultTags),
      };
    }

    await seedAssetRegistries();

    const [providers, owners, tags] = await Promise.all([
      prisma.assetProvider.findMany({ orderBy: { name: "asc" } }),
      prisma.assetOwner.findMany({ orderBy: { name: "asc" } }),
      prisma.assetTag.findMany({ orderBy: { name: "asc" } }),
    ]);

    return { providers, owners, tags };
  } catch (error) {
    console.error("Asset registry read failed; using defaults.", error);
    return {
      providers: staticOptions(defaultProviders),
      owners: staticOptions(defaultOwners),
      tags: staticOptions(defaultTags),
    };
  }
}

export async function seedAssetRegistries() {
  const prisma = await getPrismaClient();

  if (!prisma) {
    return;
  }

  await Promise.all([
    ...defaultProviders.map((name) =>
      prisma.assetProvider.upsert({
        where: { name },
        update: {},
        create: { name, slug: slugify(name) },
      }),
    ),
    ...defaultOwners.map((name) =>
      prisma.assetOwner.upsert({
        where: { name },
        update: {},
        create: { name, slug: slugify(name) },
      }),
    ),
    ...defaultTags.map((name) =>
      prisma.assetTag.upsert({
        where: { name },
        update: {},
        create: { name, slug: slugify(name) },
      }),
    ),
  ]);
}

export async function ensureProvider(name: string) {
  const prisma = await getPrismaClient();
  const normalized = name.trim();

  if (!prisma || !normalized) {
    return null;
  }

  return prisma.assetProvider.upsert({
    where: { name: normalized },
    update: {},
    create: { name: normalized, slug: slugify(normalized) },
  });
}

export async function ensureOwner(name: string) {
  const prisma = await getPrismaClient();
  const normalized = name.trim();

  if (!prisma || !normalized) {
    return null;
  }

  return prisma.assetOwner.upsert({
    where: { name: normalized },
    update: {},
    create: { name: normalized, slug: slugify(normalized) },
  });
}

export async function ensureTags(names: string[]) {
  const prisma = await getPrismaClient();
  const normalized = Array.from(
    new Set(names.map((name) => name.trim().toLowerCase()).filter(Boolean)),
  );

  if (!prisma || normalized.length === 0) {
    return [];
  }

  return Promise.all(
    normalized.map((name) =>
      prisma.assetTag.upsert({
        where: { name },
        update: {},
        create: { name, slug: slugify(name) },
      }),
    ),
  );
}
