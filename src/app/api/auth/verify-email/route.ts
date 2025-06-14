import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { eq, and, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { signIn } from "next-auth/react";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/auth/error?error=InvalidToken`
      );
    }

    // Find user with this token
    const [user] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.emailVerificationToken, token),
          gt(users.emailVerificationTokenExpires, new Date())
        )
      )
      .limit(1);

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/auth/error?error=InvalidOrExpiredToken`
      );
    }

    // Update user as verified
    await db
      .update(users)
      .set({
        emailVerified: new Date(),
        emailVerificationToken: null,
        emailVerificationTokenExpires: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Automatically sign in the user
    await signIn("credentials", {
      email: user.email,
      password: user.hashedPassword,
      redirect: true,
      callbackUrl: "/dashboard",
    });

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard`);
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/auth/error?error=VerificationFailed`
    );
  }
}
