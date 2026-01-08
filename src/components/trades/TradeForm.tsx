import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, X, Plus, Check } from 'lucide-react';
import { ScreenshotUpload } from './ScreenshotUpload';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CURRENCY_PAIRS, SETUPS, EMOTIONS } from '@/types/trade';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Regex for XXX/XXX format (3-5 uppercase letters each side)
const PAIR_FORMAT_REGEX = /^[A-Z]{2,5}\/[A-Z]{2,5}$/;

const tradeSchema = z.object({
  pair: z.string().min(1, 'Select a currency pair').refine(
    (val) => PAIR_FORMAT_REGEX.test(val),
    { message: 'Format must be XXX/XXX (e.g., BTC/USD)' }
  ),
  direction: z.enum(['long', 'short']),
  entry_price: z.coerce.number().positive('Entry price must be positive'),
  exit_price: z.coerce.number().positive('Exit price must be positive').optional().nullable(),
  stop_loss: z.coerce.number().positive('Stop loss must be positive'),
  take_profit: z.coerce.number().positive('Take profit must be positive').optional().nullable(),
  lot_size: z.coerce.number().positive('Lot size must be positive'),
  commission: z.coerce.number().min(0, 'Commission cannot be negative').default(0),
  entry_time: z.date(),
  exit_time: z.date().optional().nullable(),
  status: z.enum(['open', 'closed']).default('open'),
  setups: z.array(z.string()).default([]),
  emotions: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  before_screenshot: z.string().optional().nullable(),
  after_screenshot: z.string().optional().nullable(),
});

type TradeFormData = z.infer<typeof tradeSchema>;

interface TradeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TradeFormData) => void;
  isSubmitting?: boolean;
  defaultValues?: Partial<TradeFormData>;
  mode?: 'create' | 'edit';
}

export function TradeForm({ open, onOpenChange, onSubmit, isSubmitting, defaultValues, mode = 'create' }: TradeFormProps) {
  const { user } = useAuth();
  const [selectedSetups, setSelectedSetups] = useState<string[]>(defaultValues?.setups || []);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(defaultValues?.emotions || []);
  const [beforeScreenshot, setBeforeScreenshot] = useState<string | null>(defaultValues?.before_screenshot || null);
  const [afterScreenshot, setAfterScreenshot] = useState<string | null>(defaultValues?.after_screenshot || null);
  const [customPair, setCustomPair] = useState<string>('');
  const [savedCustomPairs, setSavedCustomPairs] = useState<string[]>([]);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Load saved custom pairs
  useEffect(() => {
    if (user && open) {
      supabase
        .from('custom_currency_pairs')
        .select('pair')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          if (data) {
            setSavedCustomPairs(data.map(d => d.pair));
          }
        });
    }
  }, [user, open]);

  const saveCustomPair = async (pair: string) => {
    if (!user || !PAIR_FORMAT_REGEX.test(pair)) return;
    
    // Check if already saved
    if (savedCustomPairs.includes(pair) || CURRENCY_PAIRS.includes(pair as typeof CURRENCY_PAIRS[number])) {
      return;
    }

    const { error } = await supabase
      .from('custom_currency_pairs')
      .insert({ user_id: user.id, pair });

    if (!error) {
      setSavedCustomPairs(prev => [...prev, pair]);
      toast.success(`${pair} saved to your pairs`);
    }
  };

  const form = useForm<TradeFormData>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      pair: '',
      direction: 'long',
      entry_price: undefined,
      exit_price: null,
      stop_loss: undefined,
      take_profit: null,
      lot_size: 0.01,
      commission: 0,
      entry_time: new Date(),
      exit_time: null,
      status: 'open',
      setups: [],
      emotions: [],
      notes: '',
      ...defaultValues,
    },
  });

  // Reset form when defaultValues change (e.g., when editing a different trade)
  React.useEffect(() => {
    if (open && defaultValues) {
      form.reset({
        pair: '',
        direction: 'long',
        entry_price: undefined,
        exit_price: null,
        stop_loss: undefined,
        take_profit: null,
        lot_size: 0.01,
        commission: 0,
        entry_time: new Date(),
        exit_time: null,
        status: 'open',
        setups: [],
        emotions: [],
        notes: '',
        ...defaultValues,
      });
      setSelectedSetups(defaultValues.setups || []);
      setSelectedEmotions(defaultValues.emotions || []);
      setBeforeScreenshot(defaultValues.before_screenshot || null);
      setAfterScreenshot(defaultValues.after_screenshot || null);
    }
  }, [open, defaultValues, form]);

  const handleSubmit = (data: TradeFormData) => {
    onSubmit({
      ...data,
      setups: selectedSetups,
      emotions: selectedEmotions,
      before_screenshot: beforeScreenshot,
      after_screenshot: afterScreenshot,
    });
  };

  const toggleSetup = (setup: string) => {
    setSelectedSetups(prev =>
      prev.includes(setup) ? prev.filter(s => s !== setup) : [...prev, setup]
    );
  };

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotion) ? prev.filter(e => e !== emotion) : [...prev, emotion]
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto scrollbar-thin">
        <SheetHeader>
          <SheetTitle>{mode === 'edit' ? 'Edit Trade' : 'Log New Trade'}</SheetTitle>
          <SheetDescription>
            {mode === 'edit' ? 'Update your trade details.' : 'Enter your trade details to add it to your journal.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-6">
            {/* Pair & Direction */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pair"
                render={({ field }) => {
                  const allPairs = [...CURRENCY_PAIRS, ...savedCustomPairs];
                  const isKnownPair = allPairs.includes(field.value);
                  
                  return (
                    <FormItem>
                      <FormLabel>Currency Pair</FormLabel>
                      {!showCustomInput ? (
                        <Select 
                          onValueChange={(value) => {
                            if (value === 'custom') {
                              setShowCustomInput(true);
                              setCustomPair('');
                              field.onChange('');
                            } else {
                              field.onChange(value);
                            }
                          }} 
                          value={isKnownPair ? field.value : ''}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select pair" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="custom">+ Add Custom</SelectItem>
                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Standard Pairs</div>
                            {CURRENCY_PAIRS.map(pair => (
                              <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                            ))}
                            {savedCustomPairs.length > 0 && (
                              <>
                                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Your Custom Pairs</div>
                                {savedCustomPairs.map(pair => (
                                  <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                                ))}
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="XXX/XXX (e.g., BTC/USD)"
                              className="font-mono flex-1"
                              value={customPair}
                              onChange={(e) => {
                                const value = e.target.value.toUpperCase();
                                setCustomPair(value);
                                field.onChange(value);
                              }}
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              onClick={() => {
                                if (PAIR_FORMAT_REGEX.test(customPair)) {
                                  saveCustomPair(customPair);
                                }
                              }}
                              disabled={!PAIR_FORMAT_REGEX.test(customPair) || savedCustomPairs.includes(customPair)}
                              title="Save this pair for future use"
                            >
                              {savedCustomPairs.includes(customPair) ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </Button>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => {
                              setShowCustomInput(false);
                              setCustomPair('');
                              field.onChange('');
                            }}
                          >
                            ← Back to list
                          </Button>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direction</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="long">Long</SelectItem>
                        <SelectItem value="short">Short</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entry_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="1.08500"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exit_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exit Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="1.08800"
                        className="font-mono"
                        {...field}
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* SL & TP */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stop_loss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stop Loss</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="1.08300"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="take_profit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Take Profit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="1.09000"
                        className="font-mono"
                        {...field}
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Lot Size & Commission */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lot_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lot Size</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.01"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Entry Time */}
            <FormField
              control={form.control}
              name="entry_time"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Entry Time</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP HH:mm')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Setups */}
            <div className="space-y-2">
              <FormLabel>Setups / Strategies</FormLabel>
              <div className="flex flex-wrap gap-2">
                {SETUPS.map(setup => (
                  <Badge
                    key={setup}
                    variant={selectedSetups.includes(setup) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleSetup(setup)}
                  >
                    {setup}
                    {selectedSetups.includes(setup) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Emotions */}
            <div className="space-y-2">
              <FormLabel>Emotions / Psychology</FormLabel>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map(emotion => {
                  const isNegative = ['FOMO', 'Greedy', 'Fearful', 'Revenge Trading', 'Overconfident', 'Impulsive', 'Rule Break'].includes(emotion);
                  return (
                    <Badge
                      key={emotion}
                      variant={selectedEmotions.includes(emotion) ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-colors',
                        selectedEmotions.includes(emotion) && isNegative && 'bg-loss hover:bg-loss/80'
                      )}
                      onClick={() => toggleEmotion(emotion)}
                    >
                      {emotion}
                      {selectedEmotions.includes(emotion) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Screenshots */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Screenshots</label>
              <div className="grid grid-cols-2 gap-4">
                <ScreenshotUpload
                  label="Before Trade"
                  value={beforeScreenshot}
                  onChange={setBeforeScreenshot}
                />
                <ScreenshotUpload
                  label="After Trade"
                  value={afterScreenshot}
                  onChange={setAfterScreenshot}
                />
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Trade rationale, lessons learned..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update Trade' : 'Save Trade'}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
