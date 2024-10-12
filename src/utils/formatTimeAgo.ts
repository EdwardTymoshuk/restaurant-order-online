export const formatTimeAgo = (date: Date): { relativeTime: string | null, fullDate: string, fullTime: string } => {
	const now = new Date()
	const diffMs = now.getTime() - date.getTime() // Різниця в мілісекундах
	const diffMinutes = Math.floor(diffMs / (1000 * 60)) // Різниця в хвилинах
	const diffHours = Math.floor(diffMinutes / 60) // Різниця в годинах

	if (diffMinutes < 1) {
		return { relativeTime: 'przed chwilą', fullDate: '', fullTime: '' }
	} else if (diffMinutes === 1) {
		return { relativeTime: 'minutę temu', fullDate: '', fullTime: '' }
	} else if (diffMinutes < 5) {
		return { relativeTime: `${diffMinutes} minuty temu`, fullDate: '', fullTime: '' }
	} else if (diffMinutes < 10) {
		return { relativeTime: `${diffMinutes} minut temu`, fullDate: '', fullTime: '' }
	} else if (diffMinutes < 20) {
		return { relativeTime: `${diffMinutes} minut temu`, fullDate: '', fullTime: '' }
	} else if (diffMinutes < 30) {
		return { relativeTime: '20 minut temu', fullDate: '', fullTime: '' }
	} else if (diffMinutes < 60) {
		return { relativeTime: 'pół godziny temu', fullDate: '', fullTime: '' }
	} else if (diffHours === 1) {
		return { relativeTime: 'godzinę temu', fullDate: '', fullTime: '' }
	} else if (diffHours > 1 && diffHours < 2) {
		return { relativeTime: 'godzinę temu', fullDate: '', fullTime: '' }
	} else {
		// Якщо більше 24 годин, повертаємо повну дату й час
		return {
			relativeTime: null,
			fullDate: date.toLocaleDateString(),
			fullTime: date.toLocaleTimeString(),
		}
	}
}
