"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { User, Loader2 } from "lucide-react";
import type { Player } from "./players";

export function UnsoldPlayersPage() {
  const [unsoldPlayers, setUnsoldPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUnsoldPlayers = async () => {
      setLoading(true);
      setError(null);
      try {
        const playersQuery = query(
          collection(db, "players"),
          where("teamId", "==", null)
        );
        const playerSnapshot = await getDocs(playersQuery);
        const playersList = playerSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Player[];
        setUnsoldPlayers(playersList);
      } catch (err) {
        console.error(err);
        setError("Failed to load unsold players.");
      } finally {
        setLoading(false);
      }
    };

    fetchUnsoldPlayers();
  }, []);

  return (
    <>
      <CardHeader className="px-0">
        <CardTitle>Unsold Players</CardTitle>
        <CardDescription>
          A list of all players who were not sold in the auction.
        </CardDescription>
      </CardHeader>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Sno.</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Year</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                     <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : error ? (
                 <TableRow>
                  <TableCell colSpan={5} className="text-center text-destructive">
                    {error}
                  </TableCell>
                </TableRow>
              ) : unsoldPlayers.length > 0 ? (
                unsoldPlayers.map((player, index) => (
                  <TableRow key={player.id}>
                    <TableCell>{index + 1}</TableCell>
                     <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={player.photoUrl}
                            alt={player.name}
                          />
                          <AvatarFallback>
                            <User />
                          </AvatarFallback>
                        </Avatar>
                        {player.name}
                      </div>
                    </TableCell>
                    <TableCell>{player.player_position}</TableCell>
                    <TableCell>{player.department}</TableCell>
                    <TableCell>{player.year}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No unsold players found.
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
