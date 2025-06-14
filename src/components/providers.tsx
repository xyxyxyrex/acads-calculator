'use client';

import { ApolloProvider } from "@apollo/client";
import { SessionProvider } from "next-auth/react";
import { client } from "@/lib/apollo-client";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ApolloProvider client={client}>
        {children}
        <Toaster position="top-center" richColors />
      </ApolloProvider>
    </SessionProvider>
  );
}
