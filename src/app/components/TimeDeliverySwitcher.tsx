'use client'

import { CLOSING_HOUR, MINIMUM_WAIT_TIME_MINUTES, OPENING_HOUR, OPENING_MINUTES_DELAY } from '@/config/constants'
import { trpc } from '@/utils/trpc'
import { useEffect, useState } from 'react'
import { BsClockHistory, BsLightning } from 'react-icons/bs'
import Switcher from '../components/Switcher'
import { TimeSelector } from '../components/TimeSelector'

const TimeDeliverySwitcher = ({ onTimeChange, isDelivery }: { onTimeChange: (time: 'asap' | Date) => void, isDelivery: boolean }) => {
	const [selectedOption, setSelectedOption] = useState('asap')
	const [selectedTime, setSelectedTime] = useState<Date | null>(null)
	const [isClosedToday, setIsClosedToday] = useState(false)

	const waitingTime = trpc.settings.getSettings.useQuery().data?.orderWaitTime || MINIMUM_WAIT_TIME_MINUTES

	const options = [
		{ value: 'asap', label: 'Jak najszybciej', icon: <BsLightning /> },
		{ value: 'choose-time', label: 'Wybierz godzinę', icon: <BsClockHistory /> },
	]

	useEffect(() => {
		const nearestTime = getNearestHour()
		const now = new Date()

		// Якщо ресторан закритий, показуємо повідомлення
		if (now.getHours() >= CLOSING_HOUR) {
			setIsClosedToday(true)
			const nextDayTime = new Date(nearestTime)
			nextDayTime.setDate(now.getDate() + 1)
			setSelectedTime(nextDayTime)
			onTimeChange(nextDayTime)
		} else {
			setIsClosedToday(false)
			setSelectedTime(nearestTime)
			onTimeChange(nearestTime)
		}
	}, [selectedOption, onTimeChange])

	const handleTimeChange = (date: Date | null) => {
		if (date) {
			setSelectedTime(date)
			onTimeChange(date)
		}
	}

	const getNearestHour = (): Date => {
		const now = new Date()
		let nearestAvailableTime: Date
		const additionalTime = isDelivery ? 15 : 0

		if (
			now.getHours() >= CLOSING_HOUR ||
			now.getHours() < OPENING_HOUR ||
			(now.getHours() === OPENING_HOUR && now.getMinutes() < OPENING_MINUTES_DELAY)
		) {
			nearestAvailableTime = new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate(),
				OPENING_HOUR,
				Math.ceil((OPENING_MINUTES_DELAY + waitingTime + additionalTime) / 30) * 30,
				0,
				0
			)
			if (now.getHours() >= CLOSING_HOUR) {
				nearestAvailableTime.setDate(now.getDate() + 1)
			}
		} else {
			const minutesAfterAdditionalTime = now.getMinutes() + waitingTime + additionalTime
			nearestAvailableTime = new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate(),
				now.getHours(),
				Math.ceil(minutesAfterAdditionalTime / 30) * 30,
				0,
				0
			)
		}

		return nearestAvailableTime
	}

	const filterTime = (time: Date) => {
		const now = new Date()
		const selectedDate = new Date(selectedTime ?? now)
		const nearestAvailableTime = getNearestHour()
		const hour = time.getHours()
		const minutes = time.getMinutes()

		// Якщо вибрано сьогоднішній день
		if (selectedDate.toDateString() === now.toDateString()) {
			// Заборонити вибір часу, якщо поточний час вже перевищує час закриття
			if (now.getHours() >= CLOSING_HOUR) {
				return false
			}

			// Заборонити вибір часу раніше найближчого доступного часу
			if (
				hour < nearestAvailableTime.getHours() ||
				(hour === nearestAvailableTime.getHours() &&
					minutes < nearestAvailableTime.getMinutes())
			) {
				return false
			}
		}

		// Заборонити вибір часу, якщо він поза робочими годинами
		if (hour < OPENING_HOUR || hour >= CLOSING_HOUR) {
			return false
		}

		// Заборонити вибір часу в межах часу відкриття (затримка)
		if (hour === OPENING_HOUR && minutes < OPENING_MINUTES_DELAY) {
			return false
		}

		return true
	}


	return (
		<div className="container mx-auto">
			<Switcher options={options} activeValue={selectedOption} onChange={setSelectedOption} />
			<div className="w-full text-center py-2">
				<span className="italic text-primary">Przywidywany czas oczekiwania: {waitingTime} min</span>
			</div>

			{selectedOption === 'asap' && isClosedToday && (
				<div className="mt-4 p-2 bg-red-100 text-danger text-center rounded-md">
					Restaurauracja jest już zamknięta. Zamówienia będą realizowane od jutra od godziny{' '}
					{OPENING_HOUR}:{OPENING_MINUTES_DELAY.toString().padStart(2, '0')}.
				</div>
			)}

			{selectedOption === 'choose-time' && (
				<TimeSelector
					selectedTime={selectedTime}
					onTimeChange={handleTimeChange}
					setNearestHour={getNearestHour}
					filterTime={filterTime}
				/>
			)}
		</div>
	)
}

export default TimeDeliverySwitcher
