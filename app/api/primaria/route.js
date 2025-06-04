import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  // Returnează prima primărie (sau null dacă nu există)
  const primaria = await prisma.primaria.findFirst();
  return NextResponse.json(primaria || {});
}
