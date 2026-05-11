import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type GooglePrediction = {
  description: string
  place_id: string
  structured_formatting?: {
    main_text?: string
    secondary_text?: string
  }
}

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get('input')?.trim()

  if (!input || input.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return NextResponse.json({ suggestions: [] })
  }

  const params = new URLSearchParams({
    input,
    key: apiKey,
    language: 'pl',
    components: 'country:pl',
    types: 'address',
    location: '54.4416,18.5601',
    radius: '35000',
  })

  const response = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    return NextResponse.json({ suggestions: [] })
  }

  const data = await response.json()
  const predictions = Array.isArray(data.predictions) ? (data.predictions as GooglePrediction[]) : []

  return NextResponse.json({
    suggestions: predictions.slice(0, 5).map((prediction) => ({
      placeId: prediction.place_id,
      description: prediction.description,
      mainText: prediction.structured_formatting?.main_text ?? prediction.description,
      secondaryText: prediction.structured_formatting?.secondary_text ?? '',
    })),
  })
}
