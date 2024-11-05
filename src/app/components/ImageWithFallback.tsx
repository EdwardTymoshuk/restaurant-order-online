import Image from 'next/image'
import React, { useState } from 'react'
import { GiMeal } from 'react-icons/gi'

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	src: string | undefined
	alt: string
	fallback?: React.ReactNode
	containerClassName?: string
	width: number
	height: number
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
	src,
	alt,
	fallback,
	containerClassName,
	width = 96,
	height = 96,
	...rest
}) => {
	const [error, setError] = useState(false)

	return (
		<>
			{!error && src ? (
				<Image
					src={src}
					alt={alt}
					width={width}
					height={height}
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
