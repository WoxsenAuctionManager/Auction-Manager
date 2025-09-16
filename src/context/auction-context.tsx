
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { Player } from '@/components/pages/players';
import { useAuctionSelection } from './auction-selection-context';
import type { ColumnLabels } from '@/components/pages/players';
import { useAuth } from './auth-context';

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
    const { user } = useAuth();
    const auctionId = selectedAuction?.id;

    const getInitialState = useCallback(() => {
        const key = `auction_${auctionId}`;
        if (!auctionId) {
            return {
                players: [],
                currentPlayerIndex: 0,
                auctionStarted: false,
                actionHistory: [],
                columnLabels: defaultColumnLabels
            };
        }
        const savedState = getLocalStorageItem(key, {});
        return {
            players: savedState.players || [],
            currentPlayerIndex: savedState.currentPlayerIndex || 0,
            auctionStarted: savedState.auctionStarted || false,
            actionHistory: savedState.actionHistory || [],
            columnLabels: savedState.columnLabels || defaultColumnLabels,
        };
    }, [auctionId]);
    
    const [state, setState] = useState(getInitialState);

    useEffect(() => {
        setState(getInitialState());
    }, [auctionId, getInitialState]);
    
    useEffect(() => {
        if(auctionId && typeof window !== 'undefined') {
            const key = `auction_${auctionId}`;
            localStorage.setItem(key, JSON.stringify(state));
            if (user?.uid) {
                localStorage.setItem(`${key}_owner`, user.uid);
            }
        }
    }, [state, auctionId, user]);

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (auctionId && event.key === `auction_${auctionId}`) {
                setState(getInitialState());
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [auctionId, getInitialState]);


    const setPlayers = (value: React.SetStateAction<AuctionPlayer[]>) => {
        setState(s => ({...s, players: typeof value === 'function' ? value(s.players) : value }));
    };
    const setCurrentPlayerIndex = (value: React.SetStateAction<number>) => {
        setState(s => ({...s, currentPlayerIndex: typeof value === 'function' ? value(s.currentPlayerIndex) : value }));
    }
    const setAuctionStarted = (value: React.SetStateAction<boolean>) => {
        setState(s => ({...s, auctionStarted: typeof value === 'function' ? value(s.auctionStarted) : value }));
    }
    const setActionHistory = (value: React.SetStateAction<ActionRecord[]>) => {
        setState(s => ({...s, actionHistory: typeof value === 'function' ? value(s.actionHistory) : value }));
    }
    const setColumnLabels = (value: React.SetStateAction<ColumnLabels>) => {
        setState(s => ({...s, columnLabels: typeof value === 'function' ? value(s.columnLabels) : value }));
    }


    const value = {
        ...state,
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
