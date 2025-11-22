const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)

const supabase = useSupabase
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null

const supabaseAnon = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  : null

const db = {
  getUserByUsername: async (username) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data || null
  },

  getUserBySessionToken: async (sessionToken) => {
    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('session_token', sessionToken)
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return null
    try {
      if (data.plan_expires_at && data.plan !== 'lifetime') {
        const now = new Date()
        const exp = new Date(data.plan_expires_at)
        if (exp <= now) {
          await supabase
            .from('users')
            .update({ plan: 'tester', plan_expires_at: null })
            .eq('id', data.id)
          data.plan = 'tester'
          data.plan_expires_at = null
        }
      }
    } catch (e) {}
    return data
  },

  updateUserSession: async (userId, sessionToken, lastLogin) => {
    const { error } = await supabase
      .from('users')
      .update({ session_token: sessionToken, last_login: lastLogin })
      .eq('id', userId)
    if (error) throw new Error(error.message)
  },

  updateUserFields: async (userId, fields) => {
    const { error } = await supabase
      .from('users')
      .update(fields)
      .eq('id', userId)
    if (error) throw new Error(error.message)
  },

  insertUser: async (user) => {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select('*')
      .limit(1)
    if (error) throw new Error(error.message)
    return data && data[0]
  },

  deleteVerificationCodesByEmail: async (email) => {
    const { error } = await supabase
      .from('verification_codes')
      .delete()
      .eq('email', email)
      .eq('used', false)
    if (error) throw new Error(error.message)
  },

  insertVerificationCode: async (payload) => {
    const { error } = await supabase
      .from('verification_codes')
      .insert(payload)
    if (error) throw new Error(error.message)
  },

  findVerificationCode: async (filters) => {
    let q = supabase.from('verification_codes').select('*').eq('used', false)
    Object.entries(filters).forEach(([k, v]) => {
      q = q.eq(k, v)
    })
    const { data, error } = await q.order('created_at', { ascending: false }).limit(1)
    if (error) throw new Error(error.message)
    return data && data[0]
  },

  markVerificationCodeUsed: async (id) => {
    const { error } = await supabase
      .from('verification_codes')
      .update({ used: true })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  // Pagamentos (Supabase)
  insertPayment: async (payment) => {
    const { data, error } = await supabase
      .from('payments')
      .insert(payment)
      .select('*')
      .limit(1)
    if (error) throw new Error(error.message)
    return data && data[0]
  },

  findPaymentByExternalReference: async (externalRef) => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('external_reference', externalRef)
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data || null
  },

  updatePaymentByExternalReference: async (externalRef, fields) => {
    const { error } = await supabase
      .from('payments')
      .update(fields)
      .eq('external_reference', externalRef)
    if (error) throw new Error(error.message)
  },

  getApplicationsByUserId: async (userId) => {
    const { data, error } = await supabase
      .from('applications')
      .select('id,name,owner_id,app_secret,version,status,paused,created_at,updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data
  },

  countApplicationsByUserId: async (userId) => {
    const { count, error } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
    return count || 0
  },

  insertApplication: async (app) => {
    const { data, error } = await supabase
      .from('applications')
      .insert(app)
      .select('*')
      .limit(1)
    if (error) throw new Error(error.message)
    return data && data[0]
  },

  renameApplication: async (appId, userId, newName) => {
    const { error } = await supabase
      .from('applications')
      .update({ name: newName })
      .eq('id', appId)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
  },

  deleteApplication: async (appId, userId) => {
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', appId)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
  },

  pauseApplication: async (appId, userId, paused) => {
    const { error } = await supabase
      .from('applications')
      .update({ paused: paused ? true : false, status: paused ? 'paused' : 'active' })
      .eq('id', appId)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
  },

  refreshAppSecret: async (appId, userId, newSecret) => {
    const { error } = await supabase
      .from('applications')
      .update({ app_secret: newSecret })
      .eq('id', appId)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
  },

  getApplicationByIdForUser: async (appId, userId) => {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', appId)
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data || null
  },

  countLicensesByAppId: async (appId) => {
    const { count, error } = await supabase
      .from('licenses')
      .select('id', { count: 'exact', head: true })
      .eq('app_id', appId)
    if (error) throw new Error(error.message)
    return count || 0
  },

  findLicenseByKeyForApp: async (licenseKey, appId) => {
    const { data, error } = await supabase
      .from('licenses')
      .select('id')
      .eq('license_key', licenseKey)
      .eq('app_id', appId)
      .limit(1)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data || null
  },

  insertLicense: async (license) => {
    const { data, error } = await supabase
      .from('licenses')
      .insert(license)
      .select('*')
      .limit(1)
    if (error) throw new Error(error.message)
    return data && data[0]
  },

  getLicensesByAppId: async (appId) => {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('app_id', appId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
  },

  getApplicationIdsByUserId: async (userId) => {
    const { data, error } = await supabase
      .from('applications')
      .select('id')
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
    return (data || []).map(r => r.id)
  },

  getLicensesByAppIds: async (appIds) => {
    if (!appIds || appIds.length === 0) return []
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .in('app_id', appIds)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
  },

  deleteAllLicensesByAppId: async (appId) => {
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('app_id', appId)
    if (error) throw new Error(error.message)
  },

  deleteUsedLicensesByAppId: async (appId) => {
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('app_id', appId)
      .eq('used', true)
    if (error) throw new Error(error.message)
  },

  deleteUnusedLicensesByAppId: async (appId) => {
    const { error } = await supabase
      .from('licenses')
      .delete()
      .eq('app_id', appId)
      .eq('used', false)
    if (error) throw new Error(error.message)
  },

  deleteAllLicensesByAppIds: async (appIds) => {
    if (!appIds || appIds.length === 0) return
    const { error } = await supabase
      .from('licenses')
      .delete()
      .in('app_id', appIds)
    if (error) throw new Error(error.message)
  },

  deleteUsedLicensesByAppIds: async (appIds) => {
    if (!appIds || appIds.length === 0) return
    const { error } = await supabase
      .from('licenses')
      .delete()
      .in('app_id', appIds)
      .eq('used', true)
    if (error) throw new Error(error.message)
  },

  deleteUnusedLicensesByAppIds: async (appIds) => {
    if (!appIds || appIds.length === 0) return
    const { error } = await supabase
      .from('licenses')
      .delete()
      .in('app_id', appIds)
      .eq('used', false)
    if (error) throw new Error(error.message)
  }
}

module.exports = { supabase, supabaseAnon, useSupabase, db }
