"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const LOCAL_STORAGE_KEY = 'savedInput';

export function InputSaverForm() {
  const [inputValue, setInputValue] = useState('');
  const [savedValue, setSavedValue] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const item = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (item) {
        setSavedValue(item);
      }
    } catch (error) {
      console.error("Could not read from local storage", error);
    }
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputValue.trim()) return;

    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, inputValue);
      setSavedValue(inputValue);
      setInputValue('');
    } catch (error) {
      console.error("Could not write to local storage", error);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <Card className="shadow-lg">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="font-headline text-3xl">Input Saver</CardTitle>
            <CardDescription>Enter some text and save it. It will be stored in your browser.</CardDescription>
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

      {isClient && savedValue && (
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
