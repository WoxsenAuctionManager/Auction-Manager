
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
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

interface AuctionState {
    players: AuctionPlayer[];
    currentPlayerIndex: number;
    auctionStarted: boolean;
    actionHistory: ActionRecord[];
}

interface AuctionContextType extends AuctionState {
    setPlayers: (value: React.SetStateAction<AuctionPlayer[]>) => void;
    setCurrentPlayerIndex: (value: React.SetStateAction<number>) => void;
    setAuctionStarted: (value: React.SetStateAction<boolean>) => void;
    setActionHistory: (value: React.SetStateAction<ActionRecord[]>) => void;
}

const AuctionContext = createContext<AuctionContextType | undefined>(undefined);

const setLocalStorageItem = (key: string, value: any) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error setting localStorage item for key: ${key}`, error);
    }
};

const getLocalStorageItem = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage for key: ${key}`, error);
        return defaultValue;
    }
};

export function AuctionProvider({ children }: { children: ReactNode }) {
    const { selectedAuction } = useAuctionSelection();
    const auctionId = selectedAuction?.id;

    const getInitialState = useCallback((): AuctionState => {
        if (!auctionId) {
            return {
                players: [],
                currentPlayerIndex: 0,
                auctionStarted: false,
                actionHistory: [],
            };
        }
        return {
            players: getLocalStorageItem(`auction_${auctionId}_players`, []),
            currentPlayerIndex: getLocalStorageItem(`auction_${auctionId}_currentPlayerIndex`, 0),
            auctionStarted: getLocalStorageItem(`auction_${auctionId}_auctionStarted`, false),
            actionHistory: getLocalStorageItem(`auction_${auctionId}_actionHistory`, []),
        };
    }, [auctionId]);

    const [state, setState] = useState<AuctionState>(getInitialState);

    const handleStorageChange = useCallback(() => {
        setState(getInitialState());
    }, [getInitialState]);

    useEffect(() => {
        // Set initial state when component mounts or auctionId changes
        handleStorageChange();
        
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [auctionId, handleStorageChange]);

    const createSetter = <T,>(key: string) => (value: React.SetStateAction<T>) => {
        if (!auctionId) return;
        
        const storageKey = `auction_${auctionId}_${key}`;
        const currentValue = getLocalStorageItem(storageKey, state[key as keyof AuctionState]);
        const newValue = value instanceof Function ? value(currentValue) : value;

        setLocalStorageItem(storageKey, newValue);
        
        // Manually trigger a state update for the current tab
        handleStorageChange();
    };

    const value = {
        ...state,
        setPlayers: createSetter<AuctionPlayer[]>('players'),
        setCurrentPlayerIndex: createSetter<number>('currentPlayerIndex'),
        setAuctionStarted: createSetter<boolean>('auctionStarted'),
        setActionHistory: createSetter<ActionRecord[]>('actionHistory'),
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
