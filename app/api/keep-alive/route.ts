import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ message: "Database is alive" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to keep DB alive" }, { status: 500 });
  }
}