"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface AuctionListItem {
    id: string;
    name: string;
}

interface AuctionSelectionContextType {
    selectedAuction: AuctionListItem | null;
    setSelectedAuction: (auction: AuctionListItem | null) => void;
}

const AuctionSelectionContext = createContext<AuctionSelectionContextType | undefined>(undefined);

export function AuctionSelectionProvider({ children }: { children: ReactNode }) {
    const [selectedAuction, setSelectedAuctionState] = useState<AuctionListItem | null>(() => {
        if (typeof window !== 'undefined') {
            const savedAuction = localStorage.getItem('selectedAuction');
            return savedAuction ? JSON.parse(savedAuction) : null;
        }
        return null;
    });
    const router = useRouter();

    const setSelectedAuction = (auction: AuctionListItem | null) => {
        setSelectedAuctionState(auction);
        if (auction) {
            localStorage.setItem('selectedAuction', JSON.stringify(auction));
        } else {
            localStorage.removeItem('selectedAuction');
        }
    };
    
    const value = {
        selectedAuction,
        setSelectedAuction,
    };

    return (
        <AuctionSelectionContext.Provider value={value}>
            {children}
        </AuctionSelectionContext.Provider>
    );
}

export function useAuctionSelection() {
    const context = useContext(AuctionSelectionContext);
    if (context === undefined) {
        throw new Error('useAuctionSelection must be used within an AuctionSelectionProvider');
    }
    return context;
}
