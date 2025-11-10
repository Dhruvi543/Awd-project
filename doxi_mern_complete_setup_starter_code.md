# DOXI MERN — Complete Setup & Starter Code (React + Vite, Node/Express, MongoDB)

This is a complete, copy‑pasteable starter you can use to get DOXI running quickly in **WebStorm** with **frontend (Vite/React)** and **backend (Node/Express/Mongoose)**. It includes: dependencies, scripts, folder structure, envs, minimal models/routes/controllers, auth (JWT), RBAC, and basic React pages.

> Root folder: `DOXI/` with `frontend/` and `backend/` inside. All commands assume you run them from those folders.

---

## 0) Prerequisites
- Node.js LTS (v18+ recommended, v20+ ideal)
- Git
- MongoDB (local `mongodb://127.0.0.1:27017` or Atlas)

---

## 1) Project Structure (full tree)
```
DOXI/
  frontend/
    index.html
    package.json
    postcss.config.js
    tailwind.config.js
    tsconfig.json (if TS)
    src/
      App.tsx
      main.tsx
      index.css
      lib/
        api.ts
        queryClient.ts
        auth.ts
        rbac.ts
      components/
        Layout.tsx
        Navbar.tsx
        Protected.tsx
        ThemeToggle.tsx
      pages/
        auth/
          Login.tsx
          Register.tsx
        patient/
          Dashboard.tsx
          Appointments.tsx
          FindDoctor.tsx
          Profile.tsx
        doctor/
          Dashboard.tsx
          Appointments.tsx
          Availability.tsx
          Profile.tsx
        admin/
          Dashboard.tsx
          Doctors.tsx
          Patients.tsx
          Reviews.tsx
        NotFound.tsx
      routes/
        index.tsx

  backend/
    package.json
    tsconfig.json (if TS)
    .env (create)
    src/
      app.ts
      server.ts
      config/
        env.ts
        db.ts
      middleware/
        auth.ts
        rbac.ts
        error.ts
      utils/
        asyncHandler.ts
      models/
        User.ts
        Doctor.ts
        Appointment.ts
        Review.ts
        Notification.ts
        Availability.ts
      controllers/
        auth.controller.ts
        appointment.controller.ts
        doctor.controller.ts
        admin.controller.ts
        review.controller.ts
        notification.controller.ts
      routes/
        auth.routes.ts
        appointment.routes.ts
        doctor.routes.ts
        admin.routes.ts
        review.routes.ts
        notification.routes.ts

  .gitignore
  README.md
```

---

## 2) Backend — Install & Scripts
From `DOXI/backend`:
```bash
npm init -y
# Runtime deps
npm i express mongoose dotenv cors morgan helmet cookie-parser jsonwebtoken bcryptjs express-rate-limit zod dayjs uuid
# Optional (email):
npm i nodemailer
# Dev deps (TypeScript + tooling)
npm i -D typescript ts-node @types/node @types/express @types/cookie-parser @types/jsonwebtoken @types/bcryptjs
npm i -D nodemon eslint prettier eslint-config-prettier eslint-plugin-import
```

**package.json (backend)**
```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint ."
  }
}
```

**tsconfig.json (backend)**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "rootDir": "src",
    "outDir": "dist",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "strict": true
  },
  "include": ["src"]
}
```

**.env (backend)**
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/doxi
JWT_SECRET=super_secret_change_me
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

---

## 3) Backend — Minimal Working Code
> Create the files below exactly as shown. This is a runnable baseline.

**src/config/env.ts**
```ts
export const ENV = {
  PORT: Number(process.env.PORT || 5000),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/doxi',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
};
```

**src/config/db.ts**
```ts
import mongoose from 'mongoose';
import { ENV } from './env.js';

export async function connectDB() {
  await mongoose.connect(ENV.MONGO_URI);
  console.log('MongoDB connected');
}
```

**src/middleware/error.ts**
```ts
export function errorHandler(err: any, _req: any, res: any, _next: any) {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
}
```

**src/middleware/auth.ts**
```ts
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

export function requireAuth(req: any, res: any, next: any) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, ENV.JWT_SECRET);
    req.user = payload; // { id, role }
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
```

**src/middleware/rbac.ts**
```ts
export function allowRoles(...roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}
```

**src/utils/asyncHandler.ts**
```ts
export const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

**src/models/User.ts**
```ts
import { Schema, model } from 'mongoose';
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);
export default model('User', userSchema);
```

**src/models/Doctor.ts**
```ts
import { Schema, model, Types } from 'mongoose';
const doctorSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: String,
    bio: String,
    consultationFee: Number,
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);
export default model('Doctor', doctorSchema);
```

**src/models/Appointment.ts**
```ts
import { Schema, model, Types } from 'mongoose';
const appointmentSchema = new Schema(
  {
    patient: { type: Types.ObjectId, ref: 'User', required: true },
    doctor: { type: Types.ObjectId, ref: 'User', required: true },
    appointmentDate: { type: Date, required: true },
    startTime: String,
    endTime: String,
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Rejected', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    consultationNotes: String,
    prescription: String,
  },
  { timestamps: true }
);
export default model('Appointment', appointmentSchema);
```

**src/models/Review.ts**
```ts
import { Schema, model, Types } from 'mongoose';
const reviewSchema = new Schema(
  {
    patient: { type: Types.ObjectId, ref: 'User', required: true },
    doctor: { type: Types.ObjectId, ref: 'User', required: true },
    appointment: { type: Types.ObjectId, ref: 'Appointment', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: String,
  },
  { timestamps: true }
);
export default model('Review', reviewSchema);
```

**src/models/Notification.ts**
```ts
import { Schema, model, Types } from 'mongoose';
const notificationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: String,
  },
  { timestamps: true }
);
export default model('Notification', notificationSchema);
```

**src/models/Availability.ts**
```ts
import { Schema, model, Types } from 'mongoose';
const availabilitySchema = new Schema(
  {
    doctor: { type: Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['schedule', 'leave'], required: true },
    dayOfWeek: String,
    startTime: String,
    endTime: String,
    startDate: Date,
    endDate: Date,
  },
  { timestamps: true }
);
export default model('Availability', availabilitySchema);
```

**src/controllers/auth.controller.ts**
```ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { ENV } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const registerDto = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['patient', 'doctor'])
});

export const register = asyncHandler(async (req, res) => {
  const dto = registerDto.parse(req.body);
  const exists = await User.findOne({ email: dto.email });
  if (exists) return res.status(400).json({ message: 'Email already exists' });
  const hash = await bcrypt.hash(dto.password, 10);
  const user = await User.create({ ...dto, password: hash });
  res.status(201).json({ id: user._id });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = jwt.sign({ id: user._id, role: user.role }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN });
  res.json({ token, role: user.role });
});
```

**src/routes/auth.routes.ts**
```ts
import { Router } from 'express';
import { login, register } from '../controllers/auth.controller.js';
const r = Router();
r.post('/register', register);
r.post('/login', login);
export default r;
```

**src/app.ts**
```ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import { errorHandler } from './middleware/error.js';

import authRoutes from './routes/auth.routes.js';
// import other route files as you build them

const app = express();
app.use(helmet());
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);

app.use(errorHandler);
export default app;
```

**src/server.ts**
```ts
import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';

async function start() {
  await connectDB();
  const server = http.createServer(app);
  server.listen(ENV.PORT, () => console.log(`API running on :${ENV.PORT}`));
}
start();
```

**Start backend in dev**
```bash
npm run dev
```

---

## 4) API Surface (initial)
- `GET /api/health` → `{ ok: true }`
- `POST /api/auth/register` → `{ id }`
- `POST /api/auth/login` → `{ token, role }`

> Next endpoints to add (stubs exist in folder structure):
- `/api/appointments` (CRUD, status transitions: Pending→Confirmed/Rejected→Completed/Cancelled)
- `/api/doctor` (profile, availability/leave)
- `/api/admin` (approve doctors, manage users)
- `/api/reviews` (CRUD, edit window 30 mins)
- `/api/notifications` (list, mark read)

**Example cURL**
```bash
curl -X POST http://localhost:5000/api/auth/register \
 -H 'Content-Type: application/json' \
 -d '{"name":"Test","email":"t@t.com","password":"Passw0rd!","role":"patient"}'

curl -X POST http://localhost:5000/api/auth/login \
 -H 'Content-Type: application/json' \
 -d '{"email":"t@t.com","password":"Passw0rd!"}'
```

---

## 5) Frontend — Install & Scripts
From `DOXI/frontend`:
```bash
npm create vite@latest . -- --template react-ts
npm i react-router-dom @tanstack/react-query axios jotai
npm i react-hook-form zod @hookform/resolvers
npm i tailwindcss postcss autoprefixer class-variance-authority clsx
npm i lucide-react react-hot-toast dayjs
npx tailwindcss init -p
```

**tailwind.config.js**
```js
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: { extend: {} },
  plugins: [],
}
```

**postcss.config.js**
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**src/index.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**package.json (frontend)**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

**.env (frontend)**
```
VITE_API_URL=http://localhost:5000/api
```

---

## 6) Frontend — Minimal Working Code

**src/lib/api.ts**
```ts
import axios from 'axios';
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**src/lib/queryClient.ts**
```ts
import { QueryClient } from '@tanstack/react-query';
export const queryClient = new QueryClient();
```

**src/lib/auth.ts**
```ts
export const auth = {
  login(token: string, role: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
  },
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  },
  role() { return localStorage.getItem('role'); },
  token() { return localStorage.getItem('token'); }
};
```

**src/lib/rbac.ts**
```ts
export const canAccess = (required: string[]) => {
  const role = localStorage.getItem('role');
  return !!role && required.includes(role);
};
```

**src/components/Protected.tsx**
```tsx
import { Navigate } from 'react-router-dom';
import { canAccess } from '../lib/rbac';

export default function Protected({ children, roles }: { children: JSX.Element, roles: string[] }) {
  const authed = !!localStorage.getItem('token');
  if (!authed) return <Navigate to="/login" replace />;
  if (!canAccess(roles)) return <Navigate to="/" replace />;
  return children;
}
```

**src/components/Navbar.tsx**
```tsx
import { Link } from 'react-router-dom';
export default function Navbar() {
  return (
    <nav className="p-4 border-b flex gap-4">
      <Link to="/">Home</Link>
      <Link to="/patient">Patient</Link>
      <Link to="/doctor">Doctor</Link>
      <Link to="/admin">Admin</Link>
      <Link className="ml-auto" to="/login">Login</Link>
    </nav>
  );
}
```

**src/components/ThemeToggle.tsx**
```tsx
export default function ThemeToggle() {
  return (
    <button
      className="px-3 py-1 rounded border"
      onClick={() => {
        const html = document.documentElement;
        html.classList.toggle('dark');
        localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
      }}
    >Toggle Theme</button>
  );
}
```

**src/App.tsx**
```tsx
import { Outlet, Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Navbar />
      <main className="p-4">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
```

**src/pages/auth/Login.tsx**
```tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import { auth } from '../../lib/auth';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

type Form = z.infer<typeof schema>;

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });
  const nav = useNavigate();

  const onSubmit = async (data: Form) => {
    try {
      const res = await api.post('/auth/login', data);
      auth.login(res.data.token, res.data.role);
      toast.success('Logged in');
      const role = res.data.role;
      if (role === 'doctor') nav('/doctor');
      else if (role === 'admin') nav('/admin');
      else nav('/patient');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-3">
      <h1 className="text-2xl font-bold">Login</h1>
      <input className="w-full border p-2 rounded" placeholder="Email" {...register('email')} />
      {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
      <input className="w-full border p-2 rounded" type="password" placeholder="Password" {...register('password')} />
      {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
      <button className="w-full bg-black text-white py-2 rounded">Sign in</button>
    </form>
  );
}
```

**src/pages/auth/Register.tsx**
```tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['patient','doctor'])
});

type Form = z.infer<typeof schema>;

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    try {
      await api.post('/auth/register', data);
      toast.success('Registered. Please login.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-3">
      <h1 className="text-2xl font-bold">Create account</h1>
      <input className="w-full border p-2 rounded" placeholder="Full name" {...register('name')} />
      {errors.name && <p className="text-red-600 text-sm">{errors.name.message}</p>}
      <input className="w-full border p-2 rounded" placeholder="Email" {...register('email')} />
      {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
      <input className="w-full border p-2 rounded" type="password" placeholder="Password" {...register('password')} />
      {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
      <select className="w-full border p-2 rounded" {...register('role')}>
        <option value="patient">Patient</option>
        <option value="doctor">Doctor</option>
      </select>
      {errors.role && <p className="text-red-600 text-sm">{errors.role.message}</p>}
      <button className="w-full bg-black text-white py-2 rounded">Sign up</button>
    </form>
  );
}
```

**src/pages/patient/Dashboard.tsx**
```tsx
export default function PatientDashboard(){
  return <div className="space-y-2">
    <h1 className="text-2xl font-bold">Patient Dashboard</h1>
    <p>Welcome to DOXI.</p>
  </div>;
}
```

*(Doctor/Admin pages can be identical placeholders for now.)*

**src/routes/index.tsx**
```tsx
import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Protected from '../components/Protected';
import PatientDashboard from '../pages/patient/Dashboard';

export const router = createBrowserRouter([
  { path: '/', element: <App />, children: [
    { index: true, element: <div>Home</div> },
    { path: 'patient', element: (
      <Protected roles={["patient"]}>
        <PatientDashboard />
      </Protected>
    )},
  ]},
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '*', element: <div>Not Found</div> }
]);
```

**src/main.tsx**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/index';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
```

**Run frontend**
```bash
npm run dev
```

Open `http://localhost:5173`.

---

## 7) Root Convenience (optional)
From `DOXI/`:
```bash
npm i -D concurrently
```
**DOXI/package.json**
```json
{
  "scripts": {
    "dev": "concurrently \"npm:dev:be\" \"npm:dev:fe\"",
    "dev:be": "npm --prefix backend run dev",
    "dev:fe": "npm --prefix frontend run dev"
  }
}
```
Run everything:
```bash
npm run dev
```

---

## 8) Business Rules (wired for later)
- Doctor must be `isApproved=true` to appear in search.
- Appointment statuses: `Pending → Confirmed/Rejected → Completed/Cancelled`.
- Review edit/delete allowed if `Date.now() - createdAt < 30 minutes`.
- Notifications: start with polling; upgrade to Socket.io later.

---

## 9) Security & DX
- `helmet`, `cors` (restrict to `CLIENT_URL`), `rate-limit` for login & write routes.
- Central `errorHandler`.
- ESLint + Prettier keep code tidy.

**.gitignore**
```
node_modules
.env
.DS_Store
/dist
```

---

## 10) Next Steps (checklist)
- [ ] Implement `/api/appointments` CRUD + status transitions
- [ ] Doctor availability & leave endpoints
- [ ] Admin: approve doctors, list users
- [ ] Reviews + 30‑min edit rule
- [ ] Notifications list + mark‑as‑read (polling)
- [ ] FE pages hooked to API via React Query
- [ ] Form validation everywhere (Zod)
- [ ] Optional: Socket.io for real‑time updates

---

### You now have a complete, bootable baseline. Start both servers, hit `POST /api/auth/register` and `POST /api/auth/login`, then navigate to `/patient` after login. If anything is unclear, tell me which section to expand and I’ll drop in the exact code. 

