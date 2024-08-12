import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"

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
		<div className="flex flex-col items-center space-x-4">
			{/* <div className='text-center py-4'>
				<h4 className='text-xl text-text-foreground'>Czas odbioru:</h4>
				<span className="text-4xl">
					{selectedTime ? selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
				</span>
			</div> */}

			<div className='flex flex-col items-center w-full'>
				<h4 className='text-xl text-text-foreground'>Wybierz czas:</h4>
				<DatePicker
					selected={selectedTime}
					onChange={onTimeChange}
					showTimeSelect
					showTimeSelectOnly
					timeIntervals={30}
					timeCaption="Wybierz godzinę odbioru"
					dateFormat="HH:mm"
					timeFormat="HH:mm"
					className="flex text-center text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-primary w-full"
					filterTime={filterTime}
				/>
			</div>

		</div>
	)
}
