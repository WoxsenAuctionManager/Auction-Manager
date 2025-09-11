"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
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
import { User, Shield, Loader2 } from "lucide-react";
import type { Team } from "./teams";
import type { Player } from "./players";

interface RosterPlayer extends Player {
  price?: number;
}

interface TeamWithRoster extends Team {
  roster: RosterPlayer[];
  remainingPurse: number;
}

export function TeamRosterPage() {
  const [teamsWithRosters, setTeamsWithRosters] = useState<TeamWithRoster[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamRosters = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch auction settings
        const settingsDocRef = doc(db, "auction_settings", "config");
        const settingsSnap = await getDoc(settingsDocRef);
        const initialPurse = settingsSnap.exists()
          ? Number(settingsSnap.data().initialPurse)
          : 0;

        // 2. Fetch all teams
        const teamsCollection = collection(db, "teams");
        const teamSnapshot = await getDocs(teamsCollection);
        const teamsList = teamSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Team[];

        // 3. For each team, fetch players and calculate remaining purse
        const teamsData = await Promise.all(
          teamsList.map(async (team) => {
            const playersQuery = query(
              collection(db, "players"),
              where("teamId", "==", team.id)
            );
            const playerSnapshot = await getDocs(playersQuery);
            const roster = playerSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as RosterPlayer[];

            const totalSpent = roster.reduce(
              (sum, player) => sum + (player.price || 0),
              0
            );
            const remainingPurse = initialPurse - totalSpent;

            return { ...team, roster, remainingPurse };
          })
        );

        setTeamsWithRosters(teamsData);
      } catch (err) {
        console.error(err);
        setError(
          "Failed to load team rosters. Please check your configuration and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTeamRosters();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <CardHeader className="px-0">
        <CardTitle>Team Roster</CardTitle>
        <CardDescription>
          View and manage player assignments for each team.
        </CardDescription>
      </CardHeader>
      <div className="space-y-6">
        {teamsWithRosters.map((team) => (
          <Card key={team.id}>
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={team.logoUrl} alt={team.name} />
                        <AvatarFallback>
                            <Shield />
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle>{team.name}</CardTitle>
                        <CardDescription>
                            Amount Remaining: &#8377;{team.remainingPurse.toLocaleString()}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Sno.</TableHead>
                    <TableHead>Player Photo</TableHead>
                    <TableHead>Player Name</TableHead>
                    <TableHead>Player Position</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {team.roster.length > 0 ? (
                    team.roster.map((player, index) => (
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
                        <TableCell>&#8377;{player.price?.toLocaleString() || 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No players in this team yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
        {teamsWithRosters.length === 0 && !loading && (
             <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">No teams found. Add a team to see its roster.</p>
                </CardContent>
            </Card>
        )}
      </div>
    </>
  );
}
