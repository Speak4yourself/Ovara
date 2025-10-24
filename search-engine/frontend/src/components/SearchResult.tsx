import { SearchResult as SearchResultType } from '../api/searchApi';

interface SearchResultProps {
  result: SearchResultType;
  index: number;
}

export default function SearchResult({ result, index }: SearchResultProps) {
  const sourceBadgeColor = {
    bing: 'bg-blue-900/50 text-blue-300',
    brave: 'bg-orange-900/50 text-orange-300',
    google: 'bg-green-900/50 text-green-300'
  }[result.source];

  return (
    <div className="bg-ovara-darker rounded-lg p-5 hover:bg-ovara-darker/80 transition-colors border border-gray-800 hover:border-ovara-accent">
      <div className="flex items-start gap-4">
        {/* Thumbnail (if available) */}
        {result.thumbnail && (
          <img
            src={result.thumbnail}
            alt={result.title}
            className="w-20 h-20 object-cover rounded"
          />
        )}

        {/* Content */}
        <div className="flex-1">
          {/* Title with index */}
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <h3 className="text-lg font-semibold text-ovara-light group-hover:text-ovara-accent transition-colors mb-1">
              {index}. {result.title}
            </h3>
          </a>

          {/* URL + Source */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-500">{result.displayUrl}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${sourceBadgeColor}`}>
              {result.source}
            </span>
          </div>

          {/* Snippet */}
          <p className="text-ovara-gray text-sm leading-relaxed">
            {result.snippet}
          </p>
        </div>
      </div>
    </div>
  );
}
