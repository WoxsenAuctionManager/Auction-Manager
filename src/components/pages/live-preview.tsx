"use client";

import { useMemo, useEffect, useState } from "react";
import { useAuction } from "@/context/auction-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuctionSelection } from "@/context/auction-selection-context";

export function LivePreviewPage() {
  const { players, currentPlayerIndex, auctionStarted } = useAuction();
  const { setSelectedAuction } = useAuctionSelection();
  const searchParams = useSearchParams();
  const auctionId = searchParams.get('auctionId');
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (auctionId && initialLoad) {
      // The name doesn't matter for read-only view, only the ID.
      setSelectedAuction({ id: auctionId, name: 'Live Auction' });
      setInitialLoad(false);
    }
  }, [auctionId, setSelectedAuction, initialLoad]);

  const currentPlayer = useMemo(() => players[currentPlayerIndex], [players, currentPlayerIndex]);

  const renderContent = () => {
    if (initialLoad && auctionId) {
      return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin" />
        </div>
      )
    }

    if (!auctionStarted) {
      return (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-3xl">Welcome to the Auction</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-xl font-semibold text-muted-foreground">
                The auction has not started yet.
              </p>
              <p className="mt-2 text-muted-foreground">Please wait for the auctioneer to begin.</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardFooter>
        </Card>
      );
    }

    if (!currentPlayer) {
      return (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-3xl">Auction Finished</CardTitle>
            <CardDescription className="text-center">No more players to auction.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-xl font-semibold text-muted-foreground">
                All players have been auctioned. Thank you for participating!
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="max-w-4xl mx-auto animate-in fade-in-50 duration-500">
        <CardHeader>
          <CardTitle className="text-center text-5xl font-bold tracking-tight">{currentPlayer.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-8">
          <Avatar className="h-64 w-64 border-8 border-primary/50 shadow-lg">
            <AvatarImage src={currentPlayer.photoUrl} alt={currentPlayer.name} />
            <AvatarFallback className="text-8xl"><User /></AvatarFallback>
          </Avatar>
          <div className="w-full space-y-4 text-2xl">
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              <p className="font-semibold text-muted-foreground">Department</p>
              <p className="font-medium">{currentPlayer.department}</p>
              <p className="font-semibold text-muted-foreground">Year</p>
              <p className="font-medium">{currentPlayer.year}</p>
              <p className="font-semibold text-muted-foreground">Position</p>
              <p className="font-medium">{currentPlayer.player_position}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col md:flex-row gap-4 border-t pt-6 mt-4">
            <div className="grid w-full md:w-auto md:flex-1 gap-2">
                <Label htmlFor="team" className="text-base">Team</Label>
                <Select disabled>
                    <SelectTrigger id="team" className="text-lg py-6">
                        <SelectValue placeholder="Team decision pending..." />
                    </SelectTrigger>
                </Select>
            </div>
            <div className="grid w-full md:w-1/4 gap-2">
                <Label htmlFor="price" className="text-base">Price</Label>
                <Input id="price" type="text" value="--" className="text-lg py-6 text-center font-bold" disabled />
            </div>
            <div className="flex w-full md:w-auto self-end gap-2">
                <Button className="flex-1 md:flex-none text-lg py-6" disabled>Sold</Button>
                <Button variant="outline" className="flex-1 md:flex-none text-lg py-6" disabled>Unsold</Button>
            </div>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-muted/20">
      <div className="w-full max-w-6xl">
        {renderContent()}
      </div>
    </div>
  );
}
