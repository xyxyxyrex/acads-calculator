import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { readFileSync } from "fs";
import path from "path";
import { verify } from "jsonwebtoken";
import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { authResolvers } from "./resolvers/auth";

// Load GraphQL schema
const typeDefs = readFileSync(
  path.join(process.cwd(), "src/graphql/schema/auth.graphql"),
  "utf-8"
);

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers: authResolvers,
});

// Create Apollo Server
const server = new ApolloServer({
  schema,
  introspection: process.env.NODE_ENV !== "production",
});

// Create handler with authentication context
const handler = startServerAndCreateNextHandler(server, {
  context: async (req, res) => {
    // Get the token from the Authorization header or cookies
    const authHeader = req.headers.authorization || "";
    const token = authHeader.split(" ")[1] || req.cookies?.token;

    if (!token) {
      return { req, res, user: null };
    }

    try {
      // Verify token
      const decoded = verify(token, JWT_SECRET) as { userId: string };
      
      // Get user from database
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId),
      });

      return { req, res, user };
    } catch (error) {
      console.error("Authentication error:", error);
      return { req, res, user: null };
    }
  },
});

export { handler as GET, handler as POST };
