'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Apple, Home, Laptop, ShoppingBag, Sprout } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { getTranslations, type Language } from '@/lib/translations';

type FilterBarProps = {
  category: string;
  onCategoryChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  language?: Language;
};

export function FilterBar({
  category,
  onCategoryChange,
  sortBy,
  onSortByChange,
  language = 'cn',
}: FilterBarProps) {
  const t = getTranslations(language);

  const categories = [
    { value: 'all', label: t.categories.all, icon: ShoppingBag },
    { value: 'Food', label: t.categories.Food, icon: Apple },
    { value: 'Household', label: t.categories.Household, icon: Home },
    { value: 'Electronics', label: t.categories.Electronics, icon: Laptop },
    { value: 'Garden', label: t.categories.Garden, icon: Sprout },
  ];

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <Tabs value={category} onValueChange={onCategoryChange} className="w-full overflow-x-auto">
        <TabsList className="w-full justify-start sm:w-auto">
          {categories.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="flex-1 gap-2 px-2 sm:flex-initial">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2 self-end md:self-auto">
        <span className="hidden text-sm font-medium text-muted-foreground sm:inline">{t.filterBar.label}:</span>
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-[150px] sm:w-[180px]">
            <SelectValue placeholder={t.filterBar.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="proximity">{t.filterBar.proximity}</SelectItem>
            <SelectItem value="newest">{t.filterBar.newest}</SelectItem>
            <SelectItem value="price_asc">{t.filterBar.price_asc}</SelectItem>
            <SelectItem value="price_desc">{t.filterBar.price_desc}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}