"use client";

import { useState, useEffect, useMemo } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, PlusCircle, Trash2, Pencil, Shield } from "lucide-react";
import { AddTeamDialog } from "../add-team-dialog";
import { useToast } from "@/hooks/use-toast";

export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
}

export function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddTeamDialogOpen, setIsAddTeamDialogOpen] = useState(false);
    const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
    const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
    const { toast } = useToast();

    const fetchTeams = async () => {
        setLoading(true);
        setError(null);
        try {
            const teamsCollection = collection(db, "teams");
            const teamSnapshot = await getDocs(teamsCollection);
            const teamsList = teamSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Team[];
            setTeams(teamsList);
        } catch (err) {
            console.error(err);
            setError(
                "Failed to load teams. Please check your internet connection and Firestore permissions."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    const handleTeamAdded = (newTeam: DocumentData) => {
        setTeams((prevTeams) => [...prevTeams, newTeam as Team]);
    };

    const handleTeamUpdated = (updatedTeam: DocumentData) => {
        setTeams((prevTeams) =>
            prevTeams.map((t) =>
                t.id === updatedTeam.id ? (updatedTeam as Team) : t
            )
        );
    };

    const handleEdit = (team: Team) => {
        setTeamToEdit(team);
        setIsAddTeamDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!teamToDelete) return;
        try {
            await deleteDoc(doc(db, "teams", teamToDelete.id));
            setTeams(teams.filter((t) => t.id !== teamToDelete.id));
            toast({
                title: "Team Deleted",
                description: `${teamToDelete.name} has been successfully deleted.`,
            });
        } catch (error) {
            console.error("Error deleting document: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete team. Please try again.",
            });
        } finally {
            setTeamToDelete(null);
        }
    };

    const handleDialogClose = () => {
        setIsAddTeamDialogOpen(false);
        setTeamToEdit(null);
    }

    return (
        <>
            <div className="flex items-center">
                <div className="flex-1">
                    <h1 className="font-semibold text-3xl">Teams</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your teams here.
                    </p>
                </div>
                <Button onClick={() => {
                    setTeamToEdit(null);
                    setIsAddTeamDialogOpen(true);
                }}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Team
                </Button>
            </div>

            <AddTeamDialog
                open={isAddTeamDialogOpen}
                onOpenChange={handleDialogClose}
                onTeamAdded={handleTeamAdded}
                onTeamUpdated={handleTeamUpdated}
                teamToEdit={teamToEdit}
            />

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {loading ? (
                <p>Loading teams...</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {teams.length > 0 ? (
                        teams.map((team) => (
                            <Card key={team.id}>
                                <CardHeader className="items-center text-center">
                                    <Avatar className="h-24 w-24 mb-4">
                                        <AvatarImage src={team.logoUrl} alt={team.name} />
                                        <AvatarFallback><Shield /></AvatarFallback>
                                    </Avatar>
                                    <CardTitle>{team.name}</CardTitle>
                                </CardHeader>
                                <CardFooter className="flex justify-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(team)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => setTeamToDelete(team)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))
                    ) : (
                        <p>No teams found. Add a new team to get started.</p>
                    )}
                </div>
            )}

            <AlertDialog open={!!teamToDelete} onOpenChange={(open) => !open && setTeamToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete{" "}
                            <strong>{teamToDelete?.name}</strong> and remove their data from our servers.
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
