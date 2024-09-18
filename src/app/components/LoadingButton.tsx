// LoadingButton.tsx
import { Button, ButtonProps } from "@/app/components/ui/button"
import React from "react"
import { Oval } from "react-loader-spinner"

interface LoadingButtonProps extends ButtonProps {
	isLoading: boolean
	loadingText?: string // Optional text to show while loading
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
	isLoading,
	children,
	loadingText,
	...props
}) => {
	return (
		<Button {...props} disabled={isLoading}>
			{isLoading ? (
				<div className="flex items-center space-x-2">
					<Oval
						height={24}
						width={24}
						color="#FFF"
						secondaryColor="#4fa94d"
						strokeWidth={2}
						strokeWidthSecondary={2}
						ariaLabel="oval-loading"
						visible={true}
					/>
					<span className={`${loadingText ? 'block' : 'hidden'}`}>{loadingText || ''}</span>
				</div>
			) : (
				children
			)}
		</Button>
	)
}

export default LoadingButton
