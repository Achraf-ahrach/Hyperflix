"use client";
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Film, MessageSquare, Clock, Star, Calendar } from 'lucide-react';

interface Movie {
  id: number;
  title: string;
  year: number;
  poster: string;
  rating: number;
  watchedDate?: string;
}

interface Comment {
  id: number;
  movieTitle: string;
  content: string;
  date: string;
  likes: number;
}

const mockMovies: Movie[] = Array.from({ length: 24 }, (_, i) => ({
  id: i + 1,
  title: `Movie Title ${i + 1}`,
  year: 2020 + (i % 5),
  poster: `https://images.unsplash.com/photo-${1440404653}-c67db74d2ba4 + i}?w=300&h=450&fit=crop`,
  rating: 3.5 + (i % 3),
  watchedDate: new Date(2024, i % 12, (i % 28) + 1).toLocaleDateString()
}));

const mockComments: Comment[] = Array.from({ length: 18 }, (_, i) => ({
  id: i + 1,
  movieTitle: `Movie Title ${i + 1}`,
  content: `This is a sample comment about the movie. It was really engaging and well-directed. The cinematography was stunning and the story kept me hooked throughout.`,
  date: new Date(2024, i % 12, (i % 28) + 1).toLocaleDateString(),
  likes: Math.floor(Math.random() * 100)
}));

const ProfilePage = () => {
  const [isDark, setIsDark] = useState(true);
  const [currentPage, setCurrentPage] = useState({ comments: 1, watched: 1, watchlist: 1 });
  
  const itemsPerPage = 6;

  // Pagination logic
  const paginate = (items: any[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    return items.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = (items: any[]) => Math.ceil(items.length / itemsPerPage);

  const Pagination = ({ current, total, onPageChange }: { current: number; total: number; onPageChange: (page: number) => void }) => (
    <div className="flex justify-center gap-2 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, current - 1))}
        disabled={current === 1}
      >
        Previous
      </Button>
      <div className="flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={current === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className="w-10"
          >
            {page}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(total, current + 1))}
        disabled={current === total}
      >
        Next
      </Button>
    </div>
  );

  const MovieCard = ({ movie }: { movie: Movie }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
      <div className="aspect-[2/3] bg-muted relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background/40 group-hover:opacity-80 transition-opacity" />
      </div>
      <CardContent className="p-4">
        <h4 className="font-semibold text-sm mb-2 line-clamp-1">{movie.title}</h4>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>{movie.year}</span>
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            <span className="font-medium">{movie.rating.toFixed(1)}</span>
          </div>
        </div>
        {movie.watchedDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{movie.watchedDate}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CommentCard = ({ comment }: { comment: Comment }) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{comment.movieTitle}</CardTitle>
            <CardDescription className="text-xs mt-1">{comment.date}</CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            ❤️ {comment.likes}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{comment.content}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header with theme toggle */}


          {/* User Profile Card */}
          <div className="flex flex-col lg:flex-row justify-between items-start mb-8 gap-6">
            <Card className="w-full lg:flex-1 lg:max-w-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-35 h-35">
                    <AvatarImage src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">John Doe</h2>
                    <p className="text-sm text-muted-foreground">Movie Enthusiast</p>
                  </div>
                </div>
                
                <div className="flex justify-between text-center">
                  <div>
                    <div className="text-2xl font-bold">248</div>
                    <div className="text-xs text-muted-foreground">Watched</div>
                  </div>
                  <div className="w-px bg-border" />
                  <div>
                    <div className="text-2xl font-bold">127</div>
                    <div className="text-xs text-muted-foreground">Comments</div>
                  </div>
                  <div className="w-px bg-border" />
                  <div>
                    <div className="text-2xl font-bold">42</div>
                    <div className="text-xs text-muted-foreground">Watchlist</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Comparison */}
            <Card className="w-full lg:flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Your Activity</CardTitle>
                <CardDescription>Compared to platform average</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Movies Watched */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Movies Watched</span>
                    <span className="font-semibold text-green-600 dark:text-green-500">+156%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 dark:bg-green-500" style={{ width: '85%' }} />
                  </div>
                  <p className="text-xs text-muted-foreground">You watch 2.5x more than average user</p>
                </div>

                {/* Comments */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Comments Posted</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-500">+89%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 dark:bg-blue-500" style={{ width: '68%' }} />
                  </div>
                  <p className="text-xs text-muted-foreground">More engaged than 89% of users</p>
                </div>

                {/* Watchlist */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Watchlist Size</span>
                    <span className="font-semibold text-orange-600 dark:text-orange-500">+34%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-orange-600 dark:bg-orange-500" style={{ width: '45%' }} />
                  </div>
                  <p className="text-xs text-muted-foreground">Average user has 31 movies saved</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="watched" className="w-full">
            <TabsList className="w-fit mb-8">
              <TabsTrigger value="watched" className="gap-2">
                <Film className="w-4 h-4" />
                Watched
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments
              </TabsTrigger>
              <TabsTrigger value="watchlist" className="gap-2">
                <Clock className="w-4 h-4" />
                Watch Later
              </TabsTrigger>
            </TabsList>

            {/* Watched Movies Tab */}
            <TabsContent value="watched">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {paginate(mockMovies, currentPage.watched).map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
              <Pagination
                current={currentPage.watched}
                total={totalPages(mockMovies)}
                onPageChange={(page) => setCurrentPage({ ...currentPage, watched: page })}
              />
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments">
              <div className="grid gap-4">
                {paginate(mockComments, currentPage.comments).map((comment) => (
                  <CommentCard key={comment.id} comment={comment} />
                ))}
              </div>
              <Pagination
                current={currentPage.comments}
                total={totalPages(mockComments)}
                onPageChange={(page) => setCurrentPage({ ...currentPage, comments: page })}
              />
            </TabsContent>

            {/* Watch Later Tab */}
            <TabsContent value="watchlist">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {paginate(mockMovies.slice(0, 12), currentPage.watchlist).map((movie) => (
                  <MovieCard key={movie.id} movie={{ ...movie, watchedDate: undefined }} />
                ))}
              </div>
              <Pagination
                current={currentPage.watchlist}
                total={totalPages(mockMovies.slice(0, 12))}
                onPageChange={(page) => setCurrentPage({ ...currentPage, watchlist: page })}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;