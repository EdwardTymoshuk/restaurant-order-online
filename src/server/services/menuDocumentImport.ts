import { execFile } from 'child_process'
import { randomUUID } from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { promisify } from 'util'
import vm from 'vm'
import { PDFParse } from 'pdf-parse'

export type ImportDocumentType = 'menu' | 'drinks' | 'full' | 'other'

export type ParsedMenuImportItem = {
  category: string
  name: string
  price: number
  description: string | null
  optionGroups?: MenuOptionGroup[]
}

export type MenuOption = {
  label: string
  price: number
}

export type MenuOptionGroup = {
  name: string
  required: boolean
  options: MenuOption[]
}

export type OcrMenuImportResult = {
  text: string
  pages: Array<{
    pageNumber: number
    text: string
  }>
  items: ParsedMenuImportItem[]
}

export type AiMenuImportResult = OcrMenuImportResult

type AiMenuVariant = {
  label: string
  price: number
}

type AiMenuOptionGroup = {
  name: string
  required: boolean
  options: AiMenuVariant[]
}

type AiMenuItem = {
  category: string
  name: string
  description: string | null
  price: number | null
  variants: AiMenuVariant[]
  optionGroups: AiMenuOptionGroup[]
}

type AiMenuPageResponse = {
  items: AiMenuItem[]
}

type OcrProgress = {
  stage: 'rendering' | 'recognizing' | 'parsing' | 'analyzing'
  message: string
  currentPage?: number
  totalPages?: number
}

type OcrOptions = {
  onProgress?: (progress: OcrProgress) => void
  timeoutMs?: number
  pageTimeoutMs?: number
}

const SCRIPT_BY_TYPE: Record<Exclude<ImportDocumentType, 'full' | 'other'>, string> = {
  menu: 'import-spoko-menu-from-pdf.js',
  drinks: 'import-spoko-drinks-from-pdf.js',
}

const execFileAsync = promisify(execFile)
const OCR_RENDER_DPI = 180
const AI_RENDER_DPI = 150
const MENU_AI_IMPORT_MODEL = process.env.OPENAI_MENU_IMPORT_MODEL || 'gpt-4o'

const pdfParseWorkerPath = path.join(process.cwd(), 'node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs')
PDFParse.setWorker(pdfParseWorkerPath)

const CATEGORY_ALIASES: Record<string, string> = {
  'dania': 'Dania główne',
  'main dishes': 'Dania główne',
  'ryby i owoce morza': 'Dania rybne',
  'ryby': 'Dania rybne',
  'fish': 'Dania rybne',
  'fish and seafood': 'Dania rybne',
  'owoce morza': 'Owoce morza',
  'seafood': 'Owoce morza',
  'mięsne': 'Dania mięsne',
  'miesne': 'Dania mięsne',
  'meat': 'Dania mięsne',
  'makarony': 'Makarony/Ravioli',
  'pasta': 'Makarony/Ravioli',
  'ravioli': 'Makarony/Ravioli',
  'dania dla najmłodszych': 'Dla dzieci',
  'dania dla najmlodszych': 'Dla dzieci',
  'dla najmłodszych': 'Dla dzieci',
  'dla najmlodszych': 'Dla dzieci',
  'kids': 'Dla dzieci',
  'kids menu': 'Dla dzieci',
  'surówki': 'Dodatki',
  'surowki': 'Dodatki',
  'sałatka': 'Przystawki',
  'salatka': 'Przystawki',
  'sałatki': 'Przystawki',
  'salatki': 'Przystawki',
  'sałatka w formie bowl': 'Bowle',
  'salatka w formie bowl': 'Bowle',
  'alkohole spirits mocne': 'Napoje alkoholowe',
  'mocne': 'Napoje alkoholowe',
  'spirits': 'Napoje alkoholowe',
  'rum': 'Rum',
  'tequila': 'Tequila',
  'whisky': 'Whisky',
  'gin': 'Gin',
  'brandy cognac likier': 'Brandy / Cognac / Likier',
  'brandy | cognac | likier': 'Brandy / Cognac / Likier',
  'cognac brandy': 'Cognac / Brandy',
  'likiery': 'Brandy / Cognac / Likier',
  'likier': 'Brandy / Cognac / Likier',
  'wódka': 'Wódka',
  'wodka': 'Wódka',
  'nalewki': 'Nalewki',
  'piwo': 'Piwo butelkowe',
  'beer': 'Piwo butelkowe',
  'butelkowe': 'Piwo butelkowe',
  'bottled': 'Piwo butelkowe',
  'bezalkoholowe': 'Piwo bezalkoholowe',
  'alcohol free': 'Piwo bezalkoholowe',
  'piwa regionalne': 'Regionalne',
  'piwo regionalne': 'Regionalne',
  'regionalne': 'Regionalne',
  'regional': 'Regionalne',
  'regional from sopot': 'Regionalne',
  'beczkowe': 'Piwo beczkowe',
  'on tap': 'Piwo beczkowe',
  'spoko koktajle': 'Drinki',
  'cocktails': 'Drinki',
  'drinki': 'Drinki',
  'koktajle': 'Drinki',
  'strefa zero': 'Drinki bezalkoholowe',
  'zero': 'Drinki bezalkoholowe',
  'mocktails': 'Drinki bezalkoholowe',
  'bezalkoholowe koktajle': 'Drinki bezalkoholowe',
  '0% alcohol area': 'Drinki bezalkoholowe',
  '0% alcohol': 'Drinki bezalkoholowe',
  'klasyczne koktaile': 'Klasyczne koktaile',
  'klasyczne koktajle': 'Klasyczne koktaile',
  'grzańce sezonowe': 'Na ciepło',
  'grzance sezonowe': 'Na ciepło',
  'hot drinks': 'Na ciepło',
  'kawy z alkoholem': 'Na ciepło',
  'coffee with alcohol': 'Na ciepło',
  'wina białe': 'Wina Białe',
  'wina biale': 'Wina Białe',
  'white wine': 'Wina Białe',
  'wina czerwone': 'Wina Czerwone',
  'red wine': 'Wina Czerwone',
  'wina musujące': 'Wina Musujące',
  'wina musujace': 'Wina Musujące',
  'prosecco': 'Wina Musujące',
  'napoje zimne': 'Napoje zimne',
  'cold drinks': 'Napoje zimne',
  'lemoniady': 'Napoje zimne',
  'lemoniada': 'Napoje zimne',
  'lemonades': 'Napoje zimne',
  'kawa': 'Kawa',
  'kawy': 'Kawa',
  'kawy sezonowe': 'Kawa',
  'kawy sezonowe 0%': 'Kawa',
  'seasonal coffee': 'Kawa',
  'coffee': 'Kawa',
  'herbata': 'Herbata',
  'tea': 'Herbata',
  'włoskie lemoniady': 'Napoje zimne',
  'wloskie lemoniady': 'Napoje zimne',
  'grzaniec': 'Na ciepło',
  'grzańce': 'Na ciepło',
  'grzance': 'Na ciepło',
  'na chłodniejsze wieczory': 'Na ciepło',
  'na chlodniejsze wieczory': 'Na ciepło',
}

const normalize = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLowerCase()

const normalizeText = (value: string) =>
  value
    .replace(/\u2028|\u2029/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\r/g, '\n')

const normalizeCategoryCandidate = (value: string) =>
  normalize(value)
    .replace(/[()]/g, '')
    .replace(/\s*\|\s*/g, ' | ')
    .replace(/\s+/g, ' ')

export const getCanonicalMenuImportCategory = (value: string) => {
  const candidate = normalizeCategoryCandidate(value)
  return CATEGORY_ALIASES[candidate] ?? null
}

const parsePrice = (value: string) => {
  const normalizedPrice = value
    .replace(/\s/g, '')
    .replace(/zł|pln/gi, '')
    .replace(',-', '')
    .replace(',', '.')

  const price = Number(normalizedPrice)
  return Number.isFinite(price) ? price : null
}

const isNoiseLine = (value: string) => {
  const line = normalize(value)
  if (!line) return true
  if (/^--\s*\d+\s+of\s+\d+\s*--$/.test(line)) return true
  if (/^\d+(\.\d+)?\s*(ml|l|%|vol|alcohol|g|szt)\b/.test(line)) return true
  if (/^(ml|l|vol|alcohol|dry wine|semi-dry wine|semi-sweet|new!?|www\.)/.test(line)) return true
  return false
}

export const parseItemsFromMenuDocumentText = (text: string): ParsedMenuImportItem[] => {
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .filter((line) => !isNoiseLine(line))

  let currentCategory: string | null = null
  const items: ParsedMenuImportItem[] = []

  for (const line of lines) {
    const category = getCanonicalMenuImportCategory(line)
    if (category) {
      currentCategory = category
      continue
    }

    if (!currentCategory) continue

    const match = line.match(/^(.+?)\s+(\d{1,4}(?:[,.]\d{1,2})?)(?:,-| ?zł| ?pln)?$/i)
    if (!match) continue

    const price = parsePrice(match[2])
    const name = match[1]
      .replace(/\s*[|–-]\s*$/, '')
      .trim()

    if (!price || name.length < 2 || !/[a-ząćęłńóśźż]/i.test(name)) continue
    if (/^\d/.test(name) || /^(served|order|enjoy|fresh|dry|semi|home wine)\b/i.test(name)) continue

    items.push({
      category: currentCategory,
      name,
      price,
      description: null,
    })
  }

  const byKey = new Map<string, ParsedMenuImportItem>()
  items.forEach((item) => {
    byKey.set(getMenuImportKey(item), item)
  })

  return Array.from(byKey.values())
}

const PRICE_PATTERN = /(?:^|\s)(\d{1,4})(?:\s*(?:,-|,|\.\d{1,2}|zł|pln|-))?(?=\s|$)/gi

const cleanOcrName = (value: string) =>
  value
    .replace(/[|•]+/g, ' ')
    .replace(/\b(?:ml|l|vol|alcohol|served|with|z|oraz)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const parseItemsFromOcrText = (text: string): ParsedMenuImportItem[] => {
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .filter((line) => !isNoiseLine(line))

  let currentCategory: string | null = null
  const items: ParsedMenuImportItem[] = []

  for (const line of lines) {
    const category = getCanonicalMenuImportCategory(line)
    if (category) {
      currentCategory = category
      continue
    }

    if (!currentCategory) continue

    const priceMatches = Array.from(line.matchAll(PRICE_PATTERN))
      .map((match) => {
        const value = parsePrice(match[1])
        if (value === null || value < 3 || value > 999) return null
        return {
          value,
          index: match.index ?? 0,
          raw: match[0],
        }
      })
      .filter((match): match is { value: number; index: number; raw: string } => match !== null)

    if (priceMatches.length === 0) continue

    if (priceMatches.length === 1) {
      const priceMatch = priceMatches[0]
      const name = cleanOcrName(line.slice(0, priceMatch.index))
      if (name.length >= 2 && /[a-ząćęłńóśźż]/i.test(name) && !/^\d/.test(name)) {
        items.push({
          category: currentCategory,
          name,
          price: priceMatch.value,
          description: null,
        })
      }
      continue
    }

    for (let index = 0; index < priceMatches.length; index += 1) {
      const priceMatch = priceMatches[index]
      const nextPriceMatch = priceMatches[index + 1]
      const previousPriceMatch = priceMatches[index - 1]
      const segmentStart = previousPriceMatch ? previousPriceMatch.index + previousPriceMatch.raw.length : 0
      const segmentEnd = priceMatch.index
      const nextText = nextPriceMatch ? line.slice(priceMatch.index + priceMatch.raw.length, nextPriceMatch.index) : ''
      const name = cleanOcrName(line.slice(segmentStart, segmentEnd))

      if (priceMatches.length > 2 && previousPriceMatch && nextText.trim().length > 2) {
        continue
      }

      if (name.length >= 2 && /[a-ząćęłńóśźż]/i.test(name) && !/^\d/.test(name)) {
        items.push({
          category: currentCategory,
          name,
          price: priceMatch.value,
          description: null,
        })
      }
    }
  }

  const byKey = new Map<string, ParsedMenuImportItem>()
  items.forEach((item) => {
    byKey.set(getMenuImportKey(item), item)
  })

  return Array.from(byKey.values())
}

const extractItemsLiteral = (script: string) => {
  const start = script.indexOf('const items = [')
  const end = script.indexOf('\n\nasync function main', start)

  if (start === -1 || end === -1) {
    throw new Error('Nie udało się znaleźć danych importu w skrypcie.')
  }

  return script.slice(start + 'const items = '.length, end)
}

const loadItemsFromScript = (scriptName: string): unknown[] => {
  const scriptPath = path.join(process.cwd(), 'scripts', scriptName)
  const source = fs.readFileSync(scriptPath, 'utf8')
  const literal = extractItemsLiteral(source)
  const context = vm.createContext({})
  const result = new vm.Script(`(${literal})`).runInContext(context)

  if (!Array.isArray(result)) {
    throw new Error('Import nie zwrócił listy pozycji.')
  }

  return result
}

const mapRawItems = (rawItems: unknown[]): ParsedMenuImportItem[] =>
  rawItems
    .map((item) => {
      if (Array.isArray(item)) {
        const [category, name, price, description] = item
        return {
          category: String(category),
          name: String(name),
          price: Number(price),
          description: description ? String(description) : null,
        }
      }

      const objectItem = item as Partial<ParsedMenuImportItem>
      return {
        category: String(objectItem.category ?? ''),
        name: String(objectItem.name ?? ''),
        price: Number(objectItem.price),
        description: objectItem.description ? String(objectItem.description) : null,
      }
    })
    .filter((item) => item.category && item.name && Number.isFinite(item.price))

const loadItemsFromFallbackScript = (type: Exclude<ImportDocumentType, 'full' | 'other'>) =>
  mapRawItems(loadItemsFromScript(SCRIPT_BY_TYPE[type]))

const parsePdfTextFromUrl = async (url: string) => {
  const parser = new PDFParse({ url })
  try {
    const result = await parser.getText()
    return result.text
  } finally {
    await parser.destroy()
  }
}

export const parseMenuDocumentForImport = async (
  type: ImportDocumentType,
  documentUrl?: string,
): Promise<ParsedMenuImportItem[]> => {
  if (type === 'full' && !documentUrl) {
    return [
      ...(await parseMenuDocumentForImport('menu')),
      ...(await parseMenuDocumentForImport('drinks')),
    ]
  }

  if (type === 'other') {
    throw new Error('Import pozycji jest dostępny tylko dla dokumentów typu Menu, Napoje albo Pełna karta.')
  }

  if (!documentUrl && type !== 'full') {
    return loadItemsFromFallbackScript(type)
  }

  if (!documentUrl) {
    throw new Error('Nie znaleziono adresu pliku PDF do importu.')
  }

  const text = await parsePdfTextFromUrl(documentUrl)
  const meaningfulText = text
    .replace(/--\s*\d+\s+of\s+\d+\s*--/g, '')
    .trim()

  if (meaningfulText.length < 200) {
    throw new Error('Ten PDF nie zawiera tekstu możliwego do odczytania. Wgraj wersję PDF z tekstem, nie sam obraz ani mocno skompresowany plik do druku.')
  }

  const parsedItems = parseItemsFromMenuDocumentText(text)
  if (parsedItems.length < 5) {
    throw new Error(
      `Nie udało się rozpoznać pozycji menu w tym PDF-ie. Rozpoznano tylko ${parsedItems.length} pozycji, więc import został przerwany. Wgraj wersję PDF z prostą warstwą tekstową: kategoria, nazwa pozycji i cena.`
    )
  }

  return parsedItems
}

const getToolErrorMessage = (tool: string) =>
  `Na serwerze brakuje narzędzia ${tool}, które jest wymagane do OCR. Zainstaluj poppler-utils oraz tesseract-ocr z językami polskim i angielskim.`

const runTool = async (
  command: string,
  args: string[],
  timeoutMs: number,
  errorMessage: string,
  maxBuffer = 10 * 1024 * 1024,
) => {
  try {
    return await execFileAsync(command, args, {
      timeout: timeoutMs,
      maxBuffer,
    })
  } catch (error) {
    const typedError = error as NodeJS.ErrnoException & { stderr?: string; signal?: string }
    if (typedError.code === 'ENOENT') {
      throw new Error(getToolErrorMessage(command))
    }
    if (typedError.signal === 'SIGTERM' || typedError.code === 'ETIMEDOUT') {
      throw new Error(errorMessage)
    }
    const details = typedError.stderr?.trim()
    throw new Error(details ? `${errorMessage} (${details})` : errorMessage)
  }
}

const downloadPdfToFile = async (documentUrl: string, tmpDir: string, timeoutMs: number) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(documentUrl, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Nie udało się pobrać PDF-a do OCR. Serwer zwrócił status ${response.status}.`)
    }

    const pdfPath = path.join(tmpDir, 'menu.pdf')
    await fs.promises.writeFile(pdfPath, Buffer.from(await response.arrayBuffer()))
    return pdfPath
  } finally {
    clearTimeout(timeout)
  }
}

const getPdfPageCount = async (pdfPath: string) => {
  const { stdout } = await runTool(
    'pdfinfo',
    [pdfPath],
    30 * 1000,
    'Nie udało się odczytać liczby stron PDF-a. Plik może być uszkodzony.',
    1024 * 1024,
  )
  const match = stdout.match(/^Pages:\s+(\d+)/m)
  if (!match) {
    throw new Error('Nie udało się odczytać liczby stron PDF-a. Plik może być uszkodzony.')
  }
  return Number(match[1])
}

const renderPdfPage = async (pdfPath: string, tmpDir: string, pageNumber: number, timeoutMs: number, resolutionDpi = OCR_RENDER_DPI) => {
  const prefix = path.join(tmpDir, `page-${pageNumber}`)
  await runTool(
    'pdftoppm',
    ['-f', String(pageNumber), '-l', String(pageNumber), '-r', String(resolutionDpi), '-png', pdfPath, prefix],
    timeoutMs,
    `Nie udało się przygotować strony ${pageNumber} do OCR. Plik może mieć zbyt ciężką grafikę.`,
    1024 * 1024,
  )

  const files = await fs.promises.readdir(tmpDir)
  const imageFile = files.find((file) => file.startsWith(`page-${pageNumber}-`) && file.endsWith('.png'))
  if (!imageFile) {
    throw new Error(`Nie udało się przygotować strony ${pageNumber} do OCR. Spróbuj wgrać lżejszy PDF.`)
  }
  return path.join(tmpDir, imageFile)
}

const recognizeImage = async (imagePath: string, pageNumber: number, timeoutMs: number) => {
  const { stdout } = await runTool(
    'tesseract',
    [imagePath, 'stdout', '-l', 'pol+eng', '--psm', '6', '--oem', '1'],
    timeoutMs,
    `OCR zatrzymał się na stronie ${pageNumber}. Wgraj lżejszy PDF albo podziel plik na mniejsze części.`,
    20 * 1024 * 1024,
  )
  return stdout
}

const MENU_AI_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          category: { type: 'string' },
          name: { type: 'string' },
          description: { type: ['string', 'null'] },
          price: { type: ['number', 'null'] },
          variants: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                label: { type: 'string' },
                price: { type: 'number' },
              },
              required: ['label', 'price'],
            },
          },
          optionGroups: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string' },
                required: { type: 'boolean' },
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                      label: { type: 'string' },
                      price: { type: 'number' },
                    },
                    required: ['label', 'price'],
                  },
                },
              },
              required: ['name', 'required', 'options'],
            },
          },
        },
        required: ['category', 'name', 'description', 'price', 'variants', 'optionGroups'],
      },
    },
  },
  required: ['items'],
} as const

const MENU_AI_SYSTEM_PROMPT = `Jestes ekspertem od przepisywania menu restauracji z PDF/obrazu do danych strukturalnych.
Zadanie: odczytaj pozycje menu z pojedynczej strony PDF restauracji Spoko Sopot.
Zwracaj wylacznie pozycje sprzedazowe: kategorie, nazwe, opis, ceny i grupy wyboru.
Ignoruj dekoracje, zdjecia, numery stron, stopki, teksty promocyjne i angielskie tlumaczenia kategorii.
Nie tworz osobnych pozycji dla konfiguratorow, skladnikow i dodatkow. Jesli pod daniem jest sekcja wyboru, zapisz ja w optionGroups. Przyklad: danie "Surówka 150 g" z opcjami "z białej kapusty", "z buraka" itd. ma jedna pozycje bazowa i optionGroups:[{"name":"Wybierz rodzaj","required":true,"options":[{"label":"z białej kapusty","price":9}]}]. To samo dotyczy "Sałatka w formie bowl" z opcjami bazy i dodatkow.
Jesli pozycja ma jedna cene, wpisz ja w price i zostaw variants jako pusta tablice. W optionGroups umieszczaj tylko wybory klienta, nie warianty rozmiaru/pojemności.
Jesli ten sam produkt ma kilka wariantow cenowych, np. kolumny 40 ml i 500 ml, wpisz nazwe produktu raz, price ustaw na null, a warianty dodaj jako [{"label":"40 ml","price":18},{"label":"500 ml","price":139}].
Przy napojach i alkoholu zawsze zachowuj widoczna objetosc w nazwie albo wariancie: 40 ml, 200 ml, 330 ml, 500 ml, 700 ml, 1 l. Nie zostawiaj samej nazwy napoju, jesli PDF pokazuje objetosc.
Jesli objetosc dotyczy calej sekcji/kolumny, przenies ja do wariantu lub nazwy kazdej pozycji z tej sekcji. Przyklad: "Wyborowa" pod kolumna "40 ml" => wariant "40 ml"; "Lech 500 ml" => nazwa "Lech 500 ml".
Jesli PDF podaje procent alkoholu dla sekcji albo pozycji, nie tworz z niego osobnej pozycji. Dopisz go do description, np. "8-9% vol.", "36-40% alcohol", "25-30% alcohol".
Ceny zapisuj jako liczby: 18,- to 18, 18 zl to 18. Nie zgaduj cen, jesli wiersz jest nieczytelny.
Kategorie maja byc mozliwie konkretne. Dla piwa rozrozniaj: Piwo butelkowe, Piwo beczkowe, Regionalne, Piwo bezalkoholowe, Piwo smakowe. Dla alkoholi mocnych uzywaj m.in.: Wodka, Gin, Rum, Whisky, Tequila, Nalewki, Brandy / Cognac / Likier. Dla napojow uzywaj m.in.: Napoje zimne, Kawa, Herbata, Drinki, Drinki bezalkoholowe, Klasyczne koktaile, Wina Biale, Wina Czerwone, Wina Musujace.
Mapuj sekcje praktycznie: "Strefa zero" to Drinki bezalkoholowe, "Lemoniady" to Napoje zimne, "Kawy sezonowe" to Kawa, "Regionalne" przy piwie to Regionalne.
Nie lacz kilku roznych produktow w jedna pozycje.`

const cleanAiValue = (value: unknown) => {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim()
}

const canonicalizeAiCategory = (value: unknown) => {
  const cleaned = cleanAiValue(value)
  if (!cleaned) return 'Inne'
  return getCanonicalMenuImportCategory(cleaned) || cleaned
}

const IGNORED_AI_CATEGORY_NAMES = new Set([
  'sałatka w formie bowl',
  'salatka w formie bowl',
])

const IGNORED_AI_ITEM_NAMES = new Set([
  'nasza baza',
  'falafel 5 szt',
  'grillowany kurczak 100 g',
  'krewetki 5 szt',
])

const shouldIgnoreAiMenuItem = (category: string, name: string) => {
  const normalizedCategory = normalize(category)
  const normalizedName = normalize(name)
  return (
    IGNORED_AI_CATEGORY_NAMES.has(normalizedCategory) ||
    IGNORED_AI_ITEM_NAMES.has(normalizedName)
  )
}

const normalizeVariantLabel = (value: unknown) => {
  const cleaned = cleanAiValue(value)
  if (!cleaned) return ''
  return cleaned
    .replace(/([0-9])\s*(ml|l|g|kg|szt\.?|os\.?)$/i, '$1 $2')
    .replace(/\.$/, '')
}

const normalizeOptionGroups = (groups: unknown): MenuOptionGroup[] => {
  if (!Array.isArray(groups)) return []
  return groups.flatMap((group) => {
    if (!group || typeof group !== 'object') return []
    const source = group as Record<string, unknown>
    const name = cleanAiValue(source.name)
    const options = Array.isArray(source.options)
      ? source.options.flatMap((option) => {
          if (!option || typeof option !== 'object') return []
          const sourceOption = option as Record<string, unknown>
          const label = cleanAiValue(sourceOption.label)
          const price = Number(sourceOption.price)
          return label && isValidAiPrice(price) ? [{ label, price }] : []
        })
      : []
    return name && options.length > 0
      ? [{ name, required: source.required !== false, options }]
      : []
  })
}

const appendVariantLabel = (name: string, label: string) => {
  if (!label) return name
  const normalizedName = normalize(name)
  const normalizedLabel = normalize(label)
  if (normalizedName.includes(normalizedLabel)) return name
  return `${name} ${label}`.trim()
}

const isValidAiPrice = (price: unknown): price is number =>
  typeof price === 'number' && Number.isFinite(price) && price > 0

const normalizeAiItems = (items: AiMenuItem[]) => {
  const parsed: ParsedMenuImportItem[] = []
  const seen = new Set<string>()

  for (const item of items) {
    const category = canonicalizeAiCategory(item.category)
    const name = cleanAiValue(item.name)
    const description = cleanAiValue(item.description) || null
    const optionGroups = normalizeOptionGroups(item.optionGroups)

    if (!name) continue
    if (shouldIgnoreAiMenuItem(category, name) && optionGroups.length === 0) continue

    if (Array.isArray(item.variants) && item.variants.length > 0) {
      for (const variant of item.variants) {
        if (!isValidAiPrice(variant.price)) continue
        const variantName = appendVariantLabel(name, normalizeVariantLabel(variant.label))
        const parsedItem = { category, name: variantName, price: variant.price, description, optionGroups }
        const key = getMenuImportKey(parsedItem)
        if (seen.has(key)) continue
        seen.add(key)
        parsed.push(parsedItem)
      }
      continue
    }

    if (!isValidAiPrice(item.price)) continue
    const parsedItem = { category, name, price: item.price, description, optionGroups }
    const key = getMenuImportKey(parsedItem)
    if (seen.has(key)) continue
    seen.add(key)
    parsed.push(parsedItem)
  }

  return parsed
}

const callOpenAiMenuVision = async (
  imagePath: string,
  pageNumber: number,
  totalPages: number,
  timeoutMs: number,
): Promise<AiMenuPageResponse> => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Brakuje OPENAI_API_KEY w konfiguracji serwera. Import AI nie moze zostac uruchomiony.')
  }

  const image = await fs.promises.readFile(imagePath)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MENU_AI_IMPORT_MODEL,
        temperature: 0,
        max_tokens: 3500,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'spoko_menu_page_import',
            strict: true,
            schema: MENU_AI_RESPONSE_SCHEMA,
          },
        },
        messages: [
          { role: 'system', content: MENU_AI_SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Odczytaj pozycje menu ze strony ${pageNumber} z ${totalPages}. Zachowaj konkretne kategorie i warianty cenowe.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${image.toString('base64')}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
      }),
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      const message = payload?.error?.message || 'Nieznany blad OpenAI API.'
      throw new Error(`Import AI nie powiodl sie dla strony ${pageNumber}: ${message}`)
    }

    const content = payload?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error(`Import AI nie zwrocil danych dla strony ${pageNumber}.`)
    }

    return JSON.parse(content) as AiMenuPageResponse
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Import AI przekroczyl limit czasu dla strony ${pageNumber}.`)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export const parseMenuDocumentWithAi = async (
  documentUrl: string,
  options: OcrOptions = {},
): Promise<AiMenuImportResult> => {
  const startedAt = Date.now()
  const timeoutMs = options.timeoutMs ?? 20 * 60 * 1000
  const pageTimeoutMs = options.pageTimeoutMs ?? 120 * 1000
  const assertWithinTimeLimit = () => {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error('Import AI trwa zbyt dlugo. Wgraj lzejszy PDF albo podziel menu na kilka plikow.')
    }
  }

  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `spoko-menu-ai-${randomUUID()}-`))
  const pages: AiMenuImportResult['pages'] = []
  const allItems: ParsedMenuImportItem[] = []
  let totalPages = 0

  try {
    options.onProgress?.({ stage: 'rendering', message: 'Pobieramy PDF do importu AI.' })
    const pdfPath = await downloadPdfToFile(documentUrl, tmpDir, 45 * 1000)

    options.onProgress?.({ stage: 'rendering', message: 'Sprawdzamy liczbe stron w PDF-ie.' })
    totalPages = await getPdfPageCount(pdfPath)

    if (totalPages > 40) {
      throw new Error('Ten PDF ma zbyt duzo stron do importu AI. Podziel menu na mniejsze pliki.')
    }

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      assertWithinTimeLimit()
      options.onProgress?.({
        stage: 'rendering',
        message: `Przygotowujemy strone ${pageNumber} z ${totalPages}.`,
        currentPage: pageNumber,
        totalPages,
      })
      const imagePath = await renderPdfPage(pdfPath, tmpDir, pageNumber, 75 * 1000, AI_RENDER_DPI)

      assertWithinTimeLimit()
      options.onProgress?.({
        stage: 'analyzing',
        message: `AI odczytuje pozycje ze strony ${pageNumber} z ${totalPages}.`,
        currentPage: pageNumber,
        totalPages,
      })
      const aiPage = await callOpenAiMenuVision(imagePath, pageNumber, totalPages, pageTimeoutMs)
      const pageItems = normalizeAiItems(aiPage.items || [])
      allItems.push(...pageItems)
      pages.push({
        pageNumber,
        text: pageItems
          .map((item) => `${item.category} | ${item.name} | ${item.price}${item.description ? ` | ${item.description}` : ''}`)
          .join('\n'),
      })
    }
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true })
  }

  const items = Array.from(new Map(allItems.map((item) => [getMenuImportKey(item), item])).values())
  if (items.length === 0) {
    throw new Error('AI nie rozpoznalo zadnych pozycji menu w tym pliku.')
  }

  return {
    text: pages.map((page) => `--- Strona ${page.pageNumber} ---\n${page.text}`).join('\n\n'),
    pages,
    items,
  }
}

export const parseMenuDocumentWithOcr = async (
  documentUrl: string,
  options: OcrOptions = {},
): Promise<OcrMenuImportResult> => {
  const startedAt = Date.now()
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000
  const pageTimeoutMs = options.pageTimeoutMs ?? 75 * 1000
  const assertWithinTimeLimit = () => {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error('OCR trwał zbyt długo. Wgraj lżejszy PDF albo podziel menu na kilka plików.')
    }
  }

  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), `spoko-menu-ocr-${randomUUID()}-`))
  const pages: OcrMenuImportResult['pages'] = []
  let totalPages = 0

  try {
    options.onProgress?.({
      stage: 'rendering',
      message: 'Pobieramy PDF do OCR.',
    })
    const pdfPath = await downloadPdfToFile(documentUrl, tmpDir, 45 * 1000)

    options.onProgress?.({
      stage: 'rendering',
      message: 'Sprawdzamy liczbę stron w PDF-ie.',
    })
    totalPages = await getPdfPageCount(pdfPath)

    if (totalPages > 40) {
      throw new Error('Ten PDF ma zbyt dużo stron do OCR. Podziel menu na mniejsze pliki.')
    }

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      assertWithinTimeLimit()
      options.onProgress?.({
        stage: 'rendering',
        message: `Przygotowujemy stronę ${pageNumber} z ${totalPages}.`,
        currentPage: pageNumber,
        totalPages,
      })
      const imagePath = await renderPdfPage(pdfPath, tmpDir, pageNumber, pageTimeoutMs)

      assertWithinTimeLimit()
      options.onProgress?.({
        stage: 'recognizing',
        message: `Rozpoznajemy stronę ${pageNumber} z ${totalPages}.`,
        currentPage: pageNumber,
        totalPages,
      })
      const text = await recognizeImage(imagePath, pageNumber, pageTimeoutMs)
      pages.push({
        pageNumber,
        text,
      })
    }
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true })
  }

  if (pages.length === 0) {
    throw new Error('OCR nie zwrócił żadnego tekstu z PDF-a. Spróbuj wgrać plik w lepszej jakości.')
  }

  options.onProgress?.({
    stage: 'parsing',
    message: 'Układamy rozpoznany tekst w pozycje menu.',
    totalPages,
  })
  const text = pages.map((page) => page.text).join('\n')
  const textItems = parseItemsFromMenuDocumentText(text)
  const ocrItems = parseItemsFromOcrText(text)
  const byKey = new Map<string, ParsedMenuImportItem>()

  ;[...textItems, ...ocrItems].forEach((item) => {
    byKey.set(getMenuImportKey(item), item)
  })

  return {
    text,
    pages,
    items: Array.from(byKey.values()),
  }
}

export const getMenuImportKey = (item: Pick<ParsedMenuImportItem, 'category' | 'name'>) =>
  `${normalize(item.category)}:${normalize(item.name)}`
