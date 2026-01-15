# Deployment Guide for YieldVibe

## 1. Deploy to Vercel

[Click here to deploy to Vercel](https://vercel.com/new).

Select this repository and deploy.

## 2. Supabase Setup

1. Create a new project on [Supabase](https://supabase.com/).
2. Go to the **SQL Editor**.
3. Copy the contents of `schema.sql` from this repository and paste it into the editor.
4. Run the SQL to create the tables.

Alternatively, running `npm run setup:db` locally (if configured) can apply the schema.

## 3. Environment Variables

Add these variables to your Vercel Project Settings:

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key (for Cron jobs) |
| `CRON_SECRET` | A secret key to secure your Cron API route |
| `DATABASE_URL` | Connection string for the database (used for setup scripts) |

> **Note**: `CRON_SECRET` can be any random string. The Vercel Cron job will use this to authenticate.
