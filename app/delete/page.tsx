"use client";
import React, { useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Trash2, Loader2, CheckCircle2 } from "lucide-react";

export default function DeleteUserPage() {
  const [userId, setUserId] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!userId.trim()) {
      setError("User ID is required.");
      return;
    }

    setIsDeleting(true);

    try {
      // Call the DELETE API
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/user/delete/${userId}`
      );

      if (response.status === 202) {
        // Success: Queued for deletion
        setSuccess(true);
        setUserId(""); // Clear input
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Failed to queue deletion request.");
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsDeleting(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-red-600 flex items-center gap-2">
            <Trash2 className="h-6 w-6" />
            Delete User Account
          </CardTitle>
          <CardDescription>
            Enter the User ID to queue the deletion request. This action cannot be
            undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="mb-4 border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                User deletion request queued successfully. The background worker will
                process it shortly.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleDelete} className="space-y-4">
            {/* User ID Input */}
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                type="text"
                placeholder="e.g. 123456..."
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                disabled={isDeleting}
                className="w-full font-mono"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Deletion...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}