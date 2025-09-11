"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

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
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, ArrowLeft, RefreshCw } from "lucide-react";
import type { Player } from "./players";
import type { Team } from "./teams";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";

type AuctionPlayer = Player & { price?: number; teamId?: string };

interface LastAction {
  player: AuctionPlayer;
  previousState: {
    teamId?: string | null;
    price?: number | null;
  };
}

export function AuctionPage() {
  const [players, setPlayers] = useState<AuctionPlayer[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch players not yet assigned to a team
      const playersQuery = query(
        collection(db, "players"),
        where("teamId", "==", null)
      );
      const playersSnapshot = await getDocs(playersQuery);
      const playersList = playersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AuctionPlayer[];
      setPlayers(playersList);

      // Fetch teams
      const teamsSnapshot = await getDocs(collection(db, "teams"));
      const teamsList = teamsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[];
      setTeams(teamsList);
      
      setCurrentPlayerIndex(0);
      setLastAction(null);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load auction data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSold = async () => {
    if (!selectedTeam || !price) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a team and enter a price.",
      });
      return;
    }

    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;

    setIsProcessing(true);
    try {
      const playerDocRef = doc(db, "players", currentPlayer.id);
      const soldData = {
        teamId: selectedTeam,
        price: Number(price),
      };
      await updateDoc(playerDocRef, soldData);
      
      setLastAction({
        player: { ...currentPlayer, ...soldData },
        previousState: {
          teamId: currentPlayer.teamId || null,
          price: currentPlayer.price || null,
        },
      });

      setPlayers(prev => prev.filter(p => p.id !== currentPlayer.id));
      setSelectedTeam("");
      setPrice("");

      toast({
        title: "Player Sold!",
        description: `${currentPlayer.name} has been sold to ${
          teams.find((t) => t.id === selectedTeam)?.name
        } for ₹${price}.`,
      });
    } catch (error) {
      console.error("Error selling player:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sell player. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnsold = () => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;
    
    setLastAction({
      player: currentPlayer,
      previousState: {
        teamId: currentPlayer.teamId || null,
        price: currentPlayer.price || null,
      },
    });

    setCurrentPlayerIndex(prev => prev + 1);
    toast({
        title: "Player Unsold",
        description: `${currentPlayer.name} is unsold. Moving to the next player.`,
    });
  };

  const handleBack = async () => {
    if (!lastAction) return;

    setIsProcessing(true);
    try {
      const playerToRestore = lastAction.player;
      const playerDocRef = doc(db, "players", playerToRestore.id);
      
      // Revert player data in Firestore
      await updateDoc(playerDocRef, {
        teamId: lastAction.previousState.teamId || null,
        price: lastAction.previousState.price || null,
      });

      // If player was unsold, put them back in the current position
      if (!lastAction.previousState.teamId) {
          setCurrentPlayerIndex(prev => prev -1);
      } else {
        // If player was sold, add them back to the start of the list
        setPlayers(prev => [playerToRestore, ...prev]);
        setCurrentPlayerIndex(0);
      }

      toast({
        title: "Action Undone",
        description: `The last action for ${playerToRestore.name} has been reverted.`,
      });
      setLastAction(null); // Can only undo once

    } catch (error) {
      console.error("Error undoing action:", error);
       toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to undo the last action. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetAuction = async () => {
    setIsProcessing(true);
    try {
        const playersRef = collection(db, "players");
        const q = query(playersRef, where("teamId", "!=", null));
        const querySnapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        querySnapshot.forEach((playerDoc) => {
            const docRef = doc(db, "players", playerDoc.id);
            batch.update(docRef, { teamId: null, price: null });
        });
        
        await batch.commit();
        
        toast({
            title: "Auction Reset",
            description: "All players have been unassigned from their teams."
        });
        
        fetchData(); // Refresh the data
    } catch (error) {
        console.error("Error resetting auction:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to reset the auction. Please try again."
        });
    } finally {
        setIsProcessing(false);
    }
};


  const currentPlayer = players[currentPlayerIndex];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-semibold text-3xl">Live Auction</h1>
        <div className="flex gap-2">
            <Button onClick={handleBack} disabled={!lastAction || isProcessing}>
                <ArrowLeft className="mr-2" /> Back
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isProcessing}>
                        <RefreshCw className="mr-2"/> Reset Auction
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to reset the auction?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will unassign all players from their teams and reset their prices. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetAuction}>Reset Auction</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>

      {!currentPlayer ? (
        <Card>
            <CardContent className="pt-6">
                <div className="text-center py-12">
                    <p className="text-xl font-semibold text-muted-foreground">
                        No more players to auction.
                    </p>
                    <p className="text-muted-foreground mt-2">You can reset the auction to start over.</p>
                </div>
            </CardContent>
        </Card>
      ) : (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-3xl">{currentPlayer.name}</CardTitle>
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
          <CardFooter className="flex flex-col md:flex-row gap-4 border-t pt-6">
            <div className="grid w-full md:w-auto md:flex-1 gap-2">
              <Label htmlFor="team">Team</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger id="team">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full md:w-1/4 gap-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                placeholder="Enter price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="flex w-full md:w-auto self-end gap-2">
              <Button onClick={handleSold} className="flex-1 md:flex-none" disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sold
              </Button>
              <Button onClick={handleUnsold} variant="outline" className="flex-1 md:flex-none" disabled={isProcessing}>
                Unsold
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
