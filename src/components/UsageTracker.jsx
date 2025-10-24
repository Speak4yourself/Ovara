import React, { useState, useEffect } from 'react';
import { BarChart3, Sparkles, Zap } from 'lucide-react';
import { getCurrentUsage, getFeatureUsage, getTierLimits } from '../utils/usageTracking';

/**
 * Usage Tracker Component
 * Displays current usage statistics for the user
 *
 * @param {string} tier - Current user tier
 * @param {string} feature - Specific feature to show (optional, shows all if not provided)
 * @param {boolean} compact - Show compact view
 */
export default function UsageTracker({ tier = 'free', feature = null, compact = false }) {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, [tier]);

  const loadUsage = async () => {
    try {
      setLoading(true);
      const data = await getCurrentUsage();
      setUsage(data);
    } catch (error) {
      console.error('Error loading usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (!usage) return null;

  // Features to display
  const features = [
    { key: 'citation', name: 'Citations', icon: '📚', premium: false },
    { key: 'ai_detection', name: 'AI Detections', icon: '🔍', premium: false },
    { key: 'outline', name: 'Outlines', icon: '📝', premium: false },
    { key: 'essay_analysis', name: 'Essay Analyses', icon: '📊', premium: false },
    { key: 'humanization', name: 'Humanizations', icon: '✨', premium: false },
    { key: 'essay_generation', name: 'Essay Generations', icon: '📄', premium: false }
  ];

  const premiumFeatures = [
    { key: 'ai_detection', name: 'Premium AI Detections', icon: '🔍', premium: true },
    { key: 'essay_analysis', name: 'Premium Analyses', icon: '📊', premium: true },
    { key: 'humanization', name: 'Premium Humanizations', icon: '✨', premium: true },
    { key: 'essay_generation', name: 'Premium Essays', icon: '📄', premium: true }
  ];

  // Filter features if specific feature requested
  const displayFeatures = feature
    ? features.filter(f => f.key === feature)
    : features;

  const displayPremiumFeatures = feature
    ? premiumFeatures.filter(f => f.key === feature)
    : premiumFeatures;

  // Only show premium features for paid tiers
  const showPremium = ['basic', 'pro', 'premium'].includes(tier);

  // Compact view for single feature
  if (compact && feature) {
    const featureData = features.find(f => f.key === feature);
    if (!featureData) return null;

    const stats = getFeatureUsage(usage, feature, false);

    // Don't show if unlimited
    if (tier !== 'free') return null;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{featureData.icon}</span>
            <span className="font-medium text-sm text-gray-700">
              {stats.used} / {stats.limit} {featureData.name}
            </span>
          </div>
          {stats.remaining === 0 && (
            <span className="text-xs text-red-600 font-semibold">Limit Reached</span>
          )}
        </div>
        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              stats.percentage >= 100
                ? 'bg-red-500'
                : stats.percentage >= 80
                ? 'bg-yellow-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(100, stats.percentage)}%` }}
          />
        </div>
      </div>
    );
  }

  // Full usage tracker view
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
            <BarChart3 className="text-white" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Usage This Month</h3>
            <p className="text-sm text-gray-500">
              {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier
            </p>
          </div>
        </div>
      </div>

      {/* Basic usage (Free tier or cheap models) */}
      {tier === 'free' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 mb-3">
            <Zap size={16} />
            <span>Basic AI Usage</span>
          </div>
          {displayFeatures.map((feat) => {
            const stats = getFeatureUsage(usage, feat.key, false);
            return (
              <UsageBar
                key={feat.key}
                icon={feat.icon}
                name={feat.name}
                used={stats.used}
                limit={stats.limit}
                percentage={stats.percentage}
              />
            );
          })}
        </div>
      )}

      {/* Premium usage (Basic/Pro/Premium tiers) */}
      {showPremium && (
        <div className="mt-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 mb-3">
            <Sparkles size={16} />
            <span>Premium AI Usage</span>
          </div>
          {displayPremiumFeatures.map((feat) => {
            const stats = getFeatureUsage(usage, feat.key, true);
            // Skip if limit is unlimited (999999)
            if (stats.limit >= 999999) {
              return (
                <div
                  key={feat.key}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 mb-2"
                >
                  <span className="text-lg">{feat.icon}</span>
                  <span className="text-sm font-medium text-gray-700 flex-1">
                    {feat.name}
                  </span>
                  <span className="text-xs font-semibold text-purple-600 px-2 py-1 bg-purple-100 rounded-full">
                    Unlimited
                  </span>
                </div>
              );
            }
            return (
              <UsageBar
                key={feat.key}
                icon={feat.icon}
                name={feat.name}
                used={stats.used}
                limit={stats.limit}
                percentage={stats.percentage}
                premium
              />
            );
          })}
        </div>
      )}

      {/* Unlimited message for paid tiers on basic features */}
      {tier !== 'free' && (
        <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">
            ✨ You have unlimited access to all basic AI features
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Individual usage bar component
 */
function UsageBar({ icon, name, used, limit, percentage, premium = false }) {
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-medium text-gray-700">{name}</span>
        </div>
        <span className={`text-xs font-semibold ${
          isAtLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-gray-600'
        }`}>
          {used} / {limit}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isAtLimit
              ? 'bg-red-500'
              : isNearLimit
              ? 'bg-yellow-500'
              : premium
              ? 'bg-gradient-to-r from-purple-500 to-pink-500'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500'
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
}
