"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';
import type { Player } from '@/components/pages/players';

type AuctionPlayer = Player & { price?: number; teamId?: string; status?: 'sold' | 'unsold' | 'queued' };

interface ActionRecord {
    type: "sold" | "unsold";
    player: AuctionPlayer;
    previousPlayerState: AuctionPlayer;
    previousPlayers: AuctionPlayer[];
    previousCurrentPlayerIndex: number;
}

interface AuctionContextType {
    players: AuctionPlayer[];
    setPlayers: React.Dispatch<React.SetStateAction<AuctionPlayer[]>>;
    currentPlayerIndex: number;
    setCurrentPlayerIndex: React.Dispatch<React.SetStateAction<number>>;
    auctionStarted: boolean;
    setAuctionStarted: React.Dispatch<React.SetStateAction<boolean>>;
    actionHistory: ActionRecord[];
    setActionHistory: React.Dispatch<React.SetStateAction<ActionRecord[]>>;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

export function AuctionProvider({ children }: { children: ReactNode }) {
    const [players, setPlayers] = useState<AuctionPlayer[]>([]);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [auctionStarted, setAuctionStarted] = useState(false);
    const [actionHistory, setActionHistory] = useState<ActionRecord[]>([]);

    const value = {
        players,
        setPlayers,
        currentPlayerIndex,
        setCurrentPlayerIndex,
        auctionStarted,
        setAuctionStarted,
        actionHistory,
        setActionHistory,
    };

    return (
        <AuctionContext.Provider value={value}>
            {children}
        </AuctionContext.Provider>
    );
}

export function useAuction() {
    const context = useContext(AuctionContext);
    if (context === undefined) {
        throw new Error('useAuction must be used within an AuctionProvider');
    }
    return context;
}
