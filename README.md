# Technology Stack Documentation
## Margie CodeVenience System

Complete documentation of all libraries, APIs, frameworks, and technologies used in this project.

---

## 📦 Core Framework & Runtime

### **Next.js**
- **Version:** 15.3.1
- **Purpose:** React framework for production
- **Features Used:**
  - App Router (Next.js 13+)
  - API Routes (`/app/api/*`)
  - Server Components & Client Components
  - Middleware for route protection
  - Turbopack (development bundler)
- **Documentation:** https://nextjs.org/docs

### **React**
- **Version:** 18.3.1
- **Purpose:** UI library
- **Features Used:**
  - Hooks (useState, useEffect, useMemo, useCallback)
  - Context API
  - Component composition
- **Documentation:** https://react.dev

### **TypeScript**
- **Version:** 5.6.3
- **Purpose:** Type-safe JavaScript
- **Configuration:** `tsconfig.json`
- **Documentation:** https://www.typescriptlang.org/docs

---

## 🎨 UI Component Libraries

### **HeroUI (NextUI)**
- **Version:** ^2.8.3
- **Purpose:** React component library
- **Components Used:**
  - `@heroui/react` - Main component library
  - `@heroui/button` - Button components
  - `@heroui/input` - Input fields
  - `@heroui/modal` - Modal dialogs
  - `@heroui/select` - Dropdown selects
  - `@heroui/tabs` - Tab navigation
  - `@heroui/table` - Table components
  - `@heroui/card` - Card containers
  - `@heroui/chip` - Badge/chip components
  - `@heroui/pagination` - Pagination controls
  - `@heroui/navbar` - Navigation bar
  - `@heroui/spinner` - Loading indicators
  - `@heroui/theme` - Theming system
  - `@heroui/system` - System utilities
- **Documentation:** https://heroui.com

### **React Aria**
- **Versions:**
  - `@react-aria/ssr`: 3.9.10
  - `@react-aria/visually-hidden`: 3.8.27
- **Purpose:** Accessibility primitives for HeroUI
- **Documentation:** https://react-spectrum.adobe.com/react-aria

### **Framer Motion**
- **Version:** 11.18.2
- **Purpose:** Animation library (used by HeroUI)
- **Documentation:** https://www.framer.com/motion

---

## 🎯 Icons & Visual Elements

### **Lucide React**
- **Version:** ^0.542.0
- **Purpose:** Icon library
- **Icons Used:** BarChart3, TrendingUp, Download, FileText, RotateCcw, XCircle, ArrowUpDown, Calendar, Hash, Package, DollarSign, Percent, Search, User, Settings, etc.
- **Documentation:** https://lucide.dev

### **React Icons**
- **Version:** ^5.5.0
- **Purpose:** Additional icon sets
- **Documentation:** https://react-icons.github.io/react-icons

---

## 📊 Charts & Data Visualization

### **Recharts**
- **Version:** ^3.2.1
- **Purpose:** Charting library for React
- **Components Used:**
  - `AreaChart` - Area charts
  - `LineChart` - Line charts
  - `BarChart` - Bar charts
  - `PieChart` - Pie charts
  - `ResponsiveContainer` - Responsive wrapper
  - `XAxis`, `YAxis` - Chart axes
  - `CartesianGrid` - Grid lines
  - `Tooltip` - Hover tooltips
  - `Legend` - Chart legends
- **Used In:**
  - Sales Performance Reports
  - Revenue Trends
  - Top Products Analysis
- **Documentation:** https://recharts.org

---

## 🗄️ Database & ORM

### **Prisma**
- **Version:** ^6.15.0
- **Purpose:** Next-generation ORM
- **Database:** MongoDB
- **Features:**
  - Type-safe database client
  - Schema management
  - Migrations
  - Query builder
- **Models:**
  - User
  - Product
  - Category
  - Sale
  - StockMovement
  - Cart
- **Documentation:** https://www.prisma.io/docs

### **MongoDB**
- **Provider:** MongoDB (via Prisma)
- **Purpose:** NoSQL database
- **Connection:** Environment variable `DATABASE_URL`
- **Documentation:** https://www.mongodb.com/docs

---

## 🔐 Authentication & Security

### **NextAuth.js (Auth.js)**
- **Version:** ^5.0.0-beta.29
- **Purpose:** Authentication framework
- **Provider:** Credentials (email/password)
- **Features:**
  - JWT-based sessions
  - Route protection via middleware
  - Role-based access control (Admin/Staff)
- **Documentation:** https://authjs.dev

### **bcryptjs**
- **Version:** ^3.0.2
- **Purpose:** Password hashing
- **Usage:** Password encryption/verification
- **Documentation:** https://www.npmjs.com/package/bcryptjs

---

## 📡 Data Fetching & State Management

### **SWR (Stale-While-Revalidate)**
- **Version:** ^2.3.6
- **Purpose:** Data fetching with caching
- **Features Used:**
  - Real-time data updates
  - Automatic revalidation
  - Cache management
  - Error handling
- **Configuration:**
  - `refreshInterval: 5000` - Auto-refresh every 5 seconds
  - `revalidateOnFocus: true` - Revalidate on window focus
  - `revalidateOnReconnect: true` - Revalidate on network reconnect
- **Documentation:** https://swr.vercel.app

### **Zustand**
- **Version:** ^5.0.8
- **Purpose:** Lightweight state management
- **Usage:** POS store for cart management
- **Documentation:** https://zustand-demo.pmnd.rs

---

## 📧 Email Services

### **Nodemailer**
- **Version:** ^6.10.1
- **Purpose:** Email sending
- **Usage:** Stock alerts, new product notifications
- **Documentation:** https://nodemailer.com

### **React Email**
- **Versions:**
  - `@react-email/components`: ^0.5.5
  - `@react-email/render`: ^1.3.1
  - `react-email`: ^4.2.12
- **Purpose:** Email template components
- **Templates:**
  - Stock Alert Email
  - New Product Email
- **Documentation:** https://react.email

---

## 📄 File Handling & Export

### **SheetJS (xlsx)**
- **Version:** ^0.18.5
- **Purpose:** Excel/CSV file generation
- **Usage:**
  - Export sales reports to XLSX
  - Export data to CSV
  - Generate downloadable reports
- **Documentation:** https://sheetjs.com

### **Vercel Blob**
- **Version:** ^2.0.0
- **Purpose:** File storage (if used for image uploads)
- **Documentation:** https://vercel.com/docs/storage/vercel-blob

---

## 📱 Barcode & QR Code Scanning

### **ZXing (Zebra Crossing)**
- **Versions:**
  - `@zxing/browser`: ^0.1.5
  - `@zxing/library`: ^0.21.3
- **Purpose:** Barcode/QR code scanning
- **Features:**
  - Camera-based scanning
  - Multiple barcode formats support
  - Product lookup by barcode
- **Documentation:** https://github.com/zxing-js/library

---

## 🎨 Styling & Theming

### **Tailwind CSS**
- **Version:** 4.1.11
- **Purpose:** Utility-first CSS framework
- **Configuration:** `tailwind.config.js`
- **Features:**
  - Dark mode support
  - Custom color schemes
  - Responsive design utilities
- **Documentation:** https://tailwindcss.com

### **Tailwind Variants**
- **Version:** 3.1.0
- **Purpose:** Component variant management
- **Documentation:** https://www.tailwind-variants.org

### **PostCSS**
- **Version:** 8.5.6
- **Purpose:** CSS processing
- **Configuration:** `postcss.config.js`
- **Documentation:** https://postcss.org

### **next-themes**
- **Version:** 0.4.6
- **Purpose:** Dark mode theme switching
- **Documentation:** https://github.com/pacocoursey/next-themes

---

## 🛠️ Utilities & Helpers

### **clsx**
- **Version:** 2.1.1
- **Purpose:** Conditional class names
- **Documentation:** https://github.com/lukeed/clsx

### **intl-messageformat**
- **Version:** 10.7.16
- **Purpose:** Internationalization message formatting
- **Documentation:** https://formatjs.io/docs/intl-messageformat

---

## 🔧 Development Tools

### **ESLint**
- **Version:** 9.25.1
- **Purpose:** Code linting
- **Plugins:**
  - `@next/eslint-plugin-next`: 15.3.4
  - `@typescript-eslint/eslint-plugin`: 8.34.1
  - `@typescript-eslint/parser`: 8.34.1
  - `eslint-plugin-import`: 2.31.0
  - `eslint-plugin-jsx-a11y`: 6.10.2
  - `eslint-plugin-node`: 11.1.0
  - `eslint-plugin-prettier`: 5.2.1
  - `eslint-plugin-react`: 7.37.5
  - `eslint-plugin-react-hooks`: 5.2.0
  - `eslint-plugin-unused-imports`: 4.1.4
- **Configuration:** `eslint.config.mjs`
- **Documentation:** https://eslint.org

### **Prettier**
- **Version:** 3.5.3
- **Purpose:** Code formatting
- **Documentation:** https://prettier.io

### **TSX**
- **Version:** ^4.20.5
- **Purpose:** TypeScript execution (for Prisma seeds)
- **Documentation:** https://github.com/esbuild-kit/tsx

### **mkcert**
- **Version:** ^3.2.0
- **Purpose:** Local HTTPS certificates for development
- **Documentation:** https://github.com/FiloSottile/mkcert

---

## 📚 Type Definitions

### **TypeScript Type Packages**
- `@types/node`: 20.5.7
- `@types/react`: 18.3.3
- `@types/react-dom`: 18.3.0
- `@types/nodemailer`: ^7.0.1
- `@react-types/shared`: 3.30.0

---

## 🌐 API Architecture

### **Next.js API Routes**
All API endpoints are located in `/app/api/*`:

#### **Authentication APIs**
- `/api/auth/sign-in` - User login
- `/api/auth/sign-up` - User registration
- `/api/auth/forgot-password` - Password reset
- `/api/auth/reset-password` - Reset password with token
- `/api/auth/validate-reset-token` - Validate password reset token
- `/api/auth/[...nextauth]` - NextAuth handlers

#### **Product APIs**
- `/api/product` - CRUD operations for products
- `/api/product/[id]` - Individual product operations
- `/api/product/restore` - Restore deleted products
- `/api/products/by-barcode` - Product lookup by barcode
- `/api/products/lookup` - Product search
- `/api/products/stock-alerts` - Stock alert generation

#### **Category APIs**
- `/api/category` - CRUD operations for categories

#### **Cart APIs**
- `/api/cart` - Cart management
- `/api/cart/[itemId]` - Individual cart item operations

#### **Checkout APIs**
- `/api/checkout` - Process sales transactions

#### **Returns APIs**
- `/api/returns` - Process product returns

#### **Reports APIs**
- `/api/reports/revenue-trends` - Revenue trend analysis
- `/api/reports/sales-performance` - Sales performance metrics
- `/api/reports/detailed-sales` - Detailed sales transactions
- `/api/reports/profit-margin` - Profit margin analysis
- `/api/reports/top-products` - Top selling products
- `/api/reports/returned-items` - Returned items report
- `/api/reports/void-items` - Voided items report
- `/api/reports/stock-movements` - Stock movement history

#### **Dashboard APIs**
- `/api/dashboard` - Dashboard statistics

#### **User Management APIs**
- `/api/users` - User CRUD operations

#### **Email APIs**
- `/api/email/settings` - Email configuration
- `/api/email/user-settings` - User email preferences
- `/api/email/config` - Email service configuration
- `/api/email/send-stock-alert` - Send stock alert emails
- `/api/email/send-new-product` - Send new product notifications
- `/api/email/clear-settings` - Clear email settings

#### **File Upload APIs**
- `/api/upload` - File/image upload handling

#### **Scan Log APIs**
- `/api/log-scan` - Log barcode scans
- `/api/scan-log` - Retrieve scan logs

---

## 🏗️ Project Structure

```
margie-codevenience/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── product/           # Product management
│   ├── category/          # Category management
│   ├── reports/           # Reports & analytics
│   ├── ScannedList/       # POS checkout
│   ├── scanqr/            # QR/Barcode scanner
│   ├── users/             # User management
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── prisma/                # Database schema & migrations
├── public/                # Static assets
├── styles/                # Global styles
└── types/                 # TypeScript type definitions
```

---

## 🔄 Key Features & Patterns

### **Real-time Updates**
- SWR with 5-second refresh intervals
- Automatic revalidation on focus/reconnect
- Live data synchronization across components

### **Role-Based Access Control**
- Admin: Full access to all features
- Staff: Limited access (Scan Items, Checkout only)
- Middleware-based route protection

### **State Management Patterns**
- React Context for global state (Notifications, Search)
- SWR for server state
- Zustand for POS cart state
- Local state with useState for component-specific data

### **Data Export**
- XLSX export for detailed reports
- CSV export for summary reports
- Print functionality for receipts

### **Email Notifications**
- Stock alerts (low stock, out of stock)
- New product notifications
- Password reset emails
- Configurable email settings

---

## 📝 Environment Variables

Required environment variables (`.env`):
- `DATABASE_URL` - MongoDB connection string
- `NEXTAUTH_SECRET` - NextAuth secret key
- `NEXTAUTH_URL` - Application URL
- `NEXT_PUBLIC_API_BASE_URL` - API base URL
- Email configuration (SMTP settings)
  - `EMAIL_HOST` - SMTP server host
  - `EMAIL_PORT` - SMTP server port
  - `EMAIL_USER` - SMTP username
  - `EMAIL_PASS` - SMTP password
  - `EMAIL_SECURE` - Use secure connection (true/false)
- `DEFAULT_NOTIFICATION_EMAIL` - Default email for alerts

---

## 🚀 Build & Deployment

### **Build Process**
1. `prisma generate` - Generate Prisma client
2. `next build` - Build Next.js application
3. TypeScript compilation
4. Asset optimization

### **Development**
- `npm run dev` - Start development server with Turbopack
- `npm run dev:https` - Start with HTTPS (for testing)

### **Production**
- `npm run build` - Build for production
- `npm start` - Start production server

---

## 📖 Additional Resources

- **Next.js Documentation:** https://nextjs.org/docs
- **React Documentation:** https://react.dev
- **Prisma Documentation:** https://www.prisma.io/docs
- **HeroUI Documentation:** https://heroui.com
- **Recharts Documentation:** https://recharts.org
- **SWR Documentation:** https://swr.vercel.app
- **NextAuth Documentation:** https://authjs.dev

---

## 📊 Summary Statistics

- **Total Dependencies:** 39 production packages
- **Total Dev Dependencies:** 25 development packages
- **Framework:** Next.js 15.3.1 (React 18.3.1)
- **Database:** MongoDB via Prisma
- **UI Library:** HeroUI (NextUI)
- **Charts:** Recharts
- **Authentication:** NextAuth.js v5
- **Data Fetching:** SWR
- **Language:** TypeScript 5.6.3

---

*Last Updated: Based on current package.json and codebase analysis*
