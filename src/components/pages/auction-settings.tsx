"use client";

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

export function AuctionSettingsPage() {
    return (
        <>
            <div className="flex items-center justify-between">
                <h1 className="font-semibold text-3xl">Auction Settings</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Auction Configuration</CardTitle>
                    <CardDescription>
                        Set the rules and parameters for your auction.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-6">
                        <div className="grid gap-3">
                            <Label htmlFor="initial-purse">Initial Purse of the team</Label>
                            <Input id="initial-purse" type="number" placeholder="e.g., 100000" />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="retentions">No. of Retentions per team</Label>
                            <Input id="retentions" type="number" placeholder="e.g., 3" />
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="retention-price">Price for each Retention</Label>
                            <Input id="retention-price" type="number" placeholder="e.g., 10000" />
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Save</Button>
                </CardFooter>
            </Card>
        </>
    );
}
