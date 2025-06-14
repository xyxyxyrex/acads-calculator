import { db } from "@/db";
import { users } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, name, password } = await request.json();

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password with a higher salt round for better security
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate a verification token
    const emailVerificationToken = uuidv4();
    const emailVerificationTokenExpires = new Date();
    emailVerificationTokenExpires.setHours(
      emailVerificationTokenExpires.getHours() + 24
    ); // 24 hours from now

    // Create user in database with Drizzle ORM
    console.log("Creating user with email:", email);
    console.log("Hashed password length:", hashedPassword.length);

    try {
      // Insert user with Drizzle ORM
      const [newUser] = await db.insert(users)
        .values({
          id: uuidv4(),
          email,
          name: name || null,
          hashedPassword,
          password: null, // Explicitly set to null
          emailVerified: new Date(),
          emailVerificationToken,
          emailVerificationTokenExpires,
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name
        });
      
      if (!newUser) {
        throw new Error("Failed to create user: No user returned from database");
      }
      
      console.log("User created with ID:", newUser.id);

      // Log in the user after successful signup
      try {
        // You'll need to implement this part based on your auth setup
        // await signIn('credentials', {
        //   email,
        //   password,
        //   redirect: false,
        // });
        
        return NextResponse.json(
          { 
            success: true, 
            userId: newUser.id,
            message: "Account created successfully. You can now log in."
          },
          { status: 201 }
        );
      } catch (error) {
        console.error("Error signing in after signup:", error);
        return NextResponse.json(
          { 
            success: true, 
            userId: newUser.id, 
            message: "Account created successfully. Please log in." 
          },
          { status: 201 }
        );
      }
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error("Failed to create user");
    }
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create account. Please try again.",
      },
      { status: 500 }
    );
  }
}
