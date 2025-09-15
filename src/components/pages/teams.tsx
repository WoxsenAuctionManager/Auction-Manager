"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { useAuth } from "@/context/auth-context";
import { useAuctionSelection } from "@/context/auction-selection-context";
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
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, PlusCircle, Trash2, Pencil, Shield, MoreHorizontal, Loader2, Upload } from "lucide-react";
import { AddTeamDialog } from "../add-team-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { convertGoogleDriveUrl } from "@/lib/utils";
import { ImportTeamsDialog } from "../import-teams-dialog";

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
    const [isImporting, setIsImporting] = useState(false);
    const [isImportTeamDialogOpen, setIsImportTeamDialogOpen] = useState(false);
    const [importedTeams, setImportedTeams] = useState<Omit<Team, 'id'>[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const { user } = useAuth();
    const { selectedAuction } = useAuctionSelection();

    const fetchTeams = useCallback(async () => {
        if (!user || !selectedAuction) {
            setTeams([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const teamsCollection = collection(db, "users", user.uid, "auctions", selectedAuction.id, "teams");
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
    }, [user, selectedAuction]);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

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
        if (!teamToDelete || !user || !selectedAuction) return;
        try {
            await deleteDoc(doc(db, "users", user.uid, "auctions", selectedAuction.id, "teams", teamToDelete.id));
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
            
            const newTeams = json.map((row: any) => ({
              name: row.Name || '',
              logoUrl: row['Logo URL'] ? convertGoogleDriveUrl(row['Logo URL']) : '',
            }));
    
            setImportedTeams(newTeams);
            setIsImportTeamDialogOpen(true);
          };
          reader.readAsArrayBuffer(file);
        }
         if(fileInputRef.current) {
          fileInputRef.current.value = "";
        }
    };

    const handleConfirmImport = async () => {
        if (!user || !selectedAuction) return;
        setIsImporting(true);
        try {
          const batch = writeBatch(db);
          const teamsCollectionRef = collection(db, "users", user.uid, "auctions", selectedAuction.id, "teams");
          importedTeams.forEach(team => {
            const newTeamRef = doc(teamsCollectionRef);
            batch.set(newTeamRef, team);
          });
    
          await batch.commit();
    
          toast({
            title: "Import Successful",
            description: `${importedTeams.length} teams have been successfully imported.`,
          });
    
          fetchTeams();
          
        } catch (error) {
          console.error("Error importing teams: ", error);
          toast({
            variant: "destructive",
            title: "Import Failed",
            description: "An error occurred while importing teams. Please check the file and try again.",
          });
        } finally {
          setIsImporting(false);
          setIsImportTeamDialogOpen(false);
          setImportedTeams([]);
        }
    };

    return (
        <>
            <div className="flex items-center">
                <div className="flex-1">
                    <h1 className="font-semibold text-3xl">Teams</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your teams here.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => {
                        setTeamToEdit(null);
                        setIsAddTeamDialogOpen(true);
                    }}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Team
                    </Button>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">More options</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            Import Teams
                        </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".xlsx, .xls, .csv"
                    />
                </div>
            </div>

            <AddTeamDialog
                open={isAddTeamDialogOpen}
                onOpenChange={handleDialogClose}
                onTeamAdded={handleTeamAdded}
                onTeamUpdated={handleTeamUpdated}
                teamToEdit={teamToEdit}
            />

            <ImportTeamsDialog
                open={isImportTeamDialogOpen}
                onOpenChange={setIsImportTeamDialogOpen}
                onConfirmImport={handleConfirmImport}
                teams={importedTeams}
                isImporting={isImporting}
            />

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {loading ? (
                 <div className="flex h-full items-center justify-center pt-12"><Loader2 className="h-12 w-12 animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {!user ? (
                        <Card className="col-span-full">
                            <CardContent className="flex flex-col items-center justify-center p-12">
                                <p className="text-muted-foreground">Please log in to view teams.</p>
                            </CardContent>
                        </Card>
                    ) : teams.length > 0 ? (
                        teams.map((team) => (
                            <Card key={team.id} className="relative">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-6 w-6"
                                        >
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(team)}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setTeamToDelete(team)}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <CardHeader className="items-center text-center pt-8">
                                    <Avatar className="h-24 w-24 mb-4">
                                        <AvatarImage src={team.logoUrl ? convertGoogleDriveUrl(team.logoUrl) : undefined} alt={team.name} />
                                        <AvatarFallback><Shield /></AvatarFallback>
                                    </Avatar>
                                    <CardTitle>{team.name}</CardTitle>
                                </CardHeader>
                            </Card>
                        ))
                    ) : (
                        <Card className="col-span-full">
                          <CardContent className="flex flex-col items-center justify-center p-12">
                                <p>No teams found. Add a new team to get started.</p>
                          </CardContent>
                        </Card>
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
