import { useCallback, useEffect, useRef, useState } from 'react'

type Options = {
  onResult: (text: string) => void
  onEnd?: () => void
  lang?: string
}

/** True when the browser exposes a SpeechRecognition implementation. */
export function voiceSupported(): boolean {
  if (typeof window === 'undefined') return false
  return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
}

/**
 * Thin wrapper around the Web Speech API. Returns controls to start/stop
 * listening plus the live transcript. Falls back gracefully (supported=false)
 * on browsers without it; callers can still drive commands via runCommand().
 */
export function useVoice({ onResult, onEnd, lang = 'en-US' }: Options) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recRef = useRef<any>(null)
  const onResultRef = useRef(onResult)
  const onEndRef = useRef(onEnd)
  useEffect(() => { onResultRef.current = onResult }, [onResult])
  useEffect(() => { onEndRef.current = onEnd }, [onEnd])

  const stop = useCallback(() => {
    try { recRef.current?.stop() } catch {}
    setListening(false)
  }, [])

  const start = useCallback(() => {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!Ctor) {
      setError('Voice recognition is not supported in this browser. Type a command instead.')
      return
    }
    setError(null)
    setTranscript('')
    const rec = new Ctor()
    rec.lang = lang
    rec.interimResults = true
    rec.continuous = false
    rec.maxAlternatives = 1
    rec.onstart = () => setListening(true)
    rec.onresult = (e: any) => {
      let finalText = ''
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalText += r[0].transcript
        else interim += r[0].transcript
      }
      setTranscript((finalText || interim).trim())
      if (finalText.trim()) onResultRef.current(finalText.trim())
    }
    rec.onerror = (e: any) => {
      const code = e?.error as string | undefined
      setError(
        code === 'not-allowed' || code === 'service-not-allowed'
          ? 'Microphone blocked. Allow mic access, or send a command as text.'
          : code === 'no-speech'
            ? "Didn't hear anything. Try again."
            : code === 'network'
              ? 'Speech service is unreachable. Send the command as text instead.'
              : code
                ? `Voice error: ${code}`
                : 'Voice error',
      )
      setListening(false)
    }
    rec.onend = () => {
      setListening(false)
      onEndRef.current?.()
    }
    recRef.current = rec
    try {
      rec.start()
      // Browsers fire `onstart` asynchronously and some never do; show the
      // listening state immediately so the control always gives feedback.
      setListening(true)
    } catch {
      setError('Could not start voice recognition.')
      setListening(false)
    }
  }, [lang])

  const clearError = useCallback(() => setError(null), [])

  useEffect(() => () => { try { recRef.current?.abort() } catch {} }, [])

  return { listening, transcript, error, start, stop, clearError, supported: voiceSupported() }
}