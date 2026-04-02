import { Lightbulb, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight font-headline">
            Project Idea Generator
          </h1>
        </Link>
        <Link href="/dashboard" passHref>
          <Button variant="ghost">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
      </div>
    </header>
  );
}
