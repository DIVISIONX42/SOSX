// src/components/Auth.tsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export function Auth({ onUser }: { onUser: (u: any) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      onUser(session?.user ?? null)
    })
    // try to restore session
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      onUser(data?.user ?? null)
    })()
  }, [])

  async function signInEmail() {
    setLoading(true)
    await supabase.auth.signInWithOtp({ email })
    setLoading(false)
    alert('Magic link sent (check email)')
  }

  async function anon() {
    setLoading(true)
    // optional: create or sign-in anon by email placeholder or provider (simplified)
    const { data } = await supabase.auth.signInWithPassword({ email: `${Date.now()}@anon.local`, password: `${Math.random()}` })
    setLoading(false)
    onUser(data.user)
  }

  return (
    <div style={{padding:12}}>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <button onClick={signInEmail} disabled={loading || !email}>Send Magic Link</button>
      <div style={{marginTop:10}}>
        <button onClick={anon}>Quick Anonymous</button>
      </div>
    </div>
  )
}