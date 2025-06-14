import type { NextAuthOptions, Session, DefaultSession } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "./db/schema/auth";
import bcrypt from "bcryptjs";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }

  // Augment the User type to include our custom fields
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    emailVerified?: Date | null;
  }
}

// Extend NodeJS.ProcessEnv interface to include our environment variables
declare global {
  interface ProcessEnv {
    GITHUB_ID?: string;
    GITHUB_SECRET?: string;
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    NEXTAUTH_SECRET?: string;
    NEXTAUTH_URL?: string;
  }
}

// Validate required environment variables at runtime
const getEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Starting authorization with email:", credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log("Missing email or password");
          throw new Error("Email and password are required");
        }

        try {
          // Use Drizzle ORM with explicit column selection
          console.log(
            "Looking up user in database with email:",
            credentials.email
          );

          // Explicitly select only the fields we need
          const result = await db
            .select({
              id: users.id,
              email: users.email,
              name: users.name,
              image: users.image,
              emailVerified: users.emailVerified,
              hashedPassword: users.hashedPassword,
            })
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1);

          const dbUser = result[0];

          // Log minimal user data for debugging (don't log the hashed password)
          if (dbUser) {
            console.log("User found with ID:", dbUser.id);
            console.log("Has hashed password:", !!dbUser.hashedPassword);
          } else {
            console.log("No user found with email:", credentials.email);
            throw new Error("Invalid email or password");
          }

          // Ensure we have the hashed password
          if (!dbUser) {
            console.log("No user found with email:", credentials.email);
            throw new Error("Invalid email or password");
          }

          // Log basic info about the found user
          console.log("User found with ID:", dbUser.id);
          console.log("Has hashed password:", !!dbUser.hashedPassword);

          // Additional debug info (be careful with logging sensitive data)
          if (dbUser.hashedPassword) {
            console.log("Stored hash length:", dbUser.hashedPassword.length);
            console.log(
              "Hash algorithm:",
              dbUser.hashedPassword.substring(0, 3)
            );
            console.log(
              "Stored hash prefix:",
              dbUser.hashedPassword.substring(0, 3) + "..."
            );
          } else {
            console.error("No hashed password found for user:", dbUser.id);
            throw new Error("Authentication failed");
          }

          // Compare passwords
          let passwordsMatch = false;
          try {
            console.log("Comparing passwords...");
            passwordsMatch = await bcrypt.compare(
              credentials.password,
              dbUser.hashedPassword
            );
            console.log("Password comparison result:", passwordsMatch);
          } catch (error) {
            console.error("Error comparing passwords:", error);
            throw new Error("Error during authentication");
          }

          if (!passwordsMatch) {
            console.log("Password does not match for user:", dbUser.id);
            throw new Error("Invalid email or password");
          }

          console.log("Authentication successful for user:", dbUser.id);

          return {
            id: dbUser.id.toString(),
            email: dbUser.email,
            name: dbUser.name ?? undefined,
            image: dbUser.image ?? undefined,
            emailVerified: dbUser.emailVerified ?? undefined,
          };
        } catch (error) {
          console.error("Error in authorization:", error);
          throw error; // Re-throw to let NextAuth handle the error
        }
      },
    }),
    GithubProvider({
      clientId: getEnvVar("GITHUB_ID"),
      clientSecret: getEnvVar("GITHUB_SECRET"),
    }),
    GoogleProvider({
      clientId: getEnvVar("GOOGLE_CLIENT_ID"),
      clientSecret: getEnvVar("GOOGLE_CLIENT_SECRET"),
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      maxAge: 10 * 60, // 10 minutes
    }),
  ],
  secret: getEnvVar("NEXTAUTH_SECRET"),
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
    error: "/error",
  },
  callbacks: {
    async session({ session, token }): Promise<Session> {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.name = token.name as string | null;
        session.user.email = token.email as string | null;
        session.user.image = token.picture as string | null;
      }
      return session;
    },
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        return {
          ...token,
          id: user.id,
          name: user.name,
          email: user.email,
          picture: user.image,
        };
      }

      // Update session with user data
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }

      return token;
    },
  },
};
