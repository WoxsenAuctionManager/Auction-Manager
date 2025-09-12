"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, addDoc, doc, updateDoc, DocumentData } from "firebase/firestore";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { Team } from "./pages/teams";
import { Textarea } from "./ui/textarea";

const teamSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  logoUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

type TeamFormValues = z.infer<typeof teamSchema>;

interface AddTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamAdded: (newTeam: DocumentData) => void;
  onTeamUpdated: (updatedTeam: DocumentData) => void;
  teamToEdit?: Team | null;
}

const defaultFormValues = {
  name: "",
  logoUrl: "",
};

export function AddTeamDialog({ open, onOpenChange, onTeamAdded, onTeamUpdated, teamToEdit }: AddTeamDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedAuction } = useAuctionSelection();
  const isEditMode = !!teamToEdit;

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (isEditMode && teamToEdit) {
      form.reset({
        name: teamToEdit.name || "",
        logoUrl: teamToEdit.logoUrl || "",
      });
    } else {
      form.reset(defaultFormValues);
    }
  }, [teamToEdit, isEditMode, form, open]);

  const onSubmit = async (data: TeamFormValues) => {
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to perform this action."});
        return;
    }
    if (!selectedAuction) {
        toast({ variant: "destructive", title: "Auction Error", description: "No auction selected."});
        return;
    }

    setIsSaving(true);
    try {
      const docData = {
        ...data,
        logoUrl: data.logoUrl || "",
      };

      if (isEditMode && teamToEdit) {
        const teamDocRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "teams", teamToEdit.id);
        await updateDoc(teamDocRef, docData);
        onTeamUpdated({ id: teamToEdit.id, ...docData });
        toast({
          title: "Team Updated",
          description: `${docData.name} has been successfully updated.`,
        });
      } else {
        const teamsCollectionRef = collection(db, "users", user.uid, "auctions", selectedAuction.id, "teams");
        const docRef = await addDoc(teamsCollectionRef, docData);
        onTeamAdded({ id: docRef.id, ...docData });
        toast({
          title: "Team Added",
          description: `${docData.name} has been successfully added.`,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving document: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'add'} team. Please try again.`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        form.reset(defaultFormValues);
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Team" : "Add New Team"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Edit the details of the team." : "Enter the details of the new team."} Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Logo URL</FormLabel>
                    <FormControl>
                      <Textarea placeholder="https://example.com/logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
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
