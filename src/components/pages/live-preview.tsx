"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User } from "lucide-react";
import type { Player } from "./players";
import { useAuctionSelection } from "@/context/auction-selection-context";

type AuctionPlayer = Player & { price?: number; teamId?: string; status?: 'sold' | 'unsold' | 'queued' };

function useLiveAuction(auctionId: string | null) {
    const getInitialState = <T,>(key: string, defaultValue: T): T => {
        if (typeof window === 'undefined' || !auctionId) return defaultValue;
        try {
            const saved = localStorage.getItem(`auction_${auctionId}_${key}`);
            return saved ? JSON.parse(saved) : defaultValue;
        } catch {
            return defaultValue;
        }
    };
    
    const [players, setPlayers] = useState<AuctionPlayer[]>(() => getInitialState('players', []));
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(() => getInitialState('currentPlayerIndex', 0));
    const [auctionStarted, setAuctionStarted] = useState<boolean>(() => getInitialState('auctionStarted', false));

    useEffect(() => {
        if (typeof window === 'undefined' || !auctionId) return;

        const handleStorageChange = (event: StorageEvent) => {
            if (event.storageArea !== localStorage) return;

            const keyMapping: { [key: string]: (value: any) => void } = {
                [`auction_${auctionId}_players`]: setPlayers,
                [`auction_${auctionId}_currentPlayerIndex`]: setCurrentPlayerIndex,
                [`auction_${auctionId}_auctionStarted`]: setAuctionStarted,
            };

            if (event.key && event.key in keyMapping && event.newValue) {
                try {
                    const newValue = JSON.parse(event.newValue);
                    keyMapping[event.key](newValue);
                } catch (e) {
                    console.error(`Failed to parse localStorage value for key ${event.key}`, e);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [auctionId]);

    const currentPlayer = useMemo(() => players[currentPlayerIndex], [players, currentPlayerIndex]);

    return { currentPlayer, auctionStarted, players };
}


export function LivePreviewPage() {
    const searchParams = useSearchParams();
    const auctionId = searchParams.get('auctionId');
    const { setSelectedAuction } = useAuctionSelection();
    const [loading, setLoading] = useState(true);
    
    const { currentPlayer, auctionStarted, players } = useLiveAuction(auctionId);

    useEffect(() => {
        if (auctionId) {
            // This is a bit of a hack to make the auction context aware of the auction ID
            // in a public page. This won't fetch data, just set the ID.
            setSelectedAuction({ id: auctionId, name: 'Live Auction' });
            setLoading(false);
        }
    }, [auctionId, setSelectedAuction]);


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-16 w-16 animate-spin" />
            </div>
        );
    }
    
    if (!auctionId) {
        return <div className="text-center py-10">No auction specified.</div>;
    }


  const renderContent = () => {
    if (!auctionStarted) {
      return (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-3xl">
              Welcome to the Live Auction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-xl font-semibold text-muted-foreground">
                The auction has not started yet. Please wait.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!currentPlayer && players.length === 0) {
      return (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-3xl">Auction Finished</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-xl font-semibold text-muted-foreground">
                All players have been auctioned.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (!currentPlayer) {
        return (
          <div className="flex justify-center items-center h-screen">
              <Loader2 className="h-16 w-16 animate-spin" />
          </div>
        );
    }

    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-3xl">
            {currentPlayer.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-8">
          <Avatar className="h-48 w-48 border-4 border-primary">
            <AvatarImage src={currentPlayer.photoUrl} alt={currentPlayer.name} />
            <AvatarFallback className="text-6xl">
              <User />
            </AvatarFallback>
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
    );
  };

  return <div className="container mx-auto p-4">{renderContent()}</div>;
}
