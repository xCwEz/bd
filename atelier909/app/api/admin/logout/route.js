import { NextResponse } from "next/server";
import { COOKIE_SESSION } from "@/lib/auth";

export async function POST(requete) {
  const origine = new URL(requete.url).origin;
  const reponse = NextResponse.redirect(`${origine}/admin/connexion`, 303);
  reponse.cookies.delete(COOKIE_SESSION);
  return reponse;
}
