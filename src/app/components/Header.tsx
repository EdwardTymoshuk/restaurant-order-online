'use client'

import CartSheet from '@/app/components/CartSheet'
import Link from 'next/link'

const Header = () => {
	return (
		<header className='bg-background p-4 shadow-sm shadow-primary min-h-20 h-auto fixed w-full z-10'>
			<div className='mx-auto flex justify-between items-center'>
				<Link href='/'>
					<img
						src='/img/page-main-logo.png'
						alt='Spoko Restaurant Logo'
						className='max-h-12'
					/>
				</Link>
				<CartSheet />
			</div>
		</header>
	)
}

export default Header
