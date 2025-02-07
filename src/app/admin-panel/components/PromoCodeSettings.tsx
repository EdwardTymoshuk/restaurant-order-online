'use client';

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/app/components/ui/accordion'
import { Button } from '@/app/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/app/components/ui/dialog'
import { Input } from '@/app/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/app/components/ui/select'
import { Switch } from '@/app/components/ui/switch'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/app/components/ui/table'
import { trpc } from '@/utils/trpc'
import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'

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

const PromoCodeSettings: React.FC = () => {
	console.log('Test log')
  // State for list of promo codes
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  // State for controlling the dialog for adding a new promo code
  const [isPromoCodeDialogOpen, setIsPromoCodeDialogOpen] = useState(false);

  // TRPC hooks for fetching, creating and deleting promo codes
  const { data: promoCodesData, refetch: refetchPromoCodes } =
    trpc.promoCode.getAllPromoCodes.useQuery();
  const createPromoCode = trpc.promoCode.createPromoCode.useMutation({
    onSuccess: () => {
      refetchPromoCodes();
    },
  });
  const deletePromoCode = trpc.promoCode.deletePromoCode.useMutation({
    onSuccess: () => {
      refetchPromoCodes();
    },
  });

  // New promo code state including new date range fields
  const [newPromoCode, setNewPromoCode] = useState<{
    code: string;
    discountType: 'FIXED' | 'PERCENTAGE';
    discountValue: string;
    isActive: boolean;
    expiresInDays: number | null; // Used when date range is not selected
    isOneTimeUse: boolean;
    useDateRange: boolean; // New switch for using explicit date range
    startDate: string; // Start date in YYYY-MM-DD format
    endDate: string; // End date in YYYY-MM-DD format
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

  // Update promo codes list when data is fetched
  useEffect(() => {
    if (promoCodesData) {
      setPromoCodes(promoCodesData);
    }
  }, [promoCodesData]);

  // Function to generate a random promo code string
  const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < 10; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  // Handler for adding a new promo code
  const handleAddPromoCode = () => {
	console.log('handleAddPromoCode запущено')
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

    // If date range option is enabled, validate start and end dates
    if (newPromoCode.useDateRange) {
      if (!newPromoCode.startDate || !newPromoCode.endDate) {
        toast.warning('Proszę wybrać daty rozpoczęcia i zakończenia.');
        return;
      }
	  console.log('Creating promo code with explicit date range:', newPromoCode);
      // Call the mutation with explicit date range
      createPromoCode.mutate({
        code: newPromoCode.code,
        discountType: newPromoCode.discountType,
        discountValue: discountValue,
        isActive: newPromoCode.isActive,
        isOneTimeUse: newPromoCode.isOneTimeUse,
        // Assuming backend accepts 'startDate' and 'expiresAt' for date range mode
        startDate: newPromoCode.startDate,
        expiresAt: newPromoCode.endDate,
      });
    } else {
      // Use relative expiration (in days) if not using date range
      const expiresAt = newPromoCode.expiresInDays
        ? dayjs().add(newPromoCode.expiresInDays, 'day').toISOString()
        : undefined;

		console.log('Creating promo code with relative expiration:', newPromoCode);

      createPromoCode.mutate({
        code: newPromoCode.code,
        discountType: newPromoCode.discountType,
        discountValue: discountValue,
        isActive: newPromoCode.isActive,
        isOneTimeUse: newPromoCode.isOneTimeUse,
        expiresAt: expiresAt,
      });
    }

    // Reset the new promo code state and close the dialog
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

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="promoCodes">
        <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline">
          Kody promocyjne
        </AccordionTrigger>
        <AccordionContent>
          <Table>
            <TableHeader className="text-text-foreground">
              <TableRow>
                <TableHead>Kod</TableHead>
                <TableHead>Typ zniżki</TableHead>
                <TableHead>Wartość</TableHead>
                <TableHead>Data ważności</TableHead>
                <TableHead>Jednorazowy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoCodes.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="font-bold">{promo.code}</TableCell>
                  <TableCell>
                    {promo.discountType === 'FIXED' ? 'Kwota stała' : 'Procent'}
                  </TableCell>
                  <TableCell>
                    {promo.discountValue} {promo.discountType === 'FIXED' ? 'zł' : '%'}
                  </TableCell>
                  <TableCell>
                    {promo.expiresAt
                      ? dayjs(promo.expiresAt).format('YYYY-MM-DD')
                      : 'Bezterminowy'}
                  </TableCell>
                  <TableCell>{promo.isOneTimeUse ? 'Tak' : 'Nie'}</TableCell>
                  <TableCell>{promo.isUsed ? 'Wykorzystany' : 'Aktywny'}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        deletePromoCode.mutate({ id: promo.id });
                      }}
                    >
                      Usuń
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button onClick={() => setIsPromoCodeDialogOpen(true)} className="mt-4">
            Dodaj
          </Button>

          {/* Dialog for adding a new promo code */}
          <Dialog open={isPromoCodeDialogOpen} onOpenChange={setIsPromoCodeDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dodaj nowy kod promocyjny</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Code input and random generation */}
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Kod"
                    value={newPromoCode.code}
                    onChange={(e) =>
                      setNewPromoCode((prev) => ({
                        ...prev,
                        code: e.target.value,
                      }))
                    }
                  />
                  <Button
                    onClick={() =>
                      setNewPromoCode((prev) => ({
                        ...prev,
                        code: generateRandomCode(),
                      }))
                    }
                  >
                    Zgenerować
                  </Button>
                </div>

                {/* Discount type selection */}
                <Select
                  value={newPromoCode.discountType}
                  onValueChange={(value) =>
                    setNewPromoCode((prev) => ({
                      ...prev,
                      discountType: value as 'FIXED' | 'PERCENTAGE',
                      discountValue: '',
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Typ zniżki" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Kwota stała</SelectItem>
                    <SelectItem value="PERCENTAGE">Procent</SelectItem>
                  </SelectContent>
                </Select>

                {/* Discount value input */}
                <Input
                  type="number"
                  placeholder="Wartość"
                  value={newPromoCode.discountValue}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^0-9.]/g, '');
                    if (value === '') {
                      setNewPromoCode((prev) => ({ ...prev, discountValue: '' }));
                      return;
                    }
                    let numericValue = parseFloat(value);
                    if (numericValue < 0) {
                      numericValue = 0;
                    }
                    if (newPromoCode.discountType === 'PERCENTAGE' && numericValue > 100) {
                      numericValue = 100;
                    }
                    setNewPromoCode((prev) => ({
                      ...prev,
                      discountValue: numericValue.toString(),
                    }));
                  }}
                />

                {/* One-time use switch */}
                <div>
                  <label className="flex items-center space-x-2">
                    <Switch
                      checked={newPromoCode.isOneTimeUse}
                      onCheckedChange={(checked) =>
                        setNewPromoCode((prev) => ({
                          ...prev,
                          isOneTimeUse: checked,
                        }))
                      }
                    />
                    <span>Kod jednorazowy</span>
                  </label>
                </div>

                {/* New switch for using explicit date range */}
                <div>
                  <label className="flex items-center space-x-2">
                    <Switch
                      checked={newPromoCode.useDateRange}
                      onCheckedChange={(checked) =>
                        setNewPromoCode((prev) => ({
                          ...prev,
                          useDateRange: checked,
                        }))
                      }
                    />
                    <span>Ustal zakres dat aktywności</span>
                  </label>
                  {newPromoCode.useDateRange && (
                    <div className="pt-4 space-y-2">
                      <Input
                        type="date"
                        placeholder="Data rozpoczęcia"
                        value={newPromoCode.startDate}
                        onChange={(e) =>
                          setNewPromoCode((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                      />
                      <Input
                        type="date"
                        placeholder="Data zakończenia"
                        value={newPromoCode.endDate}
                        onChange={(e) =>
                          setNewPromoCode((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Existing expiration mode switch (only if not using date range) */}
                {!newPromoCode.useDateRange && (
                  <div>
                    <label className="flex items-center space-x-2">
                      <Switch
                        checked={newPromoCode.expiresInDays === null}
                        onCheckedChange={(checked) =>
                          setNewPromoCode((prev) => ({
                            ...prev,
                            expiresInDays: checked ? null : 30,
                          }))
                        }
                      />
                      <span>
                        {newPromoCode.expiresInDays === null ? 'Bezterminowy' : 'Terminowy'}
                      </span>
                    </label>
                    {newPromoCode.expiresInDays !== null && (
                      <div className="pt-4">
                        <Input
                          type="number"
                          placeholder="Dni ważności"
                          value={
                            newPromoCode.expiresInDays !== null
                              ? newPromoCode.expiresInDays.toString()
                              : ''
                          }
                          onChange={(e) =>
                            setNewPromoCode((prev) => ({
                              ...prev,
                              expiresInDays: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <DialogFooter className='gap-2'>
                <Button
                  onClick={handleAddPromoCode}
                  disabled={!newPromoCode.code.trim() || !newPromoCode.discountValue.trim()}
                >
                  Dodaj
                </Button>
                <Button variant="secondary" onClick={() => setIsPromoCodeDialogOpen(false)}>
                  Anuluj
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default PromoCodeSettings;
