"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  DocumentData,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as XLSX from "xlsx";
import { convertGoogleDriveUrl } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useAuctionSelection } from "@/context/auction-selection-context";

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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, AlertCircle, PlusCircle, User, MoreHorizontal, Trash2, Pencil, Upload, Loader2, XCircle, Rows } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { AddPlayerDialog } from "../add-player-dialog";
import { useToast } from "@/hooks/use-toast";
import { PlayerProfileDialog } from "../player-profile-dialog";
import { ImportPlayersDialog } from "../import-players-dialog";

export interface Player {
  id: string;
  name: string;
  contact: string;
  year: string;
  department: string;
  player_position: string;
  photoUrl?: string;
}

export function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportPlayerDialogOpen, setIsImportPlayerDialogOpen] = useState(false);
  const [importedPlayers, setImportedPlayers] = useState<Omit<Player, 'id'>[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedAuction } = useAuctionSelection();

  const fetchPlayers = useCallback(async () => {
    if (!user || !selectedAuction) {
      setPlayers([]);
      setLoading(false);
      return;
    };
    setLoading(true);
    setError(null);
    try {
      const playersCollection = collection(db, "users", user.uid, "auctions", selectedAuction.id, "players");
      const playerSnapshot = await getDocs(playersCollection);
      const playersList = playerSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Player[];
      setPlayers(playersList);
    } catch (err) {
      console.error(err);
      setError(
        "Failed to load players. Please check your internet connection and Firestore permissions."
      );
    } finally {
      setLoading(false);
    }
  }, [user, selectedAuction]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handlePlayerAdded = (newPlayer: DocumentData) => {
    setPlayers((prevPlayers) => [...prevPlayers, newPlayer as Player]);
  };

  const handlePlayerUpdated = (updatedPlayer: DocumentData) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((p) =>
        p.id === updatedPlayer.id ? { ...p, ...updatedPlayer } as Player : p
      )
    );
  };

  const handleEdit = (player: Player) => {
    setPlayerToEdit(player);
    setIsAddPlayerDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!playerToDelete || !user || !selectedAuction) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "auctions", selectedAuction.id, "players", playerToDelete.id));
      setPlayers(players.filter((p) => p.id !== playerToDelete.id));
      toast({
        title: "Player Deleted",
        description: `${playerToDelete.name} has been successfully deleted.`,
      });
    } catch (error) {
      console.error("Error deleting document: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete player. Please try again.",
      });
    } finally {
      setPlayerToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPlayers.length === 0 || !user || !selectedAuction) return;
    try {
      const batch = writeBatch(db);
      selectedPlayers.forEach(playerId => {
        const playerDocRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "players", playerId);
        batch.delete(playerDocRef);
      });
      await batch.commit();

      setPlayers(players.filter(p => !selectedPlayers.includes(p.id)));
      toast({
        title: `${selectedPlayers.length} Player(s) Deleted`,
        description: `The selected players have been successfully deleted.`,
      });
    } catch (error) {
      console.error("Error deleting documents: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete selected players. Please try again.",
      });
    } finally {
      setIsBulkDeleteDialogOpen(false);
      setSelectedPlayers([]);
      setSelectionMode(false);
    }
  };
  
  const handleDialogClose = () => {
    setIsAddPlayerDialogOpen(false);
    setPlayerToEdit(null);
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        const newPlayers = json.map((row: any) => ({
          name: row.Name || '',
          contact: String(row.Contact || ''),
          department: row.Department || '',
          year: String(row.Year || ''),
          player_position: row.Position || '',
          photoUrl: row['Photo URL'] ? convertGoogleDriveUrl(row['Photo URL']) : '',
        }));

        setImportedPlayers(newPlayers);
        setIsImportPlayerDialogOpen(true);
      };
      reader.readAsArrayBuffer(file);
    }
     if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
    if (!user || !selectedAuction) return;
    setIsImporting(true);
    try {
      const batch = writeBatch(db);
      const playersCollectionRef = collection(db, "users", user.uid, "auctions", selectedAuction.id, "players");
      importedPlayers.forEach(player => {
        const newPlayerRef = doc(playersCollectionRef);
        batch.set(newPlayerRef, { ...player, status: 'queued' });
      });

      await batch.commit();

      toast({
        title: "Import Successful",
        description: `${importedPlayers.length} players have been successfully imported.`,
      });

      fetchPlayers();
      
    } catch (error) {
      console.error("Error importing players: ", error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: "An error occurred while importing players. Please check the file and try again.",
      });
    } finally {
      setIsImporting(false);
      setIsImportPlayerDialogOpen(false);
      setImportedPlayers([]);
    }
  };

  const filteredPlayers = useMemo(() => {
    return players.filter((player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [players, searchTerm]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPlayers(filteredPlayers.map(p => p.id));
    } else {
      setSelectedPlayers([]);
    }
  };

  const handlePlayerSelect = (playerId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlayers(prev => [...prev, playerId]);
    } else {
      setSelectedPlayers(prev => prev.filter(id => id !== playerId));
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedPlayers([]);
  }

  const allFilteredSelected = selectionMode && selectedPlayers.length > 0 && filteredPlayers.every(p => selectedPlayers.includes(p.id))

  if (loading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <h1 className="font-semibold text-3xl">Player's List</h1>
          <p className="text-muted-foreground mt-1">
            Browse and search for players in the league.
          </p>
        </div>
        {selectionMode ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedPlayers.length} selected</span>
            <Button variant="destructive" onClick={() => setIsBulkDeleteDialogOpen(true)} disabled={selectedPlayers.length === 0}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
             <Button variant="ghost" onClick={handleCancelSelection}>
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
          </div>
        ) : (
            <Button onClick={() => {
              setPlayerToEdit(null);
              setIsAddPlayerDialogOpen(true);
            }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Player
            </Button>
        )}
      </div>

      <AddPlayerDialog
        open={isAddPlayerDialogOpen}
        onOpenChange={handleDialogClose}
        onPlayerAdded={handlePlayerAdded}
        onPlayerUpdated={handlePlayerUpdated}
        playerToEdit={playerToEdit}
      />

      <PlayerProfileDialog
        player={selectedPlayer}
        open={!!selectedPlayer}
        onOpenChange={() => setSelectedPlayer(null)}
      />

      <ImportPlayersDialog
        open={isImportPlayerDialogOpen}
        onOpenChange={setIsImportPlayerDialogOpen}
        onConfirmImport={handleConfirmImport}
        players={importedPlayers}
        isImporting={isImporting}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by player name..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Import Players
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setSelectionMode(true)} disabled={players.length === 0}>
                <Rows className="mr-2 h-4 w-4" />
                Bulk Edit
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".xlsx, .xls, .csv"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {selectionMode && (
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={allFilteredSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                )}
                <TableHead className="w-[80px]">Sno.</TableHead>
                <TableHead>Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Player Position</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!user ? (
                <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                        Please log in to view players.
                    </TableCell>
                </TableRow>
              ) : filteredPlayers.length > 0 ? (
                filteredPlayers.map((player, index) => (
                  <TableRow 
                    key={player.id} 
                    data-state={selectedPlayers.includes(player.id) && "selected"}
                  >
                    {selectionMode && (
                      <TableCell>
                        <Checkbox 
                          checked={selectedPlayers.includes(player.id)}
                          onCheckedChange={(checked) => handlePlayerSelect(player.id, !!checked)}
                          aria-label={`Select ${player.name}`}
                        />
                      </TableCell>
                    )}
                    <TableCell onClick={() => setSelectedPlayer(player)} className="cursor-pointer">{index + 1}</TableCell>
                    <TableCell onClick={() => setSelectedPlayer(player)} className="cursor-pointer">
                      <Avatar>
                        <AvatarImage src={player.photoUrl} alt={player.name} />
                        <AvatarFallback>
                          <User />
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell onClick={() => setSelectedPlayer(player)} className="cursor-pointer font-medium">{player.name}</TableCell>
                    <TableCell onClick={() => setSelectedPlayer(player)} className="cursor-pointer">{player.contact}</TableCell>
                    <TableCell onClick={() => setSelectedPlayer(player)} className="cursor-pointer">{player.department}</TableCell>
                    <TableCell onClick={() => setSelectedPlayer(player)} className="cursor-pointer">{player.year}</TableCell>
                    <TableCell onClick={() => setSelectedPlayer(player)} className="cursor-pointer">{player.player_position}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(player); }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); setPlayerToDelete(player); }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={selectionMode ? 9: 8} className="text-center">
                    No players found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AlertDialog open={!!playerToDelete} onOpenChange={(open) => !open && setPlayerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong>{playerToDelete?.name}</strong> and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong>{selectedPlayers.length}</strong> player(s) and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
