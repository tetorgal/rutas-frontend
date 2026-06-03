import type { Metadata } from "next";
import { Geist, Geist_Mono, Raleway, DM_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// 1. Import the global layout providers
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarRail, SidebarInset } from "@/components/ui/sidebar";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/themeProvider";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/built/Sidebar";
import { AppHeader } from "@/components/built/Header";

const dmSansHeading = DM_Sans({ subsets: ['latin'], variable: '--font-heading' });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-sans' });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rutas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", raleway.variable, dmSansHeading.variable)} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider 
          attribute="class"
          defaultTheme="system"
          enableSystem
          themes={["light", "dark", "goal"]}
          disableTransitionOnChange>
          <Toaster richColors position="top-right" />

<Providers>

        <TooltipProvider>
          <SidebarProvider className="min-h-svh bg-background">
            <AppSidebar />
            <SidebarRail />
            <SidebarInset className="flex min-h-svh flex-col bg-transparent">
              <AppHeader />
              {children}
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}