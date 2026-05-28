import { redirect } from "next/navigation";
import { loginAction } from "./actions";
import { getSession } from "@/src/lib/auth/session";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

function safeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  if (value.startsWith("/login")) {
    return "/dashboard";
  }

  return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);

  if (session) {
    redirect(nextPath);
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#eef2f7_48%,#e6edf5_100%)] px-4 py-10 text-zinc-950">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:64px_64px] opacity-45" />
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-slate-200/70 to-transparent" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_420px]">
        <section className="hidden max-w-2xl lg:block">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Infrastructure control plane
          </div>
          <h1 className="max-w-xl text-5xl font-semibold leading-tight tracking-tight text-zinc-950">
            Keep critical server assets under quiet control.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-zinc-600">
            Track ownership, renewals, providers, and operational costs from a
            focused workspace built for infrastructure teams.
          </p>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {["Domains", "VPS", "Cloud"].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white/70 bg-white/45 px-4 py-3 shadow-sm backdrop-blur"
              >
                <p className="text-xs font-medium uppercase text-zinc-500">
                  Asset class
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-6 text-center lg:text-left">
            <p className="text-sm font-medium text-zinc-500">
              Server Asset Hub
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Sign in
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Use the admin account to access the asset workspace.
            </p>
          </div>

          <form
            action={loginAction}
            className="rounded-xl border border-white/70 bg-white/70 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl"
          >
            <input type="hidden" name="next" value={nextPath} />

            {params.error === "invalid" ? (
              <p className="mb-5 rounded-lg border border-red-200/80 bg-red-50/80 px-3 py-2 text-sm text-red-700">
                Invalid email or password.
              </p>
            ) : null}

            <label className="block text-sm font-medium text-zinc-700">
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-2 block h-11 w-full rounded-lg border border-zinc-300/80 bg-white/85 px-3 text-sm text-zinc-950 shadow-inner outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
              />
            </label>

            <label className="mt-5 block text-sm font-medium text-zinc-700">
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-2 block h-11 w-full rounded-lg border border-zinc-300/80 bg-white/85 px-3 text-sm text-zinc-950 shadow-inner outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
              />
            </label>

            <button
              type="submit"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white shadow-lg shadow-zinc-950/15 transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950/20"
            >
              Continue
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
