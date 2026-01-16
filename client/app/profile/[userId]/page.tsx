"use client"
import React, { useEffect, useState } from 'react';
import { Movie, PaginatedResponse, TabType, User } from './types/types';
import { ProfileHeader } from './components/ProfileHeader';
import { mockComments, mockUser, mockWatchedMovies, mockWatchLaterMovies } from './mockdata/data';
import { Tabs } from './components/Tabs';
import { MovieGrid } from './components/MovieGrid';
import { CommentsSection } from './components/CommentsSection';
import api from '@/lib/axios';


import { useParams } from "next/navigation";


const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('watched');
  const [userHeader, setUserHeader] = useState<User>();
  const [watchLaterMovies, setWatchLaterMovies] = useState<User[]>([]);
  const [comments, setComments] = useState<User[]>([]);
  const [watchedMovies, setWatchedMovies] = useState<Movie[]>([]);
  const [currentWatchedPage, setCurrentWatchedPage] = useState(1);
  const [currentWatchLaterPage, setCurrentWatchLaterPage] = useState(1);
  const [currentCommentPage, setCurrentCommentPage] = useState(1);
  const [totalWatched, setTotalWatched] = useState(3000);
  const [totalWatchLater, setTotalWachLater] = useState(1);
  const [totalComments, setTotalComments] = useState(1);
  const params = useParams();
  const userId = params.userId;
  const LIMIT = 20;

  // useEffect(
  //   () => {
  //     handleFetchUserData();
  //     handleCurrentWatchedPageChange(1);
  //   }
  //   ,
  //   []);

  useEffect(() => {
    if (activeTab === 'watched') {
      handleCurrentWatchedPageChange(1);
    }
    if (activeTab === 'comments') {
      handleCurrentCommentPage(1);
    }
    if (activeTab === 'watchLater') {
      handleCurrentWatchLaterPage(1);
    }
  }, [activeTab]);

  async function fetchUserData() {
    const response = await api.get(`/profile/${userId}`);
    return response.data;
  }

  async function fetchUserPages(endpoint: string) {
    const response = await api.get(endpoint);
    return response.data;
  }

  const handleFetchUserData = async () => {
    try {
      const res = await fetchUserData();
      setUserHeader({
        id: res.id,
        username: res.username,
        avatarUrl: res.avatarUrl,
        watchedCount: res.watchedCount,
        commentsCount: res.commentsCount
      })
    }
    catch (err) {
      console.error(err);

      if (err instanceof Error) {
        // setError(err.message);
      } else {
        // setError('Unexpected error occurred');
      }
    }
  }

  const handleCurrentWatchedPageChange = async (pageNum: number) => {
    try {

      const endpoint = `/profile/${userId}/movies/?page=${pageNum}&limit=${LIMIT}`;
      const res = await fetchUserPages(endpoint);
      
      console.log("yoyo");
      console.log(res.data);
      setWatchedMovies(res.data);
      setTotalWatched(res.meta.total);
      setCurrentWatchedPage(pageNum);
    }
    catch (err) {
      if (err instanceof Error) {
        // setError(err.message);
      } else {
        // setError('Unexpected error occurred');
      }
    }
  }

  const handleCurrentWatchLaterPage = async (pageNum: number) => {
    try {
      const res = await fetchUserPages('/profile/watchlater');
      console.log(res.data);
      setWatchLaterMovies(res.data);
      setTotalWachLater(res.meta.total);
      setCurrentWatchLaterPage(pageNum);
    }
    catch (err) {
      console.error(err);

      if (err instanceof Error) {
        // setError(err.message);
      } else {
        // setError('Unexpected error occurred');
      }
    }
  }

  const handleCurrentCommentPage = async (pageNum: number) => {
    try {
      const res = await fetchUserPages('/profile/comments');
      console.log(res.data);
      setComments(res.data);
      setTotalComments(res.meta.total);
      setCurrentCommentPage(pageNum);
    }
    catch (err) {
      console.error(err);

      if (err instanceof Error) {
        // setError(err.message);
      } else {
        // setError('Unexpected error occurred');
      }
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <ProfileHeader user={mockUser} />
            </div>
          </aside>

          <div className="lg:col-span-9">
            <div className="bg-zinc-950 border border-zinc-900 overflow-hidden">
              {/* Tabs Navigation */}
              <Tabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'watched' && (
                  <MovieGrid
                    movies={watchedMovies}
                    isWatchLater={false}
                    itemsPerPage={20}
                    currentPage={currentWatchedPage}
                    onPageChange={handleCurrentWatchedPageChange}
                    total={totalWatched}
                  />
                )}

                {activeTab === 'watchLater' && (
                  <MovieGrid
                    movies={mockWatchLaterMovies}
                    isWatchLater={true}
                    itemsPerPage={20}
                    currentPage={currentWatchLaterPage}
                    onPageChange={handleCurrentWatchLaterPage}
                    total={totalWatchLater}
                  />
                )}

                {activeTab === 'comments' && (
                  <CommentsSection comments={mockComments}
                    currentPage={currentCommentPage}
                    onPageChange={handleCurrentCommentPage}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;