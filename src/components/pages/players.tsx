"use client";

import { useState, useEffect, useMemo } from "react";
import {
  collection,
  getDocs,
  addDoc,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
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
import { Search, AlertCircle, PlusCircle, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { AddPlayerDialog } from "../add-player-dialog";

interface Player {
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

  const filteredPlayers = useMemo(() => {
    return players.filter((player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [players, searchTerm]);

  return (
    <>
      <div className="flex items-center">
        <div className="flex-1">
          <h1 className="font-semibold text-3xl">Player's List</h1>
          <p className="text-muted-foreground mt-1">
            Browse and search for players in the league.
          </p>
        </div>
        <Button onClick={() => setIsAddPlayerDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Player
        </Button>
      </div>

      <AddPlayerDialog
        open={isAddPlayerDialogOpen}
        onOpenChange={setIsAddPlayerDialogOpen}
        onPlayerAdded={handlePlayerAdded}
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
                <TableHead>Year</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Player Position</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
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
                  <TableRow key={player.id}>
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
                    <TableCell>{player.year}</TableCell>
                    <TableCell>{player.department}</TableCell>
                    <TableCell>{player.player_position}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
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
    </>
  );
}
