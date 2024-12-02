import Link from 'next/link'

const Page404 = () => {
	return (
		<div className="flex items-center justify-center min-h-screen w-screen bg-cover bg-center bg-[url('/img/404.jpg')] bg-no-repeat">
			<div className="max-w-md w-full mx-4 md:mx-auto text-center bg-white bg-opacity-80 p-4 md:p-8 rounded-lg shadow-lg">
				<div className="text-6xl md:text-9xl font-bold text-secondary mb-4">404</div>
				<h1 className="text-2xl md:text-4xl font-bold text-text-secondary mb-6">Oops! Chyba się zgubiłeś</h1>
				<p className="text-base md:text-lg text-text-foreground mb-8">Strona, której szukasz, najwyraźniej wyruszyła na małą przygodę. Nie martw się, pomożemy ci znaleźć drogę powrotną do domu.</p>
				<Link href="/"
					className="inline-block bg-secondary text-text-primary font-semibold px-4 md:px-6 py-1.5 md:py-3 rounded-md hover:bg-secobdary transition-colors duration-300">
					Wróć do domu
				</Link>
			</div>
		</div>
	)

}

export default Page404