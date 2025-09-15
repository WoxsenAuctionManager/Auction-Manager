
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

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
import { useAuctionSelection, AuctionListItem } from "@/context/auction-selection-context";

const auctionSchema = z.object({
  name: z.string().min(3, { message: "Auction name must be at least 3 characters." }),
});

type AuctionFormValues = z.infer<typeof auctionSchema>;

interface CreateAuctionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuctionCreated: (newAuction: any) => void;
  onAuctionUpdated: (updatedAuction: any) => void;
  auctionToEdit?: AuctionListItem | null;
}

export function CreateAuctionDialog({ open, onOpenChange, onAuctionCreated, onAuctionUpdated, auctionToEdit }: CreateAuctionDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { setSelectedAuction } = useAuctionSelection();
  const router = useRouter();
  const isEditMode = !!auctionToEdit;

  const form = useForm<AuctionFormValues>({
    resolver: zodResolver(auctionSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (open && isEditMode && auctionToEdit) {
      form.reset({ name: auctionToEdit.name });
    } else if (!isEditMode) {
      form.reset({ name: "" });
    }
  }, [open, isEditMode, auctionToEdit, form]);

  const onSubmit = async (data: AuctionFormValues) => {
    if (!user) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to perform this action."});
        return;
    }

    setIsSaving(true);
    try {
        if(isEditMode && auctionToEdit) {
            const auctionDocRef = doc(db, "users", user.uid, "auctions", auctionToEdit.id);
            await updateDoc(auctionDocRef, { name: data.name });
            const updatedAuction = { ...auctionToEdit, name: data.name };
            onAuctionUpdated(updatedAuction);
            toast({
                title: "Auction Updated",
                description: `The auction name has been updated to "${data.name}".`
            });
        } else {
            const auctionsCollectionRef = collection(db, "users", user.uid, "auctions");
            const docRef = await addDoc(auctionsCollectionRef, {
                name: data.name,
                createdAt: serverTimestamp(),
                owner: user.uid,
            });
            
            const newAuction = { id: docRef.id, name: data.name };
            onAuctionCreated(newAuction);
            setSelectedAuction(newAuction);
            
            toast({
                title: "Auction Created",
                description: `The auction "${data.name}" has been successfully created.`,
            });
            router.push('/players');
        }
      onOpenChange(false);

    } catch (error) {
      console.error("Error saving auction: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${isEditMode ? 'update' : 'create'} auction. Please try again.`,
      });
    } finally {
      setIsSaving(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) form.reset();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Auction Name' : 'Create New Auction'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the name of your auction.' : 'Give your new auction a name to get started.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auction Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Save Changes' : 'Create Auction'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
