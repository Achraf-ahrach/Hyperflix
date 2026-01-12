// ============================================================================
// MOCK DATA
// ============================================================================

import { Movie, User , Comment} from "../types/types";

export const mockUser: User = {
  id: '1',
  username: '@cinephile_alex',
  // displayName: 'Alex Rodriguez',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
  watchedCount: 342,
  // watchLaterCount: 1247,
  commentsCount: 89,
};

// Generate mock movies for pagination
export const generateMockMovies = (count: number, startId: number = 1): Movie[] => {
  const titles = [
    'The Shawshank Redemption', 'The Dark Knight', 'Inception', 'Pulp Fiction',
    'Interstellar', 'The Matrix', 'Forrest Gump', 'The Godfather',
    'Fight Club', 'Goodfellas', 'The Prestige', 'Parasite',
    'Dune', 'The Batman', 'Everything Everywhere All at Once',
    'No Country for Old Men', 'Blade Runner 2049', 'Arrival',
    'Whiplash', 'La La Land', 'Joker', 'Oppenheimer',
    'The Grand Budapest Hotel', 'Mad Max: Fury Road', 'Moonlight'
  ];

  const posters = [
    'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=300&h=450&fit=crop',
    'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=300&h=450&fit=crop',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop',
    'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=450&fit=crop',
    'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&h=450&fit=crop',
    'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=300&h=450&fit=crop',
  ];

  return Array.from({ length: count }, (_, i) => {
    const titleIndex = i % titles.length;
    const posterIndex = i % posters.length;
    return {
      id: String(startId + i),
      title: `${titles[titleIndex]} ${i > 24 ? `(${Math.floor(i / 25)})` : ''}`.trim(),
      year: 1990 + (i % 34),
      rating: 7.0 + Math.random() * 2.3,
      posterUrl: posters[posterIndex],
    };
  });
};

export const mockWatchedMovies = generateMockMovies(342);
export const mockWatchLaterMovies = generateMockMovies(1247, 500);

export const mockComments: Comment[] =

[
  {
    id: 1,
    movieId: 1,
    movieTitle: 'The Shawshank Redemption',
    moviePosterUrl: 'https://images.unsplash.com/photo-1594908900066-3f47337549d8?w=300&h=450&fit=crop',
    content: 'An absolute masterpiece. The storytelling, the performances, everything about this film is perfect. Tim Robbins and Morgan Freeman deliver career-defining performances.',
    rating: 10,
    createdAt: '2 days ago',
    // likes: 24,
  },
  {
    id: 2,
    movieId: 2,
    movieTitle: 'Inception',
    moviePosterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop',
    content: 'Nolan at his finest. The dream sequences are mind-bending and the practical effects hold up incredibly well. Hans Zimmer\'s score is phenomenal.',
    rating: 9,
    createdAt: '5 days ago',
    // likes: 18,
  },
  {
    id: 3,
    movieId: 3,
    movieTitle: 'Parasite',
    moviePosterUrl: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=300&h=450&fit=crop',
    content: 'Bong Joon-ho crafts a perfect blend of dark comedy and social commentary. Every scene is meticulously planned. Truly deserved the Palme d\'Or.',
    rating: 10,
    createdAt: '1 week ago',
    // likes: 31,
  },
  {
    id: 4,
    movieId: 4,
    movieTitle: 'The Dark Knight',
    moviePosterUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=300&h=450&fit=crop',
    content: 'Heath Ledger\'s Joker is iconic. This transcends the superhero genre and becomes a crime thriller masterpiece. The interrogation scene alone is worth the watch.',
    rating: 9,
    createdAt: '1 week ago',
    // likes: 42,
  },
  {
    id: 5,
    movieId: 5,
    movieTitle: 'Interstellar',
    moviePosterUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&h=450&fit=crop',
    content: 'Visually stunning and emotionally powerful. The docking scene had me on the edge of my seat. Science fiction at its absolute best.',
    rating: 9,
    createdAt: '2 weeks ago',
    // likes: 27,
  },
  {
    id: 6,
    movieId: 6,
    movieTitle: 'Pulp Fiction',
    moviePosterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=300&h=450&fit=crop',
    content: 'Tarantino\'s non-linear storytelling is brilliant. Every dialogue scene is quotable. Samuel L. Jackson and John Travolta have incredible chemistry.',
    rating: 8,
    createdAt: '3 weeks ago',
    // likes: 19,
  },
  {
    id: 7,
    movieId: 7,
    movieTitle: 'The Matrix',
    moviePosterUrl: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=300&h=450&fit=crop',
    content: 'Revolutionary film that changed action cinema forever. The bullet-time effects were groundbreaking. Still holds up amazingly well today.',
    rating: 9,
    createdAt: '1 month ago',
    // likes: 33,
  },
  {
    id: 8,
    movieId: 8,
    movieTitle: 'Forrest Gump',
    moviePosterUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&h=450&fit=crop',
    content: 'Tom Hanks gives one of the best performances of his career. A heartwarming journey through American history. "Life is like a box of chocolates..."',
    rating: 8,
    createdAt: '1 month ago',
    // likes: 28,
  },
];

