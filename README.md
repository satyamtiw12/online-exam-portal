# 🎓 Online Exam System — Node.js + Express + PostgreSQL

PHP se convert kiya gaya project. Railway/Render pe free deploy hoga.

---

## 📁 Project Structure

```
exam-app/
├── server.js              # Main entry point
├── config/
│   └── db.js              # PostgreSQL connection
├── middleware/
│   └── auth.js            # Session auth checks
├── routes/
│   ├── auth.js            # Login, Register, OTP
│   ├── student.js         # Dashboard, Profile, Results
│   ├── admin.js           # Admin panel routes
│   └── exam.js            # Exam screen + Submit
├── views/                 # EJS templates
│   ├── auth/
│   ├── student/
│   ├── admin/
│   ├── exam/
│   └── partials/
├── public/
│   └── uploads/           # Profile photos
├── schema.sql             # Database tables
├── .env.example           # Environment variables template
└── package.json
```

---

## 🚀 LOCAL SETUP

```bash
# 1. Dependencies install karo
npm install

# 2. .env file banao
cp .env.example .env
# .env file mein apni details bharao

# 3. PostgreSQL mein database banao
createdb exam_db

# 4. Schema run karo
psql -d exam_db -f schema.sql

# 5. Server start karo
npm start
# ya development mein:
npm run dev
```

---

## ☁️ RAILWAY PE DEPLOY (Free)

### Step 1 — GitHub pe push karo
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TUMHARA_USERNAME/exam-app.git
git push -u origin main
```

### Step 2 — Railway pe project banao
1. https://railway.app pe jao → Login with GitHub
2. **"New Project"** → **"Deploy from GitHub repo"** → apna repo select karo
3. Railway automatically Node.js detect karega

### Step 3 — PostgreSQL add karo
1. Railway dashboard mein **"New"** → **"Database"** → **"PostgreSQL"** click karo
2. Database ban jayega, usse apne service se **Connect** karo
3. `DATABASE_URL` automatically environment mein set ho jayegi ✅

### Step 4 — Schema run karo
1. Railway dashboard → PostgreSQL database → **"Query"** tab
2. `schema.sql` ka content paste karo aur run karo

### Step 5 — Environment Variables set karo
Railway dashboard → Service → **"Variables"** tab:
```
SESSION_SECRET = koi_bhi_random_string_likho
EMAIL_USER     = tumhara_gmail@gmail.com
EMAIL_PASS     = gmail_app_password
NODE_ENV       = production
```

### Step 6 — Deploy! 🎉
Railway automatically deploy karega. Public URL milega jaise:
`https://exam-app-production.up.railway.app`

---

## ☁️ RENDER PE DEPLOY (Alternative)

1. https://render.com → New → Web Service → GitHub repo connect
2. **Build Command:** `npm install`
3. **Start Command:** `npm start`
4. **Environment:** Node
5. Add PostgreSQL database (New → PostgreSQL)
6. Environment variables set karo (same as Railway)
7. Schema run karo Render ka "Shell" tab use karke:
   ```bash
   psql $DATABASE_URL -f schema.sql
   ```

---

## 🔑 Default Admin Login
```
Username: admin
Password: Admin@123
```
⚠️ First login ke baad password zaroor change karo!

---

## 📧 Gmail App Password kaise banaye?
1. Google Account → Security → 2-Step Verification ON karo
2. Security → App Passwords → "Mail" select karo → Generate
3. 16-character password milega → .env mein `EMAIL_PASS` mein dalo

---

## 🔗 Routes List
| Route | Method | Description |
|-------|--------|-------------|
| /login | GET/POST | Login |
| /register | GET/POST | Register |
| /forgot-password | GET/POST | OTP send |
| /verify-otp | GET/POST | OTP verify |
| /reset-password | GET/POST | New password |
| /dashboard | GET | Student dashboard |
| /profile | GET/POST | Profile view/edit |
| /my-results | GET | Student results |
| /instructions | GET | Exam instructions |
| /exam | GET | Exam screen |
| /submit | POST | Submit exam |
| /admin/dashboard | GET | Admin panel |
| /admin/create-exam | GET/POST | Create exam |
| /admin/add-question | GET/POST | Add question |
| /admin/manage-questions | GET | All questions |
| /admin/edit-question/:id | GET/POST | Edit question |
