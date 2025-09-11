
"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, User } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import type { Player } from "./pages/players";
import { Checkbox } from "./ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Label } from "./ui/label";

interface AddPlayersToAuctionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayersAdded: (newPlayers: Player[]) => void;
  existingPlayers: Player[];
}

export function AddPlayersToAuctionDialog({ open, onOpenChange, onPlayersAdded, existingPlayers }: AddPlayersToAuctionDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const fetchPlayers = async () => {
        setLoading(true);
        try {
          const playersQuery = query(
            collection(db, "players"),
            where("status", "==", "queued")
          );
          const playerSnapshot = await getDocs(playersQuery);
          const playersList = playerSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Player[];

          const existingPlayerIds = new Set(existingPlayers.map(p => p.id));
          const availablePlayers = playersList.filter(p => !existingPlayerIds.has(p.id));
          
          setAllPlayers(availablePlayers);
          setSelectedPlayers([]);
        } catch (error) {
          console.error("Error fetching players: ", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load players. Please try again.",
          });
        } finally {
          setLoading(false);
        }
      };

      fetchPlayers();
    }
  }, [open, toast, existingPlayers]);

  const filteredPlayers = useMemo(() => {
    return allPlayers.filter((player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allPlayers, searchTerm]);

  const handlePlayerSelect = (player: Player, checked: boolean) => {
    setSelectedPlayers(prev => {
      if (checked) {
        return [...prev, player];
      } else {
        return prev.filter(p => p.id !== player.id);
      }
    });
  };

  const handleAddPlayers = () => {
    onPlayersAdded(selectedPlayers);
    onOpenChange(false);
    toast({
        title: "Players Added",
        description: `${selectedPlayers.length} player(s) have been added to the auction queue.`
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Players to Auction</DialogTitle>
          <DialogDescription>
            Select players from the list to add to the auction queue.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search players..."
                    className="w-full pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <ScrollArea className="h-[40vh] border rounded-md p-2">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : filteredPlayers.length > 0 ? (
                    <div className="space-y-2">
                    {filteredPlayers.map(player => (
                        <div key={player.id} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted">
                            <Checkbox
                                id={`player-${player.id}`}
                                onCheckedChange={(checked) => handlePlayerSelect(player, !!checked)}
                                checked={selectedPlayers.some(p => p.id === player.id)}
                            />
                            <Label htmlFor={`player-${player.id}`} className="flex-1 flex items-center gap-3 cursor-pointer">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={player.photoUrl} alt={player.name} />
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{player.name}</p>
                                    <p className="text-xs text-muted-foreground">{player.player_position}</p>
                                </div>
                            </Label>
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">No available players found.</p>
                )}
            </ScrollArea>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleAddPlayers} disabled={selectedPlayers.length === 0}>
            Add to Auction ({selectedPlayers.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
