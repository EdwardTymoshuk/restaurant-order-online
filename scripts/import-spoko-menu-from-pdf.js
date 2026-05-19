const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const items = [
  {
    category: 'Śniadania',
    name: 'Śniadanie klasyczne',
    price: 48,
    description: 'Jajecznica na maśle z trzech jaj, świeży szczypiorek, szynka, ser gouda, pomidor i ogórek, rukola; podawane z podpieczonymi mini kajzerkami.',
  },
  {
    category: 'Śniadania',
    name: 'Bajgel z krewetkami i guacamole',
    price: 48,
    description: 'Krewetki z rukolą, sadzonym jajkiem i pomidorkami cherry, podane w chrupiącym bajglu.',
  },
  {
    category: 'Śniadania',
    name: 'Bajgel z cielęciną i jajkiem sadzonym',
    price: 48,
    description: 'Cielęcina w plastrach z jajkiem sadzonym i sosem pieprzowym, ogórek konserwowy, czerwona cebula i świeża rukola.',
  },
  {
    category: 'Śniadania',
    name: 'Bajgel z grillowanym kurczakiem',
    price: 48,
    description: 'Grillowany kurczak, cheddar, pomidor, sos tatarski, jajko sadzone i rukola.',
  },
  {
    category: 'Śniadania',
    name: 'Szakszuka z wędzonym twarogiem',
    price: 48,
    description: 'Salsa pomidorowa z cebulką, marchewką i czosnkiem, dwa jajka sadzone, świeży szpinak i wędzony twaróg; podawana z mini kajzerkami i masłem.',
  },
  {
    category: 'Śniadania',
    name: 'Szakszuka z frankfurterkami',
    price: 48,
    description: 'Salsa pomidorowa z cebulką, marchewką i czosnkiem, dwa jajka sadzone, frankfurterki, pieczarki portobello i czerwona cebula; podawana z mini kajzerkami i masłem.',
  },
  {
    category: 'Śniadania',
    name: 'Pancake',
    price: 44,
    description: 'Z karmelizowanym bananem, pastą orzechową oraz sosem czekoladowym w kokilkach.',
  },
  {
    category: 'Śniadania',
    name: 'Naleśniki z waniliowym sercem',
    price: 44,
    description: 'Delikatne, zawijane naleśniki z kremowym serkiem waniliowym, wiśniowym dżemem i sałatką owocową.',
  },
  {
    category: 'Desery',
    name: 'Sernik Nowojorski z owocami sezonowymi',
    price: 24,
    description: null,
  },
  {
    category: 'Desery',
    name: 'Szarlotka na ciepło',
    price: 24,
    description: null,
  },
  {
    category: 'Desery',
    name: 'Fondant',
    price: 26,
    description: 'Ciepłe ciasto z płynnym wnętrzem z gorzkiej czekolady, podawane z lodami i sosem porzeczkowym.',
  },
  {
    category: 'Desery',
    name: 'Beza z rokitnikiem',
    price: 26,
    description: 'Delikatna beza z kremem mascarpone, sosem z rokitnika, suszonymi kwiatami i posypką z fiołkowego cukru.',
  },
  {
    category: 'Desery',
    name: 'Cynamonka tygodnia',
    price: 26,
    description: 'Wypiek drożdżowy w kształcie ślimaka. Zapytaj kelnera o smak serwowany w tym tygodniu.',
  },
  {
    category: 'Dla dzieci',
    name: 'Panierowane fileciki z dorsza',
    price: 36,
    description: 'Z frytkami i ketchupem.',
  },
  {
    category: 'Dla dzieci',
    name: 'Chrupiące fileciki z kurczaka',
    price: 36,
    description: 'Z frytkami i ketchupem.',
  },
  {
    category: 'Dla dzieci',
    name: 'Makaron pomodoro',
    price: 28,
    description: 'Rurki w sosie z włoskich pomidorów, z parmezanem.',
  },
  {
    category: 'Dla dzieci',
    name: 'Naleśniki z serkiem waniliowym | 2 szt',
    price: 28,
    description: 'Z owocami sezonowymi i dżemem wiśniowym.',
  },
  {
    category: 'Dla dzieci',
    name: 'Zupa pomidorowa',
    price: 19,
    description: 'Z makaronem jajecznym i grillowaną korzenną bagietką.',
  },
  {
    category: 'Dla dzieci',
    name: 'Rosół',
    price: 19,
    description: 'Z makaronem jajecznym, włoszczyzną i grillowaną korzenną bagietką.',
  },
  {
    category: 'Dania rybne',
    name: 'Karmazyn',
    price: 42,
    description: 'Tuszka pieczona w piecu, marynowana z rozmarynem i ziołami.',
  },
  {
    category: 'Dania rybne',
    name: 'Łosoś',
    price: 36,
    description: 'Filet marynowany w przyprawach i oliwie koperkowo-czosnkowej, pieczony w piecu.',
  },
  {
    category: 'Dania rybne',
    name: 'Dorsz',
    price: 36,
    description: 'Filet smażony na patelni, w delikatnej mące i przyprawach.',
  },
  {
    category: 'Owoce morza',
    name: 'Stek z polędwicy tuńczyka',
    price: 78,
    description: 'Serwowany z aromatycznym kuskusem z warzywami, pieczoną dynią i karmelizowanymi mini marchewkami.',
  },
  {
    category: 'Owoce morza',
    name: 'Mule w sosie serowym Dor Blue',
    price: 72,
    description: 'Duszone w kremowym sosie z serem Dor Blue i parmezanem, białym winem, czosnkiem i masłem; podawane z grillowanym pieczywem.',
  },
  {
    category: 'Owoce morza',
    name: 'Plater owoców morza w sosie autorskim',
    price: 129,
    description: 'Krewetki, mule, vongole i ośmiorniczki duszone w lekko pikantnym sosie z nutą kaffiru i trawy cytrynowej; podawane z koszykiem grillowanego pieczywa.',
  },
  {
    category: 'Owoce morza',
    name: 'Mule w sosie autorskim',
    price: 64,
    description: 'Lekko pikantne, maślane, z nutą trawy cytrynowej i liści kaffiru, podawane z grillowanym pieczywem.',
  },
  {
    category: 'Owoce morza',
    name: 'Plater „rozpusty”',
    price: 99,
    description: 'Panierowana miruna, krążki kalmara w cieście piwnym oraz krewetki w panko; podane na frytkach z dipami tatarskim i tzatziki.',
  },
  {
    category: 'Dania mięsne',
    name: 'Panierowane polędwiczki z kurczaka',
    price: 59,
    description: 'W płatkach kukurydzianych, podane z frytkami, sałatką ze świeżych warzyw i sosem tatarskim.',
  },
  {
    category: 'Dania mięsne',
    name: 'Wolno pieczona karkówka',
    price: 64,
    description: 'W sosie z leśnych grzybów; podawana z kremowym gratinem ziemniaczanym i oliwą szczypiorkową.',
  },
  {
    category: 'Dania mięsne',
    name: 'Stek wołowy Angus',
    price: 119,
    description: 'Grillowany, podawany z pieczonym ziemniakiem z mozzarellą, sosem pieprzowym i pikantną kukurydzą w kolbie.',
  },
  {
    category: 'Dania mięsne',
    name: 'Maślany kurczak wywijany',
    price: 59,
    description: 'Marynowany w sosie tzatziki, pieczony na złoto i podawany z kuskusem z warzywami oraz brokułem bimi na maśle.',
  },
  {
    category: 'Dania mięsne',
    name: 'Żeberka',
    price: 76,
    description: 'Wolno pieczone płaty żeberek w sosie BBQ, podane z frytkami stekowymi, sosem spicy mayo oraz surówką z buraczków.',
  },
  {
    category: 'Burgery',
    name: 'Burger z panierowanym kurczakiem',
    price: 59,
    description: 'Bułka maślana, sos tatarski, świeży pomidor, panierowane fileciki z kurczaka, mix sałat; podawany z frytkami i ketchupem.',
  },
  {
    category: 'Burgery',
    name: 'Burger z panierowanym dorszem',
    price: 64,
    description: 'Bułka maślana, sos tatarski, świeży ogórek, panierowane fileciki z dorsza, chrupiące krążki cebuli i mix sałat; podawany z frytkami i ketchupem.',
  },
  {
    category: 'Burgery',
    name: 'Burger wołowy',
    price: 64,
    description: 'Bułka maślana, sos spicy mayo, ser cheddar, świeży pomidor, ogórek konserwowy, kotlet wołowy 200 g, mix sałat; podawany z frytkami i ketchupem.',
  },
  {
    category: 'Bowle',
    name: 'Sałatka w formie bowl',
    price: 34,
    description: 'Świeże warzywa i zioła, guacamole, tabbouleh z kaszy kuskus, mix sałat, pomidorki cherry, sos tzatziki i grillowana pita.',
  },
  {
    category: 'Makarony/Ravioli',
    name: 'Spaghetti nero z krewetkami i łososiem',
    price: 64,
    description: 'Czarny makaron w autorskim sosie szefowej kuchni; podawany z łososiem, krewetkami, pomidorkami cherry oraz natką pietruszki.',
  },
  {
    category: 'Makarony/Ravioli',
    name: 'Makaron Caserecce z kurczakiem',
    price: 56,
    description: 'Grillowany kurczak z cebulą, pieczarkami portobello i brokułem bimi w kremowym sosie śmietanowo-truflowym; z rukolą, pomidorkami cherry i parmezanem.',
  },
  {
    category: 'Makarony/Ravioli',
    name: 'Cepelinki z soczewicą',
    price: 48,
    description: 'Miękkie cepelinki z soczewicą w aromatycznym sosie z leśnych grzybów.',
  },
  {
    category: 'Makarony/Ravioli',
    name: 'Spaghetti nero z warzywami',
    price: 56,
    description: 'Spaghetti nero z brokułem bimi, groszkiem edamame, marchewką paryską i suszonymi pomidorami w kremowym, lekko pikantnym sosie.',
  },
  {
    category: 'Makarony/Ravioli',
    name: 'Nadziewane gnocchi buraczkowe',
    price: 48,
    description: 'Delikatne gnocchi z buraczkowego ciasta, nadziewane serem mascarpone i orzechami włoskimi.',
  },
  {
    category: 'Zupy',
    name: 'Zupa rybna z krewetkami | 3 szt',
    price: 36,
    description: 'Esencjonalny bulion rybny z włoskimi pomidorami pelati, chilli i mlekiem kokosowym; z selekcją ryb i grillowaną bagietką.',
  },
  {
    category: 'Zupy',
    name: 'Zupa rybna Spoko',
    price: 26,
    description: 'Esencjonalny bulion rybny z włoskimi pomidorami pelati, chilli i mlekiem kokosowym; z selekcją ryb i grillowaną bagietką.',
  },
  {
    category: 'Zupy',
    name: 'Krem z włoskich pomidorów',
    price: 24,
    description: 'Podany z żytnimi grzankami i pesto bazyliowym.',
  },
  {
    category: 'Zupy',
    name: 'Rosół z makaronem',
    price: 24,
    description: 'Podany z makaronem jajecznym, natką pietruszki, włoszczyzną i grillowaną korzenną bagietką.',
  },
  {
    category: 'Przystawki',
    name: 'Naleśniki z kurczakiem i boczkiem',
    price: 46,
    description: 'Wytrawne naleśniki z kurczakiem, pieczarkami, boczkiem i mozzarellą, zapiekane w delikatnym sosie śmietanowym.',
  },
  {
    category: 'Przystawki',
    name: 'Tatar wołowy',
    price: 48,
    description: 'Wołowina z marynowaną czerwoną cebulą, ogórkiem, musztardą francuską, żółtkiem, kaparami oraz grillowaną bagietką i masłem.',
  },
  {
    category: 'Przystawki',
    name: 'Krewetki z ogniem | 8 szt',
    price: 59,
    description: 'W autorskim sosie z chilli, czosnkiem i natką pietruszki; podane z grillowaną bagietką.',
  },
  {
    category: 'Przystawki',
    name: 'Tataki z polędwicy tuńczyka',
    price: 54,
    description: 'Delikatnie opalany tuńczyk marynowany w sosie ponzu; z sałatką z rukoli i wakame z sezamem oraz chipsami ryżowymi.',
  },
  {
    category: 'Przystawki',
    name: 'Vitello Tonato',
    price: 48,
    description: 'Plastry pieczonej na różowo polędwicy cielęcej w stylu carpaccio, z sosem tuńczykowym, kaparami i koszykiem grillowanego pieczywa.',
  },
  {
    category: 'Przystawki',
    name: 'Tatar z łososia',
    price: 48,
    description: 'Ręcznie siekany świeży łosoś z czerwoną cebulą, świeżym ogórkiem, musztardą francuską i sosem sojowym; z grillowaną bagietką i masłem.',
  },
  {
    category: 'Dodatki',
    name: 'Frytki z ketchupem',
    price: 18,
    description: null,
  },
  {
    category: 'Dodatki',
    name: 'Surówka',
    price: 9,
    description: 'Kiszona kapusta, surówka z marchewki albo surówka z białej kapusty.',
  },
  {
    category: 'Dodatki',
    name: 'Sos',
    price: 5,
    description: 'Ketchup, BBQ, tatarski, musztarda, spicy mayo, salsa mexicana, pieprzowy, tzatziki.',
  },
  {
    category: 'Dodatki',
    name: 'Sałatka ze świeżych warzyw',
    price: 18,
    description: null,
  },
  {
    category: 'Dodatki',
    name: 'Ziemniaczki pieczone z sosem tatarskim',
    price: 18,
    description: null,
  },
]

async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false')
  await prisma.$executeRawUnsafe(
    'UPDATE "MenuItem" SET "isArchived" = true, "isActive" = false, "isOrderable" = false, "isRecommended" = false, "isOnMainPage" = false WHERE "isArchived" = false'
  )

  await prisma.menuItem.createMany({
    data: items.map((item) => ({
      ...item,
      image: null,
      isActive: true,
      isOrderable: true,
      isRecommended: false,
      isOnMainPage: false,
    })),
  })

  const [activeCount, archivedCount, orderItemsCount] = await Promise.all([
    prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS count FROM "MenuItem" WHERE "isArchived" = false'),
    prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS count FROM "MenuItem" WHERE "isArchived" = true'),
    prisma.orderItem.count(),
  ])

  console.log(JSON.stringify({
    imported: items.length,
    activeMenuItems: activeCount[0].count,
    archivedMenuItems: archivedCount[0].count,
    orderItems: orderItemsCount,
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
