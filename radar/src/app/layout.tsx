// @ts-nocheck
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radar — Live Weather Dashboard",
  description:
    "Real-time weather data visualization powered by WebSocket streaming",
  icons: {
    icon: "/radar.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
