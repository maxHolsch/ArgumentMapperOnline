import type { Metadata } from "next";
import { Analytics } from '@vercel/analytics/next';

import "./globals.css";
import ClientWrapper from '@/components/ClientWrapper';

export const metadata: Metadata = {
  title: "Argument Mapping & Deliberation Tool - Create Diagrams Online",
  description: "A tool used for argument mapping and deliberation. By Max Holschneider, with thanks to Abdelhak Akermi.",
  keywords: [
    "mermaid",
    "diagram editor",
    "flowchart",
    "sequence diagram",
    "class diagram",
    "state diagram",
    "gantt chart",
    "pie chart",
    "er diagram",
    "user journey",
    "git graph",
    "markdown diagrams"
  ],
  authors: [{ name: "Max Holschneider" }, { name: "Thanks to Abdelhak Akermi" }],
  openGraph: {
    title: "Argument Mapping & Deliberation Tool",
    description: "A tool used for argument mapping and deliberation. By Max Holschneider, with thanks to Abdelhak Akermi.",
    type: "website",
    locale: "en_US",
    url: "https://mermaid-live-web.vercel.app",
    siteName: "Argument Mapper",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ClientWrapper>
          {children}
    
        </ClientWrapper>
        <Analytics />
      </body>
    </html>
  );
}
