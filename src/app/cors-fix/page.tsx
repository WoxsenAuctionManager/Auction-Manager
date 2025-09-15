"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, Copy, AlertTriangle } from "lucide-react";
import { CodeBlock } from "@/components/code-block";

const GCLOUD_URL = "https://cloud.google.com/sdk/docs/install";
const CORS_DOCS_URL = "https://firebase.google.com/docs/storage/web/download-files#cors_configuration";

export default function CorsFixPage() {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const bucketName = "studio-2256766213-a72a9.appspot.com";
  const corsConfigContent = `[
  {
    "origin": ["${origin}"],
    "method": ["GET", "POST", "PUT", "HEAD"],
    "responseHeader": [
      "Content-Type",
      "Access-Control-Allow-Origin"
    ],
    "maxAgeSeconds": 3600
  }
]`;

  const gcloudCommand = `gcloud storage buckets update gs://${bucketName} --cors-file=cors.json`;

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex items-start gap-4 p-4 rounded-lg border bg-amber-50 border-amber-200">
            <AlertTriangle className="h-6 w-6 text-amber-600 mt-1" />
            <div>
                <h2 className="font-semibold text-xl text-amber-900">Action Required: Fix Storage Permissions (CORS)</h2>
                <p className="text-amber-800 mt-1">
                    Your image uploads are failing because of a security policy called CORS. This is not an error in the application code. You must update your Firebase Storage bucket configuration to allow uploads from this web app.
                </p>
            </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Create a `cors.json` file</CardTitle>
            <CardDescription>
              Create a new file named `cors.json` on your local computer and paste the following content into it. This configuration explicitly allows your app's domain.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock content={corsConfigContent} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Run the `gcloud` command</CardTitle>
            <CardDescription>
              Open a terminal on your computer that has the <a href={GCLOUD_URL} target="_blank" rel="noopener noreferrer" className="underline">Google Cloud SDK (gcloud)</a> installed and authenticated. Make sure you are in the same directory where you saved `cors.json`, then run the following command.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <CodeBlock content={gcloudCommand} />
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-muted-foreground p-4 border-t">
          After completing these steps, your image uploads will work correctly.
          <br />
          For more information, you can read the official <a href={CORS_DOCS_URL} target="_blank" rel="noopener noreferrer" className="underline">Firebase CORS documentation</a>.
        </div>
      </div>
    </AppLayout>
  );
}
