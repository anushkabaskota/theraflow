import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const uid = formData.get('uid') as string | null;

        if (!file || !uid) {
            return NextResponse.json(
                { error: 'File and UID are required.' },
                { status: 400 }
            );
        }

        // Initialize GCS client
        // For local development without a service account JSON file, 
        // it will attempt to use Application Default Credentials. 
        // Usually, you provide explicit credentials or rely on Google Cloud's environment.
        const storage = new Storage();
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

        if (!bucketName) {
            return NextResponse.json({ error: 'Bucket name missing in env' }, { status: 500 });
        }

        const bucket = storage.bucket(bucketName);
        const destinationPath = `profiles/${uid}/${file.name}`;
        const fileRef = bucket.file(destinationPath);

        // Convert Web File to Node Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Save to GCS
        await fileRef.save(buffer, {
            contentType: file.type,
            resumable: false, // For small files
        });

        // Make the file publicly accessible so we can get a read string back
        // (Ensure your bucket has fine-grained or uniform access that allows this)
        await fileRef.makePublic();

        // The public URL format for GCS
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${destinationPath}`;

        return NextResponse.json({ url: publicUrl });
    } catch (error: any) {
        console.error('Error uploading to GCS:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to upload image' },
            { status: 500 }
        );
    }
}
