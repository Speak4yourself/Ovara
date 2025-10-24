import React from 'react';
import { AlertTriangle, TrendingUp, Zap, X } from 'lucide-react';

/**
 * Usage Limit Warning Component
 * Shows when user is approaching or has hit their usage limit
 *
 * @param {object} usage - Current usage stats
 * @param {string} feature - Feature name
 * @param {boolean} isPremium - Whether this is premium usage
 * @param {string} tier - Current user tier
 * @param {function} onClose - Close handler
 * @param {function} onUpgrade - Upgrade handler (optional)
 */
export default function UsageLimitWarning({ usage, feature, isPremium, tier, onClose, onUpgrade }) {

  if (!usage) return null;

  // Calculate usage stats
  const getUsageStats = () => {
    let used = 0;
    let limit = 0;
    let featureName = '';

    if (isPremium) {
      switch (feature) {
        case 'ai_detection':
          used = usage.premium_detections_used || 0;
          limit = usage.premium_detections_limit || 0;
          featureName = 'Premium AI Detections';
          break;
        case 'essay_analysis':
          used = usage.premium_analyses_used || 0;
          limit = usage.premium_analyses_limit || 0;
          featureName = 'Premium Essay Analyses';
          break;
        case 'humanization':
          used = usage.premium_humanizations_used || 0;
          limit = usage.premium_humanizations_limit || 0;
          featureName = 'Premium Humanizations';
          break;
        case 'essay_generation':
          used = usage.premium_essays_used || 0;
          limit = usage.premium_essays_limit || 0;
          featureName = 'Premium Essays';
          break;
      }
    } else {
      switch (feature) {
        case 'citation':
          used = usage.citations_used || 0;
          limit = usage.citations_limit || 0;
          featureName = 'Citations';
          break;
        case 'ai_detection':
          used = usage.ai_detections_used || 0;
          limit = usage.ai_detections_limit || 0;
          featureName = 'AI Detections';
          break;
        case 'outline':
          used = usage.outlines_used || 0;
          limit = usage.outlines_limit || 0;
          featureName = 'Outlines';
          break;
        case 'essay_analysis':
          used = usage.essay_analyses_used || 0;
          limit = usage.essay_analyses_limit || 0;
          featureName = 'Essay Analyses';
          break;
        case 'humanization':
          used = usage.humanizations_used || 0;
          limit = usage.humanizations_limit || 0;
          featureName = 'Humanizations';
          break;
        case 'essay_generation':
          used = usage.essay_generations_used || 0;
          limit = usage.essay_generations_limit || 0;
          featureName = 'Essay Generations';
          break;
      }
    }

    const remaining = Math.max(0, limit - used);
    const percentage = limit > 0 ? (used / limit) * 100 : 0;

    return { used, limit, remaining, percentage, featureName };
  };

  const stats = getUsageStats();

  // Don't show if unlimited (limit is 999999 for premium tier)
  if (stats.limit >= 999999) return null;

  // Determine warning level
  const isLimitHit = stats.remaining === 0;
  const isWarning = stats.percentage >= 80 && !isLimitHit;

  // Don't show if below 80% usage
  if (!isLimitHit && !isWarning) return null;

  // Get upgrade info
  const getUpgradeInfo = () => {
    if (tier === 'free') {
      return {
        nextTier: 'Basic',
        price: '$9.99/month',
        benefits: isPremium
          ? ['Try premium AI models', 'Unlimited basic usage']
          : ['Unlimited basic usage', 'Try premium AI models (limited)']
      };
    } else if (tier === 'basic') {
      return {
        nextTier: 'Pro',
        price: '$24.99/month',
        benefits: [
          '10x more premium AI usage',
          'Detailed sentence analysis',
          'Multiple AI detectors'
        ]
      };
    } else if (tier === 'pro') {
      return {
        nextTier: 'Premium',
        price: '$49.99/month',
        benefits: [
          'Unlimited premium AI',
          'Maximum quality always',
          'No limits ever'
        ]
      };
    }
    return null;
  };

  const upgradeInfo = getUpgradeInfo();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Open Stripe checkout or show upgrade modal
      console.log('Upgrade to:', upgradeInfo?.nextTier);
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 max-w-md z-50 ${
        isLimitHit
          ? 'bg-gradient-to-br from-red-500 to-red-600'
          : 'bg-gradient-to-br from-yellow-500 to-orange-500'
      } text-white rounded-xl shadow-2xl overflow-hidden animate-slide-in`}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
      >
        <X size={20} />
      </button>

      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${isLimitHit ? 'bg-red-400/30' : 'bg-yellow-400/30'}`}>
            {isLimitHit ? <AlertTriangle size={24} /> : <TrendingUp size={24} />}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">
              {isLimitHit ? 'Limit Reached!' : 'Almost at your limit'}
            </h3>
            <p className="text-white/90 text-sm mt-1">
              {isLimitHit
                ? `You've used all ${stats.limit} ${stats.featureName} this month`
                : `${stats.remaining} ${stats.featureName} remaining`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span>{stats.used} used</span>
            <span>{stats.limit} limit</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.percentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {upgradeInfo && (
        <div className="bg-black/20 p-6 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-yellow-300" />
            <h4 className="font-semibold">Upgrade to {upgradeInfo.nextTier}</h4>
          </div>

          <ul className="space-y-1 mb-4 text-sm">
            {upgradeInfo.benefits.map((benefit, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                {benefit}
              </li>
            ))}
          </ul>

          <button
            onClick={handleUpgrade}
            className="w-full bg-white text-gray-900 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Upgrade Now - {upgradeInfo.price}
          </button>
        </div>
      )}
    </div>
  );
}

// Add animation CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-in {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`;
document.head.appendChild(style);
