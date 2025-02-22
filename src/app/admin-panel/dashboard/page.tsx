// src/app/admin-panel/dashboard/page.tsx

'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { FaCalendarWeek } from 'react-icons/fa'
import { FiUsers } from 'react-icons/fi'
import { MdShowChart } from 'react-icons/md'
import useSWR from 'swr'

// Rejestracja elementów chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// Fetcher function to retrieve analytics data from our API endpoint.
const fetcher = async () => {
  const response = await fetch('/api/analytics')
  if (!response.ok) throw new Error('Błąd podczas pobierania danych')
  return response.json()
}

export default function DashboardPage() {
  const { data, error } = useSWR('/api/analytics', fetcher)

  if (error) return <div>❌ Błąd wczytywania statystyk.</div>
  if (!data) return <div>Ładowanie...</div>

  // Destrukturyzacja danych z endpointu
  const { oneDay, sevenDays, thirtyDays } = data

  // Przygotowanie danych do wykresu słupkowego
  // dailyBreakdown to obiekt: { "Poniedziałek": 50, "Wtorek": 60, ... }
  let chartLabels: string[] = []
  let chartData: number[] = []

  if (sevenDays?.dailyBreakdown) {
    // Rzutowanie na tablicę [string, number][]
    const entries = Object.entries(sevenDays.dailyBreakdown) as [
      string,
      number
    ][]
    chartLabels = entries.map(([day]) => day)
    chartData = entries.map(([, count]) => count)
  }

  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Wizyty (ostatnie 7 dni)',
        data: chartData,
        backgroundColor: '#3B82F6', // kolor słupków (Tailwind: bg-blue-500)
      },
    ],
  }

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Panel Statystyk</h1>

      {/* Sekcja kart z krótkimi informacjami */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Karta: dzisiaj */}
        <Card>
          <CardHeader className="flex items-center space-x-2">
            <MdShowChart className="text-xl text-blue-600" />
            <CardTitle>Dzisiaj</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Liczba wizyt:</p>
            <p className="text-xl font-semibold">{oneDay.totalVisits}</p>
          </CardContent>
        </Card>

        {/* Karta: ostatni tydzień */}
        <Card>
          <CardHeader className="flex items-center space-x-2">
            <FaCalendarWeek className="text-xl text-blue-600" />
            <CardTitle>Ostatni tydzień</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Liczba wizyt:</p>
            <p className="text-xl font-semibold">{sevenDays.totalVisits}</p>
          </CardContent>
        </Card>

        {/* Karta: ostatni miesiąc */}
        <Card>
          <CardHeader className="flex items-center space-x-2">
            <FiUsers className="text-xl text-blue-600" />
            <CardTitle>Ostatni miesiąc</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Liczba wizyt:</p>
            <p className="text-xl font-semibold">{thirtyDays.totalVisits}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sekcja z wykresem */}
      <Card>
        <CardHeader>
          <CardTitle>Wizyty – ostatnie 7 dni</CardTitle>
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
