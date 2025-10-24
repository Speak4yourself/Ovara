import { AIAnswer } from '../api/searchApi';

interface AIAnswerCardProps {
  aiAnswer: AIAnswer;
}

export default function AIAnswerCard({ aiAnswer }: AIAnswerCardProps) {
  const confidenceColor = {
    high: 'text-green-400',
    medium: 'text-yellow-400',
    low: 'text-red-400'
  }[aiAnswer.confidence];

  const confidenceBg = {
    high: 'bg-green-900/30 border-green-700',
    medium: 'bg-yellow-900/30 border-yellow-700',
    low: 'bg-red-900/30 border-red-700'
  }[aiAnswer.confidence];

  return (
    <div className={`bg-ovara-darker border-2 ${confidenceBg} rounded-lg p-6 mb-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <h3 className="text-xl font-semibold text-ovara-light">AI-Generated Answer</h3>
        </div>
        <div className={`text-sm ${confidenceColor} font-medium`}>
          {aiAnswer.confidence.toUpperCase()} confidence
        </div>
      </div>

      {/* Answer */}
      <p className="text-ovara-gray leading-relaxed mb-4 text-lg">
        {aiAnswer.answer}
      </p>

      {/* Sources */}
      {aiAnswer.sources.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-ovara-gray">Sources:</span>
            <div className="flex gap-2">
              {aiAnswer.sources.map((source, i) => (
                <a
                  key={i}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ovara-accent hover:text-ovara-light text-sm font-medium transition-colors"
                  title={source.title}
                >
                  [{i + 1}]
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      <div className="mt-4 flex items-center gap-4">
        <span className="text-sm text-gray-500">Was this helpful?</span>
        <button className="text-xl hover:scale-110 transition-transform">👍</button>
        <button className="text-xl hover:scale-110 transition-transform">👎</button>
      </div>
    </div>
  );
}
