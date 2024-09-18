'use client'

import { CLOSING_HOUR, MINIMUM_WAIT_TIME_MINUTES, OPENING_HOUR, OPENING_MINUTES_DELAY } from '@/config/constants'
import { useEffect, useState } from 'react'
import { BsClockHistory, BsLightning } from 'react-icons/bs'
import Switcher from '../components/Switcher'
import { TimeSelector } from '../components/TimeSelector'

const TimeDeliverySwitcher = ({ onTimeChange }: { onTimeChange: (time: 'asap' | Date) => void }) => {
	const [selectedOption, setSelectedOption] = useState('asap')
	const [selectedTime, setSelectedTime] = useState<Date | null>(null)

	const options = [
		{ value: 'asap', label: 'Jak najszybciej', icon: <BsLightning /> },
		{ value: 'choose-time', label: 'Wybierz godzinę', icon: <BsClockHistory /> },
	]

	// Викликаємо `getNearestHour` одразу при рендері і при зміні опції
	useEffect(() => {
		const nearestTime = getNearestHour()
		setSelectedTime(nearestTime)
		if (selectedOption === 'asap') {
			onTimeChange(nearestTime)
		}
	}, [selectedOption])

	const handleTimeChange = (date: Date | null) => {
		if (date) {
			setSelectedTime(date)
			onTimeChange(date)
		}
	}

	const getNearestHour = (): Date => {
		const now = new Date()
		let nearestAvailableTime: Date

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
				OPENING_MINUTES_DELAY + MINIMUM_WAIT_TIME_MINUTES,
				0,
				0
			)
			if (now.getHours() >= CLOSING_HOUR) {
				nearestAvailableTime.setDate(now.getDate() + 1)
			}
		} else {
			nearestAvailableTime = new Date(
				now.getFullYear(),
				now.getMonth(),
				now.getDate(),
				now.getHours(),
				Math.ceil(now.getMinutes() / 30) * 30 + MINIMUM_WAIT_TIME_MINUTES,
				0,
				0
			)
		}

		return nearestAvailableTime
	}

	const filterTime = (time: Date) => {
		const now = new Date()
		const nearestAvailableTime = getNearestHour()
		const selectedDate = new Date(selectedTime ?? now)
		const hour = time.getHours()
		const minutes = time.getMinutes()

		if (
			selectedDate.toDateString() === now.toDateString() &&
			(hour < nearestAvailableTime.getHours() ||
				(hour === nearestAvailableTime.getHours() &&
					minutes < nearestAvailableTime.getMinutes()))
		) {
			return false
		}

		if (hour < OPENING_HOUR || hour >= CLOSING_HOUR) {
			return false
		}
		if (hour === OPENING_HOUR && minutes < OPENING_MINUTES_DELAY) {
			return false
		}
		return true
	}

	return (
		<div className="container mx-auto">
			<Switcher
				options={options}
				activeValue={selectedOption}
				onChange={setSelectedOption}
			/>
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
