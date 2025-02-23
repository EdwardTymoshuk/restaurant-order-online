'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js'
import { useState } from 'react'
import { Bar } from 'react-chartjs-2'
import { FiUsers } from 'react-icons/fi'
import useSWR from 'swr'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Funkcja fetcher pobierająca dane z endpointu z uwzględnieniem zakresu
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Błąd podczas pobierania danych')
  return response.json()
}

export default function DashboardPage() {
  // Używamy stanu do przechowywania wybranego zakresu: day, week, month
  const [range, setRange] = useState<'day' | 'week' | 'month'>('week')
  const { data, error } = useSWR(`/api/analytics?range=${range}`, fetcher)

  if (error) return <div>❌ Błąd wczytywania statystyk.</div>
  if (!data) return <div>Ładowanie...</div>

  // Przykład: używamy danych dla order.spokosopot.pl do wykresu
  const orderReport = data.order

  // Agregacja aktywnych użytkowników (możesz rozbudować w zależności od danych)
  const aggregateActiveUsers = (report: any): number => {
    if (!report || !report.rows) return 0
    return report.rows.reduce(
      (sum: number, row: any) => sum + Number(row.metricValues[0].value),
      0
    )
  }

  const spokosopotActiveUsers = aggregateActiveUsers(data.spokosopot)
  const orderActiveUsers = aggregateActiveUsers(orderReport)

  // Przygotowanie danych do wykresu na podstawie raportu dla order.spokosopot.pl
  let chartLabels: string[] = []
  let chartData: number[] = []
  if (orderReport && orderReport.rows) {
    chartLabels = orderReport.rows.map(
      (row: any) => row.dimensionValues[1].value
    )
    chartData = orderReport.rows.map((row: any) =>
      Number(row.metricValues[0].value)
    )
  }

  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Aktywni użytkownicy (order.spokosopot.pl)',
        data: chartData,
        backgroundColor: '#3B82F6',
      },
    ],
  }

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
    },
    scales: {
      y: { beginAtZero: true },
    },
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Pulpit</h1>

      {/* Zakładki do wyboru zakresu */}
      <Tabs
        value={range}
        onValueChange={(val) => setRange(val as 'day' | 'week' | 'month')}
      >
        <TabsList>
          <TabsTrigger value="day">Dzisiaj</TabsTrigger>
          <TabsTrigger value="week">Tydzień</TabsTrigger>
          <TabsTrigger value="month">Miesiąc</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Karta: spokosopot.pl */}
        <Card>
          <CardHeader className="flex items-center space-x-2">
            <FiUsers className="text-xl text-secondary" />
            <CardTitle>spokosopot.pl</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Aktywni użytkownicy:</p>
            <p className="text-xl font-semibold">{spokosopotActiveUsers}</p>
          </CardContent>
        </Card>

        {/* Karta: order.spokosopot.pl */}
        <Card>
          <CardHeader className="flex items-center space-x-2">
            <FiUsers className="text-xl text-secondary" />
            <CardTitle>order.spokosopot.pl</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Aktywni użytkownicy:</p>
            <p className="text-xl font-semibold">{orderActiveUsers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sekcja z wykresem dla order.spokosopot.pl */}
      <Card>
        <CardHeader>
          <CardTitle>
            Wykres aktywnych użytkowników (order.spokosopot.pl)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartLabels.length > 0 ? (
            <Bar data={barChartData} options={barChartOptions} />
          ) : (
            <p>Brak danych do wyświetlenia.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
