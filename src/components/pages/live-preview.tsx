
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from 'next/navigation';
import { useAuctionSelection } from "@/context/auction-selection-context";
import { Loader2, User } from "lucide-react";
import type { Player } from "./players";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type AuctionPlayer = Player & { price?: number; teamId?: string; status?: 'sold' | 'unsold' | 'queued' };

interface AuctionState {
    players: AuctionPlayer[];
    currentPlayerIndex: number;
    auctionStarted: boolean;
}

function useLiveAuction(auctionId: string | null) {
    const getInitialState = useCallback(<T,>(key: string, defaultValue: T): T => {
        if (typeof window === 'undefined' || !auctionId) return defaultValue;
        try {
            const saved = localStorage.getItem(`auction_${auctionId}_${key}`);
            return saved ? JSON.parse(saved) : defaultValue;
        } catch (error) {
            console.error(`Error reading from localStorage for key: auction_${auctionId}_${key}`, error);
            return defaultValue;
        }
    }, [auctionId]);

    const [state, setState] = useState<AuctionState>({
        players: [],
        currentPlayerIndex: 0,
        auctionStarted: false,
    });
    const [loading, setLoading] = useState(true);

    const reinitializeState = useCallback(() => {
        if (!auctionId) return;
        setState({
            players: getInitialState('players', []),
            currentPlayerIndex: getInitialState('currentPlayerIndex', 0),
            auctionStarted: getInitialState('auctionStarted', false),
        });
        setLoading(false);
    }, [auctionId, getInitialState]);

    useEffect(() => {
        reinitializeState();
    }, [reinitializeState]);

    useEffect(() => {
        if (typeof window === 'undefined' || !auctionId) return;

        const handleStorageChange = (event: StorageEvent) => {
            if (event.storageArea !== localStorage) return;

            const keySuffix = event.key?.replace(`auction_${auctionId}_`, "");

            if (keySuffix && ['players', 'currentPlayerIndex', 'auctionStarted'].includes(keySuffix) && event.newValue) {
                try {
                    const newValue = JSON.parse(event.newValue);
                    setState(prevState => ({ ...prevState, [keySuffix]: newValue }));
                } catch (e) {
                    console.error(`Failed to parse localStorage value for key ${event.key}`, e);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        // Also re-read on focus in case of missed events
        const handleFocus = () => reinitializeState();
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [auctionId, reinitializeState]);

    return { ...state, loading };
}


export function LivePreviewPage() {
    const searchParams = useSearchParams();
    const auctionId = searchParams.get('auctionId');
    const { setSelectedAuction } = useAuctionSelection();
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (auctionId) {
            setSelectedAuction({ id: auctionId, name: 'Live Auction' });
            setIsInitialized(true);
        }
    }, [auctionId, setSelectedAuction]);

    const { players, currentPlayerIndex, auctionStarted, loading } = useLiveAuction(auctionId);

    const currentPlayer = useMemo(() => players[currentPlayerIndex], [players, currentPlayerIndex]);

    if (!isInitialized || loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                    <p className="text-lg font-semibold text-muted-foreground mt-4">
                        Connecting to live auction...
                    </p>
                </div>
            </div>
        );
    }
    
    if (!auctionStarted) {
        return (
             <div className="flex justify-center items-center h-screen bg-muted/40">
                <Card className="max-w-4xl mx-auto w-full text-center shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-3xl">Welcome to the Auction</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="py-12">
                            <p className="text-xl font-semibold text-muted-foreground">
                                The auction hasn't started yet.
                            </p>
                             <p className="text-muted-foreground mt-2">
                                Please wait for the auctioneer to begin.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!currentPlayer) {
         return (
            <div className="flex justify-center items-center h-screen bg-muted/40">
                <Card className="max-w-4xl mx-auto w-full text-center shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-3xl">Auction Finished</CardTitle>
                        <CardDescription>No more players to auction.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="py-12">
                            <p className="text-xl font-semibold text-muted-foreground">
                                All players have been auctioned. Thank you for participating!
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center h-screen bg-muted/40 p-4">
            <Card className="max-w-4xl w-full mx-auto shadow-2xl animate-in fade-in zoom-in-95">
                <CardHeader>
                    <CardTitle className="text-center text-4xl md:text-5xl font-bold tracking-tight">{currentPlayer.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row items-center gap-8 pt-6">
                    <Avatar className="h-48 w-48 md:h-64 md:w-64 border-4 border-primary shadow-lg">
                        <AvatarImage src={currentPlayer.photoUrl} alt={currentPlayer.name} className="object-cover"/>
                        <AvatarFallback className="text-8xl"><User /></AvatarFallback>
                    </Avatar>
                    <div className="w-full space-y-4 text-lg">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <p className="font-semibold text-muted-foreground">Department</p>
                            <p className="font-medium">{currentPlayer.department}</p>
                            <p className="font-semibold text-muted-foreground">Year</p>
                            <p className="font-medium">{currentPlayer.year}</p>
                            <p className="font-semibold text-muted-foreground">Position</p>
                            <p className="font-medium">{currentPlayer.player_position}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

