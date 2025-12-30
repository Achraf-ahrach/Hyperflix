"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Search, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
    onSortChange: (value: string) => void;
    onGenreChange: (value: string) => void;
    onRatingChange: (value: string) => void;
    onYearChange: (value: string) => void;
    onHideWatchedChange: (value: boolean) => void;
}

export function FilterBar({
    onSortChange,
    onGenreChange,
    onRatingChange,
    onYearChange,
    onHideWatchedChange,
}: FilterBarProps) {
    const [hideWatched, setHideWatched] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    // Mock data for dropdowns
    const genres = ["Action", "Sci-Fi", "Thriller", "Adventure", "Drama"];
    const years = ["2024", "2023", "2022", "2021", "2020", "Older"];
    const ratings = ["9+", "8+", "7+", "6+"];

    const toggleHideWatched = () => {
        const newVal = !hideWatched;
        setHideWatched(newVal);
        onHideWatchedChange(newVal);
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-muted-foreground mr-2 font-medium">Sort by:</span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="bg-card hover:bg-card/80 border border-border/50">
                            Name <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => onSortChange("name_asc")}>Name (A-Z)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("name_desc")}>Name (Z-A)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("rating_desc")}>Highest Rated</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("year_desc")}>Newest</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="bg-card hover:bg-card/80 border border-border/50">
                            Genre <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onGenreChange("")}>All Genres</DropdownMenuItem>
                        {genres.map(g => (
                            <DropdownMenuItem key={g} onClick={() => onGenreChange(g)}>{g}</DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="bg-card hover:bg-card/80 border border-border/50">
                            IMDb Grade <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onRatingChange("")}>Any Rating</DropdownMenuItem>
                        {ratings.map(r => (
                            <DropdownMenuItem key={r} onClick={() => onRatingChange(r)}>{r}</DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" className="bg-card hover:bg-card/80 border border-border/50">
                            Year <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onYearChange("")}>Any Year</DropdownMenuItem>
                        {years.map(y => (
                            <DropdownMenuItem key={y} onClick={() => onYearChange(y)}>{y}</DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex items-center gap-4">
                {/* Search Toggle / Input */}
                <div className={cn("relative transition-all duration-300", searchOpen ? "w-64" : "w-10")}>
                    {searchOpen ? (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                className="w-full bg-card border border-border/50 rounded-full py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                placeholder="Search..."
                                autoFocus
                            />
                            <button
                                onClick={() => setSearchOpen(false)}
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

                {/* Hide Watched & Toggle */}
                <div
                    className="flex items-center gap-3 bg-card px-4 py-2 rounded-lg border border-border/50 cursor-pointer select-none hover:bg-card/80 transition-colors"
                    onClick={toggleHideWatched}
                >
                    <span className="text-sm font-medium text-muted-foreground">Hide Watched</span>
                    <div className={cn(
                        "w-10 h-5 rounded-full relative transition-colors duration-300",
                        hideWatched ? "bg-primary" : "bg-muted"
                    )}>
                        <div className={cn(
                            "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-300",
                            hideWatched ? "translate-x-5" : "translate-x-0"
                        )} />
                    </div>
                </div>
            </div>
        </div>
    );
}
