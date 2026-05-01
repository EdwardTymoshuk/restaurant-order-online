'use client'

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/app/components/ui/card'
import { Skeleton } from '@/app/components/ui/skeleton'
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
import { FiActivity, FiGlobe, FiUsers } from 'react-icons/fi'
import useSWR from 'swr'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const fetcher = async (url: string) => {
	const response = await fetch(url)
	if (!response.ok) throw new Error('Błąd podczas pobierania danych')
	return response.json()
}

export default function DashboardPage() {
	const [range, setRange] = useState<'day' | 'week' | 'month'>('week')
	const { data, error } = useSWR(`/api/analytics?range=${range}`, fetcher)

	if (!data && !error) {
		return (
			<div className="space-y-4">
				<Skeleton className="h-24 w-full rounded-2xl" />
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<Skeleton className="h-32 w-full rounded-2xl" />
					<Skeleton className="h-32 w-full rounded-2xl" />
				</div>
				<Skeleton className="h-72 w-full rounded-2xl" />
			</div>
		)
	}

	const orderReport = data?.order

	const aggregateActiveUsers = (report: any): number => {
		if (!report || !report.rows) return 0
		return report.rows.reduce(
			(sum: number, row: any) => sum + Number(row.metricValues[0].value),
			0
		)
	}

	const spokosopotActiveUsers = aggregateActiveUsers(data?.spokosopot)
	const orderActiveUsers = aggregateActiveUsers(orderReport)
	const totalUsers = spokosopotActiveUsers + orderActiveUsers

	let chartLabels: string[] = []
	let chartData: number[] = []
	if (orderReport && orderReport.rows) {
		chartLabels = orderReport.rows.map((row: any) => row.dimensionValues[1].value)
		chartData = orderReport.rows.map((row: any) => Number(row.metricValues[0].value))
	}

	const barChartData = {
		labels: chartLabels,
		datasets: [
			{
				label: 'Aktywni użytkownicy (order.spokosopot.pl)',
				data: chartData,
				backgroundColor: 'rgba(30, 64, 175, 0.85)',
				borderRadius: 8,
			},
		],
	}

	const barChartOptions = {
		responsive: true,
		plugins: {
			legend: { display: true },
		},
		scales: {
			y: { beginAtZero: true, ticks: { precision: 0 } },
		},
	}

	return (
		<div className="space-y-5 p-1 sm:space-y-6">
			<div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-5 text-white">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-xs uppercase tracking-[0.22em] text-slate-200/80">Pulpit</p>
						<h2 className="mt-1 text-2xl font-semibold">Podgląd ruchu i aktywności</h2>
					</div>
					<Tabs
						value={range}
						onValueChange={(val) => setRange(val as 'day' | 'week' | 'month')}
					>
						<TabsList className="grid w-full grid-cols-3 bg-white/10 p-1 sm:w-[310px]">
							<TabsTrigger
								value="day"
								className="data-[state=active]:bg-white data-[state=active]:text-slate-900"
							>
								Dzisiaj
							</TabsTrigger>
							<TabsTrigger
								value="week"
								className="data-[state=active]:bg-white data-[state=active]:text-slate-900"
							>
								Tydzień
							</TabsTrigger>
							<TabsTrigger
								value="month"
								className="data-[state=active]:bg-white data-[state=active]:text-slate-900"
							>
								Miesiąc
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
			</div>

			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					Nie udało się pobrać statystyk. Sekcja działa, ale dane analityczne są tymczasowo niedostępne.
				</div>
			)}

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card className="border-slate-200 shadow-none">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-base">
							<FiActivity className="text-secondary" />
							Suma aktywnych użytkowników
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-3xl font-semibold text-slate-900">{totalUsers}</p>
					</CardContent>
				</Card>

				<Card className="border-slate-200 shadow-none">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-base">
							<FiGlobe className="text-secondary" />
							spokosopot.pl
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-slate-500">Aktywni użytkownicy</p>
						<p className="text-3xl font-semibold text-slate-900">{spokosopotActiveUsers}</p>
					</CardContent>
				</Card>

				<Card className="border-slate-200 shadow-none">
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center gap-2 text-base">
							<FiUsers className="text-secondary" />
							order.spokosopot.pl
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-slate-500">Aktywni użytkownicy</p>
						<p className="text-3xl font-semibold text-slate-900">{orderActiveUsers}</p>
					</CardContent>
				</Card>
			</div>

			<Card className="border-slate-200 shadow-none">
				<CardHeader className="pb-1">
					<CardTitle className="text-lg">
						Wykres aktywności użytkowników (order.spokosopot.pl)
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-4">
					{chartLabels.length > 0 ? (
						<div className="h-[280px] sm:h-[360px]">
							<Bar data={barChartData} options={barChartOptions} />
						</div>
					) : (
						<div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
							Brak danych do wyświetlenia dla wybranego zakresu.
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
