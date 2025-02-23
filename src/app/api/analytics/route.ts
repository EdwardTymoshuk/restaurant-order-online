export const dynamic = 'force-dynamic'

import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { NextResponse } from 'next/server'
import path from 'path'

const keyFilePath = path.join(process.cwd(), 'spoko-sopot-95753f611c8b.json')

const analyticsDataClient = new BetaAnalyticsDataClient({
  keyFilename: keyFilePath,
})

export async function GET(request: Request) {
  try {
    // Pobierz parametr "range" z URL (day, week, month)
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || 'week'

    let dateRange
    if (range === 'day') {
      dateRange = { startDate: '1daysAgo', endDate: 'today' }
    } else if (range === 'month') {
      dateRange = { startDate: '30daysAgo', endDate: 'today' }
    } else {
      // domyślnie: tydzień
      dateRange = { startDate: '7daysAgo', endDate: 'today' }
    }

    // Podaj numeryczny identyfikator property w formacie "properties/ID"
    const propertyId = 'properties/479301212'

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
