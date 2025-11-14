import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Apple, Home, Laptop, ShoppingBag, Sprout } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

const categories = [
  { value: 'all', label: {cn: '全部', en: 'All', no: 'Alle' }, icon: ShoppingBag },
  { value: 'Food', label: {cn: '食品', en: 'Food', no: 'Mat' }, icon: Apple },
  { value: 'Household', label: {cn: '家居', en: 'Household', no: 'Husholdning' }, icon: Home },
  { value: 'Electronics', label: {cn: '电子', en: 'Electronics', no: 'Elektronikk' }, icon: Laptop },
  { value: 'Garden', label: {cn: '园艺', en: 'Garden', no: 'Hage' }, icon: Sprout },
];

const sortOptions = {
  cn: {
    label: "排序",
    proximity: '距离优先',
    newest: '最新发布',
    price_asc: '价格: 从低到高',
    price_desc: '价格: 从高到低',
  },
  en: {
    label: "Sort by",
    proximity: 'Proximity',
    newest: 'Newest',
    price_asc: 'Price: Low to High',
    price_desc: 'Price: High to Low',
  },
  no: {
    label: "Sorter etter",
    proximity: 'Nærhet',
    newest: 'Nyeste',
    price_asc: 'Pris: Lav til Høy',
    price_desc: 'Pris: Høy til Lav',
  }
}

type FilterBarProps = {
  category: string;
  onCategoryChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  language?: 'cn' | 'en' | 'no';
};

export function FilterBar({
  category,
  onCategoryChange,
  sortBy,
  onSortByChange,
  language = 'cn',
}: FilterBarProps) {
  const t = sortOptions[language];
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <Tabs value={category} onValueChange={onCategoryChange} className="w-full overflow-x-auto">
        <TabsList className="grid w-full grid-cols-5 sm:w-auto">
          {categories.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="flex-1 gap-2 px-2 sm:flex-initial">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label[language]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2 self-end md:self-auto">
        <span className="hidden text-sm font-medium text-muted-foreground sm:inline">{t.label}:</span>
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-[150px] sm:w-[180px]">
            <SelectValue placeholder={t.label} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="proximity">{t.proximity}</SelectItem>
            <SelectItem value="newest">{t.newest}</SelectItem>
            <SelectItem value="price_asc">{t.price_asc}</SelectItem>
            <SelectItem value="price_desc">{t.price_desc}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
