
"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuction } from "@/context/auction-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Loader2 } from "lucide-react";

export function LivePreviewPage() {
  const { players, currentPlayerIndex, auctionStarted, columnLabels } = useAuction();
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    // Give a moment for the initial state to sync from localStorage
    const timer = setTimeout(() => setIsSyncing(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const currentPlayer = useMemo(
    () => players[currentPlayerIndex],
    [players, currentPlayerIndex]
  );

  const renderContent = () => {
    if (isSyncing) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        )
    }

    if (!auctionStarted) {
      return (
        <Card className="max-w-5xl mx-auto animate-fade-in">
          <CardHeader>
            <CardTitle className="text-center text-5xl">
              Welcome to the Auction
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-16">
              <p className="text-2xl font-semibold text-muted-foreground">
                The auction will begin shortly.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!currentPlayer) {
      return (
        <Card className="max-w-5xl mx-auto animate-fade-in">
          <CardHeader>
            <CardTitle className="text-center text-5xl">
              Auction Finished
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-16">
              <p className="text-2xl font-semibold text-muted-foreground">
                All players have been auctioned.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="max-w-5xl mx-auto animate-fade-in">
        <CardHeader>
          <CardTitle className="text-center text-6xl font-bold tracking-tight">
            {currentPlayer.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-12 pt-8">
          <Avatar className="h-80 w-80 border-4 border-primary shadow-lg rounded-lg">
            <AvatarImage
              src={currentPlayer.photoUrl}
              alt={currentPlayer.name}
              className="object-cover"
            />
            <AvatarFallback className="text-9xl rounded-lg">
              <User />
            </AvatarFallback>
          </Avatar>
          <div className="w-full space-y-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 text-3xl">
              <p className="font-semibold text-muted-foreground">{columnLabels.department}</p>
              <p className="font-medium">{currentPlayer.department}</p>
              <p className="font-semibold text-muted-foreground">{columnLabels.year}</p>
              <p className="font-medium">{currentPlayer.year}</p>
              <p className="font-semibold text-muted-foreground">{columnLabels.player_position}</p>
              <p className="font-medium">{currentPlayer.player_position}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex items-center justify-center h-full bg-background p-8">
      {renderContent()}
    </div>
  );
}
