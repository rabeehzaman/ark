"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useSWR from "swr";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronsUpDown, Check, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Party {
  id: string;
  name: string;
}

interface PartyComboboxProps {
  value: string;
  onChange: (partyId: string) => void;
  className?: string;
}

export function PartyCombobox({ value, onChange, className }: PartyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newPartyName, setNewPartyName] = useState("");
  const [showCreateInput, setShowCreateInput] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : "";
  const { data: parties, mutate } = useSWR<Party[]>(
    open ? `/api/parties${queryParams}` : null,
    fetcher
  );

  const selectedParty = useSWR<Party[]>(
    value && !open ? `/api/parties` : null,
    fetcher
  );
  const selectedName = (selectedParty.data ?? parties)?.find((p) => p.id === value)?.name;

  // Focus search input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch("");
      setShowCreateInput(false);
      setNewPartyName("");
    }
  }, [open]);

  // Focus create input when shown
  useEffect(() => {
    if (showCreateInput) {
      setTimeout(() => createInputRef.current?.focus(), 50);
    }
  }, [showCreateInput]);

  const handleSelect = useCallback((partyId: string) => {
    onChange(partyId);
    setOpen(false);
  }, [onChange]);

  const handleCreateParty = async () => {
    const name = newPartyName.trim();
    if (!name) return;

    setCreating(true);
    try {
      const res = await fetch("/api/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to create party");
        return;
      }

      const party = await res.json();
      toast.success(`Party "${name}" created`);
      await mutate();
      handleSelect(party.id);
    } catch {
      toast.error("Failed to create party");
    } finally {
      setCreating(false);
    }
  };

  const partyList = Array.isArray(parties) ? parties : [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground",
          className
        )}
      >
        <span className="truncate">
          {selectedName || "Select party..."}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--trigger-width] p-0">
        <div className="p-2">
          <Input
            ref={searchInputRef}
            placeholder="Search parties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <ScrollArea className="max-h-48">
          <div className="px-1 pb-1">
            {partyList.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                {search ? "No parties found" : "No parties yet"}
              </p>
            ) : (
              partyList.map((party) => (
                <button
                  key={party.id}
                  type="button"
                  onClick={() => handleSelect(party.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                    value === party.id && "bg-accent"
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === party.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{party.name}</span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="border-t p-2">
          {showCreateInput ? (
            <div className="flex gap-2">
              <Input
                ref={createInputRef}
                placeholder="Party name"
                value={newPartyName}
                onChange={(e) => setNewPartyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateParty();
                  }
                  if (e.key === "Escape") {
                    setShowCreateInput(false);
                    setNewPartyName("");
                  }
                }}
                className="h-8"
                disabled={creating}
              />
              <Button
                type="button"
                size="sm"
                className="h-8 shrink-0"
                onClick={handleCreateParty}
                disabled={creating || !newPartyName.trim()}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreateInput(true)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="h-4 w-4" />
              <span>Add new party</span>
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
