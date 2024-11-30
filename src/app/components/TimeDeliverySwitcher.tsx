'use client'

import {
	CLOSING_HOUR,
	OPENING_HOUR,
	OPENING_MINUTES_DELAY,
} from '@/config/constants'
import { useEffect, useState } from 'react'
import { BsClockHistory, BsLightning } from 'react-icons/bs'
import Switcher from '../components/Switcher'
import { TimeSelector } from '../components/TimeSelector'

const TimeDeliverySwitcher = ({
	onTimeChange,
	isDelivery,
	orderWaitTime,
}: {
	onTimeChange: (time: 'asap' | Date) => void
	isDelivery: boolean
	orderWaitTime: number
}) => {
	const [selectedOption, setSelectedOption] = useState('asap')
	const [selectedTime, setSelectedTime] = useState<Date | null>(null)
	const [isRestaurantClosed, setIsRestaurantClosed] = useState(false)
	const [isClosingSoon, setIsClosingSoon] = useState(false)
	const [timeLeftToOrder, setTimeLeftToOrder] = useState('')

	const additionalTime = isDelivery ? 15 : 0
	const waitTimeWithBuffer = orderWaitTime + additionalTime

	const options = [
		{ value: 'asap', label: 'Jak najszybciej', icon: <BsLightning /> },
		{ value: 'choose-time', label: 'Wybierz godzinę', icon: <BsClockHistory /> },
	]

	useEffect(() => {
		const now = new Date()
		const openingTimeToday = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			OPENING_HOUR,
			OPENING_MINUTES_DELAY + (isDelivery ? 15 : 0)
		)
		const closingTimeToday = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			CLOSING_HOUR
		)

		// Максимальний час для замовлення
		const lastOrderTimeToday = new Date(
			closingTimeToday.getTime() - waitTimeWithBuffer * 60 * 1000
		)

		// Час, коли починає з'являтися повідомлення
		const closingSoonStart = new Date(
			lastOrderTimeToday.getTime() - 30 * 60 * 1000 // 30 хвилин до закінчення прийому замовлень
		)

		// Визначаємо стан ресторану
		if (now >= closingTimeToday || now < openingTimeToday) {
			// Ресторан закритий
			setIsRestaurantClosed(true)
			setIsClosingSoon(false)
			setTimeLeftToOrder('')
			const nextDayOpening = new Date(openingTimeToday)
			if (now >= closingTimeToday) {
				nextDayOpening.setDate(now.getDate() + 1)
			}
			setSelectedTime(nextDayOpening)
			onTimeChange(nextDayOpening)
		} else {
			// Ресторан відкритий
			setIsRestaurantClosed(false)
			if (now >= closingSoonStart && now < lastOrderTimeToday) {
				setIsClosingSoon(true)
				updateTimeLeft(lastOrderTimeToday)
				const interval = setInterval(() => updateTimeLeft(lastOrderTimeToday), 1000)
				return () => clearInterval(interval)
			} else {
				setIsClosingSoon(false)
				setTimeLeftToOrder('')
			}
		}

		// Встановлюємо найближчий доступний час
		const nearestTime = getNearestAvailableTime(now, openingTimeToday)
		setSelectedTime(nearestTime)
		onTimeChange(nearestTime)
	}, [isDelivery, orderWaitTime])

	const updateTimeLeft = (cutOffTime: Date) => {
		const now = new Date()
		const diff = cutOffTime.getTime() - now.getTime()

		if (diff <= 0) {
			setTimeLeftToOrder('0:00')
			return
		}

		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
		const seconds = Math.floor((diff % (1000 * 60)) / 1000)
		setTimeLeftToOrder(`${minutes}:${seconds.toString().padStart(2, '0')}`)
	}

	const handleTimeChange = (date: Date | null) => {
		if (date) {
			setSelectedTime(date)
			onTimeChange(date)
		}
	}

	const getNearestAvailableTime = (now: Date, openingTime: Date): Date => {
		if (now < openingTime) {
			return openingTime
		}

		const nearestMinutes = Math.ceil(now.getMinutes() / 30) * 30
		return new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			now.getHours(),
			nearestMinutes
		)
	}

	const filterTime = (time: Date) => {
		const now = new Date()
		const openingTime = new Date(
			time.getFullYear(),
			time.getMonth(),
			time.getDate(),
			OPENING_HOUR,
			OPENING_MINUTES_DELAY + (isDelivery ? 15 : 0)
		)
		const closingTime = new Date(
			time.getFullYear(),
			time.getMonth(),
			time.getDate(),
			CLOSING_HOUR
		)

		const lastOrderTime = new Date(
			closingTime.getTime() - waitTimeWithBuffer * 60 * 1000
		)

		// Забороняємо час поза межами відкриття-закриття ресторану
		return time >= openingTime && time <= lastOrderTime
	}

	return (
		<div className="container mx-auto">
			<Switcher options={options} activeValue={selectedOption} onChange={setSelectedOption} />
			<div className="w-full text-center py-2">
				<span className="italic text-primary">
					Przywidywany czas oczekiwania: {orderWaitTime} min
				</span>
			</div>

			{isRestaurantClosed && (
				<div className="mt-4 p-2 bg-red-100 text-danger text-center rounded-md">
					Restauracja jest zamknięta. Zamówienia są realizowane od godziny{' '}
					{OPENING_HOUR}:{OPENING_MINUTES_DELAY.toString().padStart(2, '0')} до{' '}
					{CLOSING_HOUR}:00.
				</div>
			)}

			{isClosingSoon && timeLeftToOrder !== '0:00' && (
				<div className="mt-4 p-2 bg-yellow-100 text-yellow-800 text-center rounded-md">
					Uwaga! Restauracja zamknie się wkrótce. Zamówienia można składać jeszcze przez {timeLeftToOrder}.
				</div>
			)}

			{isClosingSoon && timeLeftToOrder === '0:00' && (
				<div className="mt-4 p-2 bg-red-100 text-danger text-center rounded-md">
					Zamówienia na dzisiaj są już niedostępne. Zapraszamy jutro od godziny{' '}
					{OPENING_HOUR}:{OPENING_MINUTES_DELAY.toString().padStart(2, '0')}.
				</div>
			)}

			{selectedOption === 'choose-time' && (
				<TimeSelector
					selectedTime={selectedTime}
					onTimeChange={handleTimeChange}
					setNearestHour={() => getNearestAvailableTime(new Date(), new Date())}
					filterTime={filterTime}
				/>
			)}
		</div>
	)
}

export default TimeDeliverySwitcher
