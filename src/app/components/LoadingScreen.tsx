// components/LoadingScreen.tsx
import { cn } from '@/utils/utils'
import React from 'react'
import AnimatedLogo from './AnimatedLogo'

// Інтерфейс пропсів
interface LoadingScreenProps {
	size?: number  // Розмір лого
	fullScreen?: boolean  // Включити на всю ширину і висоту вікна
}

// Компонент анімованого лого
const LoadingScreen: React.FC<LoadingScreenProps> = ({ size = 50, fullScreen = false }) => {
	return (
		<div
			className={cn(
				'flex items-center justify-center',
				fullScreen ? 'inset-0 z-50 bg-transparent w-full h-screen flex items-center content-center' : '',
			)}
		>
			<AnimatedLogo />
		</div>
	)
}

export default LoadingScreen
