# MORGAN COLLECTION — Setup Guide

## 1. Requirements
- Install Node.js (LTS recommended).
- Install Visual Studio Code.
- Extract this ZIP to your Desktop.

## 2. Install and run
Open the extracted `Morgan-Collection` folder in VS Code. Open Terminal > New Terminal and run:

```bash
npm install
```

Copy `.env.example` to a new file named `.env`. Change `SESSION_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` to your own private values.

Then run:

```bash
npm run dev
```

For a stable server without the file watcher, use two terminals:

```bash
npm start
npm run client:dev
```

Open:
- Storefront: http://localhost:5173
- Customer storefront: http://localhost:5173/
- Separate admin dashboard: http://localhost:5173/admin
- Phone on the same Wi-Fi: `http://172.20.10.3:5173/` (replace the IP if your computer's Wi-Fi address changes)
- API health check: http://localhost:3000/api/health

The admin page starts with a **Create your admin account** form. Create a personal admin account with your name, email, username and password, then sign in. The original administrator credentials below remain available as a fallback:
- Username: `admin`
- Password: `ChangeMe123!`

The administrator account is created when the database is first initialized. If you already started the app with the default credentials, changing `.env` alone will not change the existing password; contact the developer or reset the local database after backing it up.

## 3. Adding products
1. Open the separate admin dashboard at **http://localhost:5173/admin**.
2. Sign in.
3. Enter the product name, upload a picture, select category and audience.
4. Enter the normal price in Ghana cedis, optional sale price, sizes, colours and stock.
5. Click **Publish Product**. It will appear in the shop immediately.
6. Use Edit or Delete beside a listing to manage it.

Images are uploaded to `server/uploads`. Product and order data is stored in `server/data`; customer and admin account records are stored in JSON files with bcrypt password hashes.

## 4. What is included
- Fashion storefront with Men, Women, Unisex and product-category filters, including dedicated Ladies' Shoes, Men's Shoes, Ladies' Slippers and Men's Slippers categories.
- Product cards with pictures and GH₵ prices.
- Product details, shopping bag and checkout order submission.
- Admin login, product upload/edit/delete and inventory stock.
- Customer registration and login at **http://localhost:5173/** using the **Create account / Sign in** link. New customers must create an account first; after registration they sign in with the new email and password. Each customer has a separate account and can sign in again later.
- Admin order list and order-status updates.
- Ghana-focused checkout with delivery address, phone, Ghana cedi prices, order tracking and configurable email/phone/WhatsApp contact.
- Responsive layout and CSS 3D-inspired hero effects.

## 5. Important before going live
This is a local development starter, not yet a production deployment. Before accepting public customers:
- Deploy to a hosting provider with HTTPS.
- Use a persistent database and persistent image storage.
- Configure secure session cookies and a production session store.
- Add rate limiting, CSRF protection, input validation and backups.
- Connect a payment provider such as Paystack or Hubtel using your own verified merchant account and secret keys. No real online payment is processed by this starter.
- Confirm your official business phone and WhatsApp number in **Admin > Customer contact** before launch.
- Set your real WhatsApp business number and implement/verify the desired order workflow.
- Replace the sample branding text and upload your own product photography.
- Change the default admin credentials before exposing the site to the internet.

## 6. Troubleshooting
- If `npm` is not recognised, install Node.js LTS and restart VS Code.
- If port 3000 or 5173 is already in use, stop the other process or change the port.
- If product images do not show, check that `server/uploads` exists and the server is running.
- Keep `.env`, database files and admin credentials private.
- To use the site on a phone during development, connect the phone and computer to the same Wi-Fi network, keep the dev server running, and open the computer's Wi-Fi IP with port `5173`. Do not use `localhost` on the phone because it refers to the phone itself.

## 7. Deploy to Render
1. Push the `Morgan-Collection` folder to a private GitHub repository.
2. In Render, choose **New > Blueprint** and connect the repository.
3. Render will read `render.yaml` and create the `morgan-collection` web service.
4. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in the Render environment variables.
5. Deploy. Your public address will be similar to:

   `https://morgan-collection.onrender.com`

Render's default address uses `.onrender.com`; it is not `www.morgan collection.render.com`. A custom domain can be connected later from the Render service settings.

The persistent disk keeps the SQLite database, customer/admin account files, uploaded product images, and order data after redeploys. The included production server serves both the React storefront and the API from the same public address.
