import { NextResponse } from "next/server";

/**
 * Turn a stored base64 data URL into an inline HTTP file response so browsers
 * can render KYC documents (images/PDFs) directly in an <img>/<iframe> or a
 * download link — without ever exposing the raw data URL to the client.
 */
export function dataUrlToResponse(doc: {
  fileName: string;
  mimeType: string;
  dataUrl: string;
}): NextResponse {
  const comma = doc.dataUrl.indexOf(",");
  const base64 = comma >= 0 ? doc.dataUrl.slice(comma + 1) : doc.dataUrl;
  const body = new Uint8Array(Buffer.from(base64, "base64"));
  const safeName = (doc.fileName || "document").replace(/[^\w.\-]+/g, "_");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": doc.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${safeName}"`,
      "Content-Length": String(body.byteLength),
      // KYC docs are private — never let a shared cache retain them.
      "Cache-Control": "private, no-store",
    },
  });
}
