"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/login-form";
import { SignupForm } from "@/components/signup-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function LoginCard() {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  // Don't render anything if user is logged in
  if (session) {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-lg p-6 shadow-md border border-blue-200">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <LogIn className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Quick Setup Available!
          </h2>
        </div>
        <p className="text-center text-gray-600 mb-4">
          Log in to quickly pick your subjects—no need to type them in!
        </p>
        <div className="flex justify-center">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
            onClick={() => setIsOpen(true)}
          >
            <LogIn className="h-4 w-4 mr-2" />
            Log In / Sign Up
          </Button>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              {authMode === "login" ? "Welcome Back" : "Create an Account"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {authMode === "login"
                ? "Sign in to access your account"
                : "Sign up to start using the app"}
            </DialogDescription>
          </DialogHeader>
          {authMode === "login" ? (
            <>
              <LoginForm className="px-0" onSuccess={() => setIsOpen(false)} />
              <p className="text-center text-sm mt-4">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="text-blue-600 hover:underline font-medium"
                  onClick={() => setAuthMode("signup")}
                >
                  Sign up
                </button>
              </p>
            </>
          ) : (
            <>
              <SignupForm className="px-0" onSuccess={() => setIsOpen(false)} />
              <p className="text-center text-sm mt-4">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-blue-600 hover:underline font-medium"
                  onClick={() => setAuthMode("login")}
                >
                  Log in
                </button>
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
