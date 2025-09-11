"use client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export function TeamsPage() {
    return (
        <>
            <div className="flex items-center">
                <h1 className="font-semibold text-3xl">Teams</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Teams</CardTitle>
                    <CardDescription>
                        Manage your teams here. This page is under construction.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Coming soon!</p>
                </CardContent>
            </Card>
        </>
    );
}
