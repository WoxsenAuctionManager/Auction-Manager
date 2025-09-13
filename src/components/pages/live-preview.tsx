"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { Loader2 } from "lucide-react";
import { useAuctionSelection } from "@/context/auction-selection-context";

// This is a placeholder page. The live preview functionality has been temporarily removed.
export function LivePreviewPage() {
    const searchParams = useSearchParams();
    const auctionId = searchParams.get('auctionId');
    const { setSelectedAuction } = useAuctionSelection();
    const [message, setMessage] = useState("Loading...");

    useEffect(() => {
        if (auctionId) {
            // Set the auction context so it can be potentially used later
            setSelectedAuction({ id: auctionId, name: 'Live Auction' });
            setMessage("Live preview is temporarily disabled.");
        } else {
            setMessage("No auction specified.");
        }
    }, [auctionId, setSelectedAuction]);

    return (
        <div className="flex justify-center items-center h-screen">
            <div className="text-center">
                <p className="text-xl font-semibold text-muted-foreground">
                    {message}
                </p>
            </div>
        </div>
    );
}
