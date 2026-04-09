"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EpisodeGenerateFormProps {
  nextEpisodeNumber: number;
  characterNames: string[];
  onSubmit: (data: {
    episodeNumber: number;
    episodeOutline: string;
    focusCharacters: string[];
    plotPoints: string[];
    specialInstructions?: string;
  }) => void;
  isLoading: boolean;
}

export function EpisodeGenerateForm({
  nextEpisodeNumber,
  characterNames,
  onSubmit,
  isLoading,
}: EpisodeGenerateFormProps) {
  const [episodeNumber, setEpisodeNumber] = useState(nextEpisodeNumber);
  const [episodeOutline, setEpisodeOutline] = useState("");
  const [focusCharacters, setFocusCharacters] = useState<string[]>([]);
  const [plotPoints, setPlotPoints] = useState<string[]>([""]);
  const [specialInstructions, setSpecialInstructions] = useState("");

  function toggleCharacter(name: string) {
    setFocusCharacters((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  }

  function updatePlotPoint(index: number, value: string) {
    const updated = [...plotPoints];
    updated[index] = value;
    setPlotPoints(updated);
  }

  function addPlotPoint() {
    if (plotPoints.length >= 10) return;
    setPlotPoints([...plotPoints, ""]);
  }

  function removePlotPoint(index: number) {
    setPlotPoints(plotPoints.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validPlotPoints = plotPoints.filter((p) => p.trim());
    if (validPlotPoints.length === 0) return;
    onSubmit({
      episodeNumber,
      episodeOutline,
      focusCharacters,
      plotPoints: validPlotPoints,
      specialInstructions: specialInstructions || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="episodeNumber">에피소드 번호</Label>
          <Input
            id="episodeNumber"
            type="number"
            value={episodeNumber}
            onChange={(e) => setEpisodeNumber(Number(e.target.value))}
            min={1}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="episodeOutline">에피소드 아웃라인</Label>
        <Textarea
          id="episodeOutline"
          value={episodeOutline}
          onChange={(e) => setEpisodeOutline(e.target.value)}
          placeholder="이번 에피소드에서 다룰 내용을 간략히 설명해주세요"
          maxLength={3000}
          rows={4}
          required
        />
      </div>

      {characterNames.length > 0 && (
        <div>
          <Label>중심 인물 (선택)</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {characterNames.map((name) => (
              <Badge
                key={name}
                variant={focusCharacters.includes(name) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors",
                  focusCharacters.includes(name) && "bg-primary"
                )}
                onClick={() => toggleCharacter(name)}
              >
                {name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>포함할 사건</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addPlotPoint}
            disabled={plotPoints.length >= 10}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            추가
          </Button>
        </div>
        <div className="space-y-2">
          {plotPoints.map((point, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={point}
                onChange={(e) => updatePlotPoint(i, e.target.value)}
                placeholder={`사건 ${i + 1}`}
              />
              {plotPoints.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePlotPoint(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="specialInstructions">특별 지시사항 (선택)</Label>
        <Textarea
          id="specialInstructions"
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="예: 이번 회는 대화 중심으로, 반전을 넣어주세요"
          maxLength={2000}
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "AI가 생성 중입니다..." : "에피소드 생성"}
      </Button>
    </form>
  );
}
