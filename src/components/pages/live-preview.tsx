"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LivePreviewPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Live Preview</h1>
      <Card>
        <CardHeader>
          <CardTitle>Auction Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is a placeholder for the live auction preview.</p>
        </CardContent>
      </Card>
    </div>
  );
}
