# SwiftPOS — SaaS Point of Sale System

A full-stack SaaS POS with role-based access control.

## 🏗 Architecture

```
pos-saas/
├── frontend/   → React app → Deploy to Vercel
└── backend/    → Node.js/Express/MongoDB → Deploy to Railway
```

## 👥 Role Permissions

| Feature | Admin | Manager | Cashier |
|---------|-------|---------|---------|
| POS / Sell | ✅ | ✅ | ✅ |
| View Dashboard | ✅ | ✅ | ❌ |
| View Products | ✅ | ✅ | ❌ |
| Edit Products | ✅ | ❌ | ❌ |
| View Sales | ✅ | ✅ | ❌ |
| Manage Users | ✅ | ❌ | ❌ |

---

## 🚀 Backend → Railway

### 1. Create MongoDB Atlas cluster (free tier)
- Go to https://cloud.mongodb.com
- Create a free cluster
- Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/pos-saas`

### 2. Push backend to GitHub
```bash
cd backend
git init
git add .
git commit -m "Initial backend"
git remote add origin https://github.com/YOURUSER/pos-backend.git
git push -u origin main
```

### 3. Deploy to Railway
- Go to https://railway.app
- New Project → Deploy from GitHub repo
- Select `pos-backend`
- Add environment variables:
  ```
  MONGODB_URI=mongodb+srv://...
  JWT_SECRET=your-random-secret-key
  FRONTEND_URL=https://your-app.vercel.app
  PORT=5000
  ```
- Railway auto-detects Node.js and runs `npm start`
- Copy your Railway URL (e.g. `https://pos-backend.up.railway.app`)

### 4. Seed the admin user
Visit: `POST https://your-backend.railway.app/api/auth/seed`
- Default: `admin@pos.com` / `admin123`
- **Change password immediately after first login**

---

## 🌐 Frontend → Vercel

### 1. Push frontend to GitHub
```bash
cd frontend
git init
git add .
git commit -m "Initial frontend"
git remote add origin https://github.com/YOURUSER/pos-frontend.git
git push -u origin main
```

### 2. Deploy to Vercel
- Go to https://vercel.com
- New Project → Import from GitHub
- Select `pos-frontend`
- Add environment variable:
  ```
  REACT_APP_API_URL=https://your-backend.railway.app/api
  ```
- Click Deploy!

---

## 💻 Local Development

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI
npm run dev
# Runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
npm start
# Runs on http://localhost:3000
```

---

## 🔧 Features

- **POS Interface**: Barcode scanning, product search, cart management, multiple payment methods
- **Dashboard**: Daily revenue, profit, top products, low stock alerts, weekly chart
- **Products**: Full CRUD with barcode, cost/price, profit calculation, stock management
- **Sales**: Full transaction history with date filters, expandable details
- **Users**: Create/edit/deactivate users with role assignment
- **Role-based Access**: Admin > Manager > Cashier permission hierarchy
