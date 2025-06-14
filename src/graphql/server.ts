import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { readFileSync } from 'fs';
import path from 'path';
import { verify } from 'jsonwebtoken';
import { db } from '@/db';
import { users } from '@/db/schema/auth';
import { authResolvers } from './resolvers/auth';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

type User = typeof users.$inferSelect;

// Define the context type
export interface Context {
  req: NextRequest;
  user: User | null;
}

// Load GraphQL schema
const typeDefs = readFileSync(
  path.join(process.cwd(), 'src/graphql/schema/auth.graphql'),
  'utf-8'
);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers: authResolvers,
});

// Create Apollo Server
export const apolloServer = new ApolloServer<Context>({
  schema,
  introspection: process.env.NODE_ENV !== 'production',
});

// Create context with user authentication
export const createContext = async (req: NextRequest): Promise<Context> => {
  // Get the token from the Authorization header
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.split(' ')[1] || '';

  if (!token) {
    return { req, user: null };
  }

  try {
    // Verify token
    const decoded = verify(token, JWT_SECRET) as { userId: string };
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId));
    
    if (user) {
      return { req, user };
    }
  } catch (error) {
    console.error('Error verifying token:', error);
  }
  
  return { req, user: null };
};

// Create the handler for App Router
export const handler = startServerAndCreateNextHandler(apolloServer, {
  context: async (req) => {
    // Convert headers to a format compatible with NextRequest
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v));
      } else if (value) {
        headers.set(key, value);
      }
    });
    
    const nextReq = new NextRequest(req.url || '/', {
      headers,
    });
    return createContext(nextReq);
  },
});

// Export the handler for GET and POST methods
export { handler as GET, handler as POST };
