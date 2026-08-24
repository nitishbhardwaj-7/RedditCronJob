import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RedditPulse - AI Reddit Monitoring SaaS',
  description:
    'Automated Reddit monitoring SaaS powered by Apify, Google Gemini AI, and Resend for real-time negative feedback detection.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
