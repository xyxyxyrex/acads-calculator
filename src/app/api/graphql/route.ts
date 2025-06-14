import { handler as GET, handler as POST } from '@/graphql/server';
import { NextResponse } from 'next/server';

export { GET, POST };

// Set the runtime to Node.js
export const runtime = 'nodejs';

// Enable CORS for the API route
export const dynamic = 'force-dynamic';

// Disable body parsing for GraphQL
export const config = {
  api: {
    bodyParser: false,
  },
};

// Add CORS headers
export function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
