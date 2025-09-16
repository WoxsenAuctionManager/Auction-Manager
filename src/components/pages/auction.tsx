
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  doc,
  writeBatch,
  DocumentData,
  deleteDoc,
  setDoc,
  getDoc,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { useAuctionSelection } from "@/context/auction-selection-context";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, ArrowLeft, RefreshCw, PlayCircle, PlusCircle, ArrowUp, ArrowDown, Share2, Copy, Check, ExternalLink } from "lucide-react";
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
import { useAuction } from "@/context/auction-context";

type AuctionPlayer = Player & { price?: number; teamId?: string };

function SharePopover() {
    const [livePreviewUrl, setLivePreviewUrl] = useState('');
    const [hasCopied, setHasCopied] = useState(false);
    const { toast } = useToast();
  
    useEffect(() => {
      if (typeof window !== 'undefined') {
        setLivePreviewUrl(`${window.location.origin}/live-preview`);
      }
    }, []);
  
    const copyToClipboard = () => {
      navigator.clipboard.writeText(livePreviewUrl);
      setHasCopied(true);
      toast({ title: 'Live preview link copied!' });
      setTimeout(() => setHasCopied(false), 2000);
    };
  
    return (
      <Popover>
        <PopoverTrigger asChild>
            <Button variant="outline">
                <Share2 className="mr-2"/> Share
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Share Live Preview</h4>
              <p className="text-sm text-muted-foreground">
                Anyone with this link can view the live auction.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Input value={livePreviewUrl} readOnly className="h-8 flex-1" />
              <Button size="icon" className="h-8 w-8" onClick={copyToClipboard}>
                {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Link href="/live-preview" target="_blank" className="w-full">
              <Button variant="secondary" className="w-full">
                <ExternalLink className="mr-2" /> Go Live
              </Button>
            </Link>
          </div>
        </PopoverContent>
      </Popover>
    );
}

export function AuctionPage() {
  const {
    players,
    setPlayers,
    currentPlayerIndex,
    setCurrentPlayerIndex,
    auctionStarted,
    setAuctionStarted,
    actionHistory,
    setActionHistory,
    columnLabels,
  } = useAuction();
  
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddPlayersDialogOpen, setIsAddPlayersDialogOpen] = useState(false);
  const { user } = useAuth();
  const { selectedAuction } = useAuctionSelection();


  const { toast } = useToast();

  const fetchData = useCallback(async (loadPlayers: boolean = false) => {
    if (!user || !selectedAuction) {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
        const teamsSnapshot = await getDocs(collection(db, "users", user.uid, "auctions", selectedAuction.id, "teams"));
        const teamsList = teamsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Team[];
        setTeams(teamsList);
        
        // Also ensure players in queue are valid
        const masterPlayersSnapshot = await getDocs(collection(db, "users", user.uid, "auctions", selectedAuction.id, "players"));
        const masterPlayerIds = new Set(masterPlayersSnapshot.docs.map(doc => doc.id));

        const existingPlayers = players.filter(p => masterPlayerIds.has(p.id));

        if(existingPlayers.length !== players.length) {
            setPlayers(existingPlayers);
        }

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
  }, [toast, user, selectedAuction, players, setPlayers]);

  useEffect(() => {
    if (user && selectedAuction) {
      fetchData();
    } else {
        setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedAuction]);

  const handlePlayersAddedToAuction = (newPlayers: Player[]) => {
    const playersWithStatus = newPlayers.map(p => ({ ...p }));
    
    setPlayers(prevPlayers => {
        const combined = [...prevPlayers, ...playersWithStatus];
        const uniquePlayers = Array.from(new Map(combined.map(p => [p.id, p])).values());
        return uniquePlayers;
    });

    if (!user || !selectedAuction) return;
    const batch = writeBatch(db);
    newPlayers.forEach(player => {
        const playerRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "queued_players", player.id);
        batch.set(playerRef, player);
    });
    batch.commit().catch(err => {
        console.error("Failed to add players to queue:", err);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not add players to the database."
        })
    });
  };

  const handleSold = async () => {
    if (!user || !selectedAuction) return;
    const currentPrice = Number(price);
    if (!selectedTeam || !price || currentPrice < 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a team and enter a valid price.",
      });
      return;
    }

    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;

    setIsProcessing(true);

    try {
      // Fetch auction settings for initialPurse and squadSize
      const settingsDocRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "auction_settings", "config");
      const settingsSnap = await getDoc(settingsDocRef);
      const { initialPurse = 0, squadSize = 0 } = settingsSnap.exists() ? settingsSnap.data() : {};
      
      const teamQuery = query(
          collection(db, "users", user.uid, "auctions", selectedAuction.id, "sold_players"),
          where("teamId", "==", selectedTeam)
      );
      const teamSoldPlayersSnap = await getDocs(teamQuery);
      const teamPlayerCount = teamSoldPlayersSnap.size;

      // Check squad size limit
      if (squadSize > 0 && teamPlayerCount >= squadSize) {
          toast({
              variant: "destructive",
              title: "Team Full",
              description: `This team has already reached its squad limit of ${squadSize} players.`,
          });
          setIsProcessing(false);
          return;
      }
      
      // Check remaining purse
      const totalSpent = teamSoldPlayersSnap.docs.reduce((sum, doc) => sum + (doc.data().price || 0), 0);
      const remainingPurse = initialPurse - totalSpent;

      if (currentPrice > remainingPurse) {
        toast({
          variant: "destructive",
          title: "Insufficient Funds",
          description: `This team only has ₹${remainingPurse.toLocaleString('en-IN')} remaining and cannot afford this player.`,
        });
        setIsProcessing(false);
        return;
      }

      const newAction = {
        type: "sold" as const,
        player: currentPlayer,
        previousPlayerState: { ...currentPlayer },
        previousPlayers: [...players],
        previousCurrentPlayerIndex: currentPlayerIndex,
      };

      const batch = writeBatch(db);
      
      const soldData = {
        ...currentPlayer,
        teamId: selectedTeam,
        price: currentPrice,
      };

      const sourceRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "queued_players", currentPlayer.id);
      const targetRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "sold_players", currentPlayer.id);

      batch.delete(sourceRef);
      batch.set(targetRef, soldData);
      
      await batch.commit();

      setActionHistory(prev => [...prev, newAction]);
      
      const updatedPlayers = players.filter(p => p.id !== currentPlayer.id);
      setPlayers(updatedPlayers);
      
      setSelectedTeam("");
      setPrice("");
      if (currentPlayerIndex >= updatedPlayers.length && updatedPlayers.length > 0) {
        setCurrentPlayerIndex(0); 
      }

      toast({
        title: "Player Sold!",
        description: `${currentPlayer.name} has been sold to ${
          teams.find((t) => t.id === selectedTeam)?.name
        } for ₹${currentPrice.toLocaleString('en-IN')}.`,
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
    if (!user || !selectedAuction) return;
    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer) return;

    setIsProcessing(true);
    
    const newAction = {
      type: "unsold" as const,
      player: currentPlayer,
      previousPlayerState: { ...currentPlayer },
      previousPlayers: [...players],
      previousCurrentPlayerIndex: currentPlayerIndex,
    };

    try {
        const batch = writeBatch(db);

        const sourceRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "queued_players", currentPlayer.id);
        const targetRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "unsold_players", currentPlayer.id);

        batch.delete(sourceRef);
        batch.set(targetRef, currentPlayer);

        await batch.commit();
        
        setActionHistory(prev => [...prev, newAction]);

        const updatedPlayers = players.filter(p => p.id !== currentPlayer.id);
        setPlayers(updatedPlayers);
        
        if (currentPlayerIndex >= updatedPlayers.length && updatedPlayers.length > 0) {
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
    if (!user || !selectedAuction) return;
    if (actionHistory.length === 0) {
      toast({ title: "No actions to undo." });
      return;
    }

    setIsProcessing(true);
    const lastAction = actionHistory[actionHistory.length - 1];

    try {
      const batch = writeBatch(db);

      let sourceCollection;
      if (lastAction.type === 'sold') {
        sourceCollection = "sold_players";
      } else {
        sourceCollection = "unsold_players";
      }

      const sourceRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, sourceCollection, lastAction.player.id);
      const targetRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "queued_players", lastAction.player.id);
      
      batch.delete(sourceRef);
      batch.set(targetRef, lastAction.previousPlayerState);

      await batch.commit();

      setPlayers(lastAction.previousPlayers);
      setCurrentPlayerIndex(lastAction.previousCurrentPlayerIndex);
      
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
    if (!user || !selectedAuction) return;
    setIsProcessing(true);
    try {
        const batch = writeBatch(db);
        const soldPlayersRef = collection(db, "users", user.uid, "auctions", selectedAuction.id, "sold_players");
        const unsoldPlayersRef = collection(db, "users", user.uid, "auctions", selectedAuction.id, "unsold_players");
        
        const soldSnapshot = await getDocs(soldPlayersRef);
        soldSnapshot.forEach(doc => batch.delete(doc.ref));

        const unsoldSnapshot = await getDocs(unsoldPlayersRef);
        unsoldSnapshot.forEach(doc => batch.delete(doc.ref));

        await batch.commit();
        
        toast({
            title: "Auction Reset",
            description: "The auction has been reset. All players are now available."
        });
        
        setPlayers([]);
        setCurrentPlayerIndex(0);
        setActionHistory([]);
        setAuctionStarted(false);

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

const movePlayer = (index: number, direction: 'up' | 'down') => {
    setPlayers(currentPlayers => {
        const newPlayers = [...currentPlayers];
        const playerToMove = newPlayers[index];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;

        if (swapIndex < 0 || swapIndex >= newPlayers.length) {
            return newPlayers; // Out of bounds
        }

        newPlayers[index] = newPlayers[swapIndex];
        newPlayers[swapIndex] = playerToMove;

        return newPlayers;
    });
};


  const currentPlayer = useMemo(() => players[currentPlayerIndex], [players, currentPlayerIndex]);
  
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
                        <Input id="price" type="number" placeholder="Enter price" value="" disabled />
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
                <Avatar className="h-48 w-48 border-4 border-primary rounded-lg">
                    <AvatarImage src={currentPlayer.photoUrl} alt={currentPlayer.name} className="object-contain h-full w-full" />
                    <AvatarFallback className="text-6xl rounded-lg"><User /></AvatarFallback>
                </Avatar>
                <div className="w-full space-y-3">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-lg">
                        <p className="font-medium text-muted-foreground">{columnLabels.department}</p>
                        <p>{currentPlayer.department}</p>
                        <p className="font-medium text-muted-foreground">{columnLabels.year}</p>
                        <p>{currentPlayer.year}</p>
                        <p className="font-medium text-muted-foreground">{columnLabels.player_position}</p>
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
            <SharePopover />
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
              <CardTitle>Next up Ahead</CardTitle>
              <Button onClick={() => setIsAddPlayersDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Player
              </Button>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[80px]">{columnLabels.sno}</TableHead>
                          <TableHead>{columnLabels.photo}</TableHead>
                          <TableHead>{columnLabels.name}</TableHead>
                          <TableHead>{columnLabels.player_position}</TableHead>
                          <TableHead className="w-[120px] text-center">{columnLabels.actions}</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {players.length > 0 ? (
                          players.map((player, index) => (
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
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => movePlayer(index, 'up')}
                                            disabled={index === 0}
                                        >
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => movePlayer(index, 'down')}
                                            disabled={index === players.length - 1}
                                        >
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                    </div>
                                  </TableCell>
                              </TableRow>
                          ))
                      ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center">
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
        playersInQueue={players}
    />
    </>
  );
}
