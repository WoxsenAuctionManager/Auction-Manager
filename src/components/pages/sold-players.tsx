"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
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
import { User, Loader2, Search } from "lucide-react";
import type { Player } from "./players";
import type { Team } from "./teams";
import { Input } from "../ui/input";

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

  useEffect(() => {
    const fetchSoldPlayers = async () => {
      setLoading(true);
      setError(null);
      try {
        const playersQuery = query(
          collection(db, "players"),
          where("teamId", "!=", null)
        );
        const playerSnapshot = await getDocs(playersQuery);
        const playersList = playerSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SoldPlayer[];

        // Fetch team data for each player
        const playersWithTeamData = await Promise.all(
          playersList.map(async (player) => {
            if (player.teamId) {
              const teamDocRef = doc(db, "teams", player.teamId);
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
    };

    fetchSoldPlayers();
  }, []);

  const filteredPlayers = useMemo(() => {
    return soldPlayers.filter((player) =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [soldPlayers, searchTerm]);

  return (
    <>
      <div className="flex-1">
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : error ? (
                 <TableRow>
                  <TableCell colSpan={6} className="text-center text-destructive">
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
                    <TableCell>&#8377;{player.price?.toLocaleString() || 'N/A'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No sold players found.
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
