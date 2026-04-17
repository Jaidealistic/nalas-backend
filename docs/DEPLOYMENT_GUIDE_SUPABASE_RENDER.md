# 🚀 Nalas Production Deployment Guide (Supabase + Render)

This guide takes you from local code to a live, production-ready environment.

## Phase 1: Database Setup (Supabase)

1.  **Follow the Beginner Guide**: Start with [docs/SUPABASE_BEGINNER_GUIDE.md](SUPABASE_BEGINNER_GUIDE.md).
2.  **Run Schema**: Use the consolidated schema in [docs/final_production_schema.sql](final_production_schema.sql).

---

## Phase 2: Seeding Data (Local to Cloud)

Push the Gold Standard data from your machine to Supabase.

1.  Open terminal in `./nalas-backend`.
2.  Run seeder:
    ```bash
    $env:DATABASE_URL="your_supabase_uri_here"; node scratch/seed_gold_csv.js
    ```

---

## Phase 3: Computing Setup (Render)

1.  **Push Code**: Ensure all code is pushed to your backend repo.
2.  **Create Blueprint**:
    *   Go to **Render Dashboard** > **New** > **Blueprint**.
    *   Connect your `nalas-backend` repository.
3.  **Config**:detect the `render.yaml` and ask for:
    *   `DATABASE_URL`: Your Supabase URI.
    *   `JWT_SECRET`: (Generate)
    *   `ML_API_KEY`: (Generate)
4.  **Deploy**: Click **Apply**.

---

## 🏁 Final Verification

1.  **URL**: Get your public URL from Render.
2.  **Test**: Visit `https://your-url.onrender.com/health`.
3.  **Handoff**: Share the URL with the UI teams.
