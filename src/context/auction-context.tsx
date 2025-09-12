"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import type { Player } from '@/components/pages/players';
import { useAuctionSelection } from './auction-selection-context';

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
    const { selectedAuction } = useAuctionSelection();
    const auctionId = selectedAuction?.id;

    const getInitialState = <T,>(key: string, defaultValue: T): T => {
        if (typeof window === 'undefined' || !auctionId) return defaultValue;
        const saved = localStorage.getItem(`auction_${auctionId}_${key}`);
        return saved ? JSON.parse(saved) : defaultValue;
    };
    
    const [players, setPlayers] = useState<AuctionPlayer[]>(() => getInitialState('players', []));
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(() => getInitialState('currentPlayerIndex', 0));
    const [auctionStarted, setAuctionStarted] = useState<boolean>(() => getInitialState('auctionStarted', false));
    const [actionHistory, setActionHistory] = useState<ActionRecord[]>(() => getInitialState('actionHistory', []));

    useEffect(() => {
        if(typeof window !== 'undefined' && auctionId) {
            localStorage.setItem(`auction_${auctionId}_players`, JSON.stringify(players));
        }
    }, [players, auctionId]);

    useEffect(() => {
        if(typeof window !== 'undefined' && auctionId) {
            localStorage.setItem(`auction_${auctionId}_currentPlayerIndex`, JSON.stringify(currentPlayerIndex));
        }
    }, [currentPlayerIndex, auctionId]);

    useEffect(() => {
        if(typeof window !== 'undefined' && auctionId) {
            localStorage.setItem(`auction_${auctionId}_auctionStarted`, JSON.stringify(auctionStarted));
        }
    }, [auctionStarted, auctionId]);

    useEffect(() => {
        if(typeof window !== 'undefined' && auctionId) {
            localStorage.setItem(`auction_${auctionId}_actionHistory`, JSON.stringify(actionHistory));
        }
    }, [actionHistory, auctionId]);
    
    useEffect(() => {
        setPlayers(getInitialState('players', []));
        setCurrentPlayerIndex(getInitialState('currentPlayerIndex', 0));
        setAuctionStarted(getInitialState('auctionStarted', false));
        setActionHistory(getInitialState('actionHistory', []));
    }, [auctionId]);


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
