'use client'

type ProjectFilterProps = {
  categories: string[]
  activeCategory: string
  onCategoryChange: (category: string) => void
}

/**
 * Category filter chips for the portfolio section.
 * Desktop: restrained inline chips.
 * Mobile: horizontally scrollable.
 */
export function ProjectFilter({ categories, activeCategory, onCategoryChange }: ProjectFilterProps) {
  const allCategories = ['Semua', ...categories]

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
      {allCategories.map(cat => {
        const isActive = cat === activeCategory
        return (
          <button
            key={cat}
            type="button"
            aria-pressed={isActive}
            onClick={() => onCategoryChange(cat)}
            className={`
              shrink-0 px-4 py-2 text-xs tracking-[0.08em] uppercase
              border transition-colors duration-200
              ${isActive
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted hover:border-foreground hover:text-foreground'
              }
            `}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
