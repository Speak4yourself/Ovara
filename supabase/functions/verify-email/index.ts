/**
 * Email Verification System
 * Handles email verification tokens and confirmation
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import * as crypto from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// SendGrid configuration
const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')!
const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') || 'noreply@ovara.app'
const fromName = Deno.env.get('SENDGRID_FROM_NAME') || 'Ovara'
const appUrl = Deno.env.get('VITE_APP_URL') || 'https://ovara.app'

interface EmailVerificationRequest {
  action: 'send' | 'verify' | 'resend'
  email?: string
  token?: string
  userId?: string
}

/**
 * Generate secure verification token
 */
async function generateVerificationToken(): Promise<string> {
  const buffer = new Uint8Array(32)
  crypto.getRandomValues(buffer)

  // Convert to URL-safe base64
  const token = btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return token
}

/**
 * Hash token for secure storage
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Send verification email via SendGrid
 */
async function sendVerificationEmail(email: string, token: string, userName?: string): Promise<boolean> {
  const verificationUrl = `${appUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  const emailData = {
    personalizations: [{
      to: [{ email }],
      dynamic_template_data: {
        user_name: userName || 'User',
        verification_url: verificationUrl,
        app_name: 'Ovara',
        support_email: 'support@ovara.app'
      }
    }],
    from: {
      email: fromEmail,
      name: fromName
    },
    template_id: 'd-email-verification', // SendGrid template ID
    // Fallback content if template fails
    subject: 'Verify Your Email - Ovara',
    content: [{
      type: 'text/html',
      value: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Ovara!</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 20px;">Verify Your Email Address</h2>

            <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 20px;">
              Hi ${userName || 'there'},
            </p>

            <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin-bottom: 30px;">
              Thanks for signing up! Please click the button below to verify your email address and activate your account.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; display: inline-block;">
                Verify Email Address
              </a>
            </div>

            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0;">
                <strong>Can't click the button?</strong> Copy and paste this link into your browser:
              </p>
              <p style="color: #8b5cf6; font-size: 12px; word-break: break-all; margin: 10px 0 0 0;">
                ${verificationUrl}
              </p>
            </div>

            <p style="color: #9ca3af; font-size: 14px; line-height: 20px; margin-top: 30px;">
              This verification link will expire in 24 hours. If you didn't create an account with Ovara, you can safely ignore this email.
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 5px 0;">© 2024 Ovara. All rights reserved.</p>
            <p style="margin: 5px 0;">
              <a href="${appUrl}/privacy" style="color: #8b5cf6; text-decoration: none;">Privacy Policy</a> •
              <a href="${appUrl}/terms" style="color: #8b5cf6; text-decoration: none;">Terms of Service</a>
            </p>
          </div>
        </div>
      `
    }]
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('SendGrid error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return false
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST'
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const request: EmailVerificationRequest = await req.json()

    switch (request.action) {
      case 'send':
      case 'resend': {
        if (!request.email || !request.userId) {
          return new Response(
            JSON.stringify({ error: 'Email and userId are required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }

        // Check if user exists and is not already verified
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, email, email_verified, email_verified_at, raw_user_meta_data')
          .eq('id', request.userId)
          .single()

        if (userError || !user) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          )
        }

        if (user.email_verified && request.action === 'send') {
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Email already verified'
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        }

        // Check for recent verification attempts (rate limiting)
        const { data: recentTokens } = await supabase
          .from('email_verification_tokens')
          .select('created_at')
          .eq('user_id', request.userId)
          .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
          .order('created_at', { ascending: false })

        if (recentTokens && recentTokens.length >= 3) {
          return new Response(
            JSON.stringify({
              error: 'Too many verification attempts. Please wait a minute before trying again.'
            }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          )
        }

        // Generate and store verification token
        const token = await generateVerificationToken()
        const hashedToken = await hashToken(token)
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        // Invalidate old tokens
        await supabase
          .from('email_verification_tokens')
          .update({ used: true })
          .eq('user_id', request.userId)
          .eq('used', false)

        // Store new token
        const { error: tokenError } = await supabase
          .from('email_verification_tokens')
          .insert({
            user_id: request.userId,
            email: request.email,
            token_hash: hashedToken,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString()
          })

        if (tokenError) {
          console.error('Failed to store verification token:', tokenError)
          return new Response(
            JSON.stringify({ error: 'Failed to create verification token' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }

        // Send verification email
        const userName = user.raw_user_meta_data?.full_name || user.email.split('@')[0]
        const emailSent = await sendVerificationEmail(request.email, token, userName)

        if (!emailSent) {
          return new Response(
            JSON.stringify({ error: 'Failed to send verification email' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }

        // Log email event
        await supabase
          .from('email_logs')
          .insert({
            user_id: request.userId,
            email_type: 'verification',
            recipient: request.email,
            status: 'sent',
            sent_at: new Date().toISOString()
          })

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Verification email sent successfully'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }

      case 'verify': {
        if (!request.token || !request.email) {
          return new Response(
            JSON.stringify({ error: 'Token and email are required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }

        // Hash the provided token
        const hashedToken = await hashToken(request.token)

        // Find valid token
        const { data: tokenData, error: tokenError } = await supabase
          .from('email_verification_tokens')
          .select('*')
          .eq('token_hash', hashedToken)
          .eq('email', request.email)
          .eq('used', false)
          .gte('expires_at', new Date().toISOString())
          .single()

        if (tokenError || !tokenData) {
          return new Response(
            JSON.stringify({ error: 'Invalid or expired verification token' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }

        // Mark token as used
        await supabase
          .from('email_verification_tokens')
          .update({
            used: true,
            used_at: new Date().toISOString()
          })
          .eq('id', tokenData.id)

        // Update user as verified
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email_verified: true,
            email_verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', tokenData.user_id)

        if (updateError) {
          console.error('Failed to update user verification status:', updateError)
          return new Response(
            JSON.stringify({ error: 'Failed to verify email' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }

        // Log verification event
        await supabase
          .from('audit_logs')
          .insert({
            user_id: tokenData.user_id,
            action: 'email_verified',
            details: { email: request.email },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            user_agent: req.headers.get('user-agent'),
            created_at: new Date().toISOString()
          })

        // Check if user has a free trial or needs to select a plan
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', tokenData.user_id)
          .single()

        let nextStep = 'dashboard'

        if (!subscription) {
          // Create free tier subscription
          await supabase
            .from('user_subscriptions')
            .insert({
              user_id: tokenData.user_id,
              tier: 'free',
              status: 'active',
              created_at: new Date().toISOString()
            })

          nextStep = 'onboarding'
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Email verified successfully',
            nextStep,
            userId: tokenData.user_id
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Email verification error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})