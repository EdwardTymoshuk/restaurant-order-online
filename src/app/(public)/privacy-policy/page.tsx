import MainContainer from '@/app/components/MainContainer'
import React from 'react'

const PrivacyPolicy: React.FC = () => {
  return (
    <MainContainer className="max-w-4xl mx-auto px-6 pb-12 pt-20">
      <article className="max-w-none text-zinc-700 [&_a]:text-primary [&_a]:underline [&_h1]:mb-2 [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-zinc-950 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-zinc-950 [&_li]:mb-1 [&_p]:mb-4 [&_p]:leading-7 [&_section]:border-t [&_section]:border-zinc-200 [&_section]:pt-2 [&_strong]:text-zinc-950 [&_table]:min-w-[760px] [&_table]:border-collapse [&_table]:text-sm [&_td]:border [&_td]:border-zinc-200 [&_td]:p-3 [&_th]:border [&_th]:border-zinc-200 [&_th]:bg-zinc-50 [&_th]:p-3 [&_th]:text-left [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6">
        <h1>Polityka prywatności</h1>
        <p className="text-sm text-zinc-500">Ostatnia aktualizacja: 16.08.2026</p>

        <p>
          Szanujemy Twoją prywatność i dbamy o ochronę Twoich danych osobowych.
          Niniejsza polityka prywatności opisuje, kto jest administratorem Twoich
          danych, jakie dane zbieramy, w jakim celu i na jakiej podstawie prawnej
          je przetwarzamy oraz jakie masz prawa.
        </p>

        <section>
          <h2>1. Administrator danych</h2>
          <p>Administratorem Twoich danych osobowych jest:</p>
          <p>
            <strong>Kawo Sopot s.c.</strong>
            <br />
            Hestii 3, 81-731 Sopot
            <br />
            NIP: 5851483691
            <br />
            E-mail kontaktowy:{' '}
            <a href="mailto:info@spokosopot.pl">info@spokosopot.pl</a>
          </p>
          <p>
            W sprawach dotyczących ochrony danych osobowych możesz kontaktować się
            z nami pod powyższym adresem e-mail.
          </p>
        </section>

        <section>
          <h2>2. Jakie dane zbieramy</h2>
          <p>
            W ramach składania zamówienia online zbieramy dane niezbędne do jego
            realizacji:
          </p>
          <ul>
            <li>imię i nazwisko,</li>
            <li>numer telefonu,</li>
            <li>adres dostawy, jeśli wybierasz dostawę,</li>
            <li>wybrane produkty, sposób dostawy i płatności,</li>
            <li>NIP, jeśli prosisz o wystawienie faktury,</li>
            <li>uwagi do zamówienia, jeśli je podasz.</li>
          </ul>
          <p>
            W przypadku kontaktu z nami możemy przetwarzać także adres e-mail,
            numer telefonu oraz treść wiadomości. Dodatkowo, w związku z
            korzystaniem ze strony, możemy zbierać dane techniczne za pośrednictwem
            plików cookies. Szczegóły znajdziesz w punkcie 5.
          </p>
        </section>

        <section>
          <h2>3. Cel i podstawa prawna przetwarzania danych</h2>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Cel przetwarzania</th>
                  <th>Podstawa prawna</th>
                  <th>Okres przechowywania</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Przyjęcie i realizacja zamówienia online</td>
                  <td>Art. 6 ust. 1 lit. b RODO</td>
                  <td>Przez czas realizacji zamówienia oraz do 12 miesięcy po jego zakończeniu</td>
                </tr>
                <tr>
                  <td>Wystawienie faktury lub obsługa obowiązków księgowych</td>
                  <td>Art. 6 ust. 1 lit. c RODO</td>
                  <td>Przez okres wymagany przepisami prawa podatkowego</td>
                </tr>
                <tr>
                  <td>Kontakt w sprawie zamówienia lub zapytania</td>
                  <td>Art. 6 ust. 1 lit. b lub f RODO</td>
                  <td>Do czasu zakończenia kontaktu lub wniesienia sprzeciwu</td>
                </tr>
                <tr>
                  <td>Wysyłka informacji marketingowych o ofercie</td>
                  <td>Art. 6 ust. 1 lit. a RODO</td>
                  <td>Do czasu wycofania zgody</td>
                </tr>
                <tr>
                  <td>Statystyki odwiedzin strony</td>
                  <td>Art. 6 ust. 1 lit. a RODO</td>
                  <td>Zgodnie z okresem ważności danego cookie, maksymalnie 180 dni</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Dane nie są udostępniane innym podmiotom poza wskazanymi w punkcie 4,
            chyba że obowiązek taki wynika z przepisów prawa.
          </p>
        </section>

        <section>
          <h2>4. Odbiorcy danych</h2>
          <p>
            Twoje dane mogą być przetwarzane przez podmioty, którym powierzamy
            przetwarzanie na podstawie odpowiednich umów, w szczególności:
          </p>
          <ul>
            <li>dostawca hostingu strony i aplikacji: OVHcloud,</li>
            <li>rejestrator domeny: uti.pl,</li>
            <li>dostawca skrzynki e-mail obsługującej wiadomości i powiadomienia: OVHcloud,</li>
            <li>dostawca systemu administracyjnego i bazy danych: OVHcloud,</li>
            <li>dostawca przechowywania plików i obrazów: Cloudflare R2, jeśli używane,</li>
            <li>dostawcy narzędzi analitycznych lub marketingowych, jeśli zostaną uruchomione za Twoją zgodą.</li>
          </ul>
          <p>
            Aktualnie statystyki odwiedzin zbieramy we własnym systemie
            administracyjnym Spoko Sopot. Nie zapisujemy pełnego adresu IP w celach
            analitycznych. Jeżeli w przyszłości uruchomimy zewnętrzne narzędzia,
            takie jak Google Analytics albo Meta Pixel, lista dostawców zostanie
            uzupełniona w tej polityce.
          </p>
          <p>
            Niektóre podmioty techniczne mogą przetwarzać dane poza Europejskim
            Obszarem Gospodarczym. W takich przypadkach zapewniamy odpowiedni
            poziom ochrony danych zgodnie z wymogami RODO, w szczególności w oparciu
            o standardowe klauzule umowne.
          </p>
        </section>

        <section>
          <h2>5. Pliki cookies</h2>
          <p>Korzystamy z plików cookies w następujących kategoriach:</p>
          <p>
            <strong>Wymagane</strong> - zawsze aktywne, ponieważ umożliwiają
            podstawowe działanie strony, koszyka i zamówień online, np. zapamiętanie
            Twoich preferencji cookies. Nie wymagają zgody.
          </p>
          <p>
            <strong>Statystyki</strong> - pomagają nam zobaczyć, co Cię najbardziej
            interesuje, żebyśmy mogli rozwijać stronę w dobrym kierunku. Aktywowane
            wyłącznie za Twoją zgodą. Obecnie korzystamy z własnego systemu
            statystyk, a okres ważności zgody wynosi 180 dni.
          </p>
          <p>
            <strong>Marketingowe</strong> - dzięki nim możemy pokazywać Ci treści
            i oferty dopasowane do Twoich zainteresowań, zamiast przypadkowych
            reklam. Aktywowane wyłącznie za Twoją zgodą. Aktualnie nie korzystamy
            z zewnętrznych narzędzi marketingowych takich jak Meta Pixel.
          </p>
          <p>
            Zgody opcjonalne możesz w każdej chwili zaakceptować, odrzucić lub
            zmienić w ustawieniach cookies dostępnych na stronie.
          </p>
        </section>

        <section>
          <h2>6. Twoje prawa</h2>
          <p>W związku z przetwarzaniem Twoich danych osobowych przysługuje Ci prawo do:</p>
          <ul>
            <li>dostępu do swoich danych,</li>
            <li>sprostowania danych,</li>
            <li>usunięcia danych,</li>
            <li>ograniczenia przetwarzania,</li>
            <li>przenoszenia danych,</li>
            <li>wniesienia sprzeciwu wobec przetwarzania opartego na art. 6 ust. 1 lit. f RODO,</li>
            <li>cofnięcia zgody w dowolnym momencie, bez wpływu na zgodność z prawem przetwarzania dokonanego przed jej cofnięciem,</li>
            <li>wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych, ul. Stawki 2, 00-193 Warszawa.</li>
          </ul>
          <p>
            W celu realizacji powyższych praw skontaktuj się z nami pod adresem:{' '}
            <a href="mailto:info@spokosopot.pl">info@spokosopot.pl</a>.
          </p>
        </section>

        <section>
          <h2>7. Zmiany w polityce prywatności</h2>
          <p>
            Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej polityce
            prywatności. Każda zmiana zostanie opublikowana na tej stronie wraz
            z datą aktualizacji widoczną na górze dokumentu.
          </p>
        </section>
      </article>
    </MainContainer>
  )
}

export default PrivacyPolicy
