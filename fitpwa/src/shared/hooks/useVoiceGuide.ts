import { useCallback } from 'react'

export function useVoiceGuide() {
  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-PT'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    
    // Try to find a nice Portuguese voice
    const voices = window.speechSynthesis.getVoices()
    const ptVoice = voices.find(v => v.lang.startsWith('pt'))
    if (ptVoice) utterance.voice = ptVoice

    window.speechSynthesis.speak(utterance)
  }, [])

  return { speak }
}
