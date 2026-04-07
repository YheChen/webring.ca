export interface Member {
  slug: string
  name: string
  url: string
  city?: string
  active: boolean
  tags?: string[]
  rss?: string
  bannerUrl?: string
  lat?: number
  lng?: number
  joinedAt?: string
}

export interface HealthStatus {
  status: 'ok' | 'widget_missing' | 'http_error' | 'unreachable'
  httpStatus?: number
  lastChecked: string
  consecutiveFails: number
  frameable?: boolean
}

export type Bindings = {
  WEBRING: KVNamespace
}
