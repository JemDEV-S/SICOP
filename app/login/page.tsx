import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  if (await getCurrentAdmin()) redirect("/admin");
  const params = (await searchParams) ?? {};

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)] p-4 text-[var(--fg)]">
      <form action="/api/admin/login" method="post" className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--panel)] p-6">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--fg-muted)]">SICOP</p>
          <h1 className="mt-1 text-xl font-semibold">Acceso administrativo</h1>
        </div>
        {params.error ? <p className="mb-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">Credenciales inválidas o límite alcanzado.</p> : null}
        <label className="grid gap-1 text-sm">
          <span>Usuario</span>
          <input name="username" required className="sicop-input" />
        </label>
        <label className="mt-3 grid gap-1 text-sm">
          <span>Contraseña</span>
          <input name="password" type="password" required className="sicop-input" />
        </label>
        <button className="mt-5 h-10 w-full rounded bg-[var(--accent)] font-semibold text-white">Ingresar</button>
      </form>
    </main>
  );
}
