
"use client";

import { useState, useEffect } from "react";
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
import { Copy } from "lucide-react";

interface ShareAuctionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auctionId: string;
}

export function ShareAuctionDialog({ open, onOpenChange, auctionId }: ShareAuctionDialogProps) {
  const [shareUrl, setShareUrl] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/live-preview?auctionId=${auctionId}`;
      setShareUrl(url);
    }
  }, [auctionId]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: "The preview link has been copied to your clipboard.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Live Preview</DialogTitle>
          <DialogDescription>
            Anyone with this link can watch the auction live.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 pt-4">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input id="link" value={shareUrl} readOnly />
          </div>
          <Button type="button" size="icon" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Close
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
