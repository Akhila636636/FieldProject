import { Bot } from 'lucide-react';

export function Header() {
  return (
    <header className="p-4 border-b">
      <div className="max-w-7xl mx-auto flex items-center gap-2">
        <Bot className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight font-headline">
          Simple Chat
        </h1>
      </div>
    </header>
  );
}
