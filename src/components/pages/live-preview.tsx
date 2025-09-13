"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAuctionSelection } from "@/context/auction-selection-context";
import { useLiveAuction } from "@/hooks/use-live-auction";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User } from "lucide-react";
import Image from "next/image";

export function LivePreviewPage() {
  const searchParams = useSearchParams();
  const auctionId = searchParams.get("auctionId");
  const { setSelectedAuction } = useAuctionSelection();

  useEffect(() => {
    if (auctionId) {
      // We don't have the auction name here, but setting the ID is crucial
      // for the context to work correctly with localStorage keys.
      setSelectedAuction({ id: auctionId, name: 'Live Auction' });
    }
  }, [auctionId, setSelectedAuction]);

  const { players, currentPlayerIndex, auctionStarted, loading } = useLiveAuction(auctionId);

  const currentPlayer = useMemo(() => {
      if (!players || players.length === 0) return null;
      return players[currentPlayerIndex];
  }, [players, currentPlayerIndex]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-muted/20">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  if (!auctionId) {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-muted/20">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle>Invalid Link</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>This live preview link is missing an auction ID.</p>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-muted/20 p-4">
       <div className="absolute top-6 left-6 flex items-center gap-3">
        <Image src="https://media.licdn.com/dms/image/v2/D560BAQEmIjs8n5hw1Q/company-logo_200_200/company-logo_200_200/0/1720779427192?e=2147483647&v=beta&t=lSVyFZGzp3ki99maXPsatRFX3TA79V-p9x7dD53KIRo" alt="WUSA Auctions" width={40} height={40} className="h-10 w-10" />
        <span className="font-semibold text-xl">WUSA Live Auction</span>
       </div>
      {!auctionStarted ? (
        <Card className="max-w-2xl w-full">
            <CardHeader>
                <CardTitle className="text-center text-3xl">Auction Has Not Started</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="text-center py-12">
                    <p className="text-xl font-semibold text-muted-foreground">
                        Waiting for the auction to begin...
                    </p>
                </div>
            </CardContent>
        </Card>
      ) : !currentPlayer ? (
        <Card className="max-w-2xl w-full">
            <CardHeader>
                <CardTitle className="text-center text-3xl">Auction Finished</CardTitle>
                <CardDescription className="text-center">No more players to auction.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="text-center py-12">
                    <p className="text-xl font-semibold text-muted-foreground">
                        All players have been auctioned.
                    </p>
                </div>
            </CardContent>
        </Card>
      ) : (
        <Card className="max-w-2xl w-full">
            <CardHeader>
                <CardTitle className="text-center text-3xl">{currentPlayer.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-8">
                <Avatar className="h-48 w-48 border-4 border-primary">
                    <AvatarImage src={currentPlayer.photoUrl} alt={currentPlayer.name} />
                    <AvatarFallback className="text-6xl"><User /></AvatarFallback>
                </Avatar>
                <div className="w-full space-y-3">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-lg">
                        <p className="font-medium text-muted-foreground">Department</p>
                        <p>{currentPlayer.department}</p>
                        <p className="font-medium text-muted-foreground">Year</p>
                        <p>{currentPlayer.year}</p>
                        <p className="font-medium text-muted-foreground">Position</p>
                        <p>{currentPlayer.player_position}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
