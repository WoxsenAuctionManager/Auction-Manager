import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppLayout } from '@/components/app-layout';
import { AuctionProvider } from '@/context/auction-context';

export const metadata: Metadata = {
  title: 'WUSA Auctions Manager',
  description: 'Manage your auctions with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased h-full">
        <AuctionProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </AuctionProvider>
        <Toaster />
      </body>
    </html>
  );
}
