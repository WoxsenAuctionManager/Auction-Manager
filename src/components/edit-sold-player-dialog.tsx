"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, doc, updateDoc, getDocs, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { useAuctionSelection } from "@/context/auction-selection-context";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Player } from "./pages/players";
import type { Team } from "./pages/teams";

interface SoldPlayer extends Player {
    price?: number;
    teamId: string;
    teamName?: string;
    teamLogoUrl?: string;
}

const editSoldPlayerSchema = z.object({
  teamId: z.string().min(1, { message: "Please select a team." }),
  price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().min(0, { message: "Price must be a positive number." })
  ),
});

type EditSoldPlayerFormValues = z.infer<typeof editSoldPlayerSchema>;

interface EditSoldPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: SoldPlayer;
  onPlayerUpdated: (updatedPlayer: SoldPlayer) => void;
}

export function EditSoldPlayerDialog({ open, onOpenChange, player, onPlayerUpdated }: EditSoldPlayerDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedAuction } = useAuctionSelection();

  const form = useForm<EditSoldPlayerFormValues>({
    resolver: zodResolver(editSoldPlayerSchema),
    defaultValues: {
      teamId: player.teamId,
      price: player.price || 0,
    },
  });
  
  useEffect(() => {
    const fetchTeams = async () => {
        if (!user || !selectedAuction) return;
        try {
            const teamsSnapshot = await getDocs(collection(db, "users", user.uid, "auctions", selectedAuction.id, "teams"));
            const teamsList = teamsSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Team[];
            setTeams(teamsList);
        } catch (error) {
            console.error("Error fetching teams: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load teams for selection.",
            });
        }
    };
    if(open) {
        fetchTeams();
        form.reset({
            teamId: player.teamId,
            price: player.price || 0,
        });
    }
  }, [open, player, form, toast, user, selectedAuction]);

  const onSubmit = async (data: EditSoldPlayerFormValues) => {
    if (!user || !selectedAuction) return;
    setIsSaving(true);
    try {
      const playerDocRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "sold_players", player.id);
      await updateDoc(playerDocRef, {
        teamId: data.teamId,
        price: data.price,
      });

      const teamDocRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "teams", data.teamId);
      const teamDocSnap = await getDoc(teamDocRef);
      const teamData = teamDocSnap.data() as Team | undefined;

      onPlayerUpdated({ 
          ...player, 
          ...data, 
          teamName: teamData?.name,
          teamLogoUrl: teamData?.logoUrl
      });

      toast({
        title: "Player Updated",
        description: `${player.name}'s details have been successfully updated.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating player: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update player. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Sold Player</DialogTitle>
          <DialogDescription>
            Update the team and price for {player.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="teamId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sold To</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
