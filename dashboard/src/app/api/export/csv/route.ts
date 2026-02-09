import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticateRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req.headers);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ads = await prisma.ad.findMany({
    where: { savedById: auth.userId },
    include: {
      adTags: { include: { tag: true } },
      adFolders: { include: { folder: true } },
    },
    orderBy: { savedAt: "desc" },
  });

  const headers = [
    "Ad Library ID", "Advertiser", "Format", "Status", "Primary Text",
    "Headline", "Description", "CTA", "Destination URL", "Creative URL",
    "Platforms", "Countries", "Start Date", "End Date", "Tags", "Folders", "Saved At"
  ];

  const escapeCSV = (val: string | null | undefined) => {
    if (!val) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const rows = ads.map((ad) => [
    escapeCSV(ad.adLibraryId),
    escapeCSV(ad.advertiserName),
    escapeCSV(ad.format),
    escapeCSV(ad.status),
    escapeCSV(ad.primaryText),
    escapeCSV(ad.headline),
    escapeCSV(ad.description),
    escapeCSV(ad.ctaType),
    escapeCSV(ad.destinationUrl),
    escapeCSV(ad.creativeUrl),
    escapeCSV(ad.platforms),
    escapeCSV(ad.countries),
    escapeCSV(ad.adStartDate?.toISOString()),
    escapeCSV(ad.adEndDate?.toISOString()),
    escapeCSV(ad.adTags.map((at) => at.tag.name).join("; ")),
    escapeCSV(ad.adFolders.map((af) => af.folder.name).join("; ")),
    escapeCSV(ad.savedAt.toISOString()),
  ].join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=meta-ads-export.csv",
    },
  });
}
