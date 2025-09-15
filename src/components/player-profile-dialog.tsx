"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import type { Player } from "./pages/players";

interface PlayerProfileDialogProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerProfileDialog({ player, open, onOpenChange }: PlayerProfileDialogProps) {
  if (!player) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Player Profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-6">
          <Avatar className="h-40 w-40 border-4 border-primary">
            <AvatarImage src={player.photoUrl} alt={player.name} />
            <AvatarFallback className="text-6xl">
              <User />
            </AvatarFallback>
          </Avatar>
          <div className="w-full space-y-4 text-center">
             <h2 className="text-3xl font-bold tracking-tight">{player.name}</h2>
             <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-left mx-auto max-w-xs text-base">
                <p className="font-medium text-muted-foreground">Contact</p>
                <p>{player.contact}</p>

                <p className="font-medium text-muted-foreground">Department</p>
                <p>{player.department}</p>
                
                <p className="font-medium text-muted-foreground">Year</p>
                <p>{player.year}</p>

                <p className="font-medium text-muted-foreground">Position</p>
                <p>{player.player_position}</p>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
