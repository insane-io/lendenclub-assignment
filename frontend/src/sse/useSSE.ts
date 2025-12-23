import { useEffect } from 'react'
import axiosInstance from '../api/axiosInstance'

export type SSEHandler = (data: any) => void

export default function useSSE(onMessage: SSEHandler) {
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const base = (import.meta.env.VITE_API_BASE_URL as string) || ''
    const baseTrim = base.endsWith('/') ? base.slice(0, -1) : base
    const url = `${baseTrim}/sse/stream?token=${encodeURIComponent(token)}`

    const es = new EventSource(url)

    es.onmessage = async (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data)
        // call transactions API to refresh latest transactions
        try {
          const res = await axiosInstance.get('/transactions')
          // dispatch a DOM event so interested components can update
          try {
            window.dispatchEvent(new CustomEvent('transactions:updated', { detail: res.data }))
          } catch (evErr) {
            // fallback: call onMessage with original payload if dispatch fails
            console.warn('failed to dispatch transactions:updated event', evErr)
          }
        } catch (apiErr) {
          console.error('Failed to fetch transactions on SSE event', apiErr)
        }

        onMessage(parsed)
      } catch (err) {
        console.error('SSE parse error', err)
      }
    }

    es.onerror = (err) => {
      // EventSource will auto-reconnect with an exponential backoff controlled by the browser.
      console.error('SSE error', err)
    }

    return () => {
      try { es.close() } catch (e) { /* ignore */ }
    }
  }, [onMessage])
}
