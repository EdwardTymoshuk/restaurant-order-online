// polityka-prywatnosci.tsx
import MainContainer from '@/app/components/MainContainer'
import React from 'react'

const PrivacyPolicy: React.FC = () => {
	return (
		<MainContainer className="max-w-3xl mx-auto px-6 pb-8 pt-20">
			<h1 className="text-3xl font-bold mb-4">Polityka Prywatności</h1>

			<p>
				Szanujemy Twoją prywatność i dokładamy wszelkich starań, aby
				zapewnić ochronę Twoich danych osobowych. Niniejsza polityka
				prywatności wyjaśnia, jakie dane gromadzimy, w jakim celu je
				przetwarzamy oraz jakie prawa Ci przysługują w związku z ich
				przechowywaniem i wykorzystywaniem.
			</p>

			<section className="mt-8">
				<h2 className="text-2xl font-semibold">1. Zakres gromadzonych danych</h2>
				<p>
					W celu realizacji zamówienia i umożliwienia kontaktu z Tobą, gromadzimy
					wyłącznie dane niezbędne do świadczenia usług związanych z dostarczeniem
					posiłków oraz ewentualnym wystawieniem faktury. Są to:
				</p>
				<ul className="list-disc list-inside mt-2">
					<li>Imię i nazwisko</li>
					<li>Numer telefonu</li>
					<li>Adres dostawy</li>
					<li>NIP (opcjonalnie, jeśli życzysz sobie otrzymać fakturę)</li>
				</ul>
			</section>

			<section className="mt-8">
				<h2 className="text-2xl font-semibold">2. Cel przetwarzania danych</h2>
				<p>
					Twoje dane osobowe wykorzystujemy wyłącznie w celu:
				</p>
				<ul className="list-disc list-inside mt-2">
					<li>Realizacji Twojego zamówienia</li>
					<li>Dostarczenia zamówionych posiłków pod wskazany adres</li>
					<li>Kontaktu z Tobą w celu potwierdzenia szczegółów zamówienia, informowania o ewentualnych opóźnieniach lub zmianach oraz udzielenia odpowiedzi na Twoje zapytania</li>
					<li>Wystawienia faktury, jeżeli zostałeś o to poproszony i podałeś NIP</li>
				</ul>
				<p className="mt-2">
					Dane nie będą wykorzystywane do celów marketingowych ani udostępniane
					innym podmiotom w celach niezwiązanych bezpośrednio z realizacją
					zamówienia.
				</p>
			</section>

			<section className="mt-8">
				<h2 className="text-2xl font-semibold">3. Pliki cookies</h2>
				<p>
					Nasza strona korzysta z plików cookies w celu zapewnienia jej prawidłowego
					funkcjonowania oraz ułatwienia korzystania z naszych usług. Pliki cookies
					zapisywane są w Twojej przeglądarce i mogą być wykorzystywane do analizy
					ruchu na stronie. Masz możliwość wyrażenia zgody na korzystanie z plików
					cookies lub ich odrzucenia w ustawieniach swojej przeglądarki.
				</p>
			</section>

			<section className="mt-8">
				<h2 className="text-2xl font-semibold">4. Twoje prawa</h2>
				<p>
					Masz prawo do wglądu w swoje dane, ich sprostowania, usunięcia lub
					ograniczenia przetwarzania. Możesz również wnieść sprzeciw wobec
					przetwarzania swoich danych. Jeśli chcesz skorzystać z któregokolwiek z
					tych praw lub masz pytania dotyczące sposobu przetwarzania danych osobowych,
					prosimy o kontakt na adres e-mail:&nbsp;
					<a href="mailto:info@spokosopot.pl" className="text-primary hover:underline">
						info@spokosopot.pl
					</a>.
				</p>
			</section>

			<section className="mt-8">
				<h2 className="text-2xl font-semibold">5. Zmiany w polityce prywatności</h2>
				<p>
					Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej polityce
					prywatności. Wszelkie zmiany zostaną opublikowane na tej stronie,
					dlatego zachęcamy do regularnego zapoznawania się z jej treścią, aby być
					na bieżąco z aktualnymi zasadami.
				</p>
			</section>
		</MainContainer>
	)
}

export default PrivacyPolicy
