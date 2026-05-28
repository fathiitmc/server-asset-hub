import Link from "next/link";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: {
    href: string;
    label: string;
  };
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-zinc-600">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white shadow-sm shadow-zinc-950/15 transition hover:bg-zinc-800"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
