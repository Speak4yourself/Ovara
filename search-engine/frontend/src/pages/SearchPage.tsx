import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import AIAnswerCard from '../components/AIAnswerCard';
import SearchResult from '../components/SearchResult';
import { searchApi, SearchResponse } from '../api/searchApi';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await searchApi.search(searchQuery);
      setSearchResponse(response);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-ovara-darker border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-ovara-accent to-ovara-light bg-clip-text text-transparent">
              Ovara
            </h1>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-3xl">
            <SearchBar
              initialQuery={query}
              onSearch={performSearch}
              size="small"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-ovara-accent"></div>
            <p className="mt-4 text-ovara-gray">Searching...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        {!loading && searchResponse && (
          <>
            {/* Search Info */}
            <div className="mb-6 text-sm text-gray-500">
              <p>
                About {searchResponse.totalResults} results
                ({(searchResponse.searchTime / 1000).toFixed(2)} seconds)
                {searchResponse.fromCache && ' • From cache'}
              </p>
              <p className="mt-1">
                Sources: {searchResponse.sources.join(', ')}
              </p>
            </div>

            {/* AI Answer */}
            {searchResponse.aiAnswer && (
              <AIAnswerCard aiAnswer={searchResponse.aiAnswer} />
            )}

            {/* Search Results */}
            <div className="space-y-4">
              {searchResponse.results.map((result, index) => (
                <SearchResult
                  key={result.url}
                  result={result}
                  index={index + 1}
                />
              ))}
            </div>

            {/* No Results */}
            {searchResponse.results.length === 0 && (
              <div className="text-center py-12">
                <p className="text-ovara-gray text-lg">No results found for "{query}"</p>
                <p className="text-gray-500 mt-2">Try different keywords or check your spelling</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
