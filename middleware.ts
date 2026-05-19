import { NextResponse, type NextRequest } from "next/server";
import { absoluteUrl } from "@/lib/url";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("sicop_admin_session")?.value;
  if (!token) {
    return NextResponse.redirect(absoluteUrl("/login", request));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/cargas/:path*"],
};
