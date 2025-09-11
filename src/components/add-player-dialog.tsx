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
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { Player } from "./pages/players";

const playerSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  contact: z.string().min(10, { message: "Contact must be a valid number." }),
  year: z.string().min(1, { message: "Year is required." }),
  department: z.string().min(2, { message: "Department is required." }),
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
  year: "",
  department: "",
  player_position: "",
  photoUrl: "",
};

export function AddPlayerDialog({ open, onOpenChange, onPlayerAdded, onPlayerUpdated, playerToEdit }: AddPlayerDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const isEditMode = !!playerToEdit;

  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    if (isEditMode && playerToEdit) {
      form.reset({
        name: playerToEdit.name || "",
        contact: playerToEdit.contact || "",
        year: playerToEdit.year || "",
        department: playerToEdit.department || "",
        player_position: playerToEdit.player_position || "",
        photoUrl: playerToEdit.photoUrl || "",
      });
    } else {
      form.reset(defaultFormValues);
    }
  }, [playerToEdit, isEditMode, form, open]);

  const onSubmit = async (data: PlayerFormValues) => {
    setIsSaving(true);
    try {
      const docData = {
        ...data,
        photoUrl: data.photoUrl || "",
      };

      if (isEditMode && playerToEdit) {
        const playerDocRef = doc(db, "players", playerToEdit.id);
        await updateDoc(playerDocRef, docData);
        onPlayerUpdated({ id: playerToEdit.id, ...docData });
        toast({
          title: "Player Updated",
          description: `${docData.name} has been successfully updated.`,
        });
      } else {
        const docRef = await addDoc(collection(db, "players"), docData);
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
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
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
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                        <Input placeholder="https://example.com/photo.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            
            <Card className="mt-4">
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Debugger</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(form.watch(), null, 2)}
                </pre>
              </CardContent>
            </Card>

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
