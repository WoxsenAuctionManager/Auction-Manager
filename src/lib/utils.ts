import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertGoogleDriveUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return url;
  }

  // Regular expression to extract file ID from various Google Drive URL formats
  const fileIdRegex = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9_-]+)/;
  const match = url.match(fileIdRegex);

  if (match && match[1]) {
    const fileId = match[1];
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // Return the original URL if it doesn't match known Google Drive patterns
  return url;
}
