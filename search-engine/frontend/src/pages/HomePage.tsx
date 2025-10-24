import { useEffect, useState } from 'react';
import SearchBar from '../components/SearchBar';
import { searchApi } from '../api/searchApi';

export default function HomePage() {
  const [trending, setTrending] = useState<string[]>([]);

  useEffect(() => {
    // Load trending searches
    searchApi.getTrending().then(setTrending).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-12 text-center">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-ovara-accent to-ovara-light bg-clip-text text-transparent">
          Ovara Search
        </h1>
        <p className="text-ovara-gray text-lg">
          AI-Enhanced Search Engine
        </p>
      </div>

      {/* Search Bar */}
      <SearchBar size="large" autoFocus />

      {/* Trending Searches */}
      {trending.length > 0 && (
        <div className="mt-12 max-w-3xl w-full">
          <h3 className="text-sm text-gray-500 mb-3">🔥 Trending Searches</h3>
          <div className="flex flex-wrap gap-2">
            {trending.map((term, i) => (
              <a
                key={i}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="bg-ovara-darker hover:bg-ovara-accent/20 text-ovara-gray hover:text-ovara-light px-4 py-2 rounded-full text-sm transition-colors border border-gray-800 hover:border-ovara-accent"
              >
                {term}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="absolute bottom-8 text-center text-gray-600 text-sm">
        <p>Powered by AI • Privacy-First • No Tracking</p>
      </footer>
    </div>
  );
}
