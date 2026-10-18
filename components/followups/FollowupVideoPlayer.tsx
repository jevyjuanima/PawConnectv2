"use client";

import * as React from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createFollowupVideoSignedUrlAction } from "@/app/actions/upload";

interface FollowupVideoPlayerProps {
  storagePath: string;
  className?: string;
}

export function FollowupVideoPlayer({ storagePath, className }: FollowupVideoPlayerProps) {
  const [signedUrl, setSignedUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadVideo = React.useCallback(async () => {
    if (!storagePath) return;
    setLoading(true);
    setError(null);
    try {
      const res = await createFollowupVideoSignedUrlAction(storagePath);
      if (res.success && res.data?.signedUrl) {
        setSignedUrl(res.data.signedUrl);
      } else {
        setError(res.error || "Failed to load video");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading video");
    } finally {
      setLoading(false);
    }
  }, [storagePath]);

  React.useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 rounded-xl border border-border/80 bg-muted/20 text-xs text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary mr-2 shrink-0" />
        <span>Loading follow-up video securely...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-xs text-destructive space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadVideo}
          className="h-7 text-xs gap-1.5"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Retry Loading Video</span>
        </Button>
      </div>
    );
  }

  if (!signedUrl) {
    return null;
  }

  return (
    <div className={`relative aspect-video max-w-md rounded-xl overflow-hidden border border-border/80 bg-black ${className || ""}`}>
      <video
        src={signedUrl}
        controls
        playsInline
        preload="metadata"
        className="w-full h-full object-contain"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
