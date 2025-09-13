"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { Loader2 } from "lucide-react";
import { useAuctionSelection } from "@/context/auction-selection-context";

export function LivePreviewPage() {
    const searchParams = useSearchParams();
    const auctionId = searchParams.get('auctionId');
    const { setSelectedAuction } = useAuctionSelection();
    const [message, setMessage] = useState("Loading...");

    useEffect(() => {
        if (auctionId) {
            setSelectedAuction({ id: auctionId, name: 'Live Auction' });
            setMessage("Live preview is temporarily disabled.");
        } else {
            setMessage("No auction specified.");
        }
    }, [auctionId]);

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
