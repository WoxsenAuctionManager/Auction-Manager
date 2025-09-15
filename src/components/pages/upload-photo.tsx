
"use client";

import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import Image from "next/image";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { Label } from "../ui/label";

export function UploadPhotoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith("image/")) {
        setFile(selectedFile);
        setDownloadURL(null);
        setUploadProgress(null);
        setError(null);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please select an image file.",
        });
      }
    }
  };

  const handleUpload = () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No File Selected",
        description: "Please select a file to upload.",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setDownloadURL(null);

    // The path in the storage bucket
    const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (uploadError) => {
        console.error("Upload failed:", uploadError);
        // Provide a more detailed error message
        let errorMessage = `Upload failed. Error: ${uploadError.code}.`;
        if (uploadError.code === 'storage/unauthorized') {
            errorMessage += ' Please check your Storage Security Rules in the Firebase console.';
        } else if (uploadError.code === 'storage/object-not-found') {
            errorMessage += ' The file does not exist.';
        } else if (uploadError.code === 'storage/unknown' && navigator.onLine === false) {
            errorMessage = 'Upload failed. Please check your network connection.';
        } else if (uploadError.code === 'storage/unknown') {
            errorMessage += ' This might be a CORS configuration issue. Please ensure your bucket is configured to allow requests from this domain.'
        }

        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: uploadError.message,
        });
        setUploadProgress(null);
        setIsUploading(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setDownloadURL(url);
          toast({
            title: "Upload Successful",
            description: "Your image has been uploaded.",
          });
          setUploadProgress(null);
          setIsUploading(false);
          setFile(null);
        });
      }
    );
  };
  
  const copyToClipboard = () => {
    if (downloadURL) {
      navigator.clipboard.writeText(downloadURL);
      toast({ title: "Copied!", description: "Image URL copied to clipboard." });
    }
  };

  return (
    <div>
      <h1 className="font-semibold text-3xl">Upload Photo</h1>
      <p className="text-muted-foreground mt-1">
        This is where you can upload photos to Firebase Storage.
      </p>
      <Card className="mt-6 max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadCloud className="h-6 w-6" />
            <span>Image Upload</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file-upload" className="sr-only">Choose a file</Label>
            <Input 
              id="file-upload" 
              type="file" 
              onChange={handleFileChange} 
              accept="image/*"
              disabled={isUploading} 
            />
          </div>
          {file && !isUploading && (
             <div className="text-sm text-muted-foreground">
                Selected file: <strong>{file.name}</strong>
             </div>
          )}
          {isUploading && uploadProgress !== null && (
            <div>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-center mt-2">{Math.round(uploadProgress)}%</p>
            </div>
          )}
           {error && (
            <div className="flex items-start gap-3 text-sm text-destructive border-l-4 border-destructive bg-destructive/10 p-3 rounded-r-md">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
            </div>
           )}
          {downloadURL && (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <p>Upload complete!</p>
                    </div>
                </div>
                <div className="border rounded-md p-2 bg-muted overflow-hidden">
                    <Image
                        src={downloadURL}
                        alt="Uploaded preview"
                        width={400}
                        height={300}
                        className="w-full h-auto object-contain rounded"
                    />
                </div>
                <div className="space-y-1 relative">
                    <Label htmlFor="image-url" className="text-sm font-medium">Image URL</Label>
                    <Input id="image-url" readOnly value={downloadURL} className="pr-10" />
                    <Button 
                      variant="ghost" 
                      size="icon" 
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
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            className="w-full"
          >
            {isUploading ? "Uploading..." : "Upload to Firebase"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
