import { NextResponse } from "next/server";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const GID_MAP: Record<string, string> = {
  races: "267782969",
  participants: "573958893",
  members: "0",
  records: "1638315503",
  fees: "671485688",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sheet: string }> },
) {
  const { sheet } = await params;
  const gid = GID_MAP[sheet];

  if (!gid) {
    return NextResponse.json({ error: "Unknown sheet" }, { status: 404 });
  }

  if (!SHEET_ID) {
    return NextResponse.json(
      { error: "GOOGLE_SHEET_ID not configured" },
      { status: 500 },
    );
  }

  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;

  const res = await fetch(csvUrl, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Google Sheets responded with ${res.status}` },
      { status: 502 },
    );
  }

  const text = await res.text();

  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
