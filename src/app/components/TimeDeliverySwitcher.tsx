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
	isBreakfast,
}: {
	onTimeChange: (time: 'asap' | Date) => void
	isDelivery: boolean
	orderWaitTime: number
	isBreakfast: boolean
}) => {
	const [selectedOption, setSelectedOption] = useState<'asap' | 'choose-time'>('asap')
	const [selectedTime, setSelectedTime] = useState<Date | null>(null)
	const [isRestaurantClosed, setIsRestaurantClosed] = useState(false)
	const [isClosingSoon, setIsClosingSoon] = useState(false)
	const [timeLeftToOrder, setTimeLeftToOrder] = useState('')

	const BREAKFAST_END_HOUR = 12
	const deliveryTime = isDelivery ? 15 : 0
	const waitTimeWithBuffer = orderWaitTime + deliveryTime

	// Returns the last possible order time of a given day (15 minutes before closing)
	const getLastPossibleOrderTime = (day: Date) => {
		const closingTime = new Date(
			day.getFullYear(),
			day.getMonth(),
			day.getDate(),
			CLOSING_HOUR
		)
		return new Date(closingTime.getTime() - 15 * 60 * 1000)
	}

	useEffect(() => {
		const now = new Date()
		const openingTimeToday = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			OPENING_HOUR,
			OPENING_MINUTES_DELAY
		)
		const closingTimeToday = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			CLOSING_HOUR
		)
		const lastOrderTimeToday = getLastPossibleOrderTime(now)

		if (now >= closingTimeToday || now < openingTimeToday) {
			// Restaurant is closed, calculate time for the next day
			setIsRestaurantClosed(true)
			setIsClosingSoon(false)
			setTimeLeftToOrder('')
			const nextDayNearestTime = getNextDayAvailableTime(now)
			setSelectedTime(nextDayNearestTime)
			onTimeChange(nextDayNearestTime)
			return
		}

		// Restaurant is open
		setIsRestaurantClosed(false)

		if (now >= lastOrderTimeToday) {
			// Approaching closing time
			setIsClosingSoon(true)
			updateTimeLeft(lastOrderTimeToday)
			const interval = setInterval(() => updateTimeLeft(lastOrderTimeToday), 1000)
			return () => clearInterval(interval)
		} else {
			setIsClosingSoon(false)
			setTimeLeftToOrder('')
		}

		const nearestTime = getNearestAvailableTime(now)
		setSelectedTime(nearestTime)
		onTimeChange(nearestTime)
	}, [isDelivery, orderWaitTime])

	// Updates the countdown until no more orders can be placed today
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

	// Rounds time up to the nearest quarter-hour slot
	const roundToQuarterHour = (date: Date): Date => {
		const minutes = date.getMinutes()
		const rounded = Math.ceil(minutes / 15) * 15
		date.setMinutes(rounded, 0, 0)
		return date
	}

	// Calculates the earliest available time on the next day
	const getNextDayAvailableTime = (now: Date): Date => {
		const nextDay = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate() + (now.getHours() >= CLOSING_HOUR || now < new Date(now.getFullYear(), now.getMonth(), now.getDate(), OPENING_HOUR, OPENING_MINUTES_DELAY) ? 1 : 1),
		)

		let earliest: Date
		let latest: Date

		if (isBreakfast) {
			// Breakfast: 8:00 to 12:00 plus waiting/delivery time
			earliest = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), 8)
			earliest = new Date(earliest.getTime() + waitTimeWithBuffer * 60000)
			latest = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), 12)
			latest = new Date(latest.getTime() + waitTimeWithBuffer * 60000)
		} else {
			// Non-breakfast: 12:00 to closing plus waiting/delivery time
			earliest = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), 12)
			earliest = new Date(earliest.getTime() + waitTimeWithBuffer * 60000)
			const closingTimeNextDay = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), CLOSING_HOUR)
			latest = new Date(closingTimeNextDay.getTime() - 15 * 60000)
		}

		let adjusted = roundToQuarterHour(earliest)
		if (adjusted > latest) {
			adjusted = latest
		}

		return adjusted
	}

	// Calculates the nearest available time for the current day
	const getNearestAvailableTime = (now: Date): Date => {
		const openingTime = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			OPENING_HOUR,
			OPENING_MINUTES_DELAY
		)
		const closingTime = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			CLOSING_HOUR
		)
		const lastOrderTime = getLastPossibleOrderTime(now)

		if (now < openingTime || now >= closingTime) {
			return getNextDayAvailableTime(now)
		}

		const startTime = new Date(now.getTime() + waitTimeWithBuffer * 60 * 1000)
		let adjusted = roundToQuarterHour(startTime)

		const breakfastCutoff = new Date(
			adjusted.getFullYear(),
			adjusted.getMonth(),
			adjusted.getDate(),
			BREAKFAST_END_HOUR
		)

		if (isBreakfast) {
			if (adjusted > breakfastCutoff) {
				adjusted = breakfastCutoff
			}
		} else {
			const lunchStartTime = new Date(
				adjusted.getFullYear(),
				adjusted.getMonth(),
				adjusted.getDate(),
				BREAKFAST_END_HOUR
			)
			if (adjusted < lunchStartTime) {
				const lunchEarliest = new Date(lunchStartTime.getTime() + waitTimeWithBuffer * 60000)
				adjusted = roundToQuarterHour(lunchEarliest)
			}
		}

		// Ensure that we do not exceed the last order time
		if (adjusted > lastOrderTime) {
			adjusted = lastOrderTime
		}

		return adjusted
	}

	const handleTimeChange = (date: Date | null) => {
		if (date) {
			setSelectedTime(date)
			onTimeChange(date)
		}
	}

	// Filters available time slots for selection
	const filterTime = (time: Date) => {
		const now = new Date()
		const isNextDay = time.getFullYear() > now.getFullYear() ||
			time.getMonth() > now.getMonth() ||
			time.getDate() > now.getDate()

		if (isNextDay) {
			let earliest: Date
			let latest: Date

			if (isBreakfast) {
				earliest = new Date(time.getFullYear(), time.getMonth(), time.getDate(), 8)
				earliest = new Date(earliest.getTime() + waitTimeWithBuffer * 60000)
				latest = new Date(time.getFullYear(), time.getMonth(), time.getDate(), 12)
				latest = new Date(latest.getTime() + waitTimeWithBuffer * 60000)
			} else {
				earliest = new Date(time.getFullYear(), time.getMonth(), time.getDate(), 12)
				earliest = new Date(earliest.getTime() + waitTimeWithBuffer * 60000)
				const closingTimeNextDay = new Date(time.getFullYear(), time.getMonth(), time.getDate(), CLOSING_HOUR)
				latest = new Date(closingTimeNextDay.getTime() - 15 * 60000)
			}

			return time >= earliest && time <= latest
		} else {
			const openingTime = new Date(
				time.getFullYear(),
				time.getMonth(),
				time.getDate(),
				OPENING_HOUR,
				OPENING_MINUTES_DELAY
			)
			const closingTime = new Date(
				time.getFullYear(),
				time.getMonth(),
				time.getDate(),
				CLOSING_HOUR
			)
			const lastOrderTime = getLastPossibleOrderTime(time)
			const earliestOrderTime = new Date(
				now.getTime() + waitTimeWithBuffer * 60 * 1000
			)

			const isBreakfastTime = isBreakfast
				? time.getHours() < BREAKFAST_END_HOUR
				: time.getHours() >= BREAKFAST_END_HOUR

			return (
				time >= openingTime &&
				time <= lastOrderTime &&
				time >= earliestOrderTime &&
				isBreakfastTime
			)
		}
	}

	const options = [
		{ value: 'asap', label: 'Jak najszybciej', icon: <BsLightning /> },
		{ value: 'choose-time', label: 'Wybierz godzinę', icon: <BsClockHistory /> },
	]

	return (
		<div className="container mx-auto">
			{/* Switcher to toggle between ASAP and choose-time options */}
			<Switcher
				options={options}
				activeValue={selectedOption}
				onChange={(val) => setSelectedOption(val as 'asap' | 'choose-time')}
			/>
			<div className="w-full text-center py-2">
				{/* Displaying the estimated waiting time including delivery time if applicable */}
				<span className="italic text-primary">
					Przewidywany czas oczekiwania: {orderWaitTime + deliveryTime} min
				</span>
			</div>

			{/* Displaying a message if the restaurant is currently closed */}
			{isRestaurantClosed && (
				<div className="mt-4 p-2 bg-red-100 text-danger text-center rounded-md">
					Restauracja jest zamknięta. Zamówienia są realizowane od godziny {OPENING_HOUR}:00 do {CLOSING_HOUR}:00.
				</div>
			)}

			{/* Displaying a warning message if it's approaching closing time */}
			{isClosingSoon && timeLeftToOrder !== '0:00' && (
				<div className="mt-4 p-2 bg-yellow-100 text-yellow-800 text-center rounded-md">
					Uwaga! Restauracja zamknie się wkrótce. Zamówienia można składać jeszcze przez {timeLeftToOrder}.
				</div>
			)}

			{/* Displaying a message if no more orders can be placed today */}
			{isClosingSoon && timeLeftToOrder === '0:00' && (
				<div className="mt-4 p-2 bg-red-100 text-danger text-center rounded-md">
					Zamówienia na dzisiaj są już niedostępne. Zapraszamy jutro od godziny {OPENING_HOUR}:00.
				</div>
			)}

			{/* Time selector visible when the user chooses to pick a specific time */}
			{selectedOption === 'choose-time' && (
				<TimeSelector
					selectedTime={selectedTime}
					onTimeChange={handleTimeChange}
					setNearestHour={() => {
						const now = new Date()
						return getNearestAvailableTime(now)
					}}
					filterTime={filterTime}
				/>
			)}
		</div>
	)
}

export default TimeDeliverySwitcher
