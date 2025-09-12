
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Shield, Menu, ClipboardList, Gavel, FileCheck2, FileX2, LogOut, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { auth } from "@/lib/firebase";

const navLinks = [
  { href: "/", label: "Player's List", icon: Users },
  { href: "/teams", label: "Teams", icon: Shield },
  { href: "/team-roster", label: "Team Roster", icon: ClipboardList },
  { href: "/auction", label: "Auction", icon: Gavel },
  { href: "/sold-players", label: "Sold Players", icon: FileCheck2 },
  { href: "/unsold-players", label: "Unsold Players", icon: FileX2 },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Image src="https://media.licdn.com/dms/image/v2/D560BAQEmIjs8n5hw1Q/company-logo_200_200/company-logo_200_200/0/1720779427192?e=2147483647&v=beta&t=lSVyFZGzp3ki99maXPsatRFX3TA79V-p9x7dD53KIRo" alt="WUSA Auctions Manager" width={32} height={32} className="h-8 w-8" />
              <span className="">WUSA Auctions Manager</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <NavLinks closeSheet={() => {}} />
            </nav>
          </div>
          <div className="mt-auto p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="w-full justify-start">
                  <Avatar className="mr-2 h-8 w-8">
                    <AvatarFallback>{user?.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  {user?.email}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>Settings</DropdownMenuItem>
                <DropdownMenuItem disabled>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Image src="https://media.licdn.com/dms/image/v2/D560BAQEmIjs8n5hw1Q/company-logo_200_200/company-logo_200_200/0/1720779427192?e=2147483647&v=beta&t=lSVyFZGzp3ki99maXPsatRFX3TA79V-p9x7dD53KIRo" alt="WUSA Auctions" width={32} height={32} className="h-8 w-8" />
                  <span className="sr-only">WUSA Auctions</span>
                </Link>
                <NavLinks closeSheet={() => setIsSheetOpen(false)}/>
              </nav>
            </SheetContent>
          </Sheet>
           <div className="flex items-center gap-2 font-semibold">
             <span className="font-bold">WUSA Auctions Manager</span>
           </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavLinks({ closeSheet }: { closeSheet: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {navLinks.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={closeSheet}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
            pathname === href ? "bg-muted text-primary" : "text-muted-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </>
  );
}
