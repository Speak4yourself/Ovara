/**
 * Session Management System
 * Handles JWT tokens, refresh tokens, and session persistence
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import * as jose from 'https://deno.land/x/jose@v4.14.4/index.ts'

export interface SessionData {
  userId: string
  email: string
  tier: string
  permissions: string[]
  metadata?: Record<string, any>
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
  refreshExpiresIn: number
}

export interface SessionInfo {
  id: string
  userId: string
  deviceInfo: DeviceInfo
  createdAt: Date
  lastActivity: Date
  expiresAt: Date
  isActive: boolean
}

export interface DeviceInfo {
  userAgent: string
  ip: string
  browser?: string
  os?: string
  device?: string
  location?: {
    country?: string
    city?: string
  }
}

/**
 * Session Manager Class
 */
export class SessionManager {
  private supabase: any
  private jwtSecret: Uint8Array
  private refreshSecret: Uint8Array
  private accessTokenTTL = 15 * 60 // 15 minutes
  private refreshTokenTTL = 30 * 24 * 60 * 60 // 30 days
  private maxSessions = 5 // Maximum concurrent sessions per user

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    jwtSecret: string,
    refreshSecret: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.jwtSecret = new TextEncoder().encode(jwtSecret)
    this.refreshSecret = new TextEncoder().encode(refreshSecret)
  }

  /**
   * Create new session for user
   */
  async createSession(
    userId: string,
    deviceInfo: DeviceInfo,
    remember: boolean = false
  ): Promise<TokenPair | null> {
    try {
      // Get user data
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('id, email, raw_user_meta_data')
        .eq('id', userId)
        .single()

      if (userError || !user) {
        console.error('User not found:', userError)
        return null
      }

      // Get user subscription/tier
      const { data: subscription } = await this.supabase
        .from('user_subscriptions')
        .select('tier, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      const tier = subscription?.tier || 'free'

      // Get user permissions
      const permissions = await this.getUserPermissions(userId, tier)

      // Create session data
      const sessionData: SessionData = {
        userId: user.id,
        email: user.email,
        tier,
        permissions,
        metadata: {
          name: user.raw_user_meta_data?.full_name,
          avatar: user.raw_user_meta_data?.avatar_url
        }
      }

      // Check session limit
      await this.enforceSessionLimit(userId)

      // Generate tokens
      const tokens = await this.generateTokenPair(sessionData, remember)

      // Store session in database
      const sessionId = crypto.randomUUID()
      const now = new Date()
      const expiresAt = new Date(now.getTime() + (remember ? this.refreshTokenTTL : this.accessTokenTTL) * 1000)

      const { error: sessionError } = await this.supabase
        .from('user_sessions')
        .insert({
          id: sessionId,
          user_id: userId,
          refresh_token_hash: await this.hashToken(tokens.refreshToken),
          device_info: deviceInfo,
          created_at: now.toISOString(),
          last_activity: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
          remember_me: remember
        })

      if (sessionError) {
        console.error('Failed to store session:', sessionError)
        return null
      }

      // Log session creation
      await this.logSessionEvent(userId, 'session_created', deviceInfo)

      return tokens
    } catch (error) {
      console.error('Error creating session:', error)
      return null
    }
  }

  /**
   * Generate JWT token pair
   */
  private async generateTokenPair(
    sessionData: SessionData,
    remember: boolean
  ): Promise<TokenPair> {
    const now = Math.floor(Date.now() / 1000)

    // Adjust TTL based on remember me
    const accessTTL = this.accessTokenTTL
    const refreshTTL = remember ? this.refreshTokenTTL : 24 * 60 * 60 // 24 hours if not remembered

    // Create access token
    const accessToken = await new jose.SignJWT({
      ...sessionData,
      type: 'access'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(now + accessTTL)
      .setSubject(sessionData.userId)
      .setJti(crypto.randomUUID())
      .sign(this.jwtSecret)

    // Create refresh token
    const refreshToken = await new jose.SignJWT({
      userId: sessionData.userId,
      type: 'refresh'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(now + refreshTTL)
      .setSubject(sessionData.userId)
      .setJti(crypto.randomUUID())
      .sign(this.refreshSecret)

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTTL,
      refreshExpiresIn: refreshTTL
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshSession(refreshToken: string): Promise<TokenPair | null> {
    try {
      // Verify refresh token
      const { payload } = await jose.jwtVerify(refreshToken, this.refreshSecret)

      if (payload.type !== 'refresh') {
        console.error('Invalid token type')
        return null
      }

      const userId = payload.sub as string
      const tokenHash = await this.hashToken(refreshToken)

      // Find active session with this refresh token
      const { data: session, error: sessionError } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('refresh_token_hash', tokenHash)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .single()

      if (sessionError || !session) {
        console.error('Session not found or expired')
        return null
      }

      // Get updated user data
      const { data: user } = await this.supabase
        .from('users')
        .select('id, email, raw_user_meta_data')
        .eq('id', userId)
        .single()

      const { data: subscription } = await this.supabase
        .from('user_subscriptions')
        .select('tier, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      const tier = subscription?.tier || 'free'
      const permissions = await this.getUserPermissions(userId, tier)

      const sessionData: SessionData = {
        userId: user.id,
        email: user.email,
        tier,
        permissions,
        metadata: {
          name: user.raw_user_meta_data?.full_name,
          avatar: user.raw_user_meta_data?.avatar_url
        }
      }

      // Generate new token pair
      const tokens = await this.generateTokenPair(sessionData, session.remember_me)

      // Update session with new refresh token
      const newTokenHash = await this.hashToken(tokens.refreshToken)
      await this.supabase
        .from('user_sessions')
        .update({
          refresh_token_hash: newTokenHash,
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id)

      // Log refresh event
      await this.logSessionEvent(userId, 'session_refreshed', session.device_info)

      return tokens
    } catch (error) {
      console.error('Error refreshing session:', error)
      return null
    }
  }

  /**
   * Validate access token
   */
  async validateAccessToken(token: string): Promise<SessionData | null> {
    try {
      const { payload } = await jose.jwtVerify(token, this.jwtSecret)

      if (payload.type !== 'access') {
        return null
      }

      // Check if user is still active
      const { data: user } = await this.supabase
        .from('users')
        .select('id, banned_until')
        .eq('id', payload.sub)
        .single()

      if (!user || (user.banned_until && new Date(user.banned_until) > new Date())) {
        return null
      }

      return {
        userId: payload.sub as string,
        email: payload.email as string,
        tier: payload.tier as string,
        permissions: payload.permissions as string[],
        metadata: payload.metadata as Record<string, any>
      }
    } catch (error) {
      console.error('Token validation error:', error)
      return null
    }
  }

  /**
   * Revoke session
   */
  async revokeSession(sessionId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_sessions')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error revoking session:', error)
        return false
      }

      await this.logSessionEvent(userId, 'session_revoked', { sessionId })

      return true
    } catch (error) {
      console.error('Error revoking session:', error)
      return false
    }
  }

  /**
   * Revoke all sessions for user
   */
  async revokeAllSessions(userId: string, exceptSessionId?: string): Promise<boolean> {
    try {
      let query = this.supabase
        .from('user_sessions')
        .update({
          is_active: false,
          revoked_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('is_active', true)

      if (exceptSessionId) {
        query = query.neq('id', exceptSessionId)
      }

      const { error } = await query

      if (error) {
        console.error('Error revoking all sessions:', error)
        return false
      }

      await this.logSessionEvent(userId, 'all_sessions_revoked', {})

      return true
    } catch (error) {
      console.error('Error revoking all sessions:', error)
      return false
    }
  }

  /**
   * Get active sessions for user
   */
  async getActiveSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const { data: sessions } = await this.supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (!sessions) return []

      return sessions.map((session: any) => ({
        id: session.id,
        userId: session.user_id,
        deviceInfo: session.device_info,
        createdAt: new Date(session.created_at),
        lastActivity: new Date(session.last_activity),
        expiresAt: new Date(session.expires_at),
        isActive: session.is_active
      }))
    } catch (error) {
      console.error('Error getting active sessions:', error)
      return []
    }
  }

  /**
   * Enforce maximum session limit
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    const sessions = await this.getActiveSessions(userId)

    if (sessions.length >= this.maxSessions) {
      // Revoke oldest sessions
      const sessionsToRevoke = sessions
        .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime())
        .slice(0, sessions.length - this.maxSessions + 1)

      for (const session of sessionsToRevoke) {
        await this.revokeSession(session.id, userId)
      }
    }
  }

  /**
   * Get user permissions based on tier
   */
  private async getUserPermissions(userId: string, tier: string): Promise<string[]> {
    const basePermissions = ['read:own', 'write:own']

    const tierPermissions: Record<string, string[]> = {
      free: [...basePermissions, 'use:basic_features'],
      basic: [...basePermissions, 'use:basic_features', 'use:ai_detection', 'use:humanization'],
      pro: [...basePermissions, 'use:all_features', 'use:api', 'priority:support'],
      premium: [...basePermissions, 'use:all_features', 'use:api', 'priority:support', 'admin:team']
    }

    // Check for admin role
    const { data: adminRole } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single()

    const permissions = tierPermissions[tier] || tierPermissions.free

    if (adminRole) {
      permissions.push('admin:all')
    }

    return permissions
  }

  /**
   * Hash token for storage
   */
  private async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(token)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Log session event
   */
  private async logSessionEvent(userId: string, event: string, data: any): Promise<void> {
    try {
      await this.supabase
        .from('session_events')
        .insert({
          user_id: userId,
          event_type: event,
          event_data: data,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error logging session event:', error)
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from('user_sessions')
        .update({
          is_active: false,
          expired_at: new Date().toISOString()
        })
        .eq('is_active', true)
        .lt('expires_at', new Date().toISOString())
        .select()

      if (error) {
        console.error('Error cleaning up sessions:', error)
        return 0
      }

      return data?.length || 0
    } catch (error) {
      console.error('Error cleaning up sessions:', error)
      return 0
    }
  }
}

/**
 * Middleware for session validation
 */
export function sessionMiddleware(sessionManager: SessionManager) {
  return async (req: Request, context: any, next: Function) => {
    const authHeader = req.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.substring(7)
    const sessionData = await sessionManager.validateAccessToken(token)

    if (!sessionData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Add session data to context
    context.session = sessionData
    context.user = {
      id: sessionData.userId,
      email: sessionData.email,
      tier: sessionData.tier
    }

    return next()
  }
}

/**
 * Parse device info from request headers
 */
export function parseDeviceInfo(req: Request): DeviceInfo {
  const userAgent = req.headers.get('user-agent') || 'Unknown'
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'Unknown'

  // Basic user agent parsing
  let browser = 'Unknown'
  let os = 'Unknown'
  let device = 'Desktop'

  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'

  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) {
    os = 'Android'
    device = 'Mobile'
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS'
    device = userAgent.includes('iPad') ? 'Tablet' : 'Mobile'
  }

  return {
    userAgent,
    ip,
    browser,
    os,
    device
  }
}