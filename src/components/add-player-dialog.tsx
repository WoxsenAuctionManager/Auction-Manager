
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
import { convertGoogleDriveUrl } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useAuctionSelection } from "@/context/auction-selection-context";
import { Combobox } from "./ui/combobox";
import { useAuction } from "@/context/auction-context";

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

const departmentOptions = [
    { value: "Student", label: "Student" },
    { value: "Staff", label: "Staff" },
];
  
const yearOptions = [
    { value: "1st Year", label: "1st Year" },
    { value: "2nd Year", label: "2nd Year" },
    { value: "3rd Year", label: "3rd Year" },
    { value: "4th Year", label: "4th Year" },
];
  
const positionOptions = [
    { value: "Forward", label: "Forward" },
    { value: "Mid Fielder", label: "Mid Fielder" },
    { value: "Defender", label: "Defender" },
    { value: "Goal Keeper", label: "Goal Keeper" },
];

export function AddPlayerDialog({ open, onOpenChange, onPlayerAdded, onPlayerUpdated, playerToEdit }: AddPlayerDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { selectedAuction } = useAuctionSelection();
  const { columnLabels } = useAuction();
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
        const docRef = await addDoc(playersCollectionRef, docData);
        onPlayerAdded({ id: docRef.id, ...docData });
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
                      <FormLabel>{columnLabels.name}</FormLabel>
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
                      <FormLabel>{columnLabels.contact}</FormLabel>
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
                    <FormItem className="flex flex-col">
                      <FormLabel>{columnLabels.department}</FormLabel>
                      <Combobox
                        options={departmentOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select a department"
                        searchPlaceholder="Search departments..."
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>{columnLabels.year}</FormLabel>
                        <Combobox
                            options={watchedDepartment === 'Staff' ? [{value: 'NA', label: 'NA'}] : yearOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select a year"
                            searchPlaceholder="Search years..."
                            disabled={watchedDepartment === 'Staff'}
                        />
                        <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="player_position"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{columnLabels.player_position}</FormLabel>
                       <Combobox
                            options={positionOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select a position"
                            searchPlaceholder="Search positions..."
                        />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{columnLabels.photo}</FormLabel>
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
