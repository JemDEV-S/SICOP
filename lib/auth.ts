import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "sicop_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 12;

function secret() {
  return process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "dev-secret-change-me";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function createSessionToken(userId: number) {
  const payload = `${userId}.${Date.now() + SESSION_MAX_AGE * 1000}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string) {
  if (!token) return null;
  const [userIdRaw, expiresRaw, signature] = token.split(".");
  if (!userIdRaw || !expiresRaw || !signature) return null;
  const payload = `${userIdRaw}.${expiresRaw}`;
  const expected = sign(payload);
  const valid =
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid || Number(expiresRaw) < Date.now()) return null;
  const userId = Number(userIdRaw);
  return Number.isInteger(userId) ? userId : null;
}

export async function getCurrentAdmin() {
  const store = await cookies();
  const userId = verifySessionToken(store.get(COOKIE_NAME)?.value);
  if (!userId) return null;
  return prisma.usuario.findFirst({
    where: { id: userId, activo: true },
    select: { id: true, username: true, email: true, nombreCompleto: true, rol: true, activo: true },
  });
}

export async function requireAdmin() {
  const user = await getCurrentAdmin();
  if (!user) redirect("/login");
  return user;
}

export async function setSessionCookie(userId: number) {
  const store = await cookies();
  store.set(COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
