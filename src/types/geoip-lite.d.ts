declare module 'geoip-lite' {
  export type Lookup = {
    range: [number, number]
    country: string
    region: string
    eu: '0' | '1'
    timezone: string
    city?: string
    ll?: [number, number]
    metro?: number
    area?: number
  }

  const geoip: {
    lookup(ip: string): Lookup | null
  }

  export default geoip
}
