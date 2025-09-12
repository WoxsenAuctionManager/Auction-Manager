
"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function AuctionSettingsPage() {
    const [initialPurse, setInitialPurse] = useState("");
    const [retentions, setRetentions] = useState("");
    const [retentionPrice, setRetentionPrice] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        const fetchSettings = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                const settingsDocRef = doc(db, "users", user.uid, "auction_settings", "config");
                const docSnap = await getDoc(settingsDocRef);

                if (docSnap.exists()) {
                    const settings = docSnap.data();
                    setInitialPurse(settings.initialPurse || "");
                    setRetentions(settings.retentions || "");
                    setRetentionPrice(settings.retentionPrice || "");
                }
            } catch (error) {
                console.error("Error fetching settings: ", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load settings. Please try again.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [toast, user]);

    const handleSave = async () => {
        if (!user) {
            toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to save settings." });
            return;
        }

        setIsSaving(true);
        try {
            const settingsDocRef = doc(db, "users", user.uid, "auction_settings", "config");
            await setDoc(settingsDocRef, {
                initialPurse,
                retentions,
                retentionPrice,
            });
            toast({
                title: "Settings Saved",
                description: "Your auction settings have been successfully saved.",
            });
        } catch (error) {
            console.error("Error saving settings: ", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to save settings. Please try again.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Auction Configuration</CardTitle>
                    <CardDescription>
                        Set the rules and parameters for your auction.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center h-24">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <form className="grid gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="initial-purse">Initial Purse of the team</Label>
                                <Input
                                    id="initial-purse"
                                    type="number"
                                    value={initialPurse}
                                    onChange={(e) => setInitialPurse(e.target.value)}
                                    disabled={!user}
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="retentions">No. of Retentions per team</Label>
                                <Input
                                    id="retentions"
                                    type="number"
                                    value={retentions}
                                    onChange={(e) => setRetentions(e.target.value)}
                                    disabled={!user}
                                />
                            </div>
                            <div className="grid gap-3">
                                <Label htmlFor="retention-price">Price for each Retention</Label>
                                <Input
                                    id="retention-price"
                                    type="number"
                                    value={retentionPrice}
                                    onChange={(e) => setRetentionPrice(e.target.value)}
                                    disabled={!user}
                                />
                            </div>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button onClick={handleSave} disabled={isSaving || loading || !user}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </CardFooter>
            </Card>
        </>
    );
}
