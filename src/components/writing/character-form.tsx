"use client";

import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const roleLabels: Record<string, string> = {
  protagonist: "주인공",
  antagonist: "악역",
  supporting: "조연",
  minor: "단역",
};

export interface CharacterData {
  name: string;
  role: "protagonist" | "antagonist" | "supporting" | "minor";
  description: string;
  personality: string;
  relationships: { characterName: string; relationship: string }[];
}

interface CharacterFormProps {
  index: number;
  character: CharacterData;
  onChange: (index: number, character: CharacterData) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export function CharacterForm({
  index,
  character,
  onChange,
  onRemove,
  canRemove,
}: CharacterFormProps) {
  function update(field: keyof CharacterData, value: unknown) {
    onChange(index, { ...character, [field]: value });
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">캐릭터 {index + 1}</span>
        {canRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>이름</Label>
          <Input
            value={character.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="캐릭터 이름"
            maxLength={100}
          />
        </div>
        <div>
          <Label>역할</Label>
          <Select value={character.role} onValueChange={(v) => update("role", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(roleLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>설명</Label>
        <Textarea
          value={character.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="캐릭터 배경, 외모 등"
          maxLength={2000}
          rows={2}
        />
      </div>
      <div>
        <Label>성격</Label>
        <Textarea
          value={character.personality}
          onChange={(e) => update("personality", e.target.value)}
          placeholder="성격적 특징"
          maxLength={1000}
          rows={2}
        />
      </div>
    </div>
  );
}
