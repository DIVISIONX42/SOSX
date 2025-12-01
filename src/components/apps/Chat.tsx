// src/apps/Chat.tsx
import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'

export function Chat({ currentUser }: { currentUser: any }) {
  const [msgs, setMsgs] = useState<any[]>([])
  const [text, setText] = useState('')
  const subRef = useRef<any>(null)

  useEffect(() => {
    // load recent messages
    const load = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(200)
      setMsgs(data ?? [])
    }
    load()

    // subscribe realtime inserts
    subRef.current = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMsgs(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => {
      if (subRef.current) supabase.removeChannel(subRef.current)
    }
  }, [])

  const send = async () => {
    if (!currentUser) return alert('Please login')
    const payload = {
      sender_id: currentUser.id,
      sender_name: currentUser.email ?? currentUser.id,
      text
    }
    // try insert; if offline -> queue to localStorage
    try {
      if (!navigator.onLine) throw new Error('offline')
      await supabase.from('messages').insert(payload)
      setText('')
    } catch (err) {
      // queue in localStorage
      const q = JSON.parse(localStorage.getItem('outbox') || '[]')
      q.push({ ...payload, created_at: new Date().toISOString() })
      localStorage.setItem('outbox', JSON.stringify(q))
      setMsgs(prev => [...prev, { ...payload, created_at: new Date().toISOString(), pending: true }])
      setText('')
    }
  }

  // sync outbox when online
  useEffect(() => {
    const sync = async () => {
      const q = JSON.parse(localStorage.getItem('outbox') || '[]')
      if (q.length === 0) return
      for (const item of q) {
        await supabase.from('messages').insert(item)
      }
      localStorage.removeItem('outbox')
    }
    window.addEventListener('online', sync)
    return () => window.removeEventListener('online', sync)
  }, [])

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <div style={{flex:1, overflow:'auto', padding:8}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{margin:'6px 0', opacity: m.pending ? 0.6 : 1}}>
            <strong>{m.sender_name ?? 'anon'}</strong>: {m.text}
            <div style={{fontSize:11, color:'#666'}}>{new Date(m.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex', padding:8}}>
        <input style={{flex:1}} value={text} onChange={e=>setText(e.target.value)} />
        <button onClick={send} disabled={!text}>Send</button>
      </div>
    </div>
  )
}