import React from 'react'
import PropTypes from 'prop-types'
import { Check, X } from 'lucide-react'

/**
 * Usage Limit Modal Component
 * Displays when users hit their tier limits with upgrade options
 */
function UsageLimitModal({ isOpen, onClose, feature, onUpgrade }) {
  if (!isOpen) return null

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 9.99,
      period: 'month',
      features: [
        '50,000 words per month',
        'Basic AI scan',
        'Basic humanization',
        'Essay analyzer',
        'Citation generator',
        'Chrome extension',
        'Email support',
      ],
      color: 'from-blue-500 to-cyan-500',
      buttonColor: 'bg-blue-500 hover:bg-blue-400',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 19.99,
      period: 'month',
      popular: true,
      features: [
        '150,000 words per month',
        'Advanced AI scan',
        'Advanced humanization',
        'Plagiarism scan',
        'Writing feedback',
        'AI vocabulary',
        'Find sources',
        'Chrome extension',
        'Priority support',
      ],
      color: 'from-purple-500 to-pink-500',
      buttonColor: 'bg-purple-500 hover:bg-purple-400',
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 29.99,
      period: 'month',
      features: [
        '300,000 words per month',
        'Advanced AI scan',
        'Advanced humanization',
        'Plagiarism scan',
        'Writing feedback',
        'AI vocabulary',
        'Find sources',
        'Chrome extension',
        'FERPA Compliant',
        'Check Bibliographies',
        'Grade predictor',
        'Argument heatmap',
        'Readability sculptor',
        '24/7 Priority support',
      ],
      color: 'from-amber-500 to-orange-500',
      buttonColor: 'bg-amber-500 hover:bg-amber-400',
    },
  ]

  const getFeatureName = (feature) => {
    const featureNames = {
      aiDetection: 'Advanced AI Scans',
      humanization: 'Advanced Humanizations',
      plagiarism: 'Plagiarism Scans',
      gradePredictor: 'Grade Predictions',
      analyzer: 'Essay Analysis',
    }
    return featureNames[feature] || 'Premium Features'
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl border border-white/20 max-w-6xl w-full my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Header */}
        <div className="text-center pt-12 pb-8 px-6">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-4xl font-bold text-white mb-3">
            You've reached the limit of your free {getFeatureName(feature)}
          </h2>
          <p className="text-xl text-white/70">
            Upgrade to get even more!
          </p>
          <p className="text-lg text-purple-300 mt-2">
            Join over <span className="font-bold">6 million users</span> with Premium
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="px-6 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border ${
                  plan.popular
                    ? 'border-purple-500 bg-white/10'
                    : 'border-white/20 bg-white/5'
                } p-6 flex flex-col`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className={`text-2xl font-bold bg-gradient-to-r ${plan.color} bg-clip-text text-transparent mb-2`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-white/60">/{plan.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="flex-grow mb-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-white/80">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Upgrade Button */}
                <button
                  onClick={() => onUpgrade(plan.id)}
                  className={`w-full py-3 px-4 rounded-lg ${plan.buttonColor} text-white font-semibold transition transform hover:scale-105 active:scale-95`}
                >
                  Upgrade to {plan.name}
                </button>
              </div>
            ))}
          </div>

          {/* More Options */}
          <div className="text-center mt-8">
            <button
              onClick={onClose}
              className="text-purple-300 hover:text-purple-200 text-sm font-medium underline"
            >
              More upgrade options
            </button>
          </div>

          {/* Money Back Guarantee */}
          <div className="text-center mt-6 text-white/50 text-xs">
            <p>✓ 30-day money-back guarantee</p>
            <p className="mt-1">✓ Cancel anytime</p>
          </div>
        </div>
      </div>
    </div>
  )
}

UsageLimitModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  feature: PropTypes.oneOf(['aiDetection', 'humanization', 'plagiarism', 'gradePredictor', 'analyzer']),
  onUpgrade: PropTypes.func.isRequired,
}

export default UsageLimitModal
