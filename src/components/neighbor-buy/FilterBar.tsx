'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Hand, HardHat, List, ShoppingBasket } from 'lucide-react';
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
    { value: 'all', label: t.categories.all, icon: List },
    { value: 'Borrow', label: t.categories.Borrow, icon: Hand },
    { value: 'Help', label: t.categories.Help, icon: HardHat },
    { value: 'Group Buy', label: t.categories.GroupBuy, icon: ShoppingBasket },
  ];

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <Tabs value={category} onValueChange={onCategoryChange} className="w-full overflow-x-auto">
        <TabsList className="w-full justify-start sm:w-auto">
          {categories.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="flex-1 gap-2 px-3 sm:flex-initial">
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
            <SelectItem value="trust">{t.filterBar.trust}</SelectItem>
            <SelectItem value="newest">{t.filterBar.newest}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
