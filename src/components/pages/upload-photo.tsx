"use client";

import { useState } from "react";
import Image from "next/image";
import { useFormState, useFormStatus } from "react-dom";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Copy, UploadCloud, Loader2 } from "lucide-react";
import { uploadImageAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Uploading...
        </>
      ) : (
        "Upload Image"
      )}
    </Button>
  );
}

export function UploadForm() {
  const [state, formAction] = useFormState(uploadImageAction, { error: undefined, url: undefined });
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  };

  const copyToClipboard = () => {
    if (state.url) {
      navigator.clipboard.writeText(state.url);
      toast({ title: "Copied!", description: "Image URL copied to clipboard." });
    }
  };

  return (
    <Card className="mt-6 max-w-lg mx-auto">
      <form action={formAction}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="h-6 w-6" />
            <span>Secure Image Upload</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="image-upload" className="sr-only">Choose an image</Label>
            <Input id="image-upload" name="image" type="file" accept="image/*" onChange={handleFileChange} required />
          </div>

          {filePreview && (
            <div className="border rounded-md p-2 bg-muted overflow-hidden">
                <Image
                    src={filePreview}
                    alt="Selected preview"
                    width={400}
                    height={300}
                    className="w-full h-auto object-contain rounded"
                    onLoad={() => URL.revokeObjectURL(filePreview)}
                />
            </div>
          )}

          {state.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Upload Failed</AlertTitle>
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          {state.url && (
            <div className="space-y-2">
              <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-800 dark:text-green-300">Upload Successful</AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    Your image has been uploaded successfully.
                  </AlertDescription>
              </Alert>

              <div className="border rounded-md p-2 bg-muted overflow-hidden">
                    <Image
                        src={state.url}
                        alt="Uploaded image"
                        width={400}
                        height={300}
                        className="w-full h-auto object-contain rounded"
                    />
                </div>

              <div className="space-y-1 relative">
                <Label htmlFor="image-url">Public URL</Label>
                <Input id="image-url" readOnly value={state.url} className="pr-10" />
                 <Button 
                      variant="ghost" 
                      size="icon" 
                      type="button"
                      className="absolute right-1 top-1/2 h-8 w-8"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
              </div>
            </div>
          )}

        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
