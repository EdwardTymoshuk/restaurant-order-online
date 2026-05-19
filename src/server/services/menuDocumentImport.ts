import fs from 'fs'
import path from 'path'
import vm from 'vm'

export type ImportDocumentType = 'menu' | 'drinks' | 'other'

export type ParsedMenuImportItem = {
  category: string
  name: string
  price: number
  description: string | null
}

const SCRIPT_BY_TYPE: Record<Exclude<ImportDocumentType, 'other'>, string> = {
  menu: 'import-spoko-menu-from-pdf.js',
  drinks: 'import-spoko-drinks-from-pdf.js',
}

const normalize = (value: string) =>
  value.trim().replace(/\s+/g, ' ').toLowerCase()

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

export const parseMenuDocumentForImport = (type: ImportDocumentType): ParsedMenuImportItem[] => {
  if (type === 'other') {
    throw new Error('Import pozycji jest dostępny tylko dla dokumentów typu Menu albo Napoje.')
  }

  const rawItems = loadItemsFromScript(SCRIPT_BY_TYPE[type])

  return rawItems
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
}

export const getMenuImportKey = (item: Pick<ParsedMenuImportItem, 'category' | 'name'>) =>
  `${normalize(item.category)}:${normalize(item.name)}`
