// src/app/admin-panel/statistics/page.tsx

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
import useSWR from 'swr'

const fetcher = async () => {
  const response = await fetch('/api/analytics')
  if (!response.ok) throw new Error('Błąd podczas pobierania danych')
  return response.json()
}

export default function StatisticsPage() {
  const { data, error } = useSWR('/api/analytics', fetcher)

  if (error) return <div>❌ Błąd wczytywania statystyk.</div>
  if (!data) return <div>Ładowanie...</div>

  // Funkcja do renderowania tabeli dla danego raportu
  const renderTable = (report: any, siteName: string) => {
    if (!report || !report.rows || report.rows.length === 0) {
      return <p>Brak danych dla {siteName}.</p>
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Aktywni użytkownicy</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.rows.map((row: any, index: number) => (
            <TableRow key={index}>
              <TableCell>{row.dimensionValues[1].value}</TableCell>
              <TableCell>{row.metricValues[0].value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="p-10 space-y-8">
      <h1 className="text-2xl font-bold">📊 Statystyki szczegółowe</h1>

      <Card className="shadow">
        <CardHeader>
          <CardTitle>spokosopot.pl</CardTitle>
        </CardHeader>
        <CardContent>
          {renderTable(data.spokosopot, 'spokosopot.pl')}
        </CardContent>
      </Card>

      <Card className="shadow">
        <CardHeader>
          <CardTitle>order.spokosopot.pl</CardTitle>
        </CardHeader>
        <CardContent>
          {renderTable(data.order, 'order.spokosopot.pl')}
        </CardContent>
      </Card>
    </div>
  )
}
