import { supabase } from '../supabaseClient';

/**
 * Get current usage for the authenticated user
 * @returns {Promise<object>} Usage tracking object
 */
export async function getCurrentUsage() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's current tier
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single();

    const tier = subscription?.tier?.toLowerCase() || 'free';

    // Call function to get or create usage period
    const { data, error } = await supabase.rpc('get_or_create_usage_period', {
      p_user_id: user.id,
      p_tier: tier
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting usage:', error);
    throw error;
  }
}

/**
 * Check if user can use a feature
 * @param {string} feature - Feature name (citation, ai_detection, outline, essay_analysis, humanization, essay_generation)
 * @param {boolean} isPremium - Whether using premium model
 * @returns {Promise<boolean>} Whether user can use the feature
 */
export async function canUseFeature(feature, isPremium = false) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's current tier
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single();

    const tier = subscription?.tier?.toLowerCase() || 'free';

    // Call function to check if user can use feature
    const { data, error } = await supabase.rpc('can_use_feature', {
      p_user_id: user.id,
      p_tier: tier,
      p_feature: feature,
      p_is_premium: isPremium
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error checking feature usage:', error);
    return false;
  }
}

/**
 * Increment usage counter for a feature
 * @param {string} feature - Feature name
 * @param {boolean} isPremium - Whether using premium model
 * @returns {Promise<object>} Updated usage object
 */
export async function incrementUsage(feature, isPremium = false) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's current tier
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single();

    const tier = subscription?.tier?.toLowerCase() || 'free';

    // Call function to increment usage
    const { data, error } = await supabase.rpc('increment_usage', {
      p_user_id: user.id,
      p_tier: tier,
      p_feature: feature,
      p_is_premium: isPremium
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error incrementing usage:', error);
    throw error;
  }
}

/**
 * Get usage stats for a specific feature
 * @param {object} usage - Usage tracking object
 * @param {string} feature - Feature name
 * @param {boolean} isPremium - Whether checking premium usage
 * @returns {object} { used, limit, remaining, percentage }
 */
export function getFeatureUsage(usage, feature, isPremium = false) {
  if (!usage) return { used: 0, limit: 0, remaining: 0, percentage: 0 };

  let used = 0;
  let limit = 0;

  if (isPremium) {
    switch (feature) {
      case 'ai_detection':
        used = usage.premium_detections_used || 0;
        limit = usage.premium_detections_limit || 0;
        break;
      case 'essay_analysis':
        used = usage.premium_analyses_used || 0;
        limit = usage.premium_analyses_limit || 0;
        break;
      case 'humanization':
        used = usage.premium_humanizations_used || 0;
        limit = usage.premium_humanizations_limit || 0;
        break;
      case 'essay_generation':
        used = usage.premium_essays_used || 0;
        limit = usage.premium_essays_limit || 0;
        break;
    }
  } else {
    switch (feature) {
      case 'citation':
        used = usage.citations_used || 0;
        limit = usage.citations_limit || 0;
        break;
      case 'ai_detection':
        used = usage.ai_detections_used || 0;
        limit = usage.ai_detections_limit || 0;
        break;
      case 'outline':
        used = usage.outlines_used || 0;
        limit = usage.outlines_limit || 0;
        break;
      case 'essay_analysis':
        used = usage.essay_analyses_used || 0;
        limit = usage.essay_analyses_limit || 0;
        break;
      case 'humanization':
        used = usage.humanizations_used || 0;
        limit = usage.humanizations_limit || 0;
        break;
      case 'essay_generation':
        used = usage.essay_generations_used || 0;
        limit = usage.essay_generations_limit || 0;
        break;
    }
  }

  const remaining = Math.max(0, limit - used);
  const percentage = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  return { used, limit, remaining, percentage };
}

/**
 * Get tier limits for upgrade prompts
 * @param {string} tier - Current tier
 * @returns {object} Limit information for each tier
 */
export function getTierLimits(tier) {
  const limits = {
    free: {
      name: 'Free',
      citations: 10,
      ai_detections: 20,
      outlines: 20,
      essay_analyses: 12,
      humanizations: 12,
      essay_generations: 12,
      premium: false
    },
    basic: {
      name: 'Basic',
      citations: '∞',
      ai_detections: '∞',
      outlines: '∞',
      essay_analyses: '∞',
      humanizations: '∞',
      essay_generations: '∞',
      premium_detections: 10,
      premium_analyses: 5,
      premium_humanizations: 5,
      premium_essays: 3
    },
    pro: {
      name: 'Pro',
      citations: '∞',
      ai_detections: '∞',
      outlines: '∞',
      essay_analyses: '∞',
      humanizations: '∞',
      essay_generations: '∞',
      premium_detections: 100,
      premium_analyses: 50,
      premium_humanizations: 50,
      premium_essays: 30
    },
    premium: {
      name: 'Premium',
      citations: '∞',
      ai_detections: '∞',
      outlines: '∞',
      essay_analyses: '∞',
      humanizations: '∞',
      essay_generations: '∞',
      premium_detections: '∞',
      premium_analyses: '∞',
      premium_humanizations: '∞',
      premium_essays: '∞'
    }
  };

  return limits[tier] || limits.free;
}

/**
 * Get next tier upgrade info
 * @param {string} currentTier - Current subscription tier
 * @returns {object} Next tier information
 */
export function getNextTierInfo(currentTier) {
  const upgrades = {
    free: {
      tier: 'basic',
      name: 'Basic',
      price: '$9.99/month',
      benefits: [
        'Unlimited basic AI usage',
        'Try premium AI models (limited)',
        'Export bibliography',
        '25 saved essays'
      ]
    },
    basic: {
      tier: 'pro',
      name: 'Pro',
      price: '$24.99/month',
      benefits: [
        '10x more premium AI usage',
        'Detailed sentence analysis',
        'Multiple AI detectors',
        'Writing style matching',
        'Priority queue'
      ]
    },
    pro: {
      tier: 'premium',
      name: 'Premium',
      price: '$49.99/month',
      benefits: [
        'Unlimited premium AI for everything',
        'Maximum quality always',
        'Unlimited storage',
        'Priority processing'
      ]
    }
  };

  return upgrades[currentTier] || null;
}
