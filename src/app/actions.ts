"use server";

import { adminStorage } from "@/lib/firebase-admin";
import { randomUUID } from "crypto";

export async function uploadImageAction(formData: FormData) : Promise<{
    url?: string;
    error?: string;
}> {
    const file = formData.get("image") as File;
    if(!file || file.size === 0) {
        return { error: 'No file selected.' };
    }
    
    const bucket = adminStorage.bucket();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${randomUUID()}.${fileExtension}`;
    const filePath = `uploads/${fileName}`;

    try {
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        const blob = bucket.file(filePath);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: file.type,
            }
        });

        await new Promise((resolve, reject) => {
            blobStream.on('error', (err) => {
                reject(err);
            });
            blobStream.on('finish', () => {
                resolve(true);
            });
            blobStream.end(fileBuffer);
        });

        // Make the file public to get a downloadable URL
        await blob.makePublic();
        const publicUrl = blob.publicUrl();

        return { url: publicUrl };

    } catch (error) {
        console.error("Error uploading file: ", error);
        return { error: (error as Error).message || "Failed to upload file." };
    }
}
