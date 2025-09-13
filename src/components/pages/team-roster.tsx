
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { useAuctionSelection } from "@/context/auction-selection-context";
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
import { User, Shield, Loader2, Settings, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Team } from "./teams";
import type { Player } from "./players";
import { AuctionSettingsDialog } from "../auction-settings-dialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initialPurse, setInitialPurse] = useState<number>(0);
  const [squadSize, setSquadSize] = useState<number>(0);

  const { user } = useAuth();
  const { selectedAuction } = useAuctionSelection();
  const { toast } = useToast();

  const fetchTeamRostersAndSettings = useCallback(async () => {
    if (!user || !selectedAuction) {
      setTeamsWithRosters([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch auction settings
      const settingsDocRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "auction_settings", "config");
      const settingsSnap = await getDoc(settingsDocRef);
      const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};
      const currentInitialPurse = Number(settingsData.initialPurse) || 0;
      const currentSquadSize = Number(settingsData.squadSize) || 0;
      setInitialPurse(currentInitialPurse);
      setSquadSize(currentSquadSize);

      // 2. Fetch all teams for the user
      const teamsCollection = collection(db, "users", user.uid, "auctions", selectedAuction.id, "teams");
      const teamSnapshot = await getDocs(teamsCollection);
      const teamsList = teamSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[];

      // 3. For each team, fetch players and calculate remaining purse
      const teamsData = await Promise.all(
        teamsList.map(async (team) => {
          const playersQuery = query(
            collection(db, "users", user.uid, "auctions", selectedAuction.id, "sold_players"),
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
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load team rosters.'
      })
    } finally {
      setLoading(false);
    }
  }, [user, selectedAuction, toast]);
  
  useEffect(() => {
    fetchTeamRostersAndSettings();
  }, [fetchTeamRostersAndSettings]);

  const handleSettingsSaved = () => {
    fetchTeamRostersAndSettings();
  }

  const handleDownload = () => {
    const doc = new jsPDF();
    let yPos = 15;
    doc.setFontSize(18);
    doc.text(`Team Rosters - ${selectedAuction?.name || 'Auction'}`, 14, yPos);
    yPos += 10;

    teamsWithRosters.forEach((team) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 15;
      }
      doc.setFontSize(14);
      doc.text(team.name, 14, yPos);
      yPos += 7;

      doc.setFontSize(10);
      doc.text(`Amount Remaining: ${team.remainingPurse.toLocaleString()}`, 14, yPos);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [['Player Name', 'Position', 'Price']],
        body: team.roster.map(player => [
          player.name,
          player.player_position,
          player.price?.toLocaleString() || 'N/A'
        ]),
        theme: 'striped',
        headStyles: { fillColor: [38, 115, 101] },
        didDrawPage: (data) => {
          yPos = data.cursor?.y ?? yPos;
        }
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save(`${selectedAuction?.name || 'team'}-rosters.pdf`);
  };

  if (loading && teamsWithRosters.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !loading) {
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-semibold text-3xl">Team Roster</h1>
          <p className="text-muted-foreground mt-1">
            View and manage player assignments for each team.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={teamsWithRosters.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Rosters
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="h-5 w-5" />
                <span className="sr-only">Auction Settings</span>
            </Button>
        </div>
      </div>

      <div className="space-y-6 pt-4">
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
                            Amount Remaining: &#8377;{team.remainingPurse.toLocaleString('en-IN')}
                        </CardDescription>
                    </div>
                </div>
                 <div className="text-right">
                    <p className="text-sm font-medium">Squad Size</p>
                    <p className="text-sm text-muted-foreground">{team.roster.length} / {squadSize > 0 ? squadSize : 'N/A'}</p>
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
                        <TableCell>&#8377;{player.price?.toLocaleString('en-IN') || 'N/A'}</TableCell>
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

      <AuctionSettingsDialog 
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        initialPurse={initialPurse}
        initialSquadSize={squadSize}
        onSettingsSaved={handleSettingsSaved}
      />
    </>
  );
}
