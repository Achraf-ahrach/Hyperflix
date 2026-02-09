# How to Run Hypertube

This project includes a convenient `Makefile` to automate the setup process, ensuring the database is correctly initialized and seeded.

## Quick Start (Recommended)

1. **First Time Setup:**
   Run this command to build containers, wait for services, run migrations, and seed the database automatically:
   ```bash
   make setup
   ```
   *This command waits for dependencies to install, runs `npm run db:migrate`, and `npm run db:seed`.*

2. **Start Afterwards:**
   Once setup is complete, you can simply start the containers:
   ```bash
   make start
   ```

3. **Stop Containers:**
   ```bash
   make stop
   ```

4. **Clean Everything (Reset):**
   If you encounter persistent database errors or want to start fresh:
   ```bash
   make clean
   make setup
   ```

## Manual Setup (If Makefile fails)

If you prefer to run commands manually:

1. **Start containers:**
   ```bash
   docker compose up --build -d
   ```

2. **Run Migrations (Create Tables):**
   ```bash
   docker compose exec backend npm run db:migrate
   ```

3. **Seed Database (Required for login):**
   ```bash
   docker compose exec backend npm run db:seed
   ```
