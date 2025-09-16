"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, query, getDocs, doc, writeBatch, setDoc } from "firebase/firestore";
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
import { User, Loader2, Search, MoreHorizontal, Trash2, Trash, Download } from "lucide-react";
import type { Player } from "./players";
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PlayerProfileDialog } from "../player-profile-dialog";
import { useAuction } from "@/context/auction-context";


export function UnsoldPlayersPage() {
  const [unsoldPlayers, setUnsoldPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null);
  const [isRemoveAllDialogOpen, setIsRemoveAllDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedAuction } = useAuctionSelection();
  const { columnLabels } = useAuction();

  const fetchUnsoldPlayers = useCallback(async () => {
      if (!user || !selectedAuction) {
        setUnsoldPlayers([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const playersQuery = query(
          collection(db, "users", user.uid, "auctions", selectedAuction.id, "unsold_players")
        );
        const playerSnapshot = await getDocs(playersQuery);
        const playersList = playerSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Player[];

        const masterPlayersSnapshot = await getDocs(collection(db, "users", user.uid, "auctions", selectedAuction.id, "players"));
        const masterPlayerIds = new Set(masterPlayersSnapshot.docs.map(doc => doc.id));

        const validUnsoldPlayers = playersList.filter(p => masterPlayerIds.has(p.id));

        setUnsoldPlayers(validUnsoldPlayers);
      } catch (err) {
        console.error(err);
        setError("Failed to load unsold players.");
      } finally {
        setLoading(false);
      }
    }, [user, selectedAuction]);

  useEffect(() => {
    fetchUnsoldPlayers();
  }, [fetchUnsoldPlayers]);
  
  const handleRemove = async () => {
    if (!playerToRemove || !user || !selectedAuction) return;
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      const sourceRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "unsold_players", playerToRemove.id);
      const targetRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "queued_players", playerToRemove.id);

      batch.delete(sourceRef);
      batch.set(targetRef, playerToRemove);
      await batch.commit();

      setUnsoldPlayers(players => players.filter(p => p.id !== playerToRemove.id));
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

  const handleRemoveAll = async () => {
    if (!user || !selectedAuction) return;
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      const targetCollectionRef = collection(db, "users", user.uid, "auctions", selectedAuction.id, "queued_players");
      unsoldPlayers.forEach(player => {
        const sourcePlayerRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "unsold_players", player.id);
        const targetPlayerRef = doc(targetCollectionRef, player.id);
        batch.delete(sourcePlayerRef);
        batch.set(targetPlayerRef, player);
      });
      await batch.commit();

      setUnsoldPlayers([]);
      toast({
        title: "All Players Moved",
        description: "All unsold players have been moved back to the auction queue.",
      });
    } catch (error) {
      console.error("Error removing all players:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove all players. Please try again.",
      });
    } finally {
      setIsRemoveAllDialogOpen(false);
      setIsProcessing(false);
    }
  };

  const filteredPlayers = useMemo(() => {
    return unsoldPlayers.filter((player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [unsoldPlayers, searchTerm]);

  const handleDownload = () => {
    const doc = new jsPDF();
    doc.text("Unsold Players", 14, 16);
    autoTable(doc, {
      startY: 20,
      head: [[
        columnLabels.sno,
        columnLabels.name,
        columnLabels.contact,
        columnLabels.department,
        columnLabels.year,
        columnLabels.player_position,
      ]],
      body: filteredPlayers.map((player, index) => [
        index + 1,
        player.name,
        player.contact,
        player.department,
        player.year,
        player.player_position,
      ]),
    });
    doc.save("unsold-players.pdf");
  };


  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-3xl">Unsold Players</h1>
          <p className="text-muted-foreground mt-1">
            A list of all players who were not sold in the auction.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={handleDownload}
            disabled={filteredPlayers.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Download List
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setIsRemoveAllDialogOpen(true)}
            disabled={unsoldPlayers.length === 0 || isProcessing}
          >
            <Trash className="mr-2 h-4 w-4" />
            Remove All Players
          </Button>
        </div>
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
                <TableHead className="w-[80px]">{columnLabels.sno}</TableHead>
                <TableHead>{columnLabels.photo}</TableHead>
                <TableHead>{columnLabels.name}</TableHead>
                <TableHead>{columnLabels.contact}</TableHead>
                <TableHead>{columnLabels.department}</TableHead>
                <TableHead>{columnLabels.year}</TableHead>
                <TableHead>{columnLabels.player_position}</TableHead>
                <TableHead className="text-right">{columnLabels.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                     <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : error ? (
                 <TableRow>
                  <TableCell colSpan={8} className="text-center text-destructive">
                    {error}
                  </TableCell>
                </TableRow>
              ) : filteredPlayers.length > 0 ? (
                filteredPlayers.map((player, index) => (
                  <TableRow key={player.id} onClick={() => setSelectedPlayer(player)} className="cursor-pointer">
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
                    <TableCell>{player.contact}</TableCell>
                    <TableCell>{player.department}</TableCell>
                    <TableCell>{player.year}</TableCell>
                    <TableCell>{player.player_position}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost" disabled={isProcessing}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                  <TableCell colSpan={8} className="text-center">
                    No unsold players found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

       <PlayerProfileDialog
        player={selectedPlayer}
        open={!!selectedPlayer}
        onOpenChange={() => setSelectedPlayer(null)}
      />
      
      <AlertDialog open={!!playerToRemove} onOpenChange={(open) => !open && setPlayerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>{playerToRemove?.name}</strong> from the unsold list and make them available for auction again.
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

      <AlertDialog open={isRemoveAllDialogOpen} onOpenChange={setIsRemoveAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to remove all players?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will move all players from the unsold list back to the available players pool.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveAll} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
