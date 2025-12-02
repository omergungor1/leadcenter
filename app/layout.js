import { Inter } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "./LayoutWrapper";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "LeadCenter",
  description: "LeadCenter - Complete CRM dashboard for LeadGun",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50`}>
        <LayoutWrapper>{children}</LayoutWrapper>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
