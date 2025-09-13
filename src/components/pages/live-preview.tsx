"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LivePreviewPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-muted/20">
        <Card>
            <CardHeader>
                <CardTitle>Live Preview Unavailable</CardTitle>
            </CardHeader>
            <CardContent>
                <p>This feature is temporarily disabled.</p>
            </CardContent>
        </Card>
    </div>
  );
}
