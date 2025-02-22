import { NextResponse } from 'next/server'

// GET endpoint to fetch analytics data for multiple intervals.
export async function GET() {
  // Define intervals with corresponding 'from' parameters.
  const intervals = [
    { key: 'oneDay', from: '1d' },
    { key: 'sevenDays', from: '7d' },
    { key: 'thirtyDays', from: '30d' },
    { key: 'oneYear', from: '365d' },
  ]

  // For local development, return mock data to avoid issues with Vercel Web Analytics.
  if (process.env.NODE_ENV !== 'production') {
    const mockData = {
      oneDay: {
        totalVisits: 50,
        visitors: 45,
        pageViews: 75,
        rate: 30,
        speedInsightsAvailable: true,
        deploymentUrl: 'localhost:3000',
      },
      sevenDays: {
        totalVisits: 350,
        visitors: 300,
        pageViews: 500,
        rate: 32,
        // Daily breakdown for the week (key: day name, value: number of visits).
        dailyBreakdown: {
          Poniedziałek: 50,
          Wtorek: 60,
          Środa: 70,
          Czwartek: 80,
          Piątek: 40,
          Sobota: 30,
          Niedziela: 20,
        },
        speedInsightsAvailable: true,
        deploymentUrl: 'localhost:3000',
      },
      thirtyDays: {
        totalVisits: 1500,
        visitors: 1200,
        pageViews: 2500,
        rate: 35,
        speedInsightsAvailable: true,
        deploymentUrl: 'localhost:3000',
      },
      oneYear: {
        totalVisits: 18000,
        visitors: 15000,
        pageViews: 30000,
        rate: 37,
        speedInsightsAvailable: true,
        deploymentUrl: 'localhost:3000',
      },
    }
    return NextResponse.json(mockData)
  }

  try {
    // Replace with your actual Vercel Web Analytics ID.
    const webAnalyticsId = '4CVFFzxPrEDO0YYelKfHxnaMD'
    const headers = {
      Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
      'User-Agent': 'restaurant-order-online-analytics-fetcher',
    }

    // Fetch data for all intervals in parallel.
    const results = await Promise.all(
      intervals.map(async (interval) => {
        const response = await fetch(
          `https://api.vercel.com/v6/web-analytics/reports/${webAnalyticsId}?from=${interval.from}`,
          { headers }
        )
        // Retrieve raw response as text (useful for debugging).
        const rawData = await response.text()
        try {
          const data = JSON.parse(rawData)
          return { key: interval.key, data }
        } catch (jsonError) {
          return {
            key: interval.key,
            data: {
              error: 'Invalid JSON format from Vercel API.',
              details: rawData,
            },
          }
        }
      })
    )

    // Use a Record type for the accumulator to avoid TypeScript errors.
    const analyticsData = results.reduce((acc: Record<string, any>, curr) => {
      acc[curr.key] = curr.data
      return acc
    }, {})

    return NextResponse.json(analyticsData)
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'An error occurred while fetching data.',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
