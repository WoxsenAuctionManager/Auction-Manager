"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, query, getDocs, doc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { useAuctionSelection } from "@/context/auction-selection-context";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Loader2, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Player } from "./players";
import type { Team } from "./teams";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
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
import { EditSoldPlayerDialog } from "../edit-sold-player-dialog";

interface SoldPlayer extends Player {
  price?: number;
  teamId: string;
  teamName?: string;
  teamLogoUrl?: string;
}

export function SoldPlayersPage() {
  const [soldPlayers, setSoldPlayers] = useState<SoldPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [playerToEdit, setPlayerToEdit] = useState<SoldPlayer | null>(null);
  const [playerToRemove, setPlayerToRemove] = useState<SoldPlayer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedAuction } = useAuctionSelection();

  const fetchSoldPlayers = useCallback(async () => {
    if (!user || !selectedAuction) {
        setSoldPlayers([]);
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const playersQuery = query(
        collection(db, "users", user.uid, "auctions", selectedAuction.id, "sold_players")
      );
      const playerSnapshot = await getDocs(playersQuery);
      const playersList = playerSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SoldPlayer[];
      
      const masterPlayersSnapshot = await getDocs(collection(db, "users", user.uid, "auctions", selectedAuction.id, "players"));
      const masterPlayerIds = new Set(masterPlayersSnapshot.docs.map(doc => doc.id));

      const validSoldPlayers = playersList.filter(p => masterPlayerIds.has(p.id));

      const playersWithTeamData = await Promise.all(
        validSoldPlayers.map(async (player) => {
          if (player.teamId) {
            const teamDocRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "teams", player.teamId);
            const teamDocSnap = await getDoc(teamDocRef);
            if (teamDocSnap.exists()) {
              const teamData = teamDocSnap.data() as Team;
              return {
                ...player,
                teamName: teamData.name,
                teamLogoUrl: teamData.logoUrl,
              };
            }
          }
          return player;
        })
      );

      setSoldPlayers(playersWithTeamData);
    } catch (err) {
      console.error(err);
      setError("Failed to load sold players.");
    } finally {
      setLoading(false);
    }
  }, [user, selectedAuction]);

  useEffect(() => {
    fetchSoldPlayers();
  }, [fetchSoldPlayers]);

  const handlePlayerUpdated = (updatedPlayer: SoldPlayer) => {
    setSoldPlayers(prev => 
      prev.map(p => p.id === updatedPlayer.id ? updatedPlayer : p)
    );
    fetchSoldPlayers(); // Re-fetch to get fresh team data
  };
  
  const handleRemove = async () => {
    if (!playerToRemove || !user || !selectedAuction) return;
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      const sourceRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "sold_players", playerToRemove.id);
      const targetRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "queued_players", playerToRemove.id);
      
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { teamId, price, teamName, teamLogoUrl, ...queuedPlayer } = playerToRemove;
      
      batch.delete(sourceRef);
      batch.set(targetRef, queuedPlayer);
      await batch.commit();

      setSoldPlayers(players => players.filter(p => p.id !== playerToRemove.id));
      toast({
        title: "Player Moved",
        description: `${playerToRemove.name} has been moved back to the auction queue.`,
      });
    } catch (error) {
      console.error("Error removing player:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove player. Please try again.",
      });
    } finally {
      setPlayerToRemove(null);
      setIsProcessing(false);
    }
  };


  const filteredPlayers = useMemo(() => {
    return soldPlayers.filter((player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [soldPlayers, searchTerm]);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-3xl">Sold Players</h1>
          <p className="text-muted-foreground mt-1">
            A list of all players who have been sold in the auction.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by player name..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Sno.</TableHead>
                  <TableHead>Player Photo</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Sold To</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-destructive">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filteredPlayers.length > 0 ? (
                  filteredPlayers.map((player, index) => (
                    <TableRow key={player.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Avatar>
                          <AvatarImage
                            src={player.photoUrl}
                            alt={player.name}
                          />
                          <AvatarFallback>
                            <User />
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {player.name}
                      </TableCell>
                      <TableCell>{player.player_position}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-6 w-6">
                              <AvatarImage
                                  src={player.teamLogoUrl}
                                  alt={player.teamName}
                              />
                              <AvatarFallback>
                                {player.teamName?.charAt(0)}
                              </AvatarFallback>
                          </Avatar>
                          {player.teamName || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>&#8377;{player.price?.toLocaleString('en-IN') || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPlayerToEdit(player)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setPlayerToRemove(player)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No sold players found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {playerToEdit && (
        <EditSoldPlayerDialog
          open={!!playerToEdit}
          onOpenChange={() => setPlayerToEdit(null)}
          player={playerToEdit}
          onPlayerUpdated={handlePlayerUpdated}
        />
      )}

      <AlertDialog open={!!playerToRemove} onOpenChange={(open) => !open && setPlayerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{playerToRemove?.name}</strong> from the sold list and make them available for auction again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
