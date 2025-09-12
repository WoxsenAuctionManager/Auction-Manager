"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, PlusCircle, Gavel } from "lucide-react";
import { CreateAuctionDialog } from "../create-auction-dialog";
import { useAuctionSelection, AuctionListItem } from "@/context/auction-selection-context";

export function AuctionsListPage() {
  const [auctions, setAuctions] = useState<AuctionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useAuth();
  const { setSelectedAuction } = useAuctionSelection();
  const router = useRouter();

  const fetchAuctions = useCallback(async () => {
    if (!user) {
      setAuctions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, "users", user.uid, "auctions"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const auctionsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setAuctions(auctionsList);
    } catch (error) {
      console.error("Error fetching auctions:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const handleAuctionCreated = (newAuction: AuctionListItem) => {
    setAuctions(prev => [newAuction, ...prev]);
  };

  const handleAuctionSelect = (auction: AuctionListItem) => {
    setSelectedAuction(auction);
    router.push('/players');
  };

  return (
    <>
      <div className="text-center mb-8">
          <h1 className="font-bold text-4xl tracking-tight">WUSA Auction Manager</h1>
          <p className="text-muted-foreground mt-2">Your central hub for managing football auctions.</p>
      </div>
      
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
              <CardTitle>My Auctions</CardTitle>
              <CardDescription className="mt-1">Select an auction to manage or create a new one.</CardDescription>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Start a New Auction
          </Button>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            </div>
          ) : auctions.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {auctions.map((auction) => (
                <Card 
                  key={auction.id}
                  className="hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => handleAuctionSelect(auction)}
                >
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Gavel className="h-6 w-6 text-primary group-hover:animate-swing" />
                      </div>
                      <CardTitle className="text-lg">{auction.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-sm text-muted-foreground">Click to open and manage this auction.</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-lg font-medium text-muted-foreground">No auctions found.</p>
                <p className="text-sm text-muted-foreground mt-2">Get started by creating your first auction.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateAuctionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onAuctionCreated={handleAuctionCreated}
      />
    </>
  );
}