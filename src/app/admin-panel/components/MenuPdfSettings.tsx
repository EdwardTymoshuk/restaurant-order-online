'use client'

import { Button } from '@/app/components/ui/button'
import { Card, CardContent } from '@/app/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { Switch } from '@/app/components/ui/switch'
import { Textarea } from '@/app/components/ui/textarea'
import { MenuDownloadDocument } from '@/app/types/types'
import type { MenuOptionGroup } from '@/app/types/types'
import { sanitizeImageFilename } from '@/utils/sanitizeImageFilename'
import { cn } from '@/utils/utils'
import { trpc } from '@/utils/trpc'
import { ArrowDown, ArrowUp, FileDown, FileText, Loader2, Pencil, Plus, Save, ScanText, Sparkles, Trash2, Upload, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

type MenuDocumentType = MenuDownloadDocument['type']

type ImportPreviewItem = {
  id?: string
  category: string
  name: string
  price: number
  currentPrice?: number
  description?: string | null
}

type ImportPreview = {
  type: MenuDocumentType
  documentId?: string
  total: number
  created: ImportPreviewItem[]
  updated: ImportPreviewItem[]
  unchanged: ImportPreviewItem[]
  missing: Required<Pick<ImportPreviewItem, 'id' | 'category' | 'name' | 'price'>>[]
}

type OcrReviewItem = {
  rowId: string
  category: string
  name: string
  price: number
  description: string
  optionGroups?: MenuOptionGroup[]
}

type OcrReview = ImportPreview & {
  documentUrl: string
  ocrText: string
  items: OcrReviewItem[]
  recognitionSource?: 'ocr' | 'ai'
}

const DOCUMENT_TYPE_OPTIONS: Array<{ value: MenuDocumentType; label: string }> = [
  { value: 'menu', label: 'Menu' },
  { value: 'drinks', label: 'Napoje' },
  { value: 'full', label: 'Pełna karta' },
  { value: 'other', label: 'Inne' },
]

const inferDocumentType = (fileName: string): MenuDocumentType => {
  const normalized = fileName.toLowerCase()
  if (
    normalized.includes('pelna') ||
    normalized.includes('pełna') ||
    normalized.includes('calosc') ||
    normalized.includes('całość') ||
    normalized.includes('full')
  ) {
    return 'full'
  }
  if (normalized.includes('napoj') || normalized.includes('drink') || normalized.includes('beverage')) {
    return 'drinks'
  }
  return 'menu'
}

const getDefaultTitle = (fileName: string) =>
  fileName.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Nowy PDF'

const MAX_MENU_PDF_SIZE_MB = 50
const MAX_MENU_PDF_SIZE_BYTES = MAX_MENU_PDF_SIZE_MB * 1024 * 1024

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

const formatDateTime = (value?: string) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const normalizeMenuDocuments = (docs: MenuDownloadDocument[]) =>
  [...docs]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((doc, index) => ({ ...doc, sortOrder: index }))

const formatMetaLine = (label: string, date?: string, actor?: string) => {
  const formattedDate = formatDateTime(date)
  if (!formattedDate && !actor) return null
  if (!formattedDate) return `${label}: ${actor}`
  return `${label}: ${formattedDate}${actor ? ` · ${actor}` : ''}`
}

const MenuPdfSettings = ({ menuDocuments }: { menuDocuments: MenuDownloadDocument[] }) => {
  const [documents, setDocuments] = useState<MenuDownloadDocument[]>(normalizeMenuDocuments(menuDocuments))
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [dropzoneDragging, setDropzoneDragging] = useState(false)
  const [pendingReplaceId, setPendingReplaceId] = useState<string | null>(null)
  const [expandedDocumentId, setExpandedDocumentId] = useState<string | null>(null)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [ocrReview, setOcrReview] = useState<OcrReview | null>(null)
  const [ocrJobId, setOcrJobId] = useState<string | null>(null)
  const [ocrJobStatus, setOcrJobStatus] = useState<{
    message: string
    currentPage?: number
    totalPages?: number
  } | null>(null)
  const [selectedArchiveIds, setSelectedArchiveIds] = useState<string[]>([])
  const [editDraft, setEditDraft] = useState<{ title: string; type: MenuDocumentType }>({
    title: '',
    type: 'menu',
  })
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const queryClient = useQueryClient()
  const isUploading = uploadingId !== null

  const saveMenuDocuments = trpc.settings.updateMenuDocuments.useMutation()
  const previewMenuDocumentImport = trpc.menu.previewMenuDocumentImport.useMutation()
  const importMenuFromDocument = trpc.menu.importMenuFromDocument.useMutation()
  const startMenuDocumentOcr = trpc.menu.startMenuDocumentOcr.useMutation()
  const startMenuDocumentAiImport = trpc.menu.startMenuDocumentAiImport.useMutation()
  const ocrJobQuery = trpc.menu.getMenuDocumentOcrJob.useQuery(
    { jobId: ocrJobId ?? '00000000-0000-0000-0000-000000000000' },
    {
      enabled: Boolean(ocrJobId),
      refetchInterval: ocrJobId ? 2500 : false,
    }
  )
  const previewReviewedMenuImport = trpc.menu.previewReviewedMenuImport.useMutation()
  const importReviewedMenuItems = trpc.menu.importReviewedMenuItems.useMutation()

  useEffect(() => {
    setDocuments(normalizeMenuDocuments(menuDocuments))
  }, [menuDocuments])

  useEffect(() => {
    const job = ocrJobQuery.data
    if (!job || !ocrJobId) return

    if (job.status === 'processing') {
      setOcrJobStatus({
        message: job.message,
        currentPage: job.currentPage,
        totalPages: job.totalPages,
      })
      return
    }

    if (job.status === 'completed') {
      setOcrReview({
        ...job.result,
        items: job.result.items.map((item, index) => ({
          rowId: `${Date.now()}-${index}`,
          category: item.category,
          name: item.name,
          price: item.price,
          description: item.description ?? '',
          optionGroups: item.optionGroups,
        })),
      })
      setSelectedArchiveIds(job.result.missing.map((item) => item.id))
      setImportingId(null)
      setOcrJobId(null)
      setOcrJobStatus(null)
      toast.success(job.message)
    }

    if (job.status === 'failed') {
      setImportingId(null)
      setOcrJobId(null)
      setOcrJobStatus(null)
      toast.error(job.message)
    }
  }, [ocrJobId, ocrJobQuery.data])

  const normalizedDocuments = useMemo(
    () => documents.map((doc, index) => ({ ...doc, sortOrder: index })),
    [documents]
  )
  const activeDocumentsCount = normalizedDocuments.filter((doc) => doc.isActive).length

  const resetImportControls = () => {
    setDropzoneDragging(false)
    setPendingReplaceId(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const persist = async (nextDocuments: MenuDownloadDocument[], options?: { notify?: boolean }) => {
    setSaving(true)
    let saved = false
    try {
      const updatedSettings = await saveMenuDocuments.mutateAsync(
        nextDocuments.map((doc, index) => ({ ...doc, sortOrder: index }))
      )
      const savedDocuments = Array.isArray(updatedSettings.menuDocuments)
        ? (updatedSettings.menuDocuments as unknown as MenuDownloadDocument[])
        : nextDocuments
      setDocuments(normalizeMenuDocuments(savedDocuments))
      saved = true
      if (options?.notify) {
        toast.success('Dokumenty PDF zostały zapisane.')
      }
    } catch (error) {
      console.error(error)
      toast.error('Nie udało się zapisać dokumentów PDF.')
    } finally {
      setSaving(false)
      if (saved) {
        resetImportControls()
      }
    }
  }

  const saveCurrentDocuments = async (nextDocuments: MenuDownloadDocument[]) => {
    const normalized = nextDocuments.map((doc, index) => ({ ...doc, sortOrder: index }))
    setDocuments(normalized)
    await persist(normalized)
  }

  const updateDocument = async (id: string, patch: Partial<MenuDownloadDocument>) => {
    const nextDocuments = documents.map((doc) => (doc.id === id ? { ...doc, ...patch } : doc))
    await saveCurrentDocuments(nextDocuments)
  }

  const updateDocumentImportMeta = (
    documentId: string | undefined,
    meta?: { importedAt: string; importedBy: string } | null
  ) => {
    if (!documentId || !meta) return

    setDocuments((current) =>
      normalizeMenuDocuments(
        current.map((doc) =>
          doc.id === documentId
            ? {
                ...doc,
                importedAt: meta.importedAt,
                importedBy: meta.importedBy,
              }
            : doc
        )
      )
    )
  }

  const startEditingDocument = (doc: MenuDownloadDocument) => {
    setExpandedDocumentId(doc.id)
    setEditDraft({
      title: doc.title,
      type: doc.type,
    })
  }

  const cancelEditingDocument = () => {
    setExpandedDocumentId(null)
    setEditDraft({ title: '', type: 'menu' })
  }

  const saveEditingDocument = async (id: string) => {
    const title = editDraft.title.trim()
    if (!title) {
      toast.error('Podaj tytuł PDF-a.')
      return
    }

    await updateDocument(id, {
      title,
      type: editDraft.type,
    })
    cancelEditingDocument()
  }

  const removeDocument = async (id: string) => {
    const nextDocuments = documents.filter((doc) => doc.id !== id)
    if (expandedDocumentId === id) {
      setExpandedDocumentId(null)
    }
    await saveCurrentDocuments(nextDocuments)
  }

  const moveDocument = async (id: string, direction: -1 | 1) => {
    const index = documents.findIndex((doc) => doc.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= documents.length) return

    const next = [...documents]
    ;[next[index], next[target]] = [next[target], next[index]]
    await saveCurrentDocuments(next)
  }

  const uploadPdfFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Wgraj plik PDF.')
      return
    }

    if (file.size > MAX_MENU_PDF_SIZE_BYTES) {
      toast.error(
        `PDF jest za duży (${Math.ceil(file.size / 1024 / 1024)} MB). Wgraj wersję do internetu, maksymalnie ${MAX_MENU_PDF_SIZE_MB} MB.`
      )
      return
    }

    setUploadingId(pendingReplaceId ?? 'new')
    try {
      const formData = new FormData()
      const filename = sanitizeImageFilename(file.name || `menu-${Date.now()}.pdf`)
      formData.append('file', file, filename)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('Plik jest za duży. Wgraj lżejszą wersję PDF do internetu.')
        }
        throw new Error('Upload failed')
      }

      const { imageUrl } = await response.json()
      const baseDoc: MenuDownloadDocument = {
        id: crypto.randomUUID(),
        title: getDefaultTitle(file.name),
        url: imageUrl,
        type: inferDocumentType(file.name),
        sortOrder: documents.length,
        isActive: true,
        uploadedAt: new Date().toISOString(),
      }

      if (pendingReplaceId) {
        const nextDocuments = documents.map((doc) =>
          doc.id === pendingReplaceId
            ? {
                ...doc,
                url: imageUrl,
                title: doc.title || baseDoc.title,
                type: doc.type || baseDoc.type,
                uploadedAt: baseDoc.uploadedAt,
                uploadedBy: undefined,
                importedAt: undefined,
                importedBy: undefined,
              }
            : doc
        )
        await saveCurrentDocuments(nextDocuments)
      } else {
        await saveCurrentDocuments([...documents, baseDoc])
      }

      toast.success('PDF został wgrany. Teraz możesz ustawić tytuł i widoczność.')
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'Nie udało się wgrać PDF-a.')
    } finally {
      setUploadingId(null)
      setPendingReplaceId(null)
    }
  }

  const handleFileSelection = async (files: FileList | File[]) => {
    if (isUploading) return
    const nextFiles = Array.from(files)
    if (nextFiles.length === 0) return

    for (const file of nextFiles) {
      await uploadPdfFile(file)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openPicker = (replaceId?: string) => {
    if (isUploading) return
    setPendingReplaceId(replaceId ?? null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    fileInputRef.current?.click()
  }

  const handleDropzoneDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDropzoneDragging(false)
    await handleFileSelection(event.dataTransfer.files)
  }

  const previewDocumentImport = async (doc: MenuDownloadDocument) => {
    if (doc.type === 'other') {
      toast.error('Import pozycji działa tylko dla dokumentów typu Menu, Napoje albo Pełna karta.')
      return
    }

    setImportingId(doc.id)
    try {
      const preview = await previewMenuDocumentImport.mutateAsync({ type: doc.type, documentId: doc.id })
      setImportPreview(preview)
      setSelectedArchiveIds(preview.missing.map((item) => item.id))
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, 'Nie udało się przygotować podsumowania importu.'))
    } finally {
      setImportingId(null)
    }
  }

  const startOcrReview = async (doc: MenuDownloadDocument) => {
    if (doc.type === 'other') {
      toast.error('OCR pozycji działa tylko dla dokumentów typu Menu, Napoje albo Pełna karta.')
      return
    }

    setImportingId(`ocr-${doc.id}`)
    setOcrReview(null)
    setOcrJobId(null)
    setOcrJobStatus({
      message: 'Uruchamiamy OCR dla pliku PDF.',
    })
    try {
      const job = await startMenuDocumentOcr.mutateAsync({ type: doc.type, documentId: doc.id })
      setOcrJobId(job.jobId)
      setOcrJobStatus({
        message: job.message,
      })
      toast.info(job.message)
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, 'Nie udało się wykonać OCR pliku PDF.'))
      setImportingId(null)
      setOcrJobStatus(null)
    }
  }

  const startAiReview = async (doc: MenuDownloadDocument) => {
    if (doc.type === 'other') {
      toast.error('Rozpoznawanie działa tylko dla dokumentów typu Menu, Napoje albo Pełna karta.')
      return
    }

    setImportingId(`ai-${doc.id}`)
    setOcrReview(null)
    setOcrJobId(null)
    setOcrJobStatus({
      message: 'Przygotowujemy plik do rozpoznania menu.',
    })
    try {
      const job = await startMenuDocumentAiImport.mutateAsync({ type: doc.type, documentId: doc.id })
      setOcrJobId(job.jobId)
      setOcrJobStatus({
        message: job.message,
      })
      toast.info(job.message)
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, 'Nie udało się rozpocząć rozpoznawania menu.'))
      setImportingId(null)
      setOcrJobStatus(null)
    }
  }

  const updateOcrItem = (rowId: string, patch: Partial<OcrReviewItem>) => {
    setOcrReview((current) => {
      if (!current) return current
      return {
        ...current,
        items: current.items.map((item) => (item.rowId === rowId ? { ...item, ...patch } : item)),
      }
    })
  }

  const addOcrItem = () => {
    setOcrReview((current) => {
      if (!current) return current
      return {
        ...current,
        items: [
          ...current.items,
          {
            rowId: crypto.randomUUID(),
            category: current.type === 'drinks' ? 'Napoje zimne' : 'Dania główne',
            name: '',
            price: 0,
            description: '',
            optionGroups: [],
          },
        ],
      }
    })
  }

  const removeOcrItem = (rowId: string) => {
    setOcrReview((current) => {
      if (!current) return current
      return {
        ...current,
        items: current.items.filter((item) => item.rowId !== rowId),
      }
    })
  }

  const getReviewedItemsForApi = (review: OcrReview) =>
    review.items
      .map((item) => ({
        category: item.category.trim(),
        name: item.name.trim(),
        price: Number(item.price),
        description: item.description.trim() || null,
        optionGroups: item.optionGroups ?? [],
      }))
      .filter((item) => item.category && item.name && Number.isFinite(item.price))

  const refreshOcrPreview = async () => {
    if (!ocrReview) return

    setImportingId('ocr-preview')
    try {
      const preview = await previewReviewedMenuImport.mutateAsync({
        type: ocrReview.type,
        documentId: ocrReview.documentId,
        items: getReviewedItemsForApi(ocrReview),
      })
      setOcrReview((current) => (current ? { ...current, ...preview } : current))
      setSelectedArchiveIds(preview.missing.map((item) => item.id))
      toast.success('Podsumowanie zostało odświeżone.')
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, 'Nie udało się odświeżyć podsumowania.'))
    } finally {
      setImportingId(null)
    }
  }

  const confirmImport = async () => {
    if (!importPreview) return

    setImportingId('confirm')
    try {
      const result = await importMenuFromDocument.mutateAsync({
        type: importPreview.type,
        documentId: importPreview.documentId,
        archiveMissingIds: selectedArchiveIds,
      })
      await queryClient.invalidateQueries(['menu.getAllMenuItems'])
      await queryClient.invalidateQueries(['menu.getMenuItems'])
      await queryClient.invalidateQueries(['settings.getSettings'])
      updateDocumentImportMeta(importPreview.documentId, result.documentImportMeta)

      toast.success(
        `Wczytano ${result.total} pozycji: ${result.created} dodano, ${result.updated} zaktualizowano, ${result.archived} zarchiwizowano.`
      )
      setImportPreview(null)
      setSelectedArchiveIds([])
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, 'Nie udało się zapisać importu.'))
    } finally {
      setImportingId(null)
    }
  }

  const confirmOcrImport = async () => {
    if (!ocrReview) return

    const items = getReviewedItemsForApi(ocrReview)
    if (items.length === 0) {
      toast.error('Dodaj przynajmniej jedną poprawną pozycję przed zapisem.')
      return
    }

    setImportingId('ocr-confirm')
    try {
      const result = await importReviewedMenuItems.mutateAsync({
        type: ocrReview.type,
        documentId: ocrReview.documentId,
        items,
        archiveMissingIds: selectedArchiveIds,
      })
      await queryClient.invalidateQueries(['menu.getAllMenuItems'])
      await queryClient.invalidateQueries(['menu.getMenuItems'])
      await queryClient.invalidateQueries(['settings.getSettings'])
      updateDocumentImportMeta(ocrReview.documentId, result.documentImportMeta)

      toast.success(
        `Wczytano ${result.total} pozycji: ${result.created} dodano, ${result.updated} zaktualizowano, ${result.archived} zarchiwizowano.`
      )
      setOcrReview(null)
      setSelectedArchiveIds([])
    } catch (error) {
      console.error(error)
      toast.error(getErrorMessage(error, 'Nie udało się zapisać zmian w menu.'))
    } finally {
      setImportingId(null)
    }
  }

  const toggleArchiveSelection = (id: string) => {
    setSelectedArchiveIds((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        disabled={isUploading}
        className="hidden"
        onChange={(event) => {
          void handleFileSelection(event.target.files || [])
        }}
      />

      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/35 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">Menu dla gości</h2>
          <p className="text-xs text-muted-foreground">
            Pliki PDF widoczne na stronie menu restauracji. Goście mogą je podejrzeć albo pobrać.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-xs text-muted-foreground shadow-sm">
          {saving && <Loader2 size={12} className="animate-spin text-primary" />}
          <span>{saving ? 'Zapisywanie zmian' : 'Zmiany zapisują się automatycznie'}</span>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {documents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            Na razie nie ma żadnych dokumentów PDF. Wgraj pierwszy plik, a pojawi się tutaj karta do edycji.
          </div>
        ) : (
          normalizedDocuments.map((doc) => (
            <Card key={doc.id} className="border-border/80 bg-white shadow-sm">
              <CardContent className="space-y-3 p-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText size={17} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-950">
                          {doc.title || 'Bez tytułu'}
                        </p>
                        <span className="rounded-full bg-muted/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                          {DOCUMENT_TYPE_OPTIONS.find((option) => option.value === doc.type)?.label ?? doc.type}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                            doc.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {doc.isActive ? 'Widoczny' : 'Ukryty'}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                        <span>
                          {doc.isActive
                            ? 'Pokazywany gościom na stronie menu.'
                            : 'Ukryty przed gośćmi na stronie menu.'}
                        </span>
                        {formatMetaLine('Plik wgrany', doc.uploadedAt, doc.uploadedBy) && (
                          <span>{formatMetaLine('Plik wgrany', doc.uploadedAt, doc.uploadedBy)}</span>
                        )}
                        {formatMetaLine('Import menu zapisany', doc.importedAt, doc.importedBy) ? (
                          <span>{formatMetaLine('Import menu zapisany', doc.importedAt, doc.importedBy)}</span>
                        ) : (
                          <span>Import menu nie był jeszcze zapisany z tego pliku.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 xl:justify-end">
                    <div className="mr-1 flex items-center gap-2 px-1">
                      <span className="text-xs text-muted-foreground">Na stronie menu</span>
                      <Switch
                        checked={doc.isActive}
                        onCheckedChange={(checked) => void updateDocument(doc.id, { isActive: checked })}
                        disabled={isUploading || saving}
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => void moveDocument(doc.id, -1)}
                      disabled={doc.sortOrder === 0 || isUploading || saving}
                      aria-label="Przenieś wyżej"
                    >
                      <ArrowUp size={16} />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => void moveDocument(doc.id, 1)}
                      disabled={doc.sortOrder === documents.length - 1 || isUploading || saving}
                      aria-label="Przenieś niżej"
                    >
                      <ArrowDown size={16} />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-danger hover:text-danger"
                      onClick={() => void removeDocument(doc.id)}
                      disabled={isUploading || saving}
                      aria-label="Usuń dokument"
                    >
                      <Trash2 size={16} />
                    </Button>
                    {expandedDocumentId !== doc.id && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="gap-2"
                        onClick={() => startEditingDocument(doc)}
                        disabled={isUploading || saving}
                      >
                        <Pencil size={14} />
                        Edytuj
                      </Button>
                    )}
                    {doc.url && (
                      <Button type="button" variant="ghost" className="gap-2" asChild disabled={isUploading || saving}>
                        <a href={doc.url} target="_blank" rel="noreferrer">
                          <FileDown size={14} />
                          Podgląd
                        </a>
                      </Button>
                    )}
                    {doc.url && doc.type !== 'other' && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="gap-2"
                        onClick={() => void startAiReview(doc)}
                        disabled={isUploading || saving || importingId === doc.id || importingId === `ocr-${doc.id}` || importingId === `ai-${doc.id}`}
                      >
                        {importingId === `ai-${doc.id}` ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        {importingId === `ai-${doc.id}` ? 'Rozpoznajemy...' : 'Rozpoznaj menu'}
                      </Button>
                    )}
                  </div>
                </div>

                {expandedDocumentId === doc.id && (
                  <div className="grid gap-3 rounded-xl border border-border bg-white p-3 md:grid-cols-[1.3fr_0.9fr_auto] md:items-end">
                    <div className="space-y-2">
                      <Label htmlFor={`menu-title-${doc.id}`}>Tytuł</Label>
                      <Input
                        id={`menu-title-${doc.id}`}
                        value={editDraft.title}
                        onChange={(event) =>
                          setEditDraft((current) => ({ ...current, title: event.target.value }))
                        }
                        placeholder="Menu dań"
                        disabled={isUploading || saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`menu-type-${doc.id}`}>Typ</Label>
                      <Select
                        value={editDraft.type}
                        onValueChange={(value) =>
                          setEditDraft((current) => ({ ...current, type: value as MenuDocumentType }))
                        }
                        disabled={isUploading || saving}
                      >
                        <SelectTrigger id={`menu-type-${doc.id}`}>
                          <SelectValue placeholder="Wybierz typ" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2 md:pb-0">
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2"
                        onClick={cancelEditingDocument}
                        disabled={isUploading || saving}
                      >
                        <X size={14} />
                        Anuluj
                      </Button>
                      <Button
                        type="button"
                        className="gap-2"
                        onClick={() => void saveEditingDocument(doc.id)}
                        disabled={isUploading || saving}
                      >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Zapisz
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
        <div
          onDragOver={(event) => {
            if (isUploading) return
            event.preventDefault()
            setDropzoneDragging(true)
          }}
          onDragLeave={() => {
            if (!isUploading) setDropzoneDragging(false)
          }}
          onDrop={isUploading ? undefined : handleDropzoneDrop}
          onClick={() => openPicker()}
          aria-busy={isUploading}
          className={cn(
            'relative cursor-pointer rounded-xl border border-dashed bg-white p-3 transition',
            isUploading && 'cursor-not-allowed opacity-85',
            dropzoneDragging ? 'border-primary bg-primary/5' : 'border-border'
          )}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-950">Dodaj plik menu dla gości</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Kliknij tutaj albo przeciągnij PDF. Plik pojawi się na stronie menu jako podgląd i pobranie.
                </p>
                {isUploading && (
                  <p className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-primary">
                    <Loader2 size={12} className="animate-spin" />
                    Trwa wgrywanie pliku. Poczekaj chwilę.
                  </p>
                )}
              </div>
            </div>
            <span className="hidden rounded-full bg-muted/60 px-3 py-1 text-xs text-muted-foreground md:inline-flex">
              PDF
            </span>
          </div>
        </div>
      </div>

      <Dialog
        open={Boolean(ocrJobStatus && !ocrReview)}
        onOpenChange={(open) => {
          if (open) return
          setOcrJobId(null)
          setOcrJobStatus(null)
          setImportingId(null)
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-dark-gray">Rozpoznajemy menu</DialogTitle>
            <DialogDescription>
              Przetwarzamy PDF i szukamy pozycji menu. Przy większych plikach może to potrwać kilka minut.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Loader2 size={18} className="animate-spin" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-950">
                  {ocrJobStatus?.message ?? 'Rozpoznawanie menu jest w toku.'}
                </p>
                {ocrJobStatus?.totalPages && ocrJobStatus.currentPage ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Strona {ocrJobStatus.currentPage} z {ocrJobStatus.totalPages}
                  </p>
                ) : ocrJobStatus?.totalPages ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Przygotowano {ocrJobStatus.totalPages} stron do rozpoznania.
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">Przygotowujemy plik do rozpoznania.</p>
                )}
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Zostaw to okno otwarte. Po zakończeniu pokażemy listę pozycji do sprawdzenia i zapisania.
          </p>
        </DialogContent>
      </Dialog>

      <Dialog
        open={importPreview !== null}
        onOpenChange={(open) => {
          if (open || importingId === 'confirm') return
          setImportPreview(null)
          setSelectedArchiveIds([])
        }}
      >
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-hidden rounded-2xl p-0">
          <DialogHeader className="border-b border-border px-5 py-4">
            <DialogTitle className="font-serif text-xl text-dark-gray">Podsumowanie importu</DialogTitle>
            <DialogDescription>
              Sprawdź zmiany przed zapisaniem. Pozycje, których nie ma w nowym pliku, są domyślnie zaznaczone do archiwizacji.
            </DialogDescription>
          </DialogHeader>

          {importPreview && (
            <div className="flex max-h-[calc(88vh-92px)] flex-col">
              <div className="grid gap-2 border-b border-border bg-muted/30 p-4 sm:grid-cols-4">
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-xs text-muted-foreground">Nowe</p>
                  <p className="text-lg font-semibold text-slate-950">{importPreview.created.length}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-xs text-muted-foreground">Aktualizowane</p>
                  <p className="text-lg font-semibold text-slate-950">{importPreview.updated.length}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-xs text-muted-foreground">Bez zmian</p>
                  <p className="text-lg font-semibold text-slate-950">{importPreview.unchanged.length}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-xs text-muted-foreground">Poza PDF-em</p>
                  <p className="text-lg font-semibold text-slate-950">{importPreview.missing.length}</p>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="grid gap-4 lg:grid-cols-2">
                  <ImportList title="Nowe pozycje" items={importPreview.created} empty="Brak nowych pozycji." />
                  <ImportList title="Aktualizacje" items={importPreview.updated} empty="Brak zmian w istniejących pozycjach." />
                </div>

                <div className="mt-4 rounded-xl border border-border bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">Pozycje bez odpowiednika w PDF-ie</h3>
                      <p className="text-xs text-muted-foreground">Zaznaczone pozycje zostaną ukryte i wyłączone z zamówień.</p>
                    </div>
                    {importPreview.missing.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedArchiveIds((current) =>
                            current.length === importPreview.missing.length
                              ? []
                              : importPreview.missing.map((item) => item.id)
                          )
                        }
                        disabled={importingId === 'confirm'}
                      >
                        {selectedArchiveIds.length === importPreview.missing.length ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
                      </Button>
                    )}
                  </div>

                  {importPreview.missing.length === 0 ? (
                    <p className="px-3 py-5 text-sm text-muted-foreground">Nie ma pozycji do archiwizacji.</p>
                  ) : (
                    <div className="max-h-56 divide-y divide-border overflow-y-auto">
                      {importPreview.missing.map((item) => (
                        <label
                          key={item.id}
                          className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/30"
                        >
                          <input
                            type="checkbox"
                            checked={selectedArchiveIds.includes(item.id)}
                            onChange={() => toggleArchiveSelection(item.id)}
                            disabled={importingId === 'confirm'}
                            className="h-4 w-4 rounded border-border accent-primary"
                          />
                          <span className="min-w-0 flex-1 truncate text-slate-900">{item.name}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{item.category}</span>
                          <span className="shrink-0 text-sm tabular-nums text-slate-700">{item.price} zł</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-white px-5 py-4">
                <p className="text-xs text-muted-foreground">
                  Do archiwizacji zaznaczono {selectedArchiveIds.length} pozycji.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setImportPreview(null)
                      setSelectedArchiveIds([])
                    }}
                    disabled={importingId === 'confirm'}
                  >
                    Anuluj
                  </Button>
                  <Button
                    type="button"
                    className="gap-2"
                    onClick={() => void confirmImport()}
                    disabled={importingId === 'confirm'}
                  >
                    {importingId === 'confirm' && <Loader2 size={14} className="animate-spin" />}
                    Zapisz import
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={ocrReview !== null}
        onOpenChange={(open) => {
          if (open || importingId === 'ocr-confirm') return
          setOcrReview(null)
          setSelectedArchiveIds([])
        }}
      >
        <DialogContent className="flex h-[92dvh] w-[calc(100vw-24px)] max-w-7xl flex-col overflow-hidden rounded-2xl p-0 sm:w-[calc(100vw-40px)]">
          <DialogHeader className="border-b border-border px-5 py-4">
            <DialogTitle className="font-serif text-xl text-dark-gray">Sprawdź menu przed zapisem</DialogTitle>
            <DialogDescription>
              Popraw nazwy, kategorie, ceny i opisy. Po zapisie nowe pozycje trafią do menu, zmienione zostaną zaktualizowane, a zaznaczone stare pozycje ukryte.
            </DialogDescription>
          </DialogHeader>

          {ocrReview && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="grid gap-2 border-b border-border bg-muted/30 p-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-xs text-muted-foreground">Do sprawdzenia</p>
                  <p className="text-lg font-semibold text-slate-950">{ocrReview.items.length}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-xs text-muted-foreground">Nowe</p>
                  <p className="text-lg font-semibold text-slate-950">{ocrReview.created.length}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-xs text-muted-foreground">Zmienione</p>
                  <p className="text-lg font-semibold text-slate-950">{ocrReview.updated.length}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-xs text-muted-foreground">Bez zmian</p>
                  <p className="text-lg font-semibold text-slate-950">{ocrReview.unchanged.length}</p>
                </div>
                <div className="rounded-xl bg-white px-3 py-2">
                  <p className="text-xs text-muted-foreground">Do ukrycia</p>
                  <p className="text-lg font-semibold text-slate-950">{ocrReview.missing.length}</p>
                </div>
              </div>

              <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.8fr)]">
                <div className="min-h-0 overflow-y-auto p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-950">Pozycje wczytane z PDF</h3>
                      <p className="text-xs text-muted-foreground">
                        Sprawdź dane przed zapisaniem ich w menu.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={addOcrItem}
                        disabled={importingId === 'ocr-confirm' || importingId === 'ocr-preview'}
                      >
                        <Plus size={14} />
                        Dodaj pozycję
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="gap-2"
                        onClick={() => void refreshOcrPreview()}
                        disabled={importingId === 'ocr-confirm' || importingId === 'ocr-preview'}
                      >
                        {importingId === 'ocr-preview' ? <Loader2 size={14} className="animate-spin" /> : <ScanText size={14} />}
                        Odśwież podsumowanie
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {ocrReview.items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border bg-white px-4 py-8 text-sm text-muted-foreground">
                        Nie udało się rozpoznać pozycji automatycznie. Możesz dodać je ręcznie i porównać z PDF-em na większym ekranie.
                      </div>
                    ) : (
                      ocrReview.items.map((item, index) => (
                        <div key={item.rowId} className="rounded-xl border border-border bg-white p-3 shadow-sm">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-muted-foreground">Pozycja {index + 1}</span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-danger hover:text-danger"
                              onClick={() => removeOcrItem(item.rowId)}
                              disabled={importingId === 'ocr-confirm'}
                              aria-label="Usuń pozycję"
                            >
                              <Trash2 size={15} />
                            </Button>
                          </div>
                          <div className="grid gap-3 md:grid-cols-[1fr_1.2fr_96px]">
                            <div className="space-y-1.5">
                              <Label>Kategoria</Label>
                              <Input
                                value={item.category}
                                onChange={(event) => updateOcrItem(item.rowId, { category: event.target.value })}
                                disabled={importingId === 'ocr-confirm'}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Nazwa</Label>
                              <Input
                                value={item.name}
                                onChange={(event) => updateOcrItem(item.rowId, { name: event.target.value })}
                                disabled={importingId === 'ocr-confirm'}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Cena</Label>
                              <Input
                                type="number"
                                value={item.price}
                                onChange={(event) => updateOcrItem(item.rowId, { price: Number(event.target.value) })}
                                disabled={importingId === 'ocr-confirm'}
                              />
                            </div>
                            <div className="space-y-1.5 md:col-span-3">
                              <Label>Opis</Label>
                              <Textarea
                                value={item.description}
                                onChange={(event) => updateOcrItem(item.rowId, { description: event.target.value })}
                                disabled={importingId === 'ocr-confirm'}
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 rounded-xl border border-border bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-950">Pozycje, których nie ma w nowym pliku</h3>
                        <p className="text-xs text-muted-foreground">Zaznaczone pozycje zostaną ukryte w menu, ale nie znikną z historii zamówień.</p>
                      </div>
                      {ocrReview.missing.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setSelectedArchiveIds((current) =>
                              current.length === ocrReview.missing.length
                                ? []
                                : ocrReview.missing.map((item) => item.id)
                            )
                          }
                          disabled={importingId === 'ocr-confirm'}
                        >
                          {selectedArchiveIds.length === ocrReview.missing.length ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
                        </Button>
                      )}
                    </div>

                    {ocrReview.missing.length === 0 ? (
                      <p className="px-3 py-5 text-sm text-muted-foreground">Nie znaleźliśmy starszych pozycji do ukrycia.</p>
                    ) : (
                      <div className="max-h-52 divide-y divide-border overflow-y-auto">
                        {ocrReview.missing.map((item) => (
                          <label
                            key={item.id}
                            className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-muted/30"
                          >
                            <input
                              type="checkbox"
                              checked={selectedArchiveIds.includes(item.id)}
                              onChange={() => toggleArchiveSelection(item.id)}
                              disabled={importingId === 'ocr-confirm'}
                              className="h-4 w-4 rounded border-border accent-primary"
                            />
                            <span className="min-w-0 flex-1 truncate text-slate-900">{item.name}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">{item.category}</span>
                            <span className="shrink-0 text-sm tabular-nums text-slate-700">{item.price} zł</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <aside className="hidden min-h-0 border-l border-border bg-muted/30 p-4 lg:block">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-slate-950">Oryginalny PDF</h3>
                    <p className="text-xs text-muted-foreground">Porównaj rozpoznane dane z oryginalnym plikiem.</p>
                  </div>
                  <iframe
                    title="Podgląd PDF menu"
                    src={ocrReview.documentUrl}
                    className="h-[calc(92vh-220px)] w-full rounded-xl border border-border bg-white"
                  />
                </aside>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-white px-5 py-4">
                <p className="text-xs text-muted-foreground">
                  Do ukrycia zaznaczono {selectedArchiveIds.length} pozycji. Po ręcznych poprawkach odśwież podsumowanie.
                </p>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setOcrReview(null)
                      setSelectedArchiveIds([])
                    }}
                    disabled={importingId === 'ocr-confirm'}
                  >
                    Anuluj
                  </Button>
                  <Button
                    type="button"
                    className="w-full gap-2 sm:w-auto"
                    onClick={() => void confirmOcrImport()}
                    disabled={importingId === 'ocr-confirm'}
                  >
                    {importingId === 'ocr-confirm' && <Loader2 size={14} className="animate-spin" />}
                    Zapisz zmiany w menu
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}

const ImportList = ({
  title,
  items,
  empty,
}: {
  title: string
  items: ImportPreviewItem[]
  empty: string
}) => (
  <div className="rounded-xl border border-border bg-white">
    <div className="border-b border-border px-3 py-2">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
    </div>
    {items.length === 0 ? (
      <p className="px-3 py-5 text-sm text-muted-foreground">{empty}</p>
    ) : (
      <div className="max-h-56 divide-y divide-border overflow-y-auto">
        {items.slice(0, 80).map((item) => (
          <div key={`${item.category}-${item.name}`} className="flex items-center gap-3 px-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate text-slate-900">{item.name}</p>
              <p className="truncate text-xs text-muted-foreground">{item.category}</p>
            </div>
            <span className="shrink-0 text-sm tabular-nums text-slate-700">
              {item.currentPrice ? `${item.currentPrice} -> ` : ''}{item.price} zł
            </span>
          </div>
        ))}
        {items.length > 80 && (
          <p className="px-3 py-2 text-xs text-muted-foreground">I jeszcze {items.length - 80} pozycji.</p>
        )}
      </div>
    )}
  </div>
)

export default MenuPdfSettings
