"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { useAuctionSelection } from "@/context/auction-selection-context";

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
import { Loader2, Search, User, Filter } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import type { Player } from "./pages/players";
import { Checkbox } from "./ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Label } from "./ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  
interface AddPlayersToAuctionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayersAdded: (newPlayers: Player[]) => void;
  playersInQueue: Player[];
}

export function AddPlayersToAuctionDialog({ open, onOpenChange, onPlayersAdded, playersInQueue }: AddPlayersToAuctionDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedAuction } = useAuctionSelection();

  useEffect(() => {
    if (open && user && selectedAuction) {
      const fetchPlayers = async () => {
        setLoading(true);
        try {
          const playersQuery = query(collection(db, "users", user.uid, "auctions", selectedAuction.id, "players"));
          const playerSnapshot = await getDocs(playersQuery);
          const playersList = playerSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Player[];

          const soldPlayersQuery = query(collection(db, "users", user.uid, "auctions", selectedAuction.id, "sold_players"));
          const soldPlayersSnapshot = await getDocs(soldPlayersQuery);
          const soldPlayerIds = new Set(soldPlayersSnapshot.docs.map(doc => doc.id));
          
          const unsoldPlayersQuery = query(collection(db, "users", user.uid, "auctions", selectedAuction.id, "unsold_players"));
          const unsoldPlayersSnapshot = await getDocs(unsoldPlayersQuery);
          const unsoldPlayerIds = new Set(unsoldPlayersSnapshot.docs.map(doc => doc.id));

          const playersInQueueIds = new Set(playersInQueue.map(p => p.id));
          
          const unavailablePlayerIds = new Set([...soldPlayerIds, ...unsoldPlayerIds, ...playersInQueueIds]);

          const availablePlayers = playersList.filter(p => !unavailablePlayerIds.has(p.id));
          
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
  }, [open, toast, playersInQueue, user, selectedAuction]);
  
  const availablePositions = useMemo(() => {
    const positions = new Set(allPlayers.map(p => p.player_position).filter(Boolean));
    return Array.from(positions);
  }, [allPlayers]);

  const filteredPlayers = useMemo(() => {
    return allPlayers.filter((player) =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (positionFilter === 'all' || player.player_position === positionFilter)
    );
  }, [allPlayers, searchTerm, positionFilter]);

  const handlePlayerSelect = (player: Player, checked: boolean) => {
    setSelectedPlayers(prev => {
      if (checked) {
        return [...prev, player];
      } else {
        return prev.filter(p => p.id !== player.id);
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPlayers(Array.from(new Map([...selectedPlayers, ...filteredPlayers].map(p => [p.id, p])).values()));
    } else {
      const filteredPlayerIds = new Set(filteredPlayers.map(p => p.id));
      setSelectedPlayers(selectedPlayers.filter(p => !filteredPlayerIds.has(p.id)));
    }
  };

  const handleAddPlayers = () => {
    onPlayersAdded(selectedPlayers);
    onOpenChange(false);
    toast({
        title: "Players Added",
        description: `${selectedPlayers.length} player(s) have been added to the auction queue.`
    });
  };

  const areAllFilteredPlayersSelected = useMemo(() => {
    if (filteredPlayers.length === 0) return false;
    const filteredPlayerIds = new Set(filteredPlayers.map(p => p.id));
    return Array.from(filteredPlayerIds).every(id => selectedPlayers.some(p => p.id === id));
  }, [filteredPlayers, selectedPlayers]);

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
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search players..."
                        className="w-full pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select onValueChange={setPositionFilter} value={positionFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by position" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Positions</SelectItem>
                        {availablePositions.map(position => (
                            <SelectItem key={position} value={position}>{position}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center space-x-2 border-b pb-2">
                <Checkbox
                    id="select-all"
                    checked={areAllFilteredPlayersSelected}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    disabled={filteredPlayers.length === 0}
                />
                <Label htmlFor="select-all" className="font-medium cursor-pointer">
                    Select All
                </Label>
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
