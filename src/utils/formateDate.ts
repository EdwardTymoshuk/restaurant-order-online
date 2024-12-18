// Функція для форматування дати
export const formatDate = (isoDateString: string): string => {
	const date = new Date(isoDateString)
	return date.toLocaleString('pl-PL', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}