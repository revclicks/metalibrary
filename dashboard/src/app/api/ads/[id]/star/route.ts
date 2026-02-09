import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req.headers);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ad = await prisma.ad.findFirst({ where: { id, savedById: auth.userId } });
  if (!ad) return NextResponse.json({ error: "Ad not found" }, { status: 404 });

  const updated = await prisma.ad.update({
    where: { id },
    data: { starred: !ad.starred },
  });
  return NextResponse.json({ ad: updated });
}
