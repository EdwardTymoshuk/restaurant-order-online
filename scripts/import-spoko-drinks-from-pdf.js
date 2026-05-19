const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const items = [
  ['Rum', 'Bacardi Blanca', 19, '40 ml'],
  ['Rum', 'Bacardi Spiced', 19, '40 ml'],
  ['Rum', 'Bacardi Negra', 19, '40 ml'],
  ['Rum', 'Kraken Black Spiced', 33, '40 ml'],
  ['Tequila', 'Jose Cuervo Gold', 22, '40 ml, podawana z pomarańczą oraz cynamonem.'],
  ['Tequila', 'Jose Cuervo Silver', 22, '40 ml, podawana z cytryną oraz solą.'],
  ['Tequila', 'Cztery szoty tequili silver/gold', 69, 'Promocyjny zestaw czterech szotów tequili.'],
  ['Whisky', 'Ballantine’s', 22, '40 ml'],
  ['Whisky', 'Jack Daniel’s', 28, '40 ml'],
  ['Whisky', 'Jameson', 25, '40 ml'],
  ['Whisky', 'Chivas Regal 12 y.o.', 45, '40 ml'],
  ['Whisky', 'AnCnoc', 39, '40 ml'],
  ['Whisky', 'Ardbeg 10 y.o.', 42, '40 ml'],
  ['Whisky', 'Glenmorangie 10 y.o.', 65, '40 ml'],
  ['Whisky', 'Talisker 10 y.o.', 32, '40 ml'],
  ['Whisky', 'Grant’s', 25, '40 ml'],
  ['Whisky', 'Bruichladdich The Classic Laddie', 40, '40 ml'],
  ['Whisky', 'Kavalan', 30, '40 ml'],
  ['Whisky', 'Lagavulin 16 y.o.', 65, '40 ml'],
  ['Whisky', 'The Singleton', 32, '40 ml'],
  ['Whisky', 'Bulleit Bourbon', 26, '40 ml'],
  ['Whisky', 'Johnnie Walker Black Label', 35, '40 ml'],
  ['Gin', 'Tanqueray Sevilla', 24, '40 ml'],
  ['Gin', 'Bulldog London Dry', 24, '40 ml'],
  ['Gin', 'Gordon’s', 19, '40 ml'],
  ['Cognac / Brandy', 'Metaxa 5 y.o.', 22, '40 ml'],
  ['Cognac / Brandy', 'Metaxa 7 y.o.', 26, '40 ml'],
  ['Cognac / Brandy', 'Hennessy', 32, '40 ml'],
  ['Cognac / Brandy', 'Jägermeister', 22, '40 ml'],
  ['Wódka', 'Wyborowa', 16, '40 ml'],
  ['Wódka', 'Wyborowa Ziemniak', 19, '40 ml'],
  ['Wódka', 'Absolut', 19, '40 ml'],
  ['Wódka', 'Żołądkowa Gorzka', 16, '40 ml'],
  ['Napoje alkoholowe', 'Chłopska Wiśnia', 16, 'Nalewka, 40 ml'],
  ['Napoje alkoholowe', 'Chłopska Czarny Bez', 16, 'Nalewka, 40 ml'],
  ['Napoje alkoholowe', 'Chłopska Szarlotka', 16, 'Nalewka, 40 ml'],
  ['Napoje alkoholowe', 'Chłopska Przepalanka', 16, 'Nalewka, 40 ml'],
  ['Piwo smakowe', 'Kurortowe', 22, 'Regionalne piwo z Sopotu.'],
  ['Piwo smakowe', 'Plażowe', 22, 'Regionalne piwo z Sopotu.'],
  ['Piwo smakowe', 'Portowe', 22, 'Regionalne piwo z Sopotu.'],
  ['Piwo smakowe', 'Festiwalowe', 22, 'Regionalne piwo z Sopotu.'],
  ['Piwo butelkowe', 'Lech premium lager', 16, null],
  ['Piwo butelkowe', 'Kozel Ležák jasny', 16, null],
  ['Piwo butelkowe', 'Kozel Černý ciemny', 16, null],
  ['Piwo butelkowe', 'Pilsner Urquell', 18, null],
  ['Piwo bezalkoholowe', 'Kozel 0%', 16, null],
  ['Piwo bezalkoholowe', 'Lech free lager', 16, null],
  ['Piwo bezalkoholowe', 'Lech free smakowe', 16, null],
  ['Piwo beczkowe', 'Kozel Jasny', 14, 'Z beczki'],
  ['Piwo beczkowe', 'Książęce złote pszeniczne', 16, 'Z beczki'],
  ['Piwo beczkowe', 'Książęce czerwony lager', 16, 'Z beczki'],
  ['Piwo beczkowe', 'Książęce IPA', 16, 'Z beczki'],
  ['Piwo beczkowe', 'Książęce Porter', 16, 'Z beczki'],
  ['Drinki', 'Owocowe orzeźwienie', 34, 'Martini Fiero, Campari, grenadine, tonic, owoce leśne.'],
  ['Drinki', 'Fresh spritz', 34, 'Finlandia cucumber, prosecco, syrop ogórkowy, sok z limonki.'],
  ['Drinki', 'Negroni', 34, 'Gin Gordon’s, Campari, Martini Rosso, skórka pomarańczy.'],
  ['Drinki', 'Caipirinha', 32, 'Cachaca, cukier brązowy, sok z limonki, kruszony lód.'],
  ['Drinki', 'Aperol spritz', 34, 'Aperol, prosecco, świeża pomarańcza, woda gazowana.'],
  ['Drinki', 'Grejpfrutowe love', 34, 'Gin Gordon’s, Aperol, świeżo wyciskany sok grejpfrutowy, sour, sweet, grejpfrut i rozmaryn.'],
  ['Drinki', 'Sangria 300 ml', 26, 'Koktajl na bazie czerwonego wina z owocami i nutą cytrusów.'],
  ['Drinki', 'Sangria 1,5 l', 99, 'Koktajl na bazie czerwonego wina z owocami i nutą cytrusów.'],
  ['Drinki', 'Hugo', 34, 'Likier czarny bez, prosecco, woda gazowana, mięta, sok z limonki.'],
  ['Na ciepło', 'Grzaniec klasyczny korzenny', 20, 'Grzaniec gotycki z goździkami, laską cynamonu i plastrem pomarańczy.'],
  ['Na ciepło', 'Aperol na ciepło', 30, 'Aperol, białe wino, sok pomarańczowy, plastry pomarańczy i rozmaryn.'],
  ['Na ciepło', 'Grzaniec o smaku pigwy z cynamonem', 20, 'Grzaniec z białego wina z pigwą, cynamonem, pomarańczą i rozmarynem.'],
  ['Kawa', 'Orzechowa Baileys Coffee', 28, 'Baileys, syrop orzechowy, bita śmietana, posypka czekoladowa, americano.'],
  ['Kawa', 'Spiced Rum Coffee', 28, 'Rum spiced, sos toffi, bita śmietana, kawa latte.'],
  ['Kawa', 'Pistacjo Latte', 28, 'Likier pistacjowy, kawa latte.'],
  ['Wina Białe', 'Wino domu białe 150 ml', 19, null],
  ['Wina Białe', 'Wino domu białe 500 ml', 59, null],
  ['Wina Musujące', 'Świeże prosecco 150 ml', 26, null],
  ['Wina Musujące', 'Świeże prosecco 750 ml', 159, null],
  ['Wina Białe', 'Pinot grigio Delle Venezie', 32, '150 ml'],
  ['Wina Białe', 'Savee Sea Sauvignon Blanc', 169, '750 ml'],
  ['Wina Białe', 'Riesling Feinherb', 129, '750 ml'],
  ['Wina Białe', 'Badagoni Alazani Valley White', 129, '750 ml'],
  ['Wina Czerwone', 'Wino domu czerwone 150 ml', 19, null],
  ['Wina Czerwone', 'Wino domu czerwone 500 ml', 59, null],
  ['Wina Czerwone', 'Laya Almansa Granacha', 28, '150 ml'],
  ['Wina Czerwone', 'Badagoni Alazani Valley Red', 129, '750 ml'],
  ['Wina Czerwone', 'Verdeguez Espada Negra', 119, '750 ml'],
  ['Wina Czerwone', 'Ananto Tinto', 109, '750 ml'],
  ['Napoje zimne', 'Woda gazowana', 10, null],
  ['Napoje zimne', 'Woda niegazowana', 10, null],
  ['Napoje zimne', 'Sok jabłkowy', 15, null],
  ['Napoje zimne', 'Sok pomarańczowy', 15, null],
  ['Napoje zimne', 'Ice tea cytrynowa', 18, null],
  ['Napoje zimne', 'Ice tea brzoskwiniowa', 18, null],
  ['Napoje zimne', 'Lemoniada cytrusowa z brązowym cukrem', 20, 'Świeżo wyciskane cytrusy, woda gazowana, mięta.'],
  ['Napoje zimne', 'Lemoniada cytrusowa z miodem', 20, 'Świeżo wyciskane cytrusy, miód, mięta.'],
  ['Napoje zimne', 'Lemoniada 1,5 l', 79, null],
  ['Napoje zimne', 'Lemoniada 1,5 l premium', 89, null],
  ['Napoje zimne', 'Aranciata Classica', 15, 'Włoska lemoniada, klasyczna pomarańczowa.'],
  ['Napoje zimne', 'Aranciata Amara', 15, 'Włoska lemoniada z gorzkich pomarańczy.'],
  ['Napoje zimne', 'Limonata', 15, 'Tradycyjna włoska lemoniada cytrynowa.'],
  ['Kawa', 'Espresso', 13, null],
  ['Kawa', 'Espresso macchiato', 14, null],
  ['Kawa', 'Espresso doppio', 19, null],
  ['Kawa', 'Americano małe', 14, null],
  ['Kawa', 'Americano duże', 18, null],
  ['Kawa', 'Kawa biała mała', 15, null],
  ['Kawa', 'Kawa biała duża', 19, null],
  ['Kawa', 'Cappuccino', 16, null],
  ['Kawa', 'Latte', 22, null],
  ['Kawa', 'Flat white', 19, null],
  ['Kawa', 'Kawa Mocca', 22, 'Kawa latte z dodatkiem sosu czekoladowego.'],
  ['Kawa', 'Napój czekoladowy', 24, 'Z mlekiem, bitą śmietaną lub piankami marshmallow.'],
  ['Herbata', 'Herbata czarna', 12, 'Saszetka'],
  ['Herbata', 'Herbata czarna z bergamotką', 12, 'Saszetka'],
  ['Herbata', 'Herbata owocowa', 12, 'Saszetka'],
  ['Herbata', 'Herbata zielona', 12, 'Saszetka'],
  ['Herbata', 'Herbata zielona z marakują', 12, 'Saszetka'],
  ['Herbata', 'Mięta pieprzowa', 12, 'Saszetka'],
  ['Herbata', 'Napar zimowy klasyczny', 24, 'Dzbanek 500 ml. Earl Grey z pomarańczą, miodem, cynamonem, cytryną, imbirem, goździkami i rozmarynem.'],
  ['Herbata', 'Napar miętowy', 24, 'Dzbanek 500 ml. Napar z suszonej mięty pieprzowej na bazie zielonej herbaty z cytryną, miodem, imbirem i świeżą miętą.'],
  ['Herbata', 'Napar czarna porzeczka z miętą', 24, 'Dzbanek 500 ml. Czarna herbata z czarną porzeczką, aronią, konfiturą, świeżą miętą i cytryną.'],
]

async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT false')

  await prisma.menuItem.createMany({
    data: items.map(([category, name, price, description]) => ({
      category,
      name,
      price,
      description,
      image: null,
      isActive: true,
      isOrderable: true,
      isRecommended: false,
      isOnMainPage: false,
    })),
  })

  const [activeCount, archivedCount, orderItemsCount, drinksCount] = await Promise.all([
    prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS count FROM "MenuItem" WHERE "isArchived" = false'),
    prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS count FROM "MenuItem" WHERE "isArchived" = true'),
    prisma.orderItem.count(),
    prisma.$queryRawUnsafe(`
      SELECT COUNT(*)::int AS count
      FROM "MenuItem"
      WHERE "isArchived" = false
        AND category IN (
          'Rum', 'Tequila', 'Whisky', 'Gin', 'Cognac / Brandy', 'Wódka',
          'Napoje alkoholowe', 'Piwo smakowe', 'Piwo butelkowe',
          'Piwo bezalkoholowe', 'Piwo beczkowe', 'Drinki', 'Na ciepło',
          'Kawa', 'Wina Białe', 'Wina Musujące', 'Wina Czerwone',
          'Napoje zimne', 'Herbata'
        )
    `),
  ])

  console.log(JSON.stringify({
    imported: items.length,
    activeMenuItems: activeCount[0].count,
    activeDrinkItems: drinksCount[0].count,
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
