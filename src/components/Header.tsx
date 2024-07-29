'use client'

import Link from 'next/link'
import { CiShoppingBasket } from 'react-icons/ci'

const Header = () => {
	return (
		<header className='bg-background p-4 shadow-sm shadow-primary min-h-20 h-auto fixed w-full z-10'>
			<div className='mx-auto flex justify-between items-center'>
				<div className='flex justify-start'>
					<Link href='/'>
						<img
							src='img/page-main-logo.png'
							alt='Spoko Restaurant Logo'
							className='max-h-12'
						/>
					</Link>
				</div>

				<div className=' flex gap-2 justify-end hover:text-primary'>
					<Link href=''><CiShoppingBasket size={32} /></Link>
				</div>
			</div>
		</header>
	)
}

export default Header
