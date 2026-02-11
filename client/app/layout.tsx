import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import QueryProvider from "@/components/providers/QueryProvider";
import ReduxProviders from "@/lib/store/ReduxProviders";
import { UserProvider } from "@/lib/contexts/UserContext";

export const metadata: Metadata = {
  title: "Hyperflix",
  description: "A modern media streaming platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <QueryProvider>
          <UserProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem={false}
              storageKey="theme"
              disableTransitionOnChange
            >
              <ReduxProviders>{children}</ReduxProviders>
            </ThemeProvider>
          </UserProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
