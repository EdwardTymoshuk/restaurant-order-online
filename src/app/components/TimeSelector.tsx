import { pl } from 'date-fns/locale'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface TimeSelectorProps {
	selectedTime: Date | null
	onTimeChange: (date: Date | null) => void
	setNearestHour: () => Date
	filterTime: (time: Date) => boolean
}

export function TimeSelector({
	selectedTime,
	onTimeChange,
	setNearestHour,
	filterTime,
}: TimeSelectorProps) {
	return (
		<div className="flex flex-col w-full p-2">
			<DatePicker
				selected={selectedTime || undefined} // Зміна для дозволу null
				onChange={onTimeChange}
				showTimeSelect
				locale={pl}
				timeIntervals={15}
				timeCaption="Wybierz godzinę odbioru"
				dateFormat="d MMMM yyyy, HH:mm"
				timeFormat="HH:mm"
				className="flex text-center py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-full"
				filterDate={(date) => date.getTime() >= new Date().setHours(0, 0, 0, 0)} // Відображаємо лише доступні дати
				filterTime={(time) => filterTime(time)}
			/>
		</div>
	)
}
