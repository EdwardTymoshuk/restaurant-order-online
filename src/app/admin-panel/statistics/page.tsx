'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'
import { BiCalendar, BiCalendarEvent, BiCalendarWeek } from 'react-icons/bi'
import { HiOutlineCalendar } from 'react-icons/hi'
import useSWR from 'swr'

// Fetcher function to retrieve analytics data from our API endpoint.
const fetcher = async () => {
  const response = await fetch('/api/analytics')
  if (!response.ok) throw new Error('Błąd podczas pobierania danych')
  return response.json()
}

// Define intervals with label and icon.
const intervals = [
  { key: 'oneDay', label: 'Dzisiaj', Icon: BiCalendar },
  { key: 'sevenDays', label: 'Ostatnie 7 dni', Icon: BiCalendarWeek },
  { key: 'thirtyDays', label: 'Ostatnie 30 dni', Icon: BiCalendarEvent },
  { key: 'oneYear', label: 'Ostatni rok', Icon: HiOutlineCalendar },
]

// Dashboard component displaying analytics for various intervals.
const StatisticsPage = () => {
  const { data, error } = useSWR('/api/analytics', fetcher)

  if (error) return <div>❌ Błąd wczytywania statystyk.</div>
  if (!data) return <div>Ładowanie...</div>

  return (
    <div className="p-10 space-y-8">
      <h1 className="text-2xl font-bold">📊 Statystyki strony</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {intervals.map(({ key, label, Icon }) => {
          const stats = data[key]
          return (
            <Card key={key} className="shadow">
              <CardHeader className="flex items-center space-x-3">
                <Icon className="text-2xl" />
                <CardTitle className="text-lg">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>
                    <strong>Wizyty:</strong> {stats.totalVisits}
                  </p>
                  <p>
                    <strong>Odwiedzający:</strong> {stats.visitors}
                  </p>
                  <p>
                    <strong>Wyświetlenia stron:</strong> {stats.pageViews}
                  </p>
                  <p>
                    <strong>Współczynnik:</strong> {stats.rate}%
                  </p>
                  <p>
                    <strong>Szybkość:</strong>{' '}
                    {stats.speedInsightsAvailable ? 'Dostępne' : 'Brak danych'}
                  </p>
                  <p>
                    <strong>URL produkcyjny:</strong>{' '}
                    <a
                      href={`https://${stats.deploymentUrl}`}
                      className="text-primary underline"
                    >
                      {stats.deploymentUrl}
                    </a>
                  </p>
                </div>

                {/* Table for Referrers */}
                {stats.referrers && Object.keys(stats.referrers).length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">
                      Skąd pochodzą wizyty:
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Źródło</TableHead>
                          <TableHead>Ilość</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(stats.referrers).map(
                          ([referrer, count]) => (
                            <TableRow key={referrer}>
                              <TableCell>{referrer}</TableCell>
                              <TableCell>{String(count)}</TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Table for Pages */}
                {stats.pages && Object.keys(stats.pages).length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">
                      Najczęściej odwiedzane strony:
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Strona</TableHead>
                          <TableHead>Ilość</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(stats.pages).map(([page, count]) => (
                          <TableRow key={page}>
                            <TableCell>{page}</TableCell>
                            <TableCell>{String(count)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default StatisticsPage
