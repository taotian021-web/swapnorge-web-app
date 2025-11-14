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
  { value: 'all', label: 'All', icon: ShoppingBag },
  { value: 'Food', label: 'Food', icon: Apple },
  { value: 'Household', label: 'Household', icon: Home },
  { value: 'Electronics', label: 'Electronics', icon: Laptop },
  { value: 'Garden', label: 'Garden', icon: Sprout },
];

type FilterBarProps = {
  category: string;
  onCategoryChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
};

export function FilterBar({
  category,
  onCategoryChange,
  sortBy,
  onSortByChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <Tabs value={category} onValueChange={onCategoryChange} className="w-full overflow-x-auto">
        <TabsList className="grid w-full grid-cols-5 sm:w-auto">
          {categories.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value} className="flex-1 gap-2 px-2 sm:flex-initial">
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2 self-end md:self-auto">
        <span className="hidden text-sm font-medium text-muted-foreground sm:inline">Sort by:</span>
        <Select value={sortBy} onValueChange={onSortByChange}>
          <SelectTrigger className="w-[150px] sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="proximity">Proximity</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
