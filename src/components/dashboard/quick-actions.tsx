"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface QuickActionsProps {
  onNewCheque: () => void;
}

export function QuickActions({ onNewCheque }: QuickActionsProps) {
  return (
    <div className="flex gap-4">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onNewCheque}
        className="flex flex-1 items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/50 hover:bg-accent/50"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Plus className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-sm">Enter New Cheque</p>
          <p className="text-xs text-muted-foreground">
            Quick-add a cheque for any party
          </p>
        </div>
      </motion.button>
    </div>
  );
}
