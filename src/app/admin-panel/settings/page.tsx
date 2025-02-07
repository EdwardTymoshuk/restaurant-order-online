'use client';

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/app/components/ui/accordion'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/app/components/ui/select'
import { Switch } from '@/app/components/ui/switch'
import { trpc } from '@/utils/trpc'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import DeliveryZonesSettings from '@/app/admin-panel/components/DeliveryZonesSettings'
import LoadingButton from '@/app/components/LoadingButton'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import Image from 'next/image'
import BannerUploader from '../components/BannerUploader'
import PizzaSettings from '../components/PizzaSettings'
import PromoCodeSettings from '../components/PromoCodeSettings'
import UserList from '../components/UserList'

interface PromoCode {
  id: string;
  code: string;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  isActive: boolean;
  isUsed: boolean;
  expiresAt: Date | null;
  isOneTimeUse: boolean;
}

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  position: number | null;
}

const Settings = () => {
  // Перевірка, чи є користувач адміністратором
  const isAdmin = useIsAdmin();

  // === SETTINGS SECTION ===
  const { data: settingsData, refetch: refetchSettings } =
    trpc.settings.getSettings.useQuery();
  const updateOrderingState = trpc.settings.updateOrderingState.useMutation({
    onSuccess: () => refetchSettings(),
  });
  const updateOrderWaitTime = trpc.settings.updateOrderWaitTime.useMutation({
    onSuccess: () => refetchSettings(),
  });
  const updateDeliveryZonePrices = trpc.settings.updateDeliveryZonePrices.useMutation({
    onSuccess: () => refetchSettings(),
  });

  const [isOrderingOpen, setIsOrderingOpen] = useState<boolean>(false);
  const [orderWaitTime, setOrderWaitTime] = useState<number>(30);
  const [deliveryZones, setDeliveryZones] = useState<any[]>([]);

  useEffect(() => {
    if (settingsData) {
      setIsOrderingOpen(settingsData.isOrderingOpen);
      setOrderWaitTime(settingsData.orderWaitTime);
      // Перевіряємо, чи deliveryZones є масивом
      if (settingsData.deliveryZones && Array.isArray(settingsData.deliveryZones)) {
        setDeliveryZones(settingsData.deliveryZones);
      } else {
        setDeliveryZones([]);
      }
    }
  }, [settingsData]);

  // === PROMO CODE SECTION ===
  const { data: promoCodesData, refetch: refetchPromoCodes } =
    trpc.promoCode.getAllPromoCodes.useQuery();
  const createPromoCode = trpc.promoCode.createPromoCode.useMutation({
    onSuccess: () => refetchPromoCodes(),
  });
  const deletePromoCode = trpc.promoCode.deletePromoCode.useMutation({
    onSuccess: () => refetchPromoCodes(),
  });
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isPromoCodeDialogOpen, setIsPromoCodeDialogOpen] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState<{
    code: string;
    discountType: 'FIXED' | 'PERCENTAGE';
    discountValue: string;
    isActive: boolean;
    expiresInDays: number | null;
    isOneTimeUse: boolean;
    useDateRange: boolean; // перемикач для явного вибору діапазону дат
    startDate: string; // формат YYYY-MM-DD
    endDate: string;   // формат YYYY-MM-DD
  }>({
    code: '',
    discountType: 'FIXED',
    discountValue: '',
    isActive: true,
    expiresInDays: null,
    isOneTimeUse: false,
    useDateRange: false,
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (promoCodesData) {
      setPromoCodes(promoCodesData);
    }
  }, [promoCodesData]);

  // Функція для генерації випадкового коду
  const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  // Обробка додавання нового промокоду
  const handleAddPromoCode = () => {
    if (!newPromoCode.code.trim()) {
      toast.warning('Proszę wpisać kod promocyjny.');
      return;
    }
    if (!newPromoCode.discountValue.trim()) {
      toast.warning('Proszę wpisać wartość zniżki.');
      return;
    }
    const discountValue = parseFloat(newPromoCode.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) {
      toast.warning('Proszę wpisać prawidłową wartość zniżki.');
      return;
    }

    if (newPromoCode.useDateRange) {
      if (!newPromoCode.startDate || !newPromoCode.endDate) {
        toast.warning('Proszę wybrać daty rozpoczęcia i zakończenia.');
        return;
      }
      // Якщо вибрано явний діапазон дат, передаємо дату завершення
      createPromoCode.mutate({
        code: newPromoCode.code,
        discountType: newPromoCode.discountType,
        discountValue,
        isActive: newPromoCode.isActive,
        isOneTimeUse: newPromoCode.isOneTimeUse,
        expiresAt: newPromoCode.endDate, // дата завершення
        // Якщо потрібно зберігати startDate – додайте відповідне поле
      });
    } else {
      // Використовуємо режим відносного закінчення (кількість днів)
      const expiresAt = newPromoCode.expiresInDays
        ? dayjs().add(newPromoCode.expiresInDays, 'day').toISOString()
        : undefined;
      createPromoCode.mutate({
        code: newPromoCode.code,
        discountType: newPromoCode.discountType,
        discountValue,
        isActive: newPromoCode.isActive,
        isOneTimeUse: newPromoCode.isOneTimeUse,
        expiresAt,
      });
    }

    // Скидання стану та закриття діалогу
    setNewPromoCode({
      code: '',
      discountType: 'FIXED',
      discountValue: '',
      isActive: true,
      expiresInDays: null,
      isOneTimeUse: false,
      useDateRange: false,
      startDate: '',
      endDate: '',
    });
    setIsPromoCodeDialogOpen(false);
  };

  // === BANNER SECTION ===
  const { data: bannersData, refetch: refetchBanners } =
    trpc.banner.getAllBanners.useQuery();
  const createBanner = trpc.banner.createBanner.useMutation({
    onSuccess: () => refetchBanners(),
  });
  const deleteBanner = trpc.banner.deleteBanner.useMutation({
    onMutate: (variables) => {
      // За бажанням можна встановити стан завантаження
    },
    onSuccess: () => refetchBanners(),
  });
  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null);

  // Обробка оновлення зон доставки
  const handleUpdateZones = (updatedZones: any[]) => {
    updateDeliveryZonePrices.mutate(updatedZones);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Ustawienia</h1>
      <div className="space-y-8">
        {/* Секція Замовлення Online */}
        <section>
          <h2 className="text-xl font-semibold">Zamówienia Online</h2>
          <div className="flex items-center space-x-4">
            <Switch
              checked={isOrderingOpen}
              onCheckedChange={(checked) => {
                setIsOrderingOpen(checked);
                updateOrderingState.mutate({ isOrderingOpen: checked });
              }}
            />
            <span>{isOrderingOpen ? 'Aktywne' : 'Wyłączone'}</span>
          </div>
        </section>

        {/* Секція Зон доставки */}
        <section>
          <DeliveryZonesSettings
            deliveryZones={deliveryZones}
            onUpdateZones={handleUpdateZones}
          />
        </section>

        {/* Секція Налаштувань піци */}
        <section>
          <PizzaSettings
            settingsData={{
              pizzaCategoryEnabled: settingsData?.pizzaCategoryEnabled ?? false,
              pizzaAvailability: Array.isArray(settingsData?.pizzaAvailability)
                ? (settingsData?.pizzaAvailability as { day: number; startHour: number; endHour: number }[])
                : [],
            }}
            refetchSettings={refetchSettings}
          />
        </section>

        {/* Секція Час очікування */}
        <section>
          <h2 className="text-xl font-semibold">Czas oczekiwania</h2>
          <Select
            value={orderWaitTime.toString()}
            onValueChange={(value) => {
              const newTime = Number(value);
              setOrderWaitTime(newTime);
              updateOrderWaitTime.mutate({ orderWaitTime: newTime });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Wybierz czas oczekiwania" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minut</SelectItem>
              <SelectItem value="45">45 minut</SelectItem>
              <SelectItem value="60">60 minut</SelectItem>
              <SelectItem value="75">75 minut</SelectItem>
              <SelectItem value="90">90 minut</SelectItem>
              <SelectItem value="120">120 minut</SelectItem>
            </SelectContent>
          </Select>
        </section>

        {/* Секція Промокодів */}
        <section>
       <PromoCodeSettings />
        </section>

        {/* Секція Банерів */}
        <section>
          <Accordion type="single" collapsible>
            <AccordionItem value="banners">
              <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">
                Banery reklamowe
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {bannersData && bannersData.length > 0 ? (
                    bannersData.map((banner, index) => (
                      <div key={banner.id} className="flex items-center justify-between space-x-4 max-w-lg">
                        <Image
                          src={banner.imageUrl}
                          width={400}
                          height={100}
                          alt={`Baner-${index + 1}`}
                          className="w-full h-auto object-cover rounded-md shadow-sm"
                        />
                        <LoadingButton
                          isLoading={deletingBannerId === banner.id}
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteBanner.mutate({ id: banner.id })}
                          className="ml-4"
                        >
                          Usuń
                        </LoadingButton>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 mt-2">Brak banerów. Dodaj nowy baner poniżej.</p>
                  )}
                  <BannerUploader
                    onImageUpload={(imageUrl) => {
                      createBanner.mutate({
                        imageUrl,
                        linkUrl: '',
                        position: bannersData ? bannersData.length + 1 : 1,
                      });
                    }}
                  />
                  <p className="text-text-foreground italic">
                    *Zalecany rozmiar banera - to{' '}
                    <span className="text-text-secondary">1056 px x 384 px</span>
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Секція Списку користувачів (тільки для Admin) */}
        {isAdmin && (
          <section>
            <UserList />
          </section>
        )}
      </div>
    </div>
  );
};

export default Settings;
