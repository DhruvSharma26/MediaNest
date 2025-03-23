"use client";
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

function VideoUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [videoId, setVideoId] = useState<string | null>(null);

    const router = useRouter();
    const MAX_FILE_SIZE = 70 * 1024 * 1024; // 70MB limit

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            alert("File size too large (Max: 70MB)");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);
        formData.append("description", description);

        try {
            const response = await axios.post("/api/video-upload", formData);
            setVideoId(response.data.videoId);
            alert("Video uploaded successfully!");
            router.push("/");
        } catch (error) {
            console.error(error);
            alert("Upload failed.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (videoId: string) => {
      try {
          await axios.delete("/api/video-upload", { data: { videoId } });
          console.log("Video deleted successfully!");
      } catch (error) {
          console.error("Failed to delete video:", error);
      }
  };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="label">
                        <span className="label-text">Title</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="input input-bordered w-full"
                        required
                    />
                </div>
                <div>
                    <label className="label">
                        <span className="label-text">Description</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="textarea textarea-bordered w-full"
                    />
                </div>
                <div>
                    <label className="label">
                        <span className="label-text">Video File</span>
                    </label>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="file-input file-input-bordered w-full"
                        required
                    />
                </div>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isUploading}
                >
                    {isUploading ? "Uploading..." : "Upload Video"}
                </button>
            </form>
            {videoId && (
    <button
        onClick={() => handleDelete(videoId)}
        className="btn btn-error mt-4"
    >
        Delete Video
    </button>
)}

        </div>
    );
}
export default VideoUpload;
