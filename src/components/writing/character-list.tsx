"use client";

import { useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CharacterForm, type CharacterData } from "./character-form";
import { useAsyncAction } from "@/hooks/use-async-action";
import { apiClient } from "@/lib/api-client";

const roleLabels: Record<string, string> = {
  protagonist: "주인공",
  antagonist: "악역",
  supporting: "조연",
  minor: "단역",
};

const roleColors: Record<string, string> = {
  protagonist: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  antagonist: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  supporting: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  minor: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

interface CharacterListProps {
  characters: CharacterData[];
  seriesId: string;
}

export function CharacterList({ characters: initialCharacters, seriesId }: CharacterListProps) {
  const [characters, setCharacters] = useState(initialCharacters);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editChar, setEditChar] = useState<CharacterData | null>(null);

  const saveAction = useCallback(
    async (chars: CharacterData[]) => {
      await apiClient(`/api/writing/series/${seriesId}`, {
        method: "PUT",
        body: JSON.stringify({ characters: chars }),
      });
      return chars;
    },
    [seriesId]
  );

  const { execute, error, isLoading } = useAsyncAction(saveAction);

  function openAdd() {
    setEditChar({
      name: "",
      role: "supporting",
      description: "",
      personality: "",
      relationships: [],
    });
    setEditIndex(null);
    setIsAdding(true);
  }

  function openEdit(index: number) {
    setEditChar({ ...characters[index] });
    setEditIndex(index);
    setIsAdding(true);
  }

  async function handleSave() {
    if (!editChar) return;
    const updated = [...characters];
    if (editIndex !== null) {
      updated[editIndex] = editChar;
    } else {
      updated.push(editChar);
    }
    const result = await execute(updated);
    if (result) {
      setCharacters(result);
      setIsAdding(false);
      setEditChar(null);
    }
  }

  async function handleDelete(index: number) {
    const updated = characters.filter((_, i) => i !== index);
    const result = await execute(updated);
    if (result) {
      setCharacters(result);
    }
  }

  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <Users className="text-muted-foreground mb-2 h-8 w-8" />
        <p className="text-muted-foreground">아직 캐릭터가 없습니다.</p>
        <Button variant="outline" className="mt-4" onClick={openAdd}>
          <Plus className="mr-1 h-4 w-4" />
          캐릭터 추가
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={openAdd} disabled={characters.length >= 20}>
          <Plus className="mr-1 h-4 w-4" />
          추가
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {characters.map((char, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{char.name}</span>
                <Badge variant="outline" className={roleColors[char.role] ?? ""}>
                  {roleLabels[char.role] ?? char.role}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(i)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(i)}
                  disabled={isLoading}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {char.description && (
              <p className="text-muted-foreground line-clamp-2 text-sm">{char.description}</p>
            )}
            {char.personality && (
              <p className="text-muted-foreground text-xs">성격: {char.personality}</p>
            )}
          </div>
        ))}
      </div>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editIndex !== null ? "캐릭터 수정" : "캐릭터 추가"}</DialogTitle>
          </DialogHeader>
          {editChar && (
            <div className="space-y-4">
              <CharacterForm
                index={0}
                character={editChar}
                onChange={(_, c) => setEditChar(c)}
                onRemove={() => {}}
                canRemove={false}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  취소
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? "저장 중..." : "저장"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
