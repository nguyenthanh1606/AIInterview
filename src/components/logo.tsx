import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <div className="bg-accent p-2 rounded-lg">
        <Bot className="h-6 w-6 text-accent-foreground" />
      </div>
      <span className="text-xl font-bold text-foreground">
        AIGuestInterview
      </span>
    </div>
  );
}
