"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, orderBy, query, doc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, PlusCircle, Gavel, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { CreateAuctionDialog } from "../create-auction-dialog";
import { useAuctionSelection, AuctionListItem } from "@/context/auction-selection-context";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export function AuctionsListPage() {
  const [auctions, setAuctions] = useState<AuctionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [auctionToEdit, setAuctionToEdit] = useState<AuctionListItem | null>(null);
  const [auctionToDelete, setAuctionToDelete] = useState<AuctionListItem | null>(null);
  const { user } = useAuth();
  const { setSelectedAuction } = useAuctionSelection();
  const router = useRouter();
  const { toast } = useToast();

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

  const handleAuctionUpdated = (updatedAuction: AuctionListItem) => {
    setAuctions(prev => prev.map(a => a.id === updatedAuction.id ? updatedAuction : a));
    setAuctionToEdit(null);
  }

  const handleAuctionSelect = (auction: AuctionListItem) => {
    setSelectedAuction(auction);
    router.push('/players');
  };

  const handleEdit = (e: React.MouseEvent, auction: AuctionListItem) => {
    e.stopPropagation();
    setAuctionToEdit(auction);
  }

  const handleDeleteRequest = (e: React.MouseEvent, auction: AuctionListItem) => {
    e.stopPropagation();
    setAuctionToDelete(auction);
  }

  const handleDelete = async () => {
    if (!auctionToDelete || !user) return;

    try {
        const auctionRef = doc(db, "users", user.uid, "auctions", auctionToDelete.id);

        // NOTE: This is a simple deletion. For a production app, you might want to
        // delete all subcollections (players, teams, etc.) in a more robust way,
        // potentially using a Firebase Cloud Function.
        const collectionsToDelete = ['players', 'teams', 'sold_players', 'unsold_players', 'queued_players', 'auction_settings'];
        const batch = writeBatch(db);

        for (const subCollection of collectionsToDelete) {
            const snapshot = await getDocs(collection(auctionRef, subCollection));
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
        }
        batch.delete(auctionRef);
        await batch.commit();

        setAuctions(auctions.filter((a) => a.id !== auctionToDelete.id));
        toast({
            title: "Auction Deleted",
            description: `The auction "${auctionToDelete.name}" has been permanently deleted.`,
        });
    } catch (error) {
        console.error("Error deleting auction:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to delete auction. Please try again.",
        });
    } finally {
        setAuctionToDelete(null);
    }
  };


  return (
    <>
      <div className="text-center mb-8">
          <h1 className="font-bold text-4xl tracking-tight">WUSA Auction Manager</h1>
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
                  className="hover:shadow-md transition-shadow cursor-pointer group relative"
                  onClick={() => handleAuctionSelect(auction)}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Auction options</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleEdit(e, auction)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleDeleteRequest(e, auction)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2 pt-6">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Gavel className="h-6 w-6 text-primary group-hover:animate-swing" />
                      </div>
                      <CardTitle className="text-lg">{auction.name}</CardTitle>
                  </CardHeader>
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
        open={isCreateDialogOpen || !!auctionToEdit}
        onOpenChange={(isOpen) => {
            if (!isOpen) {
                setIsCreateDialogOpen(false);
                setAuctionToEdit(null);
            }
        }}
        onAuctionCreated={handleAuctionCreated}
        onAuctionUpdated={handleAuctionUpdated}
        auctionToEdit={auctionToEdit}
      />

       <AlertDialog open={!!auctionToDelete} onOpenChange={(open) => !open && setAuctionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the <strong>{auctionToDelete?.name}</strong> auction and all of its data, including players, teams, and auction results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
