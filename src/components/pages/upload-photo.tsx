"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function UploadPhotoPage() {
  return (
    <div>
      <h1 className="font-semibold text-3xl">Upload Photo</h1>
      <p className="text-muted-foreground mt-1">
        This is where you can upload photos.
      </p>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Upload Area</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The content for the upload photo page will go here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
