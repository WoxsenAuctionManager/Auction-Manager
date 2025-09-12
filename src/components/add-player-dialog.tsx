"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, addDoc, doc, updateDoc, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
import { ScrollArea } from "./ui/scroll-area";
import type { Player } from "./pages/players";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { convertGoogleDriveUrl } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useAuctionSelection } from "@/context/auction-selection-context";

const playerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  contact: z.string().min(10, { message: "Contact must be a valid number." }),
  department: z.string().min(2, { message: "Department is required." }),
  year: z.string().min(1, { message: "Year is required." }),
  player_position: z.string().min(2, { message: "Player position is required." }),
  photoUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

interface AddPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayerAdded: (newPlayer: DocumentData) => void;
  onPlayerUpdated: (updatedPlayer: DocumentData) => void;
  playerToEdit?: Player | null;
}

const defaultFormValues = {
  name: "",
  contact: "",
  department: "",
  year: "",
  player_position: "",
  photoUrl: "",
};

export function AddPlayerDialog({ open, onOpenChange, onPlayerAdded, onPlayerUpdated, playerToEdit }: AddPlayerDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedAuction } = useAuctionSelection();
  const isEditMode = !!playerToEdit;

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: defaultFormValues,
  });

  const watchedDepartment = form.watch("department");

  useEffect(() => {
    if (watchedDepartment === "Staff") {
      form.setValue("year", "NA", { shouldValidate: true });
    } else if (watchedDepartment === "Student" && form.getValues("year") === "NA") {
      form.setValue("year", "", { shouldValidate: true });
    }
  }, [watchedDepartment, form]);

  useEffect(() => {
    if (isEditMode && playerToEdit) {
      form.reset({
        name: playerToEdit.name || "",
        contact: playerToEdit.contact || "",
        department: playerToEdit.department || "",
        year: playerToEdit.year || "",
        player_position: playerToEdit.player_position || "",
        photoUrl: playerToEdit.photoUrl || "",
      });
    } else {
      form.reset(defaultFormValues);
    }
  }, [playerToEdit, isEditMode, form, open]);

  const onSubmit = async (data: PlayerFormValues) => {
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
        photoUrl: data.photoUrl ? convertGoogleDriveUrl(data.photoUrl) : "",
      };

      if (isEditMode && playerToEdit) {
        const playerDocRef = doc(db, "users", user.uid, "auctions", selectedAuction.id, "players", playerToEdit.id);
        await updateDoc(playerDocRef, docData);
        onPlayerUpdated({ id: playerToEdit.id, ...docData });
        toast({
          title: "Player Updated",
          description: `${docData.name} has been successfully updated.`,
        });
      } else {
        const playersCollectionRef = collection(db, "users", user.uid, "auctions", selectedAuction.id, "players");
        const docRef = await addDoc(playersCollectionRef, {
          ...docData,
          status: 'queued'
        });
        onPlayerAdded({ id: docRef.id, ...docData, status: 'queued' });
        toast({
          title: "Player Added",
          description: `${docData.name} has been successfully added.`,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving document: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'add'} player. Please try again.`,
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
          <DialogTitle>{isEditMode ? "Edit Player" : "Add New Player"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Edit the details of the player." : "Enter the details of the new player."} Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[55vh] pr-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Student">Student</SelectItem>
                          <SelectItem value="Staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={watchedDepartment === 'Staff'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1st Year">1st Year</SelectItem>
                          <SelectItem value="2nd Year">2nd Year</SelectItem>
                          <SelectItem value="3rd Year">3rd Year</SelectItem>
                          <SelectItem value="4th Year">4th Year</SelectItem>
                          {watchedDepartment !== 'Student' && <SelectItem value="NA">NA</SelectItem>}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="player_position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Player Position</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Forward">Forward</SelectItem>
                          <SelectItem value="Mid Fielder">Mid Fielder</SelectItem>
                          <SelectItem value="Defender">Defender</SelectItem>
                          <SelectItem value="Goal Keeper">Goal Keeper</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Player Photo URL</FormLabel>
                      <FormControl>
                        <Textarea placeholder="https://example.com/photo.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            
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
