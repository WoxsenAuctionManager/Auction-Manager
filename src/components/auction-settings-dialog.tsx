
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings } from "lucide-react";

interface AuctionSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPurse: number;
  onSettingsSaved: () => void;
}

export function AuctionSettingsDialog({
  open,
  onOpenChange,
  initialPurse,
  onSettingsSaved
}: AuctionSettingsDialogProps) {
  const [purse, setPurse] = useState(String(initialPurse));
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setPurse(String(initialPurse));
    }
  }, [open, initialPurse]);

  const handleSave = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to save settings.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const settingsDocRef = doc(db, "users", user.uid, "auction_settings", "config");
      await setDoc(settingsDocRef, { initialPurse: Number(purse) }, { merge: true });

      toast({
        title: "Settings Saved",
        description: "The initial purse has been successfully updated.",
      });
      
      onSettingsSaved();
      onOpenChange(false);

    } catch (error) {
      console.error("Error saving settings: ", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Auction Settings
          </DialogTitle>
          <DialogDescription>
            Manage the configuration for your auction.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="grid gap-3">
            <Label htmlFor="initial-purse">Initial Purse of the Team</Label>
            <Input
              id="initial-purse"
              type="number"
              value={purse}
              onChange={(e) => setPurse(e.target.value)}
              disabled={isSaving}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    