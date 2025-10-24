# Supabase Edge Functions - Implementation Guide

This document outlines the Edge Functions that need to be created to support the new features.

---

## 📋 Required Edge Functions

### 1. Essay Generator (`generate-essay`)

**Path:** `supabase/functions/generate-essay/index.ts`

**Request Body:**
```typescript
{
  title: string,
  prompt: string,
  theme: string,
  format: 'MLA' | 'APA' | 'Chicago' | 'Harvard',
  writingLevel: 'elementary' | 'middle-school' | 'high-school' | 'college' | 'graduate',
  className: string,
  studentName: string,
  citations: Array<Citation>,
  customSources: Array<string>,
  wordCount: number,
  tier: 'free' | 'basic' | 'pro' | 'premium'
}
```

**Response:**
```typescript
{
  essay: string,
  worksCited: string
}
```

---

### 2. Tone Mapper (`tone-mapper`)

**Path:** `supabase/functions/tone-mapper/index.ts`

**Request Body:**
```typescript
{
  text: string,
  targetTone: 'professional' | 'casual' | 'academic' | 'friendly' | 'confident' | 'empathetic' | 'persuasive' | 'concise',
  tier: 'free' | 'basic' | 'pro' | 'premium'
}
```

**Response:**
```typescript
{
  mappedText: string
}
```

**Logic:**
- Use GPT/Claude to rewrite text in target tone
- Maintain original meaning and key points
- Adjust vocabulary, sentence structure, formality
- Free tier: 500 words max
- Basic: 1000 words max
- Pro/Premium: Unlimited

---

### 3. Readability Sculptor (`readability-sculptor`)

**Path:** `supabase/functions/readability-sculptor/index.ts`

**Request Body:**
```typescript
{
  text: string,
  targetLevel: 'elementary' | 'middle-school' | 'high-school' | 'college' | 'graduate' | 'professional',
  tier: 'free' | 'basic' | 'pro' | 'premium'
}
```

**Response:**
```typescript
{
  sculptedText: string
}
```

**Logic:**
- Adjust sentence length and complexity
- Replace complex words with simpler alternatives (or vice versa)
- Aim for target Flesch-Kincaid grade level:
  - Elementary: Grade 3-5
  - Middle School: Grade 6-8
  - High School: Grade 9-12
  - College: Grade 13-16
  - Graduate: Grade 17+
  - Professional: Maintain technical terminology

---

### 4. Idea-to-Outline AI (`idea-to-outline`)

**Path:** `supabase/functions/idea-to-outline/index.ts`

**Request Body:**
```typescript
{
  idea: string,
  outlineType: 'essay' | 'research-paper' | 'presentation' | 'article' | 'speech' | 'story',
  detailLevel: 'brief' | 'medium' | 'detailed',
  tier: 'free' | 'basic' | 'pro' | 'premium'
}
```

**Response:**
```typescript
{
  outline: {
    title: string,
    sections: Array<{
      heading: string,
      subpoints?: Array<{
        text: string,
        details?: Array<string>
      }>
    }>,
    conclusion?: string
  }
}
```

**Logic:**
- Analyze the idea/topic
- Create hierarchical structure based on outline type
- Detail level determines depth:
  - Brief: Main sections only
  - Medium: Sections + subpoints
  - Detailed: Sections + subpoints + details
- Different structures for each outline type:
  - Essay: Intro, Body (3-5 points), Conclusion
  - Research Paper: Abstract, Intro, Methods, Results, Discussion, Conclusion
  - Presentation: Opening, Key Points, Closing
  - Article: Hook, Main Points, Conclusion/CTA
  - Speech: Attention Getter, Main Points, Call to Action
  - Story: Setup, Rising Action, Climax, Falling Action, Resolution

---

### 5. Essay Grade Predictor (`grade-predictor`)

**Path:** `supabase/functions/grade-predictor/index.ts`

**Request Body:**
```typescript
{
  essayText: string,
  rubric?: string,
  gradeLevel: 'middle-school' | 'high-school' | 'college' | 'graduate',
  tier: 'free' | 'basic' | 'pro' | 'premium'
}
```

**Response:**
```typescript
{
  prediction: {
    score: number,           // 0-100
    confidence: number,      // 0-100
    breakdown: Array<{
      name: string,
      score: number
    }>,
    strengths: Array<string>,
    improvements: Array<string>,
    feedback: string
  }
}
```

**Analysis Categories:**
```typescript
const categories = [
  'Content & Ideas',
  'Organization & Structure',
  'Grammar & Mechanics',
  'Vocabulary & Style',
  'Thesis & Arguments',
  'Evidence & Support'
]
```

**Logic:**
- Analyze essay quality across multiple dimensions
- Consider grade level expectations
- If rubric provided, weight categories accordingly
- Provide specific, actionable feedback
- Confidence based on essay length and clarity

---

### 6. Argument Heatmap (`argument-heatmap`)

**Path:** `supabase/functions/argument-heatmap/index.ts`

**Request Body:**
```typescript
{
  essayText: string,
  tier: 'free' | 'basic' | 'pro' | 'premium'
}
```

**Response:**
```typescript
{
  heatmap: {
    segments: Array<{
      text: string,
      type: 'Thesis' | 'Argument' | 'Evidence' | 'Counterargument' | 'Conclusion' | 'Transition',
      strength: number,    // 0-100
      feedback?: string
    }>,
    overallStrength: number,
    recommendations: Array<string>
  }
}
```

**Logic:**
- Break essay into logical segments (paragraphs/arguments)
- Classify each segment type
- Analyze strength based on:
  - Clarity of claim
  - Quality of evidence
  - Logical reasoning
  - Connection to thesis
  - Citation/source quality
- Strength scoring:
  - 80-100: Very Strong (well-supported with evidence)
  - 60-79: Strong (good support)
  - 40-59: Moderate (some support, needs improvement)
  - 20-39: Weak (little support)
  - 0-19: Very Weak (unsupported claims)
- Provide specific feedback for weak segments

---

## 🔧 Implementation Notes

### Common Requirements

All Edge Functions should:

1. **Authentication**: Verify user via JWT token
2. **Rate Limiting**: Implement based on tier
3. **Error Handling**: Return proper error codes and messages
4. **Logging**: Log usage for analytics
5. **Tier Restrictions**:
   - Free: Basic features, lower limits
   - Basic: Standard features, moderate limits
   - Pro: Advanced features, high limits
   - Premium: All features, no limits

### Rate Limits (Suggested)

```typescript
const rateLimits = {
  free: {
    requestsPerDay: 10,
    maxTextLength: 500
  },
  basic: {
    requestsPerDay: 50,
    maxTextLength: 1000
  },
  pro: {
    requestsPerDay: 200,
    maxTextLength: 5000
  },
  premium: {
    requestsPerDay: 1000,
    maxTextLength: 10000
  }
}
```

### AI Model Selection

Recommended models:
- **GPT-4** or **Claude 3 Sonnet**: For complex tasks (Grade Predictor, Argument Heatmap)
- **GPT-3.5-turbo** or **Claude 3 Haiku**: For simpler tasks (Tone Mapper, basic outlines)

### Database Logging

Consider logging usage for analytics:
```sql
CREATE TABLE edge_function_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  function_name TEXT NOT NULL,
  tier TEXT NOT NULL,
  input_length INTEGER,
  output_length INTEGER,
  processing_time INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📝 Example Implementation (Tone Mapper)

```typescript
// supabase/functions/tone-mapper/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const openAIKey = Deno.env.get('OPENAI_API_KEY')

serve(async (req) => {
  try {
    // Get request body
    const { text, targetTone, tier } = await req.json()

    // Verify authentication
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check tier limits
    const maxLength = tier === 'free' ? 500 : tier === 'basic' ? 1000 : 10000
    if (text.split(/\s+/).length > maxLength) {
      return new Response(JSON.stringify({
        error: `Text exceeds ${maxLength} word limit for ${tier} tier`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a tone adjustment expert. Rewrite the given text in a ${targetTone} tone while maintaining the original meaning and key points.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    const mappedText = data.choices[0].message.content

    return new Response(JSON.stringify({ mappedText }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

---

## 🚀 Deployment

To deploy all Edge Functions:

```bash
# Deploy individual function
supabase functions deploy tone-mapper

# Deploy all functions
supabase functions deploy generate-essay
supabase functions deploy tone-mapper
supabase functions deploy readability-sculptor
supabase functions deploy idea-to-outline
supabase functions deploy grade-predictor
supabase functions deploy argument-heatmap
```

---

## 🔐 Environment Variables

Required environment variables:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Set in Supabase Dashboard under Project Settings → Edge Functions → Secrets

---

## ✅ Testing Checklist

For each Edge Function:
- [ ] Handles authentication correctly
- [ ] Enforces tier-based rate limits
- [ ] Returns proper error messages
- [ ] Validates input parameters
- [ ] Processes text correctly
- [ ] Returns expected response format
- [ ] Logs usage to database
- [ ] Handles timeouts gracefully
- [ ] Works with all tier levels
- [ ] Error responses have correct status codes

---

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Deno Deploy Documentation](https://deno.com/deploy/docs)
