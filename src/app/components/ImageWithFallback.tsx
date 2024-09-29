import React, { useState } from 'react'
import { GiMeal } from 'react-icons/gi'

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	src: string | undefined
	alt: string
	fallback?: React.ReactNode
	containerClassName?: string
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
	src,
	alt,
	fallback,
	containerClassName,
	...rest
}) => {
	const [error, setError] = useState(false)

	return (
		<>
			{!error ? (
				<img
					src={src}
					alt={alt}
					onError={() => setError(true)}
					{...rest}
				/>
			) : (
				<div className={`bg-gray-200 flex items-center justify-center rounded-md ${containerClassName}`}>
					{fallback || <GiMeal size={30} className="text-gray-600" />}
				</div>
			)}
		</>
	)
}

export default ImageWithFallback
