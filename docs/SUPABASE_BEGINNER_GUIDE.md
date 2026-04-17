# 🏺 Supabase Beginner's Guide: From Zero to Cloud DB

Welcome to Supabase! Think of it as your database's "home" in the cloud. Follow these steps exactly.

### Step 1: Account & Organization
1.  Go to [Supabase.com](https://supabase.com/).
2.  Click **Sign Up** (using GitHub is the easiest way for developers).
3.  Once logged in, click **New Project**.
4.  It will ask you to select an **Organization**. 
    *   If you don't have one, click **Create Organization**. 
    *   Name it something like `Nalas-Catering`.
    *   Select `Free` for the plan.

### Step 2: Create the Project
1.  Inside your organization, click **New Project**.
2.  **Name**: `Nalas-Production`.
3.  **Database Password**: 
    > [!IMPORTANT]
    > Write this password down! You will need it later for your Connection String. Do not lose it.
4.  **Region**: Select **Mumbai (ap-south-1)** or **Singapore**.
5.  Click **Create New Project**. (It will take about 2 minutes to "provision").

### Step 3: Run the Schema (Building the Tables)
Once the project is "Active":
1.  On the left sidebar, click the **SQL Editor** icon (it looks like a `>_`).
2.  Click **+ New Query**.
3.  Open this file: `docs/final_production_schema.sql` in your GitHub repo.
4.  Copy **All** the text from that file.
5.  Paste it into the Supabase SQL Editor.
6.  Click **Run** (at the bottom right).
    *   You should see `Success. No rows returned`. 
    *   Your tables (Orders, Stock, Ingredients) are now created!

### Step 4: Get your Connection URI
You need this to "talk" to your database from the Backend and the ML service.
1.  In Supabase, click the **Settings** (gear icon) at the bottom left.
2.  Click **Database**.
3.  Scroll down to **Connection String**.
4.  Click the **URI** tab. It will look like this:
    `postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres`
    *   Replace `[YOUR-PASSWORD]` with the password you wrote down in Step 2.

### Step 5: Seeding the Gold Data
Now we fill the empty cloud database with your official data.
1.  Open your local terminal/PowerShell.
2.  Navigate to `./nalas-backend`.
3.  Run this command (replace the URL with yours):
    ```powershell
    $env:DATABASE_URL="your-full-uri-from-step-4"; node scratch/seed_gold_csv.js
    ```
4.  If it says **"SUCCESS! Gold dataset is fully live"**, you are finished with the database!
