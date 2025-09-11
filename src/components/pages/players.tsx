"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, AlertCircle, PlusCircle, User, MoreHorizontal, Trash2, Pencil, Upload } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportPlayerDialogOpen, setIsImportPlayerDialogOpen] = useState(false);
  const [importedPlayers, setImportedPlayers] = useState<Omit<Player, 'id'>[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchPlayers = async () => {
    setLoading(true);
    setError(null);
    try {
      const playersCollection = collection(db, "players");
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
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

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
    if (!playerToDelete) return;
    try {
      await deleteDoc(doc(db, "players", playerToDelete.id));
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
     // Reset file input to allow re-uploading the same file
     if(fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    try {
      const batch = writeBatch(db);
      importedPlayers.forEach(player => {
        const newPlayerRef = doc(collection(db, "players"));
        batch.set(newPlayerRef, { ...player, status: 'queued' });
      });

      await batch.commit();

      toast({
        title: "Import Successful",
        description: `${importedPlayers.length} players have been successfully imported.`,
      });

      fetchPlayers(); // Re-fetch players to update the list
      
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

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <h1 className="font-semibold text-3xl">Player's List</h1>
          <p className="text-muted-foreground mt-1">
            Browse and search for players in the league.
          </p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".xlsx, .xls, .csv"
        />
        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" /> Import Players
        </Button>
        <Button onClick={() => {
          setPlayerToEdit(null);
          setIsAddPlayerDialogOpen(true);
        }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Player
        </Button>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredPlayers.length > 0 ? (
                filteredPlayers.map((player, index) => (
                  <TableRow key={player.id} onClick={() => setSelectedPlayer(player)} className="cursor-pointer">
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Avatar>
                        <AvatarImage src={player.photoUrl} alt={player.name} />
                        <AvatarFallback>
                          <User />
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell>{player.contact}</TableCell>
                    <TableCell>{player.department}</TableCell>
                    <TableCell>{player.year}</TableCell>
                    <TableCell>{player.player_position}</TableCell>
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
                  <TableCell colSpan={8} className="text-center">
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
    </>
  );
}
