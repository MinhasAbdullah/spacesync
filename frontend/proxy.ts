import { NextResponse, type NextRequest } from "next/server";
import { refreshAuth } from "@/lib/supabase/proxy";

const protectedPages = ["/dashboard", "/search", "/resources", "/bookings", "/analytics", "/team", "/settings", "/onboarding", "/api-test"];
const authPages = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { response, user } = await refreshAuth(request);
  const pathname = request.nextUrl.pathname;
  if (protectedPages.some((path) => pathname.startsWith(path)) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }
  if (authPages.includes(pathname) && user) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/dashboard";
    destination.search = "";
    return NextResponse.redirect(destination);
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
