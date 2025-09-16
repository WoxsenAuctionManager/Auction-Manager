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
import { useAuction } from "@/context/auction-context";

interface PlayerProfileDialogProps {
  player: Player | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlayerProfileDialog({ player, open, onOpenChange }: PlayerProfileDialogProps) {
  const { columnLabels } = useAuction();
  
  if (!player) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Player Profile</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-8 items-center py-6">
          <div className="flex justify-center">
            <Avatar className="h-64 w-64 border-4 border-primary">
              <AvatarImage src={player.photoUrl} alt={player.name} className="object-cover"/>
              <AvatarFallback className="text-8xl">
                <User />
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="w-full space-y-6 text-center md:text-left">
             <h2 className="text-4xl font-bold tracking-tight">{player.name}</h2>
             <div className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-4 text-lg">
                <p className="font-semibold text-muted-foreground">{columnLabels.contact}</p>
                <p>{player.contact}</p>

                <p className="font-semibold text-muted-foreground">{columnLabels.department}</p>
                <p>{player.department}</p>
                
                <p className="font-semibold text-muted-foreground">{columnLabels.year}</p>
                <p>{player.year}</p>

                <p className="font-semibold text-muted-foreground">{columnLabels.player_position}</p>
                <p>{player.player_position}</p>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
