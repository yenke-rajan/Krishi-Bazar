import { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchToggleProps {
  onSearch: (q: string) => void;
  placeholder: string;
}

export function SearchToggle({ onSearch, placeholder }: SearchToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    onSearch('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-xl hover:bg-kb-cream text-kb-muted hover:text-kb-forest transition-colors"
      >
        <Search className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-white border border-kb-border rounded-xl px-3 py-1.5">
      <Search className="w-3.5 h-3.5 text-kb-muted flex-shrink-0" />
      <input
        autoFocus
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); onSearch(e.target.value); }}
        className="text-sm outline-none w-36 text-kb-text"
        placeholder={placeholder}
      />
      <button onClick={handleClose}>
        <X className="w-3.5 h-3.5 text-kb-muted" />
      </button>
    </div>
  );
}
