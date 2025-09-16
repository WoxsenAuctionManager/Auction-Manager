
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "./ui/scroll-area";
import type { ColumnLabels } from "./pages/players";
import { useToast } from "@/hooks/use-toast";

interface EditColumnNamesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnLabels: ColumnLabels;
  onSave: (newLabels: ColumnLabels) => void;
}

export function EditColumnNamesDialog({
  open,
  onOpenChange,
  columnLabels,
  onSave,
}: EditColumnNamesDialogProps) {
  const [labels, setLabels] = useState(columnLabels);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setLabels(columnLabels);
    }
  }, [open, columnLabels]);

  const handleChange = (key: keyof ColumnLabels, value: string) => {
    setLabels((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(labels);
    toast({
      title: "Column Names Updated",
      description: "Your custom column names have been saved.",
    });
    onOpenChange(false);
  };
  
  const originalLabels: { [key: string]: string } = {
    sno: 'Sno.',
    photo: 'Photo',
    name: 'Name',
    contact: 'Contact',
    department: 'Department',
    year: 'Year',
    player_position: 'Player Position',
    actions: 'Actions',
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Column Names</DialogTitle>
          <DialogDescription>
            Customize the header names for the player table.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[50vh] pr-4">
            <div className="space-y-4 py-4">
            {Object.keys(labels).map((key) => {
                const typedKey = key as keyof ColumnLabels;
                return (
                <div key={key} className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor={key} className="text-right capitalize">
                    {originalLabels[key] || key.replace('_', ' ')}
                    </Label>
                    <Input
                    id={key}
                    value={labels[typedKey]}
                    onChange={(e) => handleChange(typedKey, e.target.value)}
                    className="col-span-2"
                    />
                </div>
                );
            })}
            </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    