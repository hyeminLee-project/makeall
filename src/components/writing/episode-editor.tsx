"use client";

import { useState, useCallback } from "react";
import { Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EpisodeStatusBadge } from "./episode-status-badge";
import { useAsyncAction } from "@/hooks/use-async-action";
import { apiClient } from "@/lib/api-client";

interface EpisodeEditorProps {
  episodeId: string;
  seriesId: string;
  episodeNumber: number;
  status: string;
  initialContent: string;
}

export function EpisodeEditor({
  episodeId,
  seriesId,
  episodeNumber,
  status: initialStatus,
  initialContent,
}: EpisodeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [status, setStatus] = useState(initialStatus);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);

  const saveAction = useCallback(
    async (finalContent: string) => {
      return apiClient<{ id: string; status: string; word_count: number }>(
        `/api/writing/series/${seriesId}/episodes/${episodeId}`,
        {
          method: "PUT",
          body: JSON.stringify({ finalContent }),
        }
      );
    },
    [seriesId, episodeId]
  );

  const finalizeAction = useCallback(
    async () => {
      return apiClient<{ status: string }>(
        `/api/writing/series/${seriesId}/episodes/${episodeId}/finalize`,
        { method: "POST" }
      );
    },
    [seriesId, episodeId]
  );

  const {
    execute: executeSave,
    error: saveError,
    isLoading: isSaving,
  } = useAsyncAction(saveAction);

  const {
    execute: executeFinalize,
    error: finalizeError,
    isLoading: isFinalizing,
  } = useAsyncAction(finalizeAction);

  async function handleSave() {
    const result = await executeSave(content);
    if (result) {
      setStatus(result.status);
    }
  }

  async function handleFinalize() {
    // Save first if content was edited
    if (status === "draft") {
      const saveResult = await executeSave(content);
      if (!saveResult) return;
    }
    const result = await executeFinalize(undefined as unknown as void);
    if (result) {
      setStatus(result.status);
      setShowFinalizeDialog(false);
    }
  }

  const isFinalized = status === "finalized";
  const error = saveError || finalizeError;

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground text-sm font-medium">
            에피소드 #{episodeNumber}
          </span>
          <EpisodeStatusBadge status={status} />
          <Badge variant="outline" className="text-xs">
            {content.length.toLocaleString()}자
          </Badge>
        </div>
        <div className="flex gap-2">
          {!isFinalized && (
            <>
              <Button variant="outline" onClick={handleSave} disabled={isSaving || isFinalizing}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "저장 중..." : "임시 저장"}
              </Button>
              <Button
                onClick={() => setShowFinalizeDialog(true)}
                disabled={isSaving || isFinalizing || !content.trim()}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                완성
              </Button>
            </>
          )}
        </div>
      </div>

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="에피소드 내용을 작성하세요..."
        className="min-h-[500px] font-mono text-sm leading-relaxed"
        maxLength={100000}
        disabled={isFinalized}
      />

      <Dialog open={showFinalizeDialog} onOpenChange={setShowFinalizeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>에피소드 완성</DialogTitle>
            <DialogDescription>
              에피소드를 완성 처리하시겠습니까? 완성 후에는 연속성 상태가 자동으로 업데이트됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinalizeDialog(false)}>
              취소
            </Button>
            <Button onClick={handleFinalize} disabled={isFinalizing}>
              {isFinalizing ? "처리 중..." : "완성 처리"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
