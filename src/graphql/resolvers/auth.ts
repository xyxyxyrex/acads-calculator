import { compare, hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import type { User } from "@/db/schema/auth";
import { GraphQLContext } from "@/graphql/types/context";
import { SetPasswordInput, SetPasswordResponse } from "@/graphql/types/auth";
import { Request, Response } from 'express';

// Extend the User type to include password fields
type UserWithPassword = User & {
  password?: string | null;
  hashedPassword?: string | null;
};

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface AuthPayload {
  user: typeof users.$inferSelect;
  token: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const SALT_ROUNDS = 10;

export const authResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, { user }: GraphQLContext) => {
      if (!user) {
        throw new Error('Not authenticated');
      }
      return user;
    },
  },
  Mutation: {
    setPassword: async (
      _: unknown,
      { email, password }: SetPasswordInput,
      context: GraphQLContext
    ): Promise<SetPasswordResponse> => {
      try {
        // Find user by email
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          return {
            success: false,
            message: 'User not found',
          };
        }

        // Convert the user object to a plain object and check for password fields
        const userObj = { ...user } as Record<string, unknown>;
        const hasPassword = userObj.hasOwnProperty('hashedPassword') || 
                          userObj.hasOwnProperty('password');
        
        if (hasPassword) {
          return {
            success: false,
            message: 'Password already set for this account',
          };
        }

        // Hash the new password
        const hashedPassword = await hash(password, SALT_ROUNDS);

        // Update user with new password
        await db
          .update(users)
          .set({ 
            password: hashedPassword,
            updatedAt: new Date() 
          } as any) // Temporary type assertion to bypass type checking
          .where(eq(users.id, user.id));

        return {
          success: true,
          message: 'Password set successfully',
        };
      } catch (error) {
        console.error('Error setting password:', error);
        return {
          success: false,
          message: 'Failed to set password',
        };
      }
    },
    register: async (
      _: unknown,
      { input }: { input: RegisterInput },
      context: GraphQLContext
    ): Promise<AuthPayload> => {
      const { email, password, name } = input;
      
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingUser) {
        throw new Error("User already exists with this email");
      }

      // Hash password
      const hashedPassword = await hash(password, SALT_ROUNDS);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          name,
          password: hashedPassword
        } as any) // Temporary type assertion to bypass type checking
        .returning();

      // Generate JWT token
      const token = sign({ userId: newUser.id }, JWT_SECRET, {
        expiresIn: "30d",
      });

      return {
        user: newUser,
        token,
      };
    },

    login: async (
      _: unknown,
      { input }: { input: LoginInput },
      context: GraphQLContext
    ): Promise<AuthPayload> => {
      const { email, password } = input;

      // Find user by email with all fields
      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (!user) {
        throw new Error("Invalid email or password");
      }

      // Convert the database user to our UserWithPassword type
      const userWithPassword: UserWithPassword = {
        id: user.id.toString(),
        name: user.name ?? null,
        email: user.email,
        emailVerified: 'emailVerified' in user ? user.emailVerified ?? null : null,
        emailVerificationToken: 'emailVerificationToken' in user ? user.emailVerificationToken ?? null : null,
        emailVerificationTokenExpires: 'emailVerificationTokenExpires' in user ? user.emailVerificationTokenExpires ?? null : null,
        image: 'image' in user ? user.image ?? null : null,
        password: 'password' in user ? user.password ?? null : null,
        hashedPassword: 'hashedPassword' in user ? user.hashedPassword ?? null : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt ?? new Date()
      } as UserWithPassword;

      // Check if email is verified
      if (!userWithPassword.emailVerified) {
        throw new Error('Please verify your email before logging in');
      }

      // Verify password
      const passwordToCheck = userWithPassword.hashedPassword || userWithPassword.password;
      if (!passwordToCheck) {
        throw new Error("No password set for this account");
      }

      const isValid = await compare(password, passwordToCheck);
      if (!isValid) {
        throw new Error("Invalid email or password");
      }

      // Generate JWT token
      const token = sign({ userId: user.id }, JWT_SECRET, {
        expiresIn: "30d",
      });

      return {
        user,
        token,
      };
    },

    logout: async (_: unknown, __: unknown, { res }: GraphQLContext) => {
      // Clear the authentication cookie
      if (res) {
        res.setHeader('Set-Cookie', 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly');
      }
      return true;
    },
  },
};
