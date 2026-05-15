import { NextResponse } from "next/server";

export const CACHE_HEADERS = {
  "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
};

export function okJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...CACHE_HEADERS,
      ...init?.headers,
    },
  });
}

export function errorJson(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
