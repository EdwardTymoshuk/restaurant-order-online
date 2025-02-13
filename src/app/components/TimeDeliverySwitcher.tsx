'use client'

import {
	CLOSING_HOUR,
	OPENING_HOUR,
	OPENING_MINUTES_DELAY,
} from '@/config/constants'
import { useCallback, useEffect, useState } from 'react'
import { BsClockHistory, BsLightning } from 'react-icons/bs'
import { toast } from 'sonner'
import Switcher from '../components/Switcher'
import { TimeSelector } from '../components/TimeSelector'
import { MenuItemCategory } from '../types/types'

const TimeDeliverySwitcher = ({
	onTimeChange,
	isDelivery,
	orderWaitTime,
	isBreakfast,
	cartItems
}: {
	onTimeChange: (time: 'asap' | Date) => void
	isDelivery: boolean
	orderWaitTime: number
	isBreakfast: boolean
	cartItems: { category: MenuItemCategory }[]
}) => {
	const [selectedOption, setSelectedOption] = useState<'asap' | 'choose-time'>('asap')
	const [selectedTime, setSelectedTime] = useState<Date | null>(null)
	const [isRestaurantClosed, setIsRestaurantClosed] = useState(false)
	const [isClosingSoon, setIsClosingSoon] = useState(false)
	const [timeLeftToOrder, setTimeLeftToOrder] = useState('')

	const BREAKFAST_END_HOUR = 12
	const deliveryTime = isDelivery ? 15 : 0
	const waitTimeWithBuffer = orderWaitTime + deliveryTime

	const isValentinesItemInCart = cartItems?.some(item => item.category === 'Oferta Walentynkowa')

	const allowedDates = ["2025-02-14", "2025-02-15", "2025-02-16"]

	const isDateAllowed = (date: Date) => {
		if (!isValentinesItemInCart) return true // Якщо немає промо-страв, всі дати доступні
		const selectedDateStr = date.toISOString().split("T")[0] // YYYY-MM-DD
		return allowedDates.includes(selectedDateStr)
	}


	// Returns the last possible order time of a given day (15 minutes before closing)
	const getLastPossibleOrderTime = useCallback((day: Date) => {
		const closingTime = new Date(
			day.getFullYear(),
			day.getMonth(),
			day.getDate(),
			CLOSING_HOUR
		)
		return new Date(closingTime.getTime() - 15 * 60 * 1000)
	}, [])

	const getNextDayAvailableTime = useCallback((now: Date): Date => {
		const nextDay = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate() + (now.getHours() >= CLOSING_HOUR || now < new Date(now.getFullYear(), now.getMonth(), now.getDate(), OPENING_HOUR, OPENING_MINUTES_DELAY) ? 1 : 1),
		)

		while (isValentinesItemInCart && !isDateAllowed(nextDay)) {
			nextDay.setDate(nextDay.getDate() + 1)
		}

		let earliest: Date
		let latest: Date

		if (isBreakfast) {
			earliest = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), 8)
			earliest = new Date(earliest.getTime() + waitTimeWithBuffer * 60000)
			latest = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), 12)
		} else {
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
	}, [isBreakfast, waitTimeWithBuffer])


	const getNearestAvailableTime = useCallback((now: Date): Date => {
		const openingTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), OPENING_HOUR, OPENING_MINUTES_DELAY);
		const closingTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), CLOSING_HOUR);
		const lastOrderTime = getLastPossibleOrderTime(now);
		
		const isOnlyBreakfast = cartItems.every(item => item.category === 'Śniadania' || item.category === 'Napoje bezalkoholowe');
		const isNonBreakfastItem = cartItems.some(item => item.category !== 'Śniadania' && item.category !== 'Napoje bezalkoholowe');
	
		if (now < openingTime || now >= closingTime) {
			return getNextDayAvailableTime(now);
		}
	
		let adjusted = roundToQuarterHour(new Date(now.getTime() + waitTimeWithBuffer * 60 * 1000));
	
		const breakfastEndTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), BREAKFAST_END_HOUR);
	
		if (isOnlyBreakfast && adjusted >= breakfastEndTime) {
			return getNextDayAvailableTime(now);
		}
	
		if (isNonBreakfastItem && now.getHours() < BREAKFAST_END_HOUR) {
			adjusted = new Date(now.getFullYear(), now.getMonth(), now.getDate(), BREAKFAST_END_HOUR);
		}
	
		return adjusted > lastOrderTime ? lastOrderTime : adjusted;
	}, [getLastPossibleOrderTime, getNextDayAvailableTime, waitTimeWithBuffer, cartItems]);
	

	useEffect(() => {
		if (selectedOption === 'choose-time') return;
	
		const now = new Date();
		const openingTimeToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), OPENING_HOUR, OPENING_MINUTES_DELAY);
		const closingTimeToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), CLOSING_HOUR);
		const lastOrderTimeToday = getLastPossibleOrderTime(now);
	
		if (now >= closingTimeToday || now < openingTimeToday) {
			setIsRestaurantClosed(true);
			setIsClosingSoon(false);
			setTimeLeftToOrder('');
			const nextDayNearestTime = getNextDayAvailableTime(now);
			setSelectedTime(nextDayNearestTime);
			onTimeChange(nextDayNearestTime);
			return;
		}
	
		setIsRestaurantClosed(false);
	
		if (now >= lastOrderTimeToday) {
			setIsClosingSoon(true);
			updateTimeLeft(lastOrderTimeToday);
			const interval = setInterval(() => updateTimeLeft(lastOrderTimeToday), 1000);
			return () => clearInterval(interval);
		} else {
			setIsClosingSoon(false);
			setTimeLeftToOrder('');
		}
	
		const nearestTime = getNearestAvailableTime(now);
		const isOnlyBreakfast = cartItems.every(item => item.category === 'Śniadania' || item.category === 'Napoje bezalkoholowe');
	
		if (isOnlyBreakfast && now.getHours() >= BREAKFAST_END_HOUR) {
			setSelectedOption('choose-time');
		}
	
		setSelectedTime(nearestTime);
		onTimeChange(nearestTime);
	}, [isDelivery, orderWaitTime, getNearestAvailableTime, getNextDayAvailableTime, onTimeChange, getLastPossibleOrderTime, cartItems]);
	
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

	const handleTimeChange = (date: Date | null) => {
		if (!date) return;
	
		const isOnlyBreakfast = cartItems.every(item => item.category === 'Śniadania' || item.category === 'Napoje bezalkoholowe');
		const isNonBreakfastItem = cartItems.some(item => item.category !== 'Śniadania' && item.category !== 'Napoje bezalkoholowe');
	
		const selectedHour = date.getHours();
	
		if (isOnlyBreakfast && (selectedHour < 8 || selectedHour >= BREAKFAST_END_HOUR)) {
			toast.warning('Śniadania można zamawiać tylko w godzinach 8:00 - 12:00.');
			return;
		}
	
		if (isNonBreakfastItem && selectedHour < BREAKFAST_END_HOUR) {
			toast.warning('Dania główne można zamawiać tylko po 12:00.');
			return;
		}
	
		setSelectedTime(date);
		onTimeChange(date);
	};
	

	// Filters available time slots for selection
	const filterTime = (time: Date) => {
		const isAllowed = isDateAllowed(time);
		if (!isAllowed) return false;
	
		const isNextDay = time.getDate() !== new Date().getDate();
		const isOnlyBreakfast = cartItems.every(item => item.category === 'Śniadania' || item.category === 'Napoje bezalkoholowe');
		const isNonBreakfastItem = cartItems.some(item => item.category !== 'Śniadania' && item.category !== 'Napoje bezalkoholowe');
	
		let earliest, latest;
	
		if (isNextDay) {
			earliest = isOnlyBreakfast
				? new Date(time.getFullYear(), time.getMonth(), time.getDate(), 8)
				: new Date(time.getFullYear(), time.getMonth(), time.getDate(), 12);
	
			latest = isOnlyBreakfast
				? new Date(time.getFullYear(), time.getMonth(), time.getDate(), BREAKFAST_END_HOUR)
				: new Date(time.getFullYear(), time.getMonth(), time.getDate(), CLOSING_HOUR - 1, 45);
		} else {
			earliest = new Date(new Date().getTime() + waitTimeWithBuffer * 60 * 1000);
			latest = getLastPossibleOrderTime(time);
		}
	
		return time >= earliest && time <= latest && ((isOnlyBreakfast && time.getHours() < BREAKFAST_END_HOUR) || (isNonBreakfastItem && time.getHours() >= BREAKFAST_END_HOUR));
	};
	

	const options = [
		{ value: 'asap', label: 'Jak najszybciej', icon: <BsLightning />, disabled: isValentinesItemInCart || (cartItems.every(item => item.category === 'Śniadania' || item.category === 'Napoje bezalkoholowe') && new Date().getHours() >= BREAKFAST_END_HOUR) },
		{ value: 'choose-time', label: 'Wybierz godzinę', icon: <BsClockHistory /> },
	];
	

	useEffect(() => {
		if (isValentinesItemInCart) {
			setSelectedOption('choose-time')
		}
	}, [isValentinesItemInCart])
	

	return (
		<div className="container mx-auto">
			{/* Switcher to toggle between ASAP and choose-time options */}
			<Switcher
				options={options}
				activeValue={selectedOption}
				onChange={(val) => {
					if (isValentinesItemInCart && val === 'asap') return
					setSelectedOption(val as 'asap' | 'choose-time')}
				}
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
