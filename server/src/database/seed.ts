import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { users } from './schema/users';
import { movies } from './schema/movies';
import { comments } from './schema/comments';

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool, { schema });

  /* ---------------- USERS ---------------- */
  const insertedUsers = await db
    .insert(users)
    .values([
      {
        email: 'seed_user1@test.com',
        username: 'seed_user1',
        firstName: 'Seed',
        lastName: 'UserOne',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        email: 'seed_user2@test.com',
        username: 'seed_user2',
        firstName: 'Seed',
        lastName: 'UserTwo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])
    .returning({ id: users.id });

  /* ---------------- MOVIES ---------------- */
  const insertedMovies = await db
    .insert(movies)
    .values([
      {
        title: 'Inception',
        productionYear: 2010,
        imdbRating: '8.8',
        runtimeMinutes: 148,
        summary: 'A thief who steals corporate secrets through dreams.',
        coverImageUrl: 'https://example.com/inception.jpg',
      },
    ])
    .returning({ id: movies.id });

  /* ---------------- COMMENTS ---------------- */

  // Base parent comments
  const parentComments = await db
    .insert(comments)
    .values([
      {
        userId: insertedUsers[0].id,
        movieId: insertedMovies[0].id,
        content: 'This movie is a masterpiece.',
      },
      {
        userId: insertedUsers[1].id,
        movieId: insertedMovies[0].id,
        content: 'I did not enjoy it that much.',
      },
    ])
    .returning({ id: comments.id });

  // Generate 200 additional comments
  const extraComments = Array.from({ length: 200 }, (_, i) => {
    const isReply = i % 5 === 0; // every 5th is a reply
    const userId =
      insertedUsers[i % insertedUsers.length].id;

    return {
      userId,
      movieId: insertedMovies[0].id,
      parentId: isReply
        ? parentComments[i % parentComments.length].id
        : null,
      content: isReply
        ? `Seeded reply comment #${i + 1}`
        : `Seeded comment #${i + 1}`,
    };
  });

  await db.insert(comments).values(extraComments);

  await pool.end();
}

seed()
  .then(() => {
    console.log('✅ Seeding completed with new users');
  })
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
