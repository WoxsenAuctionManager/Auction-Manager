"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const FIRESTORE_DOC_PATH = 'savedInput/latest';

export function InputSaverForm() {
  const [inputValue, setInputValue] = useState('');
  const [savedValue, setSavedValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const docRef = doc(db, FIRESTORE_DOC_PATH);
    getDoc(docRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          setSavedValue(docSnap.data().text);
        }
      })
      .catch((error) => {
        console.error("Error fetching document:", error);
        toast({
          title: "Error",
          description: "Could not fetch data from Firestore. Please make sure Firestore is set up correctly in your Firebase project.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [toast]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputValue.trim()) return;

    try {
      const docRef = doc(db, FIRESTORE_DOC_PATH);
      await setDoc(docRef, { text: inputValue });
      setSavedValue(inputValue);
      setInputValue('');
      toast({
        title: "Success!",
        description: "Your text has been saved to Firestore.",
      });
    } catch (error) {
      console.error("Could not write to Firestore", error);
      toast({
        title: "Error",
        description: "Could not save to Firestore. Check your security rules.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <Card className="shadow-lg">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Input Saver</CardTitle>
            <CardDescription>Enter some text and save it. It will be stored in Firestore.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="text-input">Your Text</Label>
              <Input
                id="text-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type something..."
                autoComplete="off"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="ml-auto">Save Text</Button>
          </CardFooter>
        </form>
      </Card>

      {isLoading ? (
         <Card className="shadow-lg animate-in fade-in-0 duration-700">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Saved Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg break-words text-foreground/90">Loading saved data...</p>
          </CardContent>
        </Card>
      ) : savedValue && (
        <Card className="shadow-lg animate-in fade-in-0 duration-700">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Saved Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg break-words text-foreground/90">{savedValue}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
