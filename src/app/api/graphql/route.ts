import { handler } from "@/graphql/server";
import { NextRequest, NextResponse } from "next/server";

// Set the runtime to Node.js
export const runtime = "nodejs";
// Enable CORS for the API route
export const dynamic = "force-dynamic";

// Wrapper functions to ensure proper Next.js route handler signature
export async function GET(request: NextRequest, context: { params: any }) {
  return handler(request);
}

export async function POST(request: NextRequest, context: { params: any }) {
  return handler(request);
}

// Add CORS headers
export function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  return response;
}

// Note: The config export is not needed in App Router - body parsing is handled differently
