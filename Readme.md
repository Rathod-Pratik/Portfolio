# 💻 Personal Portfolio & CMS Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![AWS S3](https://img.shields.io/badge/AWS_S3-569A31?logo=amazon-s3&logoColor=white)](https://aws.amazon.com/s3/)

A modern, full-stack, production-ready **Personal Portfolio and Content Management System (CMS)** platform. Built with **Next.js (React 19)** for the client application, **Vite (React 18)** for the administrative dashboard, and a robust **TypeScript + Express + MongoDB** backend with **AWS S3** asset management and secure **JWT** authentication.

🌐 **Live Demo:** [pratikofficial.dev](https://pratikofficial.dev/)

---

## 📌 Features

### 👤 Client Application (Public Portfolio)
- **Interactive Hero & Intro:** Dynamic introduction featuring animated typewriter effects, social links, and smooth Framer Motion transitions.
- **Project Showcase:** Filterable project catalog displaying tech stacks, features, live demo links, and GitHub repository links.
- **Tech Blogs & Articles:** Markdown-supported technical blogging platform with rich syntax highlighting and reading experience.
- **Developer Notes & Code Snippets:** Curated code snippets and programming notes covering various languages and frameworks.
- **Work Experience & Timeline:** Visual career timeline highlighting roles, organizations, and key achievements.
- **Direct Contact Channel:** Inquiry form with automated email delivery powered by **Nodemailer**.
- **Modern Responsive Design:** Optimized for mobile, tablet, and desktop with cutting-edge Tailwind CSS styling.

### 🛠️ Administrative Control Panel (CMS Dashboard)
- **Protected Access:** Cookie-based JWT authentication with session verification (`/auth/check`).
- **Comprehensive Content Management (CRUD):**
  - **Projects:** Add, update, categorize, and delete portfolio projects with image uploads.
  - **Blogs & Notes:** Author and edit articles with a full-featured Markdown editor (`@uiw/react-md-editor`).
  - **Skills & Expertise:** Manage technical skills, proficiency levels, and core domains.
  - **Experience & Timeline:** Maintain employment history and career milestones.
  - **Resume / CV Management:** Upload and serve latest resume documents.
  - **Hero & About CMS:** Modify hero texts, bio descriptions, and dynamic stats on the fly.
- **Client Inquiries & Budget Review:** Review incoming contact messages, client inquiries, and project budget estimates.

### ⚙️ Backend Architecture & Security
- **Domain-Driven Modular Structure:** Encapsulated feature modules (`Auth`, `Project`, `Blog`, `Note`, `Skill`, `Resume`, `Aws`, etc.).
- **Cloud Asset Storage:** Secure image and document handling using **AWS S3** (`@aws-sdk/client-s3`) and presigned URLs.
- **Security Best Practices:** HTTP-only cookies, Helmet security headers, CORS origin whitelisting, and bcrypt password hashing.
- **Serverless Compatibility:** Integrated with `serverless-http` for seamless AWS Lambda and serverless deployment.

---

## 🛠️ Tech Stack

### Client (Public App)
- **Framework:** Next.js 16 (App Router) & React 19
- **Styling:** Tailwind CSS 4, PostCSS
- **Animations:** Framer Motion, Typewriter Effect
- **Data Fetching:** TanStack React Query v5, Axios
- **Icons & Markdown:** React Icons, React Markdown

### Admin Dashboard
- **Framework:** React 18 with Vite 6
- **Routing & State:** React Router DOM 7, Zustand
- **Form Management:** Formik, Yup
- **Styling & UI:** Tailwind CSS, Lucide React, Swiper, AOS (Animate on Scroll)
- **Markdown Editor:** `@uiw/react-md-editor`, Remark GFM, PrismJS

### Backend API
- **Runtime & Language:** Node.js, TypeScript
- **Framework:** Express.js 4
- **Database:** MongoDB with Mongoose ODM 8
- **Authentication:** JSON Web Tokens (JWT), Cookie-Parser, bcryptjs
- **Cloud Storage:** AWS SDK S3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`), Multer
- **Email Service:** Nodemailer
- **Security & Utilities:** Helmet, CORS, Dotenv, Serverless-HTTP

---

## 📂 Project Structure

```
personal-portfolio/
├── App/                          # Public Portfolio Client (Next.js 16 + React 19)
│   ├── src/
│   │   ├── app/                  # App Router routes (home, about, blog, note, project)
│   │   ├── components/           # Reusable UI components & layouts
│   │   ├── lib/                  # TanStack Query & API client setup
│   │   ├── types/                # TypeScript interfaces & types
│   │   └── utils/                # Utility helpers & formatting
│   ├── public/                   # Static assets, icons, and favicon
│   ├── next.config.ts            # Next.js configuration
│   └── package.json              # App dependencies & scripts
│
├── Dashboard/                    # Admin Control Panel (Vite + React 18)
│   ├── src/
│   │   ├── API/                  # Axios service instances & endpoints
│   │   ├── Component/            # Reusable UI widgets, sidebar, tables & modals
│   │   ├── Pages/                # Dashboard views (Project, Blog, Notes, Skills, Resume, etc.)
│   │   ├── Routes/               # React Router route definitions & route guards
│   │   ├── store/                # Zustand global state stores
│   │   └── main.tsx              # React entry point
│   ├── vite.config.ts            # Vite build configuration
│   └── package.json              # Dashboard dependencies & scripts
│
├── Server/                       # RESTful API Backend (Express.js + TypeScript)
│   ├── src/
│   │   ├── api/                  # Express app setup, CORS, and route mounting
│   │   ├── middlewares/          # Authentication guards, Multer upload configs
│   │   ├── modules/              # Domain-driven feature modules
│   │   │   ├── About/            # About me profile management
│   │   │   ├── Auth/             # Admin login, registration & JWT authentication
│   │   │   ├── Aws/              # AWS S3 image & asset uploads
│   │   │   ├── Blog/             # Tech articles & blog CMS
│   │   │   ├── Budget/           # Client project budget inquiries
│   │   │   ├── Contact/          # Contact messages & Nodemailer handler
│   │   │   ├── Experience/       # Work experience & career timeline
│   │   │   ├── Expertice/        # Areas of expertise & proficiencies
│   │   │   ├── Hero/             # Dynamic hero banner content
│   │   │   ├── Note/             # Code snippets & developer notes
│   │   │   ├── Project/          # Projects showcase & metadata
│   │   │   ├── ProjectType/      # Project categories & tags
│   │   │   ├── Resume/           # Resume / CV upload and serving
│   │   │   ├── Skill/            # Skills & tech stack management
│   │   │   └── Stats/            # Metrics & portfolio statistics
│   │   ├── utils/                # MongoDB connection & shared helpers
│   │   └── Type/                 # TypeScript type declarations
│   ├── server.ts                 # Server entry point
│   ├── tsconfig.json             # TypeScript compiler options
│   └── package.json              # Server dependencies & scripts
│
├── Readme.md                     # Project documentation
└── LICENSE                       # MIT License
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js:** `v18+` or higher
- **npm** / **yarn** / **pnpm**
- **MongoDB:** Local instance or [MongoDB Atlas](https://www.mongodb.com/atlas)
- **AWS S3 Bucket:** (For image and resume file uploads)
- **SMTP Account:** (e.g. Gmail App Password for contact form emails)

---

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Rathod-Pratik/personal-portfolio.git
   cd personal-portfolio
   ```

2. **Configure Environment Variables:**

   **Server (`Server/.env`):**
   ```env
   PORT=5000
   Database=mongodb://localhost:27017/portfolio
   JWT_SECRET=your_super_secret_jwt_key
   FRONTED=http://localhost:3000
   FRONTEND_URL=http://localhost:5173

   # AWS S3 (Asset Uploads)
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   AWS_BUCKET_NAME=your_s3_bucket_name

   # Email (Nodemailer)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   ```

   **App (`App/.env.local`):**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

   **Dashboard (`Dashboard/.env`):**
   ```env
   VITE_API_URL=http://localhost:5000
   ```

3. **Install dependencies and start each service:**

   - **Backend API (`Server`):**
     ```bash
     cd Server
     npm install
     npm run dev
     ```

   - **Client App (`App`):**
     ```bash
     cd App
     npm install
     npm run dev
     ```

   - **Admin Dashboard (`Dashboard`):**
     ```bash
     cd Dashboard
     npm install
     npm run dev
     ```

---

## 🛠️ Available Scripts

### Backend (`Server/`)
| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts server with hot-reloading via `tsx watch` |
| `npm start` | Runs server via `tsx server.ts` |
| `npm run typecheck` | Validates TypeScript types without emitting files |
| `npm run deploy` | Deploys backend using Serverless Framework |

### Client App (`App/`)
| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs Next.js development server (`http://localhost:3000`) |
| `npm run build` | Builds optimized production bundle |
| `npm start` | Starts Next.js production server |
| `npm run lint` | Runs Next.js ESLint checks |

### Admin Dashboard (`Dashboard/`)
| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite development server (`http://localhost:5173`) |
| `npm run build` | Compiles production assets into `dist/` |
| `npm run preview` | Previews production build locally |
| `npm run lint` | Runs ESLint analysis |

---

## 📡 API Overview

| Route Prefix | Module | Description |
| :--- | :--- | :--- |
| `/auth` | **Authentication** | Admin registration, login, logout, and token check (`/auth/check`) |
| `/project` | **Projects** | Fetch, create, update, and delete showcase projects |
| `/project-type` | **Project Types** | Manage project categories and tags |
| `/blogs` | **Blogs** | Read, write, update, and manage Markdown tech blogs |
| `/note` | **Notes** | Code snippets and technical programming notes |
| `/skills` | **Skills** | Technical skill stack and proficiency management |
| `/experiences` | **Experience** | Work history, roles, and career timeline |
| `/expertise` | **Expertise** | Core domains and areas of specialization |
| `/about` | **About** | Manage personal biography and profile details |
| `/hero` | **Hero Section** | Dynamic homepage hero content and subtitles |
| `/states` | **Statistics** | Portfolio counter statistics and numerical metrics |
| `/CV` | **Resume / CV** | Upload, retrieve, and download resume documents |
| `/s3` | **AWS S3** | Cloud storage file upload and presigned URL generation |
| `/contact` | **Contact** | Receive user contact inquiries and send email alerts |
| `/budget` | **Budget** | Client project estimation and budget submissions |
| `/` | **Health Check** | Base health check endpoint (`Backend is up`) |

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```text
MIT License

Copyright (c) 2025-2026 Rathod Pratik

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 👨‍💻 Author

**Rathod Pratik**
- **Website:** [pratikofficial.dev](https://pratikofficial.dev/)
- **GitHub:** [@Rathod-Pratik](https://github.com/Rathod-Pratik)
