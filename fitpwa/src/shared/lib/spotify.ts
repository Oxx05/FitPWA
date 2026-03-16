const SPOTIFY_TOKEN_KEY = 'fitpwa.spotify.token'
const SPOTIFY_VERIFIER_KEY = 'fitpwa.spotify.verifier'
const SPOTIFY_STATE_KEY = 'fitpwa.spotify.state'

const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
]

interface SpotifyToken {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  obtained_at: number
}

export interface SpotifyNowPlaying {
  isPlaying: boolean
  trackName: string
  artistName: string
  albumArtUrl?: string
}

const base64UrlEncode = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach(b => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return await crypto.subtle.digest('SHA-256', data)
}

const generateRandomString = (length: number) => {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('')
}

export const getSpotifyAuthUrl = async (redirectUri: string) => {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined
  if (!clientId) return null

  const verifier = generateRandomString(64)
  const challenge = base64UrlEncode(await sha256(verifier))
  const state = generateRandomString(16)

  sessionStorage.setItem(SPOTIFY_VERIFIER_KEY, verifier)
  sessionStorage.setItem(SPOTIFY_STATE_KEY, state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SPOTIFY_SCOPES.join(' '),
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state
  })

  return `https://accounts.spotify.com/authorize?${params.toString()}`
}

export const exchangeSpotifyCode = async (code: string, redirectUri: string) => {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string | undefined
  const verifier = sessionStorage.getItem(SPOTIFY_VERIFIER_KEY)
  if (!clientId || !verifier) return null

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier
  })

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })

  if (!res.ok) return null
  const token = (await res.json()) as Omit<SpotifyToken, 'obtained_at'>
  const stored: SpotifyToken = { ...token, obtained_at: Date.now() }
  localStorage.setItem(SPOTIFY_TOKEN_KEY, JSON.stringify(stored))
  sessionStorage.removeItem(SPOTIFY_VERIFIER_KEY)
  return stored
}

export const getStoredSpotifyToken = (): SpotifyToken | null => {
  const raw = localStorage.getItem(SPOTIFY_TOKEN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SpotifyToken
  } catch {
    return null
  }
}

export const hasValidSpotifyToken = () => {
  const token = getStoredSpotifyToken()
  if (!token) return false
  const expiresAt = token.obtained_at + token.expires_in * 1000
  return Date.now() < expiresAt - 60_000
}

export const clearSpotifyToken = () => {
  localStorage.removeItem(SPOTIFY_TOKEN_KEY)
}

export const getStoredSpotifyState = () => {
  return sessionStorage.getItem(SPOTIFY_STATE_KEY)
}

export const clearStoredSpotifyState = () => {
  sessionStorage.removeItem(SPOTIFY_STATE_KEY)
}

const getAccessToken = () => {
  const token = getStoredSpotifyToken()
  if (!token) return null
  const expiresAt = token.obtained_at + token.expires_in * 1000
  if (Date.now() >= expiresAt - 60_000) return null
  return token.access_token
}

const spotifyFetch = async (path: string, options: RequestInit = {}) => {
  const accessToken = getAccessToken()
  if (!accessToken) return null
  const res = await fetch(`https://api.spotify.com/v1/${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${accessToken}`
    }
  })
  if (!res.ok) return null
  if (res.status === 204) return {}
  return res.json()
}

export const getSpotifyNowPlaying = async (): Promise<SpotifyNowPlaying | null> => {
  const data = await spotifyFetch('me/player/currently-playing')
  if (!data || !('item' in data)) return null
  const item = data.item as { name: string; artists: Array<{ name: string }>; album?: { images?: Array<{ url: string }> } }
  return {
    isPlaying: !!data.is_playing,
    trackName: item?.name || '—',
    artistName: item?.artists?.map(a => a.name).join(', ') || '—',
    albumArtUrl: item?.album?.images?.[0]?.url
  }
}

export const spotifyPlay = async () => {
  await spotifyFetch('me/player/play', { method: 'PUT' })
}

export const spotifyPause = async () => {
  await spotifyFetch('me/player/pause', { method: 'PUT' })
}

export const spotifyNext = async () => {
  await spotifyFetch('me/player/next', { method: 'POST' })
}

export const spotifyPrevious = async () => {
  await spotifyFetch('me/player/previous', { method: 'POST' })
}
