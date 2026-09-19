import { NextRequest, NextResponse } from "next/server";
import { COOKIE_SESSAO, tokenValido } from "@/lib/adminAuth";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_SESSAO)?.value;
  if (await tokenValido(token)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
