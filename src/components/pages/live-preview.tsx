"use client";

import { useMemo } from "react";
import { useAuction } from "@/context/auction-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Loader2 } from "lucide-react";

export function LivePreviewPage() {
  const { players, currentPlayerIndex, auctionStarted } = useAuction();

  const currentPlayer = useMemo(
    () => players[currentPlayerIndex],
    [players, currentPlayerIndex]
  );

  const renderContent = () => {
    if (!auctionStarted) {
      return (
        <Card className="max-w-4xl mx-auto animate-fade-in">
          <CardHeader>
            <CardTitle className="text-center text-4xl">
              Welcome to the Auction
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-xl font-semibold text-muted-foreground">
                The auction will begin shortly.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!currentPlayer) {
      return (
        <Card className="max-w-4xl mx-auto animate-fade-in">
          <CardHeader>
            <CardTitle className="text-center text-4xl">
              Auction Finished
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-xl font-semibold text-muted-foreground">
                All players have been auctioned.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="max-w-4xl mx-auto animate-fade-in">
        <CardHeader>
          <CardTitle className="text-center text-5xl font-bold tracking-tight">
            {currentPlayer.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-8 pt-8">
          <Avatar className="h-64 w-64 border-4 border-primary shadow-lg">
            <AvatarImage
              src={currentPlayer.photoUrl}
              alt={currentPlayer.name}
              className="object-cover"
            />
            <AvatarFallback className="text-8xl">
              <User />
            </AvatarFallback>
          </Avatar>
          <div className="w-full space-y-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-2xl">
              <p className="font-semibold text-muted-foreground">Department</p>
              <p className="font-medium">{currentPlayer.department}</p>
              <p className="font-semibold text-muted-foreground">Year</p>
              <p className="font-medium">{currentPlayer.year}</p>
              <p className="font-semibold text-muted-foreground">Position</p>
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
