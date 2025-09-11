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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Player Profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <Avatar className="h-32 w-32">
            <AvatarImage src={player.photoUrl} alt={player.name} />
            <AvatarFallback className="text-4xl">
              <User />
            </AvatarFallback>
          </Avatar>
          <div className="w-full space-y-3 text-center">
             <h2 className="text-2xl font-bold">{player.name}</h2>
             <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-left mx-auto max-w-sm">
                <p className="text-sm font-medium text-muted-foreground">Contact</p>
                <p className="text-sm">{player.contact}</p>

                <p className="text-sm font-medium text-muted-foreground">Department</p>
                <p className="text-sm">{player.department}</p>
                
                <p className="text-sm font-medium text-muted-foreground">Year</p>
                <p className="text-sm">{player.year}</p>

                <p className="text-sm font-medium text-muted-foreground">Position</p>
                <p className="text-sm">{player.player_position}</p>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
