# Speech & Debate Bake Sale website

Pages:
- `/price` shows the fundraising progress bar, the date, the lockbox code, the add-item form with undo, and the menu
- `/time` is the volunteer sign-up for 1st through 6th period
- `/mod` is the moderator page (password: `perezsux`)

Going to `/` takes you to `/price`.

## Put it on Vercel (about 5 minutes)

**1. Upload the code**
- Easiest: make a new GitHub repo, upload everything in this folder, then in Vercel go to **Add New → Project** and import that repo. Leave every setting at its default (Framework Preset: **Other**) and click **Deploy**.
- Or, with the Vercel CLI: run `npx vercel` inside this folder, then `npx vercel --prod`.

**2. Add the database (required, so everyone sees the same data)**
1. Open the project in Vercel and go to the **Storage** tab.
2. Choose **Create Database → Upstash for Redis** (the free plan is enough).
3. Connect it to this project. Vercel adds the `KV_REST_API_URL` and `KV_REST_API_TOKEN` settings for you.
4. Go to **Deployments**, open the ⋯ menu on the latest deployment, and click **Redeploy**.

The red "No database connected" banner goes away once the database is connected.

**3. (Optional) Change the mod password**
Under **Settings → Environment Variables**, add `MOD_PASSWORD` with a new password, then redeploy. If you don't add it, the password stays `perezsux`.

## How it works
- Only moderators can set how much money was made (on /mod). That number drives the progress bar.
- Undo removes the last item added from *that* device.
- The mod page can change the date, the lockbox code, the money goal, each item's name and price, delete items, set how much money was made, and remove volunteers.
- Pages refresh every 4 seconds, so every phone at the table stays in sync.
