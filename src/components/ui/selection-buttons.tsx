"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calculator, Calendar, LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { LoginCard } from "./login-card";

export default function SelectionButtons() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const { data: session } = useSession();

  const handleNavigation = (path: string) => {
    setIsNavigating(true);
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Hello,{" "}
            <span className="text-blue-600">
              {session?.user?.name || "User"}!
            </span>
          </h1>
          {session && (
            <Button
              variant="ghost"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          )}
        </div>
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Choose Your Tool</h1>
          <p className="text-lg text-gray-600">
            Select the tool you&apos;d like to use
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 p-4 border-2 border-blue-200 hover:border-blue-400 bg-white hover:bg-blue-50 transition-all"
            onClick={() => handleNavigation("/gwa-calc")}
            disabled={isNavigating}
          >
            {isNavigating ? (
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            ) : (
              <>
                <Calculator className="h-8 w-8 text-blue-600" />
                <span className="text-gray-900">GWA Calculator</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 p-4 border-2 border-blue-200 hover:border-blue-400 bg-white hover:bg-blue-50 transition-all"
            onClick={() => handleNavigation("/timetable")}
            disabled={isNavigating}
          >
            {isNavigating ? (
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            ) : (
              <>
                <Calendar className="h-8 w-8 text-blue-600" />
                <span className="text-gray-900">Time Table Generator</span>
              </>
            )}
          </Button>
        </div>

        <LoginCard />
        {isNavigating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center">
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-700">Loading...</p>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Click on any button to get started
          </p>
        </div>
      </div>
    </div>
  );
}
