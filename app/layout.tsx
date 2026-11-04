import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Agent Security Lab", description: "Controlled prompt-injection and agent-tool security evaluation environment." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
