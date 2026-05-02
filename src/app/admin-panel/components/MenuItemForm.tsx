'use client'

import ImageUploader from '@/app/admin-panel/components/ImageUploader'
import LoadingButton from '@/app/components/LoadingButton'
import { Card } from '@/app/components/ui/card'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { Separator } from '@/app/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select'
import { Switch } from '@/app/components/ui/switch'
import { Textarea } from '@/app/components/ui/textarea'
import { MenuItemCategory } from '@/app/types/types'
import { menuItemCategories } from '@/config'
import { useEffect, useState } from 'react'

interface MenuItemFormProps {
  initialValues: {
    name: string
    price: number
    description: string
    category: MenuItemCategory
    image: string
    isActive: boolean
    isRecommended: boolean
    isOnMainPage: boolean
    isOrderable: boolean
  }
  isLoading: boolean
  onSubmit: (values: {
    name: string
    price: number
    description: string
    category: MenuItemCategory
    image: string
    isActive: boolean
    isRecommended: boolean
    isOnMainPage: boolean
    isOrderable: boolean
  }) => void
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({
  initialValues,
  isLoading,
  onSubmit,
}) => {
  const [name, setName] = useState(initialValues.name)
  const [price, setPrice] = useState(initialValues.price)
  const [description, setDescription] = useState(initialValues.description)
  const [category, setCategory] = useState<MenuItemCategory>(
    initialValues.category
  )
  const [image, setImage] = useState(initialValues.image)
  const [isActive, setIsActive] = useState(initialValues.isActive)
  const [isRecommended, setIsRecommended] = useState(
    initialValues.isRecommended
  )
  const [isOnMainPage, setIsOnMainPage] = useState(initialValues.isOnMainPage)
  const [isOrderable, setIsOrderable] = useState(initialValues.isOrderable)

  const [errors, setErrors] = useState<{ name?: string; price?: string }>({})

  useEffect(() => {
    setName(initialValues.name)
    setPrice(initialValues.price)
    setDescription(initialValues.description)
    setCategory(initialValues.category)
    setImage(initialValues.image)
    setIsActive(initialValues.isActive)
    setIsRecommended(initialValues.isRecommended)
    setIsOnMainPage(initialValues.isOnMainPage)
    setIsOrderable(initialValues.isOrderable)
  }, [initialValues])

  const validateForm = () => {
    const newErrors: { name?: string; price?: string } = {}
    if (!name) newErrors.name = 'Nazwa produktu jest obowiązkowa'
    if (price <= 0) newErrors.price = 'Cena musi być większa niż zero'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        name,
        price,
        description,
        category,
        image,
        isActive,
        isRecommended,
        isOnMainPage,
        isOrderable,
      })
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="space-y-5 p-5 md:p-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Dane pozycji</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nazwa, cena i opis widoczne dla klienta w menu.
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="menu-item-name">Nazwa</Label>
          <Input
            id="menu-item-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Np. Pizza Margherita"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <p className="text-sm text-danger">{errors.name}</p>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="menu-item-price">Cena (PLN)</Label>
            <Input
              id="menu-item-price"
              type="number"
              value={Number.isNaN(price) ? '' : price}
              onChange={(e) => setPrice(e.target.value === '' ? 0 : parseFloat(e.target.value))}
              placeholder="0"
              min={0}
              step="0.01"
              aria-invalid={Boolean(errors.price)}
            />
            {errors.price && <p className="text-sm text-danger">{errors.price}</p>}
          </div>

          <div className="space-y-2">
            <Label>Kategoria</Label>
            <Select
              value={category}
              onValueChange={(val) => setCategory(val as MenuItemCategory)}
            >
              <SelectTrigger aria-label="Kategoria">
                <SelectValue placeholder="Wybierz kategorię" />
              </SelectTrigger>
              <SelectContent>
                {menuItemCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="menu-item-description">Opis</Label>
          <Textarea
            id="menu-item-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Krótki opis składników, sposobu podania albo wyróżników pozycji."
            className="min-h-[140px]"
          />
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="space-y-4 p-5 md:p-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Zdjęcie</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Zdjęcie produktu w karcie menu i zamówieniach online.
            </p>
          </div>

          <ImageUploader
            label="Zdjęcie produktu"
            onImageUpload={(images) => setImage(images[0] ?? '')}
            multiple={false}
            aspectRatio={1}
            currentImages={image ? [image] : []}
          />
        </Card>

        <Card className="space-y-4 p-5 md:p-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Widoczność</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Kontroluj, gdzie pozycja pojawia się dla klienta.
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="menu-item-active">Aktywne</Label>
                <p className="text-xs text-muted-foreground">Pozycja widoczna w menu.</p>
              </div>
              <Switch
                id="menu-item-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="menu-item-orderable">Dostępne do zamówienia</Label>
                <p className="text-xs text-muted-foreground">Klient może dodać pozycję do koszyka.</p>
              </div>
              <Switch
                id="menu-item-orderable"
                checked={isOrderable}
                onCheckedChange={setIsOrderable}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="menu-item-recommended">Polecane</Label>
                <p className="text-xs text-muted-foreground">Pozycja może pojawić się w rekomendacjach.</p>
              </div>
              <Switch
                id="menu-item-recommended"
                checked={isRecommended}
                onCheckedChange={setIsRecommended}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="menu-item-special">Specjał</Label>
                <p className="text-xs text-muted-foreground">Wyróżnienie na stronie głównej.</p>
              </div>
              <Switch
                id="menu-item-special"
                checked={isOnMainPage}
                onCheckedChange={setIsOnMainPage}
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <LoadingButton isLoading={isLoading} onClick={handleSubmit} className="min-w-[140px]">
            Zapisz pozycję
          </LoadingButton>
        </div>
      </div>
    </div>
  )
}

export default MenuItemForm
