"use client";
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Film, MessageSquare, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { useUser } from '@/lib/contexts/UserContext';
import { API_URL } from '@/app/utils';
import { useParams } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { MovieCard } from '@/components/profile/MovieCard';
import { CommentCard } from '@/components/profile/CommentCard';
import { Pagination } from '@/components/profile/Pagination';
import { watch } from 'fs';



const ProfilePage = () => {
  const [currentPage, setCurrentPage] = useState({ comments: 1, watched: 1, watchlist: 1 });
  const { user } = useUser();
  const params = useParams();
  const userId = params.userId;

  const {
    data: userData,
    isLoading: isUserDataLoading,
    isError: isUserDataError,
    error: userDataError
  } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.getUserData(Number(userId)),

  });


  const {
    data: commentData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['comments', currentPage.comments],
    queryFn: () => profileService.getComments({
      userId: Number(userId),
      pageNum: currentPage.comments
    }),

    placeholderData: (previousData) => previousData,
  });


  const {
    data: moviesData,
    isLoading: isMoviesLoading,
    isError: isMoviesError,
    error: moviesError
  } = useQuery({
    queryKey: ['movies', currentPage.watched],
    queryFn: () => profileService.getMovies({
      userId: userId,
      pageNum: currentPage.watched
    }),

    placeholderData: (previousData) => previousData,
  });



  const {
    data: watchListData,
    isLoading: isWatchListLoading,
    isError: isWatchListError,
    error: watchListError
  } = useQuery({
    queryKey: ['watchlist', currentPage.watchlist],
    queryFn: () => profileService.getWatchLater({
      userId: userId,
      pageNum: currentPage.watchlist
    }),

    placeholderData: (previousData) => previousData,
  });


  let startUrl = '';
  let avatarUrl = user?.avatarUrl || '';
  if (avatarUrl.startsWith('http')) {
    startUrl = '';
  }
  else startUrl = API_URL;

  const ActivityItem = ({ label, userValue, avgValue, colorClass }:
    { label: string; userValue: number; avgValue: number; colorClass: string }) => {

    let diff = ((Number(userValue) - avgValue) / avgValue) * 100;
    const isHigher = diff > 0;
    const barWidth = Number(Math.min((Number(userValue) / (avgValue * 2)) * 100, 100));
    const barColor = colorClass.replace('text', 'bg');
    const textColor = colorClass;

    if (isNaN(diff)) {
      diff = 0;
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text">{label}</span>
          <span className={`font-semibold ${textColor}`}>
            {isHigher ? '+' : ''}{diff.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor}`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {isHigher
            ? `${(userValue / avgValue).toFixed(1)}x above average`
            : `Average user has ${avgValue} ${label.toLowerCase()}`}
        </p>
      </div>
    );
  };

  return (
    <div >
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8 max-w-6xl">

          {/* User Profile Card */}
          <div className="flex flex-col lg:flex-row justify-between items-start mb-8 gap-6">
            <Card className="w-full lg:flex-1 lg:max-w-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-35 h-35">
                    <AvatarImage src={`${startUrl}${avatarUrl || ''}`} />
                    <AvatarFallback>{user?.username?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">{user?.username}</h2>
                  </div>
                </div>
                <div className="flex justify-between text-center">
                  <div>
                    {
                      isUserDataLoading ? (
                        <Spinner />
                      ) : (
                        <div className="text-2xl font-bold">{userData?.watched.count}</div>
                      )
                    }
                    <div className="text-xs text-muted-foreground">Watched</div>
                  </div>
                  <div className="w-px bg-border" />
                  <div>
                    {
                      isUserDataLoading ? (
                        <Spinner />
                      ) : (
                        <div className="text-2xl font-bold">{userData?.comments.count}</div>
                      )
                    }
                    <div className="text-xs text-muted-foreground">Comments</div>
                  </div>
                  <div className="w-px bg-border" />
                  <div>
                    {
                      isUserDataLoading ? (
                        <Spinner />
                      ) : (
                        <div className="text-2xl font-bold">{userData?.watchlist.count}</div>
                      )
                    }
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
                {
                  isUserDataLoading ? (
                    <Spinner />
                  ) : (
                    <>
                      <ActivityItem label="Movies Watched" userValue={userData?.watched.count} avgValue={userData?.watched.platformAverage} colorClass="text-green-600 dark:text-green-500" />
                      <ActivityItem label="Comments Posted" userValue={userData?.comments.count} avgValue={userData?.comments.platformAverage} colorClass="text-blue-600 dark:text-blue-500" />
                    </>
                  )
                }
              </CardContent>
            </Card>
          </div>


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
                {
                  isMoviesLoading ? (
                    <p>Loading movies...</p>
                  ) : (
                    moviesData?.data.map((movie: any) => (
                      <MovieCard key={movie.id} movie={movie} />
                    )))
                }
              </div>
              {
                  moviesData?.data.length > 0 ?
                  (
                    <Pagination
                    current={currentPage.watched}
                    total={moviesData?.meta.lastPage}
                    onPageChange={(page) => setCurrentPage({ ...currentPage, watched: page })}
                    />
                  )
                  :
                  <p className='text-center'>No movies available</p>
              }
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments">
              <div className="grid gap-4">
                {isLoading ? (
                  <p>Loading comments...</p>
                ) : (
                  commentData?.data.map((comment: any) => (
                    <CommentCard key={comment.id} comment={comment} />
                  ))
                )}
              </div>

              {
              commentData?.data.length > 0 ? (
                <Pagination
                  current={currentPage.comments}
                  total={commentData?.meta.lastPage || 0}
                  onPageChange={(page) =>
                    setCurrentPage({ ...currentPage, comments: page })
                  }
                />
              ) 
              :
               <p className='text-center'>No comments available</p>
              }
            </TabsContent>

            {/* Watch Later Tab */}
            <TabsContent value="watchlist">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {
                  isWatchListLoading ? (
                    <p>Loading movies...</p>
                  ) : (
                    watchListData?.data.map((movie: any) => (
                      <MovieCard key={movie.id} movie={movie} />
                    )))
                }
              </div>
              {
                watchListData?.data.length > 0 ?
                (

                  <Pagination
                  current={currentPage.watchlist}
                  total={watchListData?.meta.lastPage}
                  onPageChange={(page) => setCurrentPage({ ...currentPage, watchlist: page })}
                  />
                )
                :
                <p className='text-center'>No movies in watch later list</p>
              }
            </TabsContent>


          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;


