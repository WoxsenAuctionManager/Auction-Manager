"use client";

import { useState, useEffect } from "react";
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
import { User, Loader2 } from "lucide-react";
import type { Player } from "./players";
import type { Team } from "./teams";

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

  return (
    <>
      <CardHeader className="px-0">
        <CardTitle>Sold Players</CardTitle>
        <CardDescription>
          A list of all players who have been sold in the auction.
        </CardDescription>
      </CardHeader>

      <Card>
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
              ) : soldPlayers.length > 0 ? (
                soldPlayers.map((player, index) => (
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
