
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
    setPlayers: (value: React.SetStateAction<AuctionPlayer[]>) => void;
    currentPlayerIndex: number;
    setCurrentPlayerIndex: (value: React.SetStateAction<number>) => void;
    auctionStarted: boolean;
    setAuctionStarted: (value: React.SetStateAction<boolean>) => void;
    actionHistory: ActionRecord[];
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


export function AuctionProvider({ children }: { children: ReactNode }) {
    const { selectedAuction } = useAuctionSelection();
    const auctionId = selectedAuction?.id;

    const getInitialState = <T,>(key: string, defaultValue: T): T => {
        if (typeof window === 'undefined' || !auctionId) return defaultValue;
        try {
            const saved = localStorage.getItem(`auction_${auctionId}_${key}`);
            return saved ? JSON.parse(saved) : defaultValue;
        } catch (error) {
            console.error(`Error reading from localStorage for key: auction_${auctionId}_${key}`, error);
            return defaultValue;
        }
    };
    
    const [_players, _setPlayers] = useState<AuctionPlayer[]>(() => getInitialState('players', []));
    const [_currentPlayerIndex, _setCurrentPlayerIndex] = useState<number>(() => getInitialState('currentPlayerIndex', 0));
    const [_auctionStarted, _setAuctionStarted] = useState<boolean>(() => getInitialState('auctionStarted', false));
    const [_actionHistory, _setActionHistory] = useState<ActionRecord[]>(() => getInitialState('actionHistory', []));

    const createSetter = <T,>(stateSetter: React.Dispatch<React.SetStateAction<T>>, key: string) => (value: React.SetStateAction<T>) => {
        stateSetter(prevState => {
            const resolvedValue = value instanceof Function ? value(prevState) : value;
            if (auctionId) {
                setLocalStorageItem(`auction_${auctionId}_${key}`, resolvedValue);
            }
            return resolvedValue;
        });
    };

    const setPlayers = createSetter(_setPlayers, 'players');
    const setCurrentPlayerIndex = createSetter(_setCurrentPlayerIndex, 'currentPlayerIndex');
    const setAuctionStarted = createSetter(_setAuctionStarted, 'auctionStarted');
    const setActionHistory = createSetter(_setActionHistory, 'actionHistory');

    // Effect to reset state when auction changes
    useEffect(() => {
        _setPlayers(getInitialState('players', []));
        _setCurrentPlayerIndex(getInitialState('currentPlayerIndex', 0));
        _setAuctionStarted(getInitialState('auctionStarted', false));
        _setActionHistory(getInitialState('actionHistory', []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auctionId]);

    // Effect to listen for changes in other tabs
    useEffect(() => {
        if (typeof window === 'undefined' || !auctionId) return;

        const handleStorageChange = (event: StorageEvent) => {
            if (event.storageArea !== localStorage) return;
            
            const keyMapping: { [key: string]: (value: any) => void } = {
                [`auction_${auctionId}_players`]: _setPlayers,
                [`auction_${auctionId}_currentPlayerIndex`]: _setCurrentPlayerIndex,
                [`auction_${auctionId}_auctionStarted`]: _setAuctionStarted,
                [`auction_${auctionId}_actionHistory`]: _setActionHistory,
            };

            if (event.key && event.key in keyMapping && event.newValue) {
                try {
                    const newValue = JSON.parse(event.newValue);
                    keyMapping[event.key](newValue);
                } catch (e) {
                    console.error(`Failed to parse localStorage value for key ${event.key}`, e);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [auctionId]);


    const value = {
        players: _players,
        setPlayers,
        currentPlayerIndex: _currentPlayerIndex,
        setCurrentPlayerIndex,
        auctionStarted: _auctionStarted,
        setAuctionStarted,
        actionHistory: _actionHistory,
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
