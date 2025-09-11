"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export function AuctionSettingsPage() {
    return (
        <>
            <div className="flex items-center">
                <h1 className="font-semibold text-3xl">Auction Settings</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Auction Settings</CardTitle>
                    <CardDescription>
                        Configure your auction settings here. This page is under construction.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Coming soon!</p>
                </CardContent>
            </Card>
        </>
    );
}
