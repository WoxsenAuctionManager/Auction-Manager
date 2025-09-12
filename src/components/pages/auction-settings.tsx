"use client";

import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { User, Shield, Loader2, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
  const [initialPurse, setInitialPurse] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTeamRostersAndSettings = async () => {
    if (!user) {
      setTeamsWithRosters([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch auction settings
      const settingsDocRef = doc(db, "users", user.uid, "auction_settings", "config");
      const settingsSnap = await getDoc(settingsDocRef);
      const currentInitialPurse = settingsSnap.exists()
        ? Number(settingsSnap.data().initialPurse)
        : 0;
      setInitialPurse(String(currentInitialPurse));

      // 2. Fetch all teams for the user
      const teamsCollection = collection(db, "users", user.uid, "teams");
      const teamSnapshot = await getDocs(teamsCollection);
      const teamsList = teamSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[];

      // 3. For each team, fetch players and calculate remaining purse
      const teamsData = await Promise.all(
        teamsList.map(async (team) => {
          const playersQuery = query(
            collection(db, "users", user.uid, "players"),
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
          const remainingPurse = currentInitialPurse - totalSpent;

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
  
  useEffect(() => {
    fetchTeamRostersAndSettings();
  }, [user]);

  const handleSaveSettings = async () => {
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to save settings." });
        return;
    }

    setIsSaving(true);
    try {
        const settingsDocRef = doc(db, "users", user.uid, "auction_settings", "config");
        const settingsSnap = await getDoc(settingsDocRef);
        const existingSettings = settingsSnap.exists() ? settingsSnap.data() : {};
        
        await setDoc(settingsDocRef, {
            ...existingSettings,
            initialPurse: initialPurse,
        });

        toast({
            title: "Settings Saved",
            description: "The initial purse has been successfully updated.",
        });

        // Refetch data to update remaining purses
        fetchTeamRostersAndSettings();

    } catch (error) {
        console.error("Error saving settings: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save settings. Please try again.",
        });
    } finally {
        setIsSaving(false);
    }
};

  if (loading && teamsWithRosters.length === 0) {
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
      <CardHeader className="px-0 flex-row justify-between items-center">
        <div>
          <CardTitle>Team Roster</CardTitle>
          <CardDescription>
            View and manage player assignments for each team.
          </CardDescription>
        </div>
      </CardHeader>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Auction Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 max-w-sm">
              <Label htmlFor="initial-purse">Initial Purse of the team</Label>
              <Input
                  id="initial-purse"
                  type="number"
                  value={initialPurse}
                  onChange={(e) => setInitialPurse(e.target.value)}
                  disabled={!user || loading}
              />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
            <Button onClick={handleSaveSettings} disabled={isSaving || loading || !user}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
            </Button>
        </CardFooter>
      </Card>

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