import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const analyticsDataClient = new BetaAnalyticsDataClient({
  // Odczytujemy zmienną środowiskową i parsujemy jej zawartość
  credentials: JSON.parse(process.env.GA_SERVICE_ACCOUNT_KEY || '{}'),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'week'

    let dateRange
    if (range === 'day') {
      dateRange = { startDate: '1daysAgo', endDate: 'today' }
    } else if (range === 'month') {
      dateRange = { startDate: '30daysAgo', endDate: 'today' }
    } else {
      dateRange = { startDate: '7daysAgo', endDate: 'today' }
    }

    // Użyj numerycznego identyfikatora property, np.:
    const propertyId = 'properties/10301861134' // zamień na swój właściwy numer

    // Raport dla spokosopot.pl
    const [responseSpokosopot] = await analyticsDataClient.runReport({
      property: propertyId,
      dateRanges: [dateRange],
      dimensions: [{ name: 'hostname' }, { name: 'date' }],
      metrics: [{ name: 'activeUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'hostname',
          stringFilter: {
            matchType: 'EXACT',
            value: 'spokosopot.pl',
          },
        },
      },
    })

    // Raport dla order.spokosopot.pl
    const [responseOrder] = await analyticsDataClient.runReport({
      property: propertyId,
      dateRanges: [dateRange],
      dimensions: [{ name: 'hostname' }, { name: 'date' }],
      metrics: [{ name: 'activeUsers' }],
      dimensionFilter: {
        filter: {
          fieldName: 'hostname',
          stringFilter: {
            matchType: 'EXACT',
            value: 'order.spokosopot.pl',
          },
        },
      },
    })

    return NextResponse.json({
      spokosopot: responseSpokosopot,
      order: responseOrder,
    })
  } catch (error: any) {
    console.error('Błąd pobierania danych z GA:', error)
    return NextResponse.json(
      {
        error: 'Błąd pobierania danych z Google Analytics',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
