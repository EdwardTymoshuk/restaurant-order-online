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
import { MenuDownloadDocument } from '@/app/types/types'
import { sanitizeImageFilename } from '@/utils/sanitizeImageFilename'
import { cn } from '@/utils/utils'
import { trpc } from '@/utils/trpc'
import { ArrowDown, ArrowUp, FileDown, FileInput, FileText, Loader2, Pencil, Save, Trash2, Upload, X } from 'lucide-react'
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
  total: number
  created: ImportPreviewItem[]
  updated: ImportPreviewItem[]
  unchanged: ImportPreviewItem[]
  missing: Required<Pick<ImportPreviewItem, 'id' | 'category' | 'name' | 'price'>>[]
}

const DOCUMENT_TYPE_OPTIONS: Array<{ value: MenuDocumentType; label: string }> = [
  { value: 'menu', label: 'Menu' },
  { value: 'drinks', label: 'Napoje' },
  { value: 'other', label: 'Inne' },
]

const inferDocumentType = (fileName: string): MenuDocumentType => {
  const normalized = fileName.toLowerCase()
  if (normalized.includes('napoj') || normalized.includes('drink') || normalized.includes('beverage')) {
    return 'drinks'
  }
  return 'menu'
}

const getDefaultTitle = (fileName: string) =>
  fileName.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Nowy PDF'

const MenuPdfSettings = ({ menuDocuments }: { menuDocuments: MenuDownloadDocument[] }) => {
  const [documents, setDocuments] = useState<MenuDownloadDocument[]>(
    [...menuDocuments]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((doc, index) => ({ ...doc, sortOrder: index }))
  )
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [dropzoneDragging, setDropzoneDragging] = useState(false)
  const [pendingReplaceId, setPendingReplaceId] = useState<string | null>(null)
  const [expandedDocumentId, setExpandedDocumentId] = useState<string | null>(null)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
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

  useEffect(() => {
    setDocuments(
      [...menuDocuments]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((doc, index) => ({ ...doc, sortOrder: index }))
    )
  }, [menuDocuments])

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
      await saveMenuDocuments.mutateAsync(
        nextDocuments.map((doc, index) => ({ ...doc, sortOrder: index }))
      )
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
      }

      if (pendingReplaceId) {
        const nextDocuments = documents.map((doc) =>
          doc.id === pendingReplaceId
            ? { ...doc, url: imageUrl, title: doc.title || baseDoc.title, type: doc.type || baseDoc.type }
            : doc
        )
        await saveCurrentDocuments(nextDocuments)
      } else {
        await saveCurrentDocuments([...documents, baseDoc])
      }

      toast.success('PDF został wgrany. Teraz możesz ustawić tytuł i widoczność.')
    } catch (error) {
      console.error(error)
      toast.error('Nie udało się wgrać PDF-a.')
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
      toast.error('Import pozycji działa tylko dla dokumentów typu Menu albo Napoje.')
      return
    }

    setImportingId(doc.id)
    try {
      const preview = await previewMenuDocumentImport.mutateAsync({ type: doc.type })
      setImportPreview(preview)
      setSelectedArchiveIds([])
    } catch (error) {
      console.error(error)
      toast.error('Nie udało się przygotować podsumowania importu.')
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
        archiveMissingIds: selectedArchiveIds,
      })
      await queryClient.invalidateQueries(['menu.getAllMenuItems'])
      await queryClient.invalidateQueries(['menu.getMenuItems'])

      toast.success(
        `Wczytano ${result.total} pozycji: ${result.created} dodano, ${result.updated} zaktualizowano, ${result.archived} zarchiwizowano.`
      )
      setImportPreview(null)
      setSelectedArchiveIds([])
    } catch (error) {
      console.error(error)
      toast.error('Nie udało się zapisać importu.')
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
                      <p className="mt-1 text-xs text-muted-foreground">
                        {doc.isActive
                          ? 'Pokazywany gościom na stronie menu.'
                          : 'Ukryty przed gośćmi na stronie menu.'}
                      </p>
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
                        onClick={() => void previewDocumentImport(doc)}
                        disabled={isUploading || saving || importingId === doc.id}
                      >
                        {importingId === doc.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <FileInput size={14} />
                        )}
                        {importingId === doc.id ? 'Sprawdzanie...' : 'Wczytaj'}
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
              Sprawdź zmiany przed zapisaniem. Pozycje, których nie ma w nowym PDF-ie, możesz zaznaczyć do archiwizacji.
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
