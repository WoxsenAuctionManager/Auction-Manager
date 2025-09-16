
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Player, ColumnLabels } from "./pages/players";
import { Loader2 } from "lucide-react";

interface ImportPlayersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmImport: () => void;
  players: Omit<Player, "id">[];
  isImporting: boolean;
  columnLabels: ColumnLabels;
}

export function ImportPlayersDialog({
  open,
  onOpenChange,
  onConfirmImport,
  players,
  isImporting,
  columnLabels,
}: ImportPlayersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Confirm Player Import</DialogTitle>
          <DialogDescription>
            Review the players below. Click "Confirm Import" to add them to the
            database for the current auction.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{columnLabels.name}</TableHead>
                <TableHead>{columnLabels.contact}</TableHead>
                <TableHead>{columnLabels.department}</TableHead>
                <TableHead>{columnLabels.year}</TableHead>
                <TableHead>{columnLabels.player_position}</TableHead>
                <TableHead>{columnLabels.photo}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.length > 0 ? (
                players.map((player, index) => (
                  <TableRow key={index}>
                    <TableCell>{player.name}</TableCell>
                    <TableCell>{player.contact}</TableCell>
                    <TableCell>{player.department}</TableCell>
                    <TableCell>{player.year}</TableCell>
                    <TableCell>{player.player_position}</TableCell>
                    <TableCell className="truncate max-w-xs">{player.photoUrl}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No players to import or file is empty.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirmImport}
            disabled={isImporting || players.length === 0}
          >
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Import ({players.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
