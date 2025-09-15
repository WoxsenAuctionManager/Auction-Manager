
"use client";

import { useState } from "react";
import Image from "next/image";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Copy, UploadCloud, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { storage } from "@/lib/firebase";

export function UploadForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setUrl(null);
      setError(null);
    } else {
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('No file selected.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUrl(null);

    try {
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `${window.crypto.randomUUID()}.${fileExtension}`;
      const storageRef = ref(storage, `uploads/${fileName}`);
      
      const uploadTask = await uploadBytes(storageRef, selectedFile);
      const downloadUrl = await getDownloadURL(uploadTask.ref);

      setUrl(downloadUrl);
      toast({
        title: "Upload Successful",
        description: "Your image has been uploaded successfully.",
      });

    } catch (err: any) {
      console.error("Error uploading file: ", err);
      const errorMessage = err.message || "Failed to upload file. Check storage rules and configuration.";
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      toast({ title: "Copied!", description: "Image URL copied to clipboard." });
    }
  };

  return (
    <>
      <Card className="mt-6 max-w-lg mx-auto">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="h-6 w-6" />
              <span>Image Upload</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="image-upload" className="sr-only">Choose an image</Label>
              <Input id="image-upload" name="image" type="file" accept="image/*" onChange={handleFileChange} required disabled={isUploading} />
            </div>

            {filePreview && (
              <div className="border rounded-md p-2 bg-muted overflow-hidden">
                  <Image
                      src={filePreview}
                      alt="Selected preview"
                      width={400}
                      height={300}
                      className="w-full h-auto object-contain rounded"
                  />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Upload Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {url && (
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
                          src={url}
                          alt="Uploaded image"
                          width={400}
                          height={300}
                          className="w-full h-auto object-contain rounded"
                      />
                  </div>

                <div className="space-y-1 relative">
                  <Label htmlFor="image-url">Public URL</Label>
                  <Input id="image-url" readOnly value={url} className="pr-10" />
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
              <Button type="submit" disabled={isUploading || !selectedFile} className="w-full">
              {isUploading ? (
                  <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                  </>
              ) : (
                  "Upload Image"
              )}
              </Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card className="mt-6 max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>SharePoint Embed Test</CardTitle>
        </CardHeader>
        <CardContent>
          <iframe src="https://woxsenschoolofbusiness-my.sharepoint.com/personal/ashish_v_2026_woxsen_edu_in/_layouts/15/embed.aspx?UniqueId=3234e349-af94-4dff-bdb9-c6617b7a1a43" width="100%" height="360" frameBorder="0" scrolling="no" allowFullScreen title="IMG_20250912_175728_ROHITH chigatapu"></iframe>
        </CardContent>
      </Card>
    </>
  );
}
