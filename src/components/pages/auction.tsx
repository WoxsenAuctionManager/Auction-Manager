"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export function AuctionPage() {
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Auction</CardTitle>
                    <CardDescription>
                        The live auction will take place here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center items-center h-48">
                        <p className="text-muted-foreground">Auction page is under construction.</p>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
