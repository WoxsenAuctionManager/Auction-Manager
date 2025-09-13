"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Player } from '@/components/pages/players';

type AuctionPlayer = Player & { price?: number; teamId?: string; status?: 'sold' | 'unsold' | 'queued' };

interface LiveAuctionState {
    players: AuctionPlayer[];
    currentPlayerIndex: number;
    auctionStarted: boolean;
}

export function useLiveAuction(auctionId: string | null) {
    const [state, setState] = useState<LiveAuctionState>({
        players: [],
        currentPlayerIndex: 0,
        auctionStarted: false,
    });
    const [loading, setLoading] = useState(true);

    const loadStateFromStorage = useCallback(() => {
        if (typeof window === 'undefined' || !auctionId) {
            setLoading(false);
            return;
        };

        try {
            const savedPlayers = localStorage.getItem(`auction_${auctionId}_players`);
            const savedIndex = localStorage.getItem(`auction_${auctionId}_currentPlayerIndex`);
            const savedStarted = localStorage.getItem(`auction_${auctionId}_auctionStarted`);

            setState({
                players: savedPlayers ? JSON.parse(savedPlayers) : [],
                currentPlayerIndex: savedIndex ? JSON.parse(savedIndex) : 0,
                auctionStarted: savedStarted ? JSON.parse(savedStarted) : false,
            });
        } catch (error) {
            console.error("Failed to load state from localStorage", error);
        } finally {
            setLoading(false);
        }
    }, [auctionId]);
    
    useEffect(() => {
        loadStateFromStorage();
    }, [loadStateFromStorage]);

    useEffect(() => {
        if (typeof window === 'undefined' || !auctionId) return;

        const handleStorageChange = (event: StorageEvent) => {
            if (event.storageArea !== localStorage) return;

            const key = event.key;
            if (key?.startsWith(`auction_${auctionId}_`)) {
                loadStateFromStorage();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [auctionId, loadStateFromStorage]);

    return { ...state, loading };
}
