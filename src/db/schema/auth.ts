import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  index,
  type TableConfig,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define the users table with explicit column names to match the database
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("email_verified"),
    emailVerificationToken: text("email_verification_token"),
    emailVerificationTokenExpires: timestamp(
      "email_verification_token_expires"
    ),
    image: text("image"),
    password: text("password"),
    // Explicitly map to the hashed_password column in the database with proper type
    hashedPassword: text("hashed_password").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
    emailVerificationTokenIdx: index("email_verification_token_idx").on(
      table.emailVerificationToken
    ),
    hashedPasswordIdx: index("hashed_password_idx").on(table.hashedPassword),
  })
);

export type User = typeof users.$inferSelect;
// Remove the duplicate NewUser type and use the one from drizzle-orm
export { type InferInsertModel } from "drizzle-orm";

declare module "drizzle-orm" {
  interface PgTableWithColumns {
    $inferSelect: User;
  }
}

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    userIdIdx: index("account_user_id_idx").on(table.userId),
    providerAccountIdIdx: index("provider_account_id_idx").on(
      table.providerAccountId
    ),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires").notNull(),
  },
  (table) => ({
    sessionTokenIdx: index("session_token_idx").on(table.sessionToken),
  })
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires").notNull(),
  },
  (table) => ({
    tokenIdx: index("verification_token_idx").on(table.token),
  })
);

// Base user schema for validation
export const registerUserSchema = z.object({
  email: z.string().email("Invalid email").min(1, "Email is required"),
  name: z.string().min(2, "Name is too short").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginUserSchema = registerUserSchema.pick({
  email: true,
  password: true,
});

// Schema for database operations (without password)
export const userDbSchema = createInsertSchema(users, {
  email: (schema) => schema.email("Invalid email").min(1, "Email is required"),
  name: (schema) => schema.min(2, "Name is too short").optional(),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  emailVerified: true,
  hashedPassword: true,
  image: true,
  emailVerificationToken: true,
  emailVerificationTokenExpires: true,
});
