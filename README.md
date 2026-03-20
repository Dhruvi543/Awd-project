# DOXI

DOXI is a comprehensive healthcare appointment management system built using the MERN stack (MongoDB, Express, React, Node.js). 

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS & Material-UI (MUI)
- **Routing**: React Router v6
- **Authentication**: Google OAuth (`@react-oauth/google`)
- **Payments**: Razorpay Integration (`react-razorpay`)
- **State/Data**: Axios, Lodash, Zod

### Backend
- **Environment**: Node.js & Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **Security**: Helmet, Express Rate Limit, Mongo Sanitize, XSS Sanitizer
- **Payments**: Razorpay API
- **Emails**: Nodemailer
- **Validation**: Zod

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas URI
- Razorpay Account (for payments)
- Google Cloud Console Project (for OAuth)

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd DOXI
   ```

2. **Install all dependencies** (root, frontend, and backend):
   ```bash
   npm run install:all
   ```

### Environment Variables

You will need to set up environment variables for both the frontend and backend. 

1. Create a `.env` file in the `backend/` directory.
2. Create a `.env` file in the `frontend/` directory.

*(Check `.env.example` if available, or ask the repository owner for necessary keys like `MONGO_URI`, `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, etc.)*

## 🧑‍💻 Running the Application

You can run both the frontend and backend concurrently from the root directory:

```bash
npm run dev
```

Alternatively, you can run them separately:
- **Backend Only**: `npm run dev:backend`
- **Frontend Only**: `npm run dev:frontend`

## 📜 Scripts Available

- `npm run dev` - Starts both frontend and backend development servers using concurrently.
- `npm run install:all` - Installs dependencies for root, frontend, and backend.
- `npm run ci:all` - Clean install dependencies for CI environments.

### Backend Specific Scripts (Run from `backend/` or using `npm --prefix backend run <script>`)
- `npm run seed` - Seeds the database with initial users.
- `npm run seed:admin` - Creates an admin user.
- `npm run clear:users` - Deletes all users from the database.
- `npm run clear:patients-doctors` - Clears specific patient and doctor records.

## 📄 License
ISC
