
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  getCountFromServer,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { useAuctionSelection } from "@/context/auction-selection-context";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Users, Shield, CheckCircle2, XCircle, Trophy } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface DashboardData {
  totalPlayers: number;
  soldPlayers: number;
  unsoldPlayers: number;
  teamsCount: number;
  teamData: { name: string; value: number; playerCount: number, remainingPurse: number }[];
  topBuys: { name: string; price: number; teamName: string; photoUrl?: string }[];
}

const COLORS = [
  "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b",
  "#e377c2", "#7f7f7f", "#bcbd22", "#17becf", "#aec7e8", "#ffbb78",
  "#98df8a", "#ff9896", "#c5b0d5", "#c49c94", "#f7b6d2", "#c7c7c7",
  "#dbdb8d", "#9edae5"
];

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { selectedAuction } = useAuctionSelection();

  const fetchData = useCallback(async () => {
    if (!user || !selectedAuction) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const playersCol = collection(db, "users", user.uid, "auctions", selectedAuction.id, "players");
      const soldPlayersCol = collection(db, "users", user.uid, "auctions", selectedAuction.id, "sold_players");
      const unsoldPlayersCol = collection(db, "users", user.uid, "auctions", selectedAuction.id, "unsold_players");
      const teamsCol = collection(db, "users", user.uid, "auctions", selectedAuction.id, "teams");
      const settingsDocRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "auction_settings", "config");

      // Get counts and data
      const [
        totalPlayersSnap,
        soldPlayersSnap,
        unsoldPlayersSnap,
        teamsSnap,
        settingsSnap,
      ] = await Promise.all([
        getCountFromServer(playersCol),
        getDocs(soldPlayersCol),
        getCountFromServer(unsoldPlayersCol),
        getDocs(teamsCol),
        getDoc(settingsDocRef),
      ]);
      
      const totalPlayers = totalPlayersSnap.data().count;
      const soldPlayersList = soldPlayersSnap.docs.map(doc => doc.data());
      const soldPlayers = soldPlayersList.length;
      const unsoldPlayers = unsoldPlayersSnap.data().count;
      const teamsList = teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const teamsCount = teamsList.length;
      const initialPurse = settingsSnap.exists() ? (settingsSnap.data().initialPurse || 0) : 0;

      // Team data for chart
      const teamData = teamsList.map(team => {
        const playersInTeam = soldPlayersList.filter(p => p.teamId === team.id);
        const playerCount = playersInTeam.length;
        const totalSpent = playersInTeam.reduce((sum, p) => sum + (p.price || 0), 0);
        const remainingPurse = initialPurse - totalSpent;
        return { name: team.name, value: playerCount, playerCount, remainingPurse };
      });

      // Top 5 buys
      const sortedSoldPlayers = [...soldPlayersList].sort((a, b) => (b.price || 0) - (a.price || 0));
      const topBuys = sortedSoldPlayers.slice(0, 5).map(player => {
        const team = teamsList.find(t => t.id === player.teamId);
        return {
          name: player.name,
          price: player.price || 0,
          teamName: team?.name || "N/A",
          photoUrl: player.photoUrl,
        };
      });

      setData({
        totalPlayers,
        soldPlayers,
        unsoldPlayers,
        teamsCount,
        teamData,
        topBuys,
      });

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user, selectedAuction]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Welcome to your Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No auction data available. Please make sure you have an auction selected.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Players</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">Total players in the league</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sold Players</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.soldPlayers}</div>
            <p className="text-xs text-muted-foreground">Out of {data.totalPlayers} players</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsold Players</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.unsoldPlayers}</div>
            <p className="text-xs text-muted-foreground">Players who were not sold</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.teamsCount}</div>
            <p className="text-xs text-muted-foreground">Participating in the auction</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Status</CardTitle>
            <CardDescription>Number of players in each team.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={data.teamData}
                  cx="40%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-sm font-bold">
                        {value}
                      </text>
                    );
                  }}
                >
                  {data.teamData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{backgroundColor: 'hsl(var(--background))'}}
                    formatter={(value: number, name: string, props) => {
                        const remainingPurse = props.payload.remainingPurse;
                        return [`₹${remainingPurse.toLocaleString('en-IN')}`, name]
                    }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500"/> Top 5 Buys
            </CardTitle>
          <CardDescription>The most expensive players sold in the auction.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topBuys.length > 0 ? (
                data.topBuys.map((buy, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={buy.photoUrl || undefined} />
                          <AvatarFallback>{buy.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {buy.name}
                      </div>
                    </TableCell>
                    <TableCell>{buy.teamName}</TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{buy.price.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No players sold yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
