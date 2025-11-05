import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  value?: string;
}

const SearchBar = ({
  onSearch,
  placeholder = 'Search articles...',
  value = '',
}: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState(value);

  // Sync internal state with external value
  React.useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={searchTerm}
        onChange={handleSearch}
        placeholder={placeholder}
        className="pl-10 pr-4 py-2 w-full"
      />
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-newspaper-muted">
        <Search size={18} />
      </div>
    </div>
  );
};

export default SearchBar;
