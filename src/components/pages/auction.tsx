
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  writeBatch,
  DocumentData,
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
import { Loader2, User, ArrowLeft, RefreshCw, PlayCircle, PlusCircle } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddPlayersToAuctionDialog } from "../add-players-to-auction-dialog";

type AuctionPlayer = Player & { price?: number; teamId?: string; status?: 'sold' | 'unsold' | 'queued' };

interface ActionRecord {
  type: "sold" | "unsold";
  player: AuctionPlayer;
  previousPlayerState: AuctionPlayer;
  previousPlayers: AuctionPlayer[];
  previousCurrentPlayerIndex: number;
}


export function AuctionPage() {
  const [allPlayers, setAllPlayers] = useState<AuctionPlayer[]>([]);
  const [players, setPlayers] = useState<AuctionPlayer[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionHistory, setActionHistory] = useState<ActionRecord[]>([]);
  const [auctionStarted, setAuctionStarted] = useState(false);
  const [isAddPlayersDialogOpen, setIsAddPlayersDialogOpen] = useState(false);


  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const playersQuery = query(collection(db, "players"), where("status", "==", "queued"));
      const playersSnapshot = await getDocs(playersQuery);
      const allPlayersList = playersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AuctionPlayer[];
      setAllPlayers(allPlayersList);
      setPlayers(allPlayersList);

      const teamsSnapshot = await getDocs(collection(db, "teams"));
      const teamsList = teamsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[];
      setTeams(teamsList);
      
      setCurrentPlayerIndex(0);
      setActionHistory([]);
      setAuctionStarted(false);

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

  const handlePlayersAddedToAuction = (newPlayers: Player[]) => {
    setPlayers(prevPlayers => {
        const combined = [...prevPlayers, ...newPlayers];
        // Simple deduplication based on ID
        const uniquePlayers = Array.from(new Map(combined.map(p => [p.id, p])).values());
        return uniquePlayers;
    });
    setAllPlayers(prevAll => {
        const combined = [...prevAll, ...newPlayers];
        const uniquePlayers = Array.from(new Map(combined.map(p => [p.id, p])).values());
        return uniquePlayers;
    });
  };

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

    const newAction: ActionRecord = {
      type: "sold",
      player: currentPlayer,
      previousPlayerState: { ...currentPlayer },
      previousPlayers: [...players],
      previousCurrentPlayerIndex: currentPlayerIndex,
    };
    
    try {
      const playerDocRef = doc(db, "players", currentPlayer.id);
      const soldData = {
        teamId: selectedTeam,
        price: Number(price),
        status: 'sold' as const,
      };
      await updateDoc(playerDocRef, soldData);

      setActionHistory(prev => [...prev, newAction]);
      
      const updatedPlayers = players.filter(p => p.id !== currentPlayer.id);
      setPlayers(updatedPlayers);
      setAllPlayers(prevAll => prevAll.map(p => p.id === currentPlayer.id ? { ...p, ...soldData } : p));
      
      setSelectedTeam("");
      setPrice("");
      if (currentPlayerIndex >= updatedPlayers.length) {
        setCurrentPlayerIndex(0); 
      }


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

  const handleUnsold = async () => {
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;

    setIsProcessing(true);
    
    const newAction: ActionRecord = {
      type: "unsold",
      player: currentPlayer,
      previousPlayerState: { ...currentPlayer },
      previousPlayers: [...players],
      previousCurrentPlayerIndex: currentPlayerIndex,
    };

    try {
        const playerDocRef = doc(db, "players", currentPlayer.id);
        await updateDoc(playerDocRef, { status: 'unsold' });
        
        setActionHistory(prev => [...prev, newAction]);

        const updatedPlayers = players.filter(p => p.id !== currentPlayer.id);
        setPlayers(updatedPlayers);
        setAllPlayers(prevAll => prevAll.map(p => p.id === currentPlayer.id ? { ...p, status: 'unsold' } : p));
        
        if (currentPlayerIndex >= updatedPlayers.length) {
            setCurrentPlayerIndex(0);
        }

        toast({
            title: "Player Unsold",
            description: `${currentPlayer.name} is unsold. Moving to the next player.`,
        });

    } catch (error) {
        console.error("Error marking player as unsold:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to mark player as unsold. Please try again.",
        });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleUndo = async () => {
    if (actionHistory.length === 0) {
      toast({ title: "No actions to undo." });
      return;
    }

    setIsProcessing(true);
    const lastAction = actionHistory[actionHistory.length - 1];

    try {
      const playerDocRef = doc(db, "players", lastAction.player.id);
      if (lastAction.type === "sold") {
        await updateDoc(playerDocRef, {
          teamId: null,
          price: null,
          status: 'queued',
        });
      } else if (lastAction.type === "unsold") {
         await updateDoc(playerDocRef, { status: 'queued' });
      }

      setPlayers(lastAction.previousPlayers);
      setCurrentPlayerIndex(lastAction.previousCurrentPlayerIndex);
      
      // Revert allPlayers state
      const revertedAllPlayers = allPlayers.map(p => {
          if (p.id === lastAction.player.id) {
              return lastAction.previousPlayerState;
          }
          return p;
      });
      // Add player back if they were removed
      if (!revertedAllPlayers.find(p => p.id === lastAction.player.id)) {
        revertedAllPlayers.push(lastAction.previousPlayerState);
      }
      setAllPlayers(revertedAllPlayers);


      setActionHistory(prev => prev.slice(0, -1));
      toast({
        title: "Action Undone",
        description: `The last action for ${lastAction.player.name} has been reverted.`,
      });
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
        const querySnapshot = await getDocs(playersRef);
        
        const batch = writeBatch(db);
        querySnapshot.forEach((playerDoc) => {
            const docRef = doc(db, "players", playerDoc.id);
            batch.update(docRef, { teamId: null, price: null, status: 'queued' });
        });
        
        await batch.commit();
        
        toast({
            title: "Auction Reset",
            description: "The auction has been reset. All players are now available."
        });
        
        await fetchData(); // Refetch all data to reset state
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


  const currentPlayer = useMemo(() => players[currentPlayerIndex], [players, currentPlayerIndex]);
  
  const upcomingPlayers = useMemo(() => {
    if (!auctionStarted) {
      return players;
    }
    if (!currentPlayer || players.length <= 1) {
      return [];
    }
    const upcoming = [
      ...players.slice(currentPlayerIndex + 1),
      ...players.slice(0, currentPlayerIndex)
    ];
    return upcoming;
  }, [players, currentPlayerIndex, currentPlayer, auctionStarted]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  const renderAuctionContent = () => {
    if (!auctionStarted) {
        return (
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-center text-3xl">Welcome to the Auction</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="text-center py-12">
                        <p className="text-xl font-semibold text-muted-foreground">
                            The auction is ready to start.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center border-t pt-6">
                    <Button size="lg" onClick={() => setAuctionStarted(true)} disabled={players.length === 0}>
                        <PlayCircle className="mr-2" /> Start Auction
                    </Button>
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
                            All players have been auctioned.
                        </p>
                        <p className="text-muted-foreground mt-2">You can reset the auction to start over.</p>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col md:flex-row gap-4 border-t pt-6">
                    <div className="grid w-full md:w-auto md:flex-1 gap-2">
                        <Label htmlFor="team">Team</Label>
                        <Select disabled>
                            <SelectTrigger id="team">
                                <SelectValue placeholder="Select a team" />
                            </SelectTrigger>
                        </Select>
                    </div>
                    <div className="grid w-full md:w-1/4 gap-2">
                        <Label htmlFor="price">Price</Label>
                        <Input id="price" type="number" placeholder="Enter price" disabled />
                    </div>
                    <div className="flex w-full md:w-auto self-end gap-2">
                        <Button className="flex-1 md:flex-none" disabled>Sold</Button>
                        <Button variant="outline" className="flex-1 md:flex-none" disabled>Unsold</Button>
                    </div>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="max-w-4xl mx-auto">
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
            <CardFooter className="flex flex-col md:flex-row gap-4 border-t pt-6">
                <div className="grid w-full md:w-auto md:flex-1 gap-2">
                    <Label htmlFor="team">Team</Label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                        <SelectTrigger id="team">
                            <SelectValue placeholder="Select a team" />
                        </SelectTrigger>
                        <SelectContent>
                            {teams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
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
    );
};


  return (
    <>
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleUndo} disabled={actionHistory.length === 0 || isProcessing}>
                <ArrowLeft className="mr-2" /> Back
            </Button>
            <h1 className="font-semibold text-3xl">Live Auction</h1>
        </div>
        <div className="flex gap-2">
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

      {renderAuctionContent()}

      <Card className="max-w-4xl mx-auto">
          <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Next Up Ahead</CardTitle>
              <Button onClick={() => setIsAddPlayersDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Player
              </Button>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[80px]">Sno.</TableHead>
                          <TableHead>Photo</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Position</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {upcomingPlayers.length > 0 ? (
                          upcomingPlayers.map((player, index) => (
                              <TableRow key={player.id}>
                                  <TableCell>{index + 1}</TableCell>
                                  <TableCell>
                                      <Avatar>
                                          <AvatarImage src={player.photoUrl} alt={player.name} />
                                          <AvatarFallback><User /></AvatarFallback>
                                      </Avatar>
                                  </TableCell>
                                  <TableCell>{player.name}</TableCell>
                                  <TableCell>{player.player_position}</TableCell>
                              </TableRow>
                          ))
                      ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">
                                No upcoming players.
                            </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </div>
    <AddPlayersToAuctionDialog
        open={isAddPlayersDialogOpen}
        onOpenChange={setIsAddPlayersDialogOpen}
        onPlayersAdded={handlePlayersAddedToAuction}
        existingPlayers={allPlayers}
    />
    </>
  );
}
