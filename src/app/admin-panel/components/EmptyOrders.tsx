import Image from 'next/image'

const EmptyOrders = () => {
	return (
		<div className='flex flex-col gap-4 w-full h-full items-center pt-16'>
			<Image src='/icons/cleaned.png' alt='Cleaned icon' width={128} height={128} className='opacity-60' />
		</div>
	)
}

export default EmptyOrders
