"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Search, X, Check, EyeOff } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { MovieFilters } from "@/lib/hooks/useMovies";

// Complete genre list from IMDb
const GENRES = [
    "Action",
    "Adventure",
    "Animation",
    "Biography",
    "Comedy",
    "Crime",
    "Documentary",
    "Drama",
    "Family",
    "Fantasy",
    "Film-Noir",
    "History",
    "Horror",
    "Music",
    "Musical",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Sport",
    "Thriller",
    "War",
    "Western",
] as const;

// Rating options (minimum IMDb rating)
const RATINGS = [
    { label: "9+", value: 9 },
    { label: "8+", value: 8 },
    { label: "7+", value: 7 },
    { label: "6+", value: 6 },
    { label: "5+", value: 5 },
];

// Sort options matching YTS API
const SORT_OPTIONS = [
    { label: "Name (A-Z)", sort_by: "title" as const, order_by: "asc" as const },
    { label: "Name (Z-A)", sort_by: "title" as const, order_by: "desc" as const },
    { label: "Highest Rated", sort_by: "rating" as const, order_by: "desc" as const },
    { label: "Lowest Rated", sort_by: "rating" as const, order_by: "asc" as const },
    { label: "Newest", sort_by: "year" as const, order_by: "desc" as const },
    { label: "Oldest", sort_by: "year" as const, order_by: "asc" as const },
    { label: "Most Downloaded", sort_by: "download_count" as const, order_by: "desc" as const },
    { label: "Most Liked", sort_by: "like_count" as const, order_by: "desc" as const },
    { label: "Recently Added", sort_by: "date_added" as const, order_by: "desc" as const },
];

// // Quality options
// const QUALITY_OPTIONS = [
//     { label: "All", value: "all" },
//     { label: "720p", value: "720p" },
//     { label: "1080p", value: "1080p" },
//     { label: "2160p (4K)", value: "2160p" },
//     { label: "3D", value: "3D" },
// ];

interface FilterBarProps {
    filters: MovieFilters;
    onFiltersChange: (filters: MovieFilters) => void;
}

export function FilterBar({
    filters,
    onFiltersChange,
}: FilterBarProps) {
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters.query_term || "");

    const handleSortChange = useCallback((sort_by: MovieFilters['sort_by'], order_by: MovieFilters['order_by']) => {
        onFiltersChange({ ...filters, sort_by, order_by });
    }, [filters, onFiltersChange]);

    const handleGenreChange = useCallback((genre: string | undefined) => {
        onFiltersChange({ ...filters, genre });
    }, [filters, onFiltersChange]);

    const handleRatingChange = useCallback((minimum_rating: number | undefined) => {
        onFiltersChange({ ...filters, minimum_rating });
    }, [filters, onFiltersChange]);

    const handleQualityChange = useCallback((quality: string | undefined) => {
        onFiltersChange({ ...filters, quality: quality === 'all' ? undefined : quality });
    }, [filters, onFiltersChange]);

    const handleHideWatchedToggle = useCallback(() => {
        onFiltersChange({ ...filters, hideWatched: !filters.hideWatched });
    }, [filters, onFiltersChange]);

    const handleSearchSubmit = useCallback(() => {
        if (searchQuery.trim()) {
            onFiltersChange({ ...filters, query_term: searchQuery.trim() });
        } else {
            onFiltersChange({ ...filters, query_term: undefined });
        }
    }, [filters, searchQuery, onFiltersChange]);

    const handleClearSearch = useCallback(() => {
        setSearchQuery("");
        onFiltersChange({ ...filters, query_term: undefined });
        setSearchOpen(false);
    }, [filters, onFiltersChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    }, [handleSearchSubmit]);

    // Get current sort label
    const currentSort = SORT_OPTIONS.find(
        opt => opt.sort_by === filters.sort_by && opt.order_by === filters.order_by
    ) || SORT_OPTIONS[8]; // Default to "Recently Added"

    // Get current genre label
    const currentGenre = filters.genre || "All Genres";

    // Get current rating label
    const currentRating = filters.minimum_rating
        ? RATINGS.find(r => r.value === filters.minimum_rating)?.label || "Any Rating"
        : "Any Rating";

    // // Get current quality label
    // const currentQuality = filters.quality 
    //     ? QUALITY_OPTIONS.find(q => q.value === filters.quality)?.label || "All"
    //     : "All";

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-muted-foreground mr-2 font-medium">Sort by:</span>

                {/* Sort Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="bg-card hover:bg-card/80 border border-border/50">
                            {currentSort.label} <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
                        {SORT_OPTIONS.map((opt) => (
                            <DropdownMenuItem
                                key={`${opt.sort_by}-${opt.order_by}`}
                                onClick={() => handleSortChange(opt.sort_by, opt.order_by)}
                                className="flex items-center justify-between"
                            >
                                {opt.label}
                                {currentSort.sort_by === opt.sort_by && currentSort.order_by === opt.order_by && (
                                    <Check className="h-4 w-4 ml-2" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Genre Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="bg-card hover:bg-card/80 border border-border/50">
                            {currentGenre} <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-80 overflow-y-auto">
                        <DropdownMenuItem
                            onClick={() => handleGenreChange(undefined)}
                            className="flex items-center justify-between"
                        >
                            All Genres
                            {!filters.genre && <Check className="h-4 w-4 ml-2" />}
                        </DropdownMenuItem>
                        {GENRES.map((genre) => (
                            <DropdownMenuItem
                                key={genre}
                                onClick={() => handleGenreChange(genre)}
                                className="flex items-center justify-between"
                            >
                                {genre}
                                {filters.genre === genre && <Check className="h-4 w-4 ml-2" />}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Rating Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="bg-card hover:bg-card/80 border border-border/50">
                            IMDb {currentRating} <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem
                            onClick={() => handleRatingChange(undefined)}
                            className="flex items-center justify-between"
                        >
                            Any Rating
                            {!filters.minimum_rating && <Check className="h-4 w-4 ml-2" />}
                        </DropdownMenuItem>
                        {RATINGS.map((rating) => (
                            <DropdownMenuItem
                                key={rating.value}
                                onClick={() => handleRatingChange(rating.value)}
                                className="flex items-center justify-between"
                            >
                                {rating.label}
                                {filters.minimum_rating === rating.value && <Check className="h-4 w-4 ml-2" />}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Quality Dropdown */}
                {/* <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="bg-card hover:bg-card/80 border border-border/50">
                            Quality: {currentQuality} <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {QUALITY_OPTIONS.map((quality) => (
                            <DropdownMenuItem 
                                key={quality.value} 
                                onClick={() => handleQualityChange(quality.value)}
                                className="flex items-center justify-between"
                            >
                                {quality.label}
                                {(filters.quality === quality.value || (!filters.quality && quality.value === 'all')) && (
                                    <Check className="h-4 w-4 ml-2" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu> */}

                {/* Hide Watched Toggle */}
                <Button
                    variant={filters.hideWatched ? "default" : "secondary"}
                    className={cn(
                        "border border-border/50",
                        filters.hideWatched && "bg-primary hover:bg-primary/90"
                    )}
                    onClick={handleHideWatchedToggle}
                >
                    <EyeOff className="mr-2 h-4 w-4" />
                    {filters.hideWatched ? "Watched Hidden" : "Hide Watched"}
                </Button>
            </div>

            <div className="flex items-center gap-4">
                {/* Search Toggle / Input */}
                <div className={cn("relative transition-all duration-300", searchOpen ? "w-64" : "w-10")}>
                    {searchOpen ? (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                className="w-full bg-card border border-border/50 rounded-full py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Search movies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                            <button
                                onClick={handleClearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSearchOpen(true)}
                            className="hover:bg-card rounded-full"
                        >
                            <Search className="w-5 h-5" />
                        </Button>
                    )}
                </div>

                {/* Active Filters Indicator */}
                {(filters.genre || filters.minimum_rating || filters.quality || filters.query_term || filters.hideWatched) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFiltersChange({ sort_by: filters.sort_by, order_by: filters.order_by })}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Clear Filters <X className="ml-1 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
