import '../node_modules/dotenv/config.js'

import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { uploadToR2 } from '../src/utils/uploadToR2'
import { sanitizeImageFilename } from '../src/utils/sanitizeImageFilename'

const prisma = new PrismaClient()

const files = [
  {
    path: '/Users/edward_t/Documents/Projects/Spoko files/Spoko_Menu_dania_cmyk_druk_A4_3mm_spady.pdf',
    title: 'Menu dań',
    type: 'menu' as const,
  },
  {
    path: '/Users/edward_t/Documents/Projects/Spoko files/Spoko_Menu_napoje_rgb_druk_A4_3mm_spady.pdf',
    title: 'Menu napojów',
    type: 'drinks' as const,
  },
]

async function main() {
  const docs = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const buffer = await readFile(file.path)
    const original = file.path.split('/').pop() ?? `menu-${file.type}.pdf`
    const filename = sanitizeImageFilename(`pdf-${file.type}-${original}`)
    const url = await uploadToR2(buffer, `menu-pdfs/${filename}`, 'application/pdf')

    docs.push({
      id: randomUUID(),
      title: file.title,
      url,
      type: file.type,
      sortOrder: i,
      isActive: true,
    })

    console.log(`uploaded ${file.title}: ${url}`)
  }

  const settings = await prisma.settings.findFirst()
  if (!settings) throw new Error('Settings not found')

  await prisma.settings.update({
    where: { id: settings.id },
    data: { menuDocuments: docs },
  })

  console.log(JSON.stringify(docs, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
