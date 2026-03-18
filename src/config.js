const DEFAULT_POSTER_API_PATH = '/api/generate'
const ALLOWED_POSTER_API_PATH = '/api/generate'

export const resolvePosterApiUrl = (configuredValue = import.meta.env.VITE_POSTER_API_URL) => {
  const normalizedValue = String(configuredValue || '').trim()

  if (!normalizedValue) {
    return DEFAULT_POSTER_API_PATH
  }

  if (normalizedValue.startsWith('/')) {
    return normalizedValue === ALLOWED_POSTER_API_PATH ? normalizedValue : DEFAULT_POSTER_API_PATH
  }

  try {
    const parsedUrl = new URL(normalizedValue, window.location.origin)

    if (parsedUrl.pathname !== ALLOWED_POSTER_API_PATH) {
      return DEFAULT_POSTER_API_PATH
    }

    parsedUrl.hash = ''
    return parsedUrl.toString()
  } catch {
    return DEFAULT_POSTER_API_PATH
  }
}

export const POSTER_API_URL = resolvePosterApiUrl()
