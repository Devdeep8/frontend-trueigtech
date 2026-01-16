/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
// Assuming you have a toast hook for feedback, if not, use alerts for now, but toast is better
// import { useToast } from "@/components/ui/use-toast"; 

export function AdminUploadButton() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  // const { toast } = useToast();

  const handleUpload = async () => {
    if (!file) {
      // toast({ variant: "destructive", description: "Please select a file." });
      alert("Please select a file.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file); // Make sure "file" matches the field name in your Multer setup

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/game/bulkupload`,
        {
          method: "POST",
          body: formData,
          // Do NOT set Content-Type header here! 
          // The browser sets it automatically with the correct boundary.
          credentials: "include", // Include cookies for auth (if you are using cookie-based auth)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Upload failed");
      }

      const result = await response.json();
      console.log({result})
      toast.success( "Games uploaded successfully!" );
      window.location.reload(); // Simple way to refresh the list
    } catch (error: any) {
      console.error(error);
      toast.error(error);
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Upload CSV</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Upload Games</DialogTitle>
          <DialogDescription>
            Select a CSV file containing the game data.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="file-upload"
              type="file"
              accept=".csv"
              className="col-span-4"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <DialogTrigger asChild>
             {/* This button inside DialogTrigger will close the dialog when clicked */}
            <Button variant="outline" disabled={uploading}>
              Cancel
            </Button>
          </DialogTrigger>
          
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}