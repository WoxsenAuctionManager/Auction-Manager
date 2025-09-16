
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Loader2, Expand, Shrink } from "lucide-react";
import { Button } from "../ui/button";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

// This is a simplified interface for what we expect from localStorage
// We can't import the full context here as it's not needed for the public view
interface AuctionState {
  players: any[];
  currentPlayerIndex: number;
  auctionStarted: boolean;
  columnLabels: { [key: string]: string };
}
interface AuctionDetails {
    name: string;
    owner: string;
}

export function LivePreviewPage({ auctionId }: { auctionId: string }) {
  const [auctionState, setAuctionState] = useState<AuctionState | null>(null);
  const [auctionDetails, setAuctionDetails] = useState<AuctionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  useEffect(() => {
    if (!auctionId || typeof window === 'undefined') return;

    const handleStorageChange = () => {
        try {
            const key = `auction_${auctionId}`;
            const data = localStorage.getItem(key);
            if (data) {
                const parsedData = JSON.parse(data);
                setAuctionState(parsedData);
            }
            setLoading(false);
        } catch (e) {
            console.error("Error reading from localStorage", e);
            setError("Could not load auction data.");
            setLoading(false);
        }
    };
    
    handleStorageChange(); // Initial load
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also fetch auction details like name
    const ownerId = localStorage.getItem(`auction_${auctionId}_owner`);
    if(ownerId) {
        const auctionDocRef = doc(db, "users", ownerId, "auctions", auctionId);
        const unsubscribe = onSnapshot(auctionDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setAuctionDetails(docSnap.data() as AuctionDetails);
            } else {
                setError("Auction not found.");
            }
        });
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            unsubscribe();
        };
    } else {
        // Fallback for finding owner if not in local storage (might be slow)
        // This part is complex without a dedicated public collection.
        // For now, we'll rely on the auctioneer's browser to sync owner.
    }


    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, [auctionId]);


  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
  };

  const renderContent = () => {
    if (!isClient || loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[550px]">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        )
    }

    if (error) {
        return (
          <Card className="max-w-5xl mx-auto animate-fade-in w-full min-h-[550px] flex flex-col justify-center">
            <CardHeader><CardTitle className="text-center text-3xl text-destructive">{error}</CardTitle></CardHeader>
          </Card>
        );
    }
    
    if (!auctionState || !auctionState.auctionStarted) {
      return (
        <Card className="max-w-5xl mx-auto animate-fade-in w-full min-h-[550px] flex flex-col justify-center">
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

    const currentPlayer = auctionState.players[auctionState.currentPlayerIndex];
    const columnLabels = auctionState.columnLabels;
    
    if (!currentPlayer) {
      return (
        <Card className="max-w-5xl mx-auto animate-fade-in w-full min-h-[550px] flex flex-col justify-center">
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
      <Card className="max-w-5xl mx-auto animate-fade-in w-full min-h-[550px]">
        <CardHeader>
          <CardTitle className="text-center text-6xl font-bold tracking-tight">
            {currentPlayer.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center gap-12 pt-8">
          <div className="relative h-80 w-80">
            <Avatar className="h-full w-full border-4 border-primary shadow-lg rounded-lg">
                <AvatarImage
                src={currentPlayer.photoUrl}
                alt={currentPlayer.name}
                className="object-contain h-full w-full"
                />
                <AvatarFallback className="text-9xl rounded-lg">
                <User />
                </AvatarFallback>
            </Avatar>
          </div>
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 relative">
        <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleFullscreen} 
            className="absolute top-4 right-4 z-10"
        >
            {isFullscreen ? <Shrink className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
            <span className="sr-only">{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
        </Button>
        {isClient && auctionDetails?.name && (
            <h1 className="text-4xl font-bold tracking-tight text-center mb-8">
                {auctionDetails.name}
            </h1>
        )}
        {renderContent()}
    </div>
  );
}
