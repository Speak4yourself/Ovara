import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  autoFocus?: boolean;
  size?: 'large' | 'small';
}

export default function SearchBar({
  initialQuery = '',
  onSearch,
  autoFocus = false,
  size = 'large'
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (query.trim()) {
      if (onSearch) {
        onSearch(query);
      } else {
        navigate(`/search?q=${encodeURIComponent(query)}`);
      }
    }
  };

  const sizeClasses = size === 'large'
    ? 'text-lg py-4 px-6'
    : 'text-base py-3 px-4';

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the web..."
          autoFocus={autoFocus}
          className={`w-full ${sizeClasses} bg-ovara-darker text-ovara-gray rounded-full border-2 border-ovara-accent focus:border-ovara-light focus:outline-none transition-colors placeholder-gray-500`}
        />

        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-ovara-accent hover:bg-ovara-accent-hover text-white rounded-full px-6 py-2 transition-colors"
        >
          🔍 Search
        </button>
      </div>

      {/* Suggestions could go here */}
    </form>
  );
}
