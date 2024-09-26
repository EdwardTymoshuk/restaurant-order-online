export const sanitizeImageFilename = (filename: string): string => {
	return filename
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^\w.-]/g, '')
}
