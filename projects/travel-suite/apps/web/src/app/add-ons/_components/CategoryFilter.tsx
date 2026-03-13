"use client";

import { Plus, Search } from "lucide-react";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";

interface CategoryFilterProps {
  readonly categories: readonly string[];
  readonly selectedCategory: string;
  readonly onSelectCategory: (category: string) => void;
  readonly searchQuery: string;
  readonly onSearchChange: (query: string) => void;
  readonly onCreateClick: () => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onCreateClick,
}: CategoryFilterProps) {
  return (
    <>
      {/* Category Tabs + Create Button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <GlassButton
              key={category}
              variant={selectedCategory === category ? "primary" : "ghost"}
              size="sm"
              onClick={() => onSelectCategory(category)}
            >
              {category}
            </GlassButton>
          ))}
        </div>

        <GlassButton variant="primary" onClick={onCreateClick}>
          <Plus className="w-4 h-4" />
          Add New Add-on
        </GlassButton>
      </div>

      {/* Search */}
      <GlassInput
        placeholder="Search add-ons..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        icon={Search}
      />
    </>
  );
}
