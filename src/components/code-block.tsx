"use client";

import { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  content: string;
}

export function CodeBlock({ content }: CodeBlockProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setHasCopied(true);
    toast({ title: 'Copied to clipboard!' });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
        <code>{content}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8"
        onClick={copyToClipboard}
      >
        {hasCopied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        <span className="sr-only">Copy to clipboard</span>
      </Button>
    </div>
  );
}
