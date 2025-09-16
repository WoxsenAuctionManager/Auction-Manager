
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { Player } from '@/components/pages/players';
import { useAuctionSelection } from './auction-selection-context';
import type { ColumnLabels } from '@/components/pages/players';

type AuctionPlayer = Player & { price?: number; teamId?: string; status?: 'sold' | 'unsold' | 'queued' };

interface ActionRecord {
    type: "sold" | "unsold";
    player: AuctionPlayer;
    previousPlayerState: AuctionPlayer;
    previousPlayers: AuctionPlayer[];
    previousCurrentPlayerIndex: number;
}

const defaultColumnLabels: ColumnLabels = {
    sno: 'Sno.',
    photo: 'Photo',
    name: 'Name',
    contact: 'Contact',
    department: 'Department',
    year: 'Year',
    player_position: 'Player Position',
    actions: 'Actions',
};

interface AuctionState {
    players: AuctionPlayer[];
    currentPlayerIndex: number;
    auctionStarted: boolean;
    actionHistory: ActionRecord[];
    columnLabels: ColumnLabels;
}

interface AuctionContextType extends AuctionState {
    setPlayers: (value: React.SetStateAction<AuctionPlayer[]>) => void;
    setCurrentPlayerIndex: (value: React.SetStateAction<number>) => void;
    setAuctionStarted: (value: React.SetStateAction<boolean>) => void;
    setActionHistory: (value: React.SetStateAction<ActionRecord[]>) => void;
    setColumnLabels: (value: React.SetStateAction<ColumnLabels>) => void;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

const getLocalStorageItem = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    const saved = localStorage.getItem(key);
    try {
        return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
        console.error("Error parsing JSON from localStorage", e);
        return defaultValue;
    }
};

export function AuctionProvider({ children }: { children: ReactNode }) {
    const { selectedAuction } = useAuctionSelection();
    const auctionId = selectedAuction?.id;

    const getInitialState = useCallback(() => {
        if (!auctionId) {
            return {
                players: [],
                currentPlayerIndex: 0,
                auctionStarted: false,
                actionHistory: [],
                columnLabels: defaultColumnLabels
            };
        }
        return {
            players: getLocalStorageItem(`auction_${auctionId}_players`, []),
            currentPlayerIndex: getLocalStorageItem(`auction_${auctionId}_currentPlayerIndex`, 0),
            auctionStarted: getLocalStorageItem(`auction_${auctionId}_auctionStarted`, false),
            actionHistory: getLocalStorageItem(`auction_${auctionId}_actionHistory`, []),
            columnLabels: getLocalStorageItem(`auction_${auctionId}_columnLabels`, defaultColumnLabels)
        };
    }, [auctionId]);

    const [players, setPlayers] = useState<AuctionPlayer[]>(() => getInitialState().players);
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(() => getInitialState().currentPlayerIndex);
    const [auctionStarted, setAuctionStarted] = useState<boolean>(() => getInitialState().auctionStarted);
    const [actionHistory, setActionHistory] = useState<ActionRecord[]>(() => getInitialState().actionHistory);
    const [columnLabels, setColumnLabels] = useState<ColumnLabels>(() => getInitialState().columnLabels);

    useEffect(() => {
        const initialState = getInitialState();
        setPlayers(initialState.players);
        setCurrentPlayerIndex(initialState.currentPlayerIndex);
        setAuctionStarted(initialState.auctionStarted);
        setActionHistory(initialState.actionHistory);
        setColumnLabels(initialState.columnLabels);
    }, [auctionId, getInitialState]);
    
    useEffect(() => {
        if(auctionId) localStorage.setItem(`auction_${auctionId}_players`, JSON.stringify(players));
    }, [players, auctionId]);
    
    useEffect(() => {
        if(auctionId) localStorage.setItem(`auction_${auctionId}_currentPlayerIndex`, JSON.stringify(currentPlayerIndex));
    }, [currentPlayerIndex, auctionId]);

    useEffect(() => {
        if(auctionId) localStorage.setItem(`auction_${auctionId}_auctionStarted`, JSON.stringify(auctionStarted));
    }, [auctionStarted, auctionId]);

    useEffect(() => {
        if(auctionId) localStorage.setItem(`auction_${auctionId}_actionHistory`, JSON.stringify(actionHistory));
    }, [actionHistory, auctionId]);

    useEffect(() => {
        if(auctionId) localStorage.setItem(`auction_${auctionId}_columnLabels`, JSON.stringify(columnLabels));
    }, [columnLabels, auctionId]);

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (auctionId && event.key?.startsWith(`auction_${auctionId}`)) {
                const initialState = getInitialState();
                setPlayers(initialState.players);
                setCurrentPlayerIndex(initialState.currentPlayerIndex);
                setAuctionStarted(initialState.auctionStarted);
                setActionHistory(initialState.actionHistory);
                setColumnLabels(initialState.columnLabels);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [auctionId, getInitialState]);


    const value = {
        players,
        currentPlayerIndex,
        auctionStarted,
        actionHistory,
        columnLabels,
        setPlayers,
        setCurrentPlayerIndex,
        setAuctionStarted,
        setActionHistory,
        setColumnLabels,
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
