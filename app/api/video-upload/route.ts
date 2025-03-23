import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

interface CloudinaryUploadResult {
    public_id: string;
    bytes: number;
    duration?: number;
    [key: string]: any;
}

// Upload Video
export async function POST(request: NextRequest) {
    const { userId } = auth();

    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET) {
        return NextResponse.json(
            { error: "Cloudinary credentials not found" },
            { status: 500 }
        );
    }

    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const originalSize = formData.get("originalSize") as string;

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: "video",
                        folder: "video-uploads",
                        transformation: [
                            { quality: "auto", fetch_format: "mp4" }
                        ]
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result as CloudinaryUploadResult);
                    }
                );
                uploadStream.end(buffer);
            }
        );

        const video = await prisma.video.create({
            data: {
                title,
                description,
                publicId: result.public_id,
                originalSize: originalSize,
                compressedSize: String(result.bytes),
                duration: result.duration || 0,
            },
        });

        return NextResponse.json(video);
    } catch (error) {
        console.log("Upload video failed", error);
        return NextResponse.json({ error: "Upload video failed" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

// Delete Video
export async function DELETE(request: NextRequest) {
    const { userId } = auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { videoId } = await request.json();
        if (!videoId) {
            return NextResponse.json({ error: "Video ID required" }, { status: 400 });
        }

        // Find video in DB
        const video = await prisma.video.findUnique({
            where: { id: videoId },
        });

        if (!video) {
            return NextResponse.json({ error: "Video not found" }, { status: 404 });
        }

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(video.publicId, { resource_type: "video" });

        // Delete from DB
        await prisma.video.delete({ where: { id: videoId } });

        return NextResponse.json({ message: "Video deleted successfully" });
    } catch (error) {
        console.log("Delete video failed", error);
        return NextResponse.json({ error: "Delete video failed" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
