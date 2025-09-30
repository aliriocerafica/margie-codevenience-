// Sample data constants for the application
import { Package, Tag, DollarSign, Users, BarChart3, TrendingUp, ShoppingCart, Star } from "lucide-react";
import type { DashboardStat, QuickActionItem, ProductSummaryItem } from "@/types";

// Dashboard Statistics Sample Data
export const DASHBOARD_STATS: DashboardStat[] = [
  {
    title: "Total Products",
    value: "1,234",
    icon: Package,
    change: "+12%",
    changeType: "positive"
  },
  {
    title: "Categories",
    value: "45",
    icon: Tag,
    change: "+3%",
    changeType: "positive"
  },
  {
    title: "Total Sales",
    value: "₱124,500",
    icon: DollarSign,
    change: "+18%",
    changeType: "positive"
  },
  {
    title: "Active Users",
    value: "89",
    icon: Users,
    change: "+5%",
    changeType: "positive"
  }
];

// Quick Actions Sample Data
export const DASHBOARD_QUICK_ACTIONS: QuickActionItem[] = [
  { 
    id: "add-product", 
    label: "Add New Product", 
    color: "primary", 
    variant: "flat", 
    icon: Package,
    href: "/product?add=1"
  },
  { 
    id: "manage-categories", 
    label: "Manage Categories", 
    color: "secondary", 
    variant: "flat", 
    icon: Tag,
    href: "/category"
  },
  { 
    id: "view-analytics", 
    label: "View Analytics", 
    color: "success", 
    variant: "flat", 
    icon: BarChart3,
    href: "/analytics"
  },
  { 
    id: "sales-report", 
    label: "Sales Report", 
    color: "warning", 
    variant: "flat", 
    icon: TrendingUp,
    href: "/reports"
  },
];

// Recent Products Sample Data
export const RECENT_PRODUCTS: ProductSummaryItem[] = [
  { 
    id: "1",
    name: "MacBook Pro 16-inch", 
    category: "Electronics", 
    price: "₱129,999",
    stock: 15,
    status: "available"
  },
  { 
    id: "2",
    name: "Wireless Bluetooth Mouse", 
    category: "Accessories", 
    price: "₱1,299",
    stock: 45,
    status: "available"
  },
  { 
    id: "3",
    name: "Mechanical Gaming Keyboard", 
    category: "Accessories", 
    price: "₱4,899",
    stock: 8,
    status: "low_stock"
  },
  { 
    id: "4",
    name: "4K Monitor 27-inch", 
    category: "Electronics", 
    price: "₱25,999",
    stock: 0,
    status: "out_of_stock"
  },
  { 
    id: "5",
    name: "USB-C Hub", 
    category: "Accessories", 
    price: "₱2,499",
    stock: 23,
    status: "available"
  }
];

// Sample Products Data for Product Page
export const SAMPLE_PRODUCTS = [
  {
    id: 1,
    name: "MacBook Pro 16-inch",
    category: { id: 1, name: "Electronics" },
    price: "129999",
    stock: 15,
    status: "available",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=100&h=100&fit=crop&crop=center",
    description: "High-performance laptop for professionals"
  },
  {
    id: 2,
    name: "Wireless Bluetooth Mouse",
    category: { id: 2, name: "Accessories" },
    price: "1299",
    stock: 45,
    status: "available",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&h=100&fit=crop&crop=center",
    description: "Ergonomic wireless mouse"
  },
  {
    id: 3,
    name: "Mechanical Gaming Keyboard",
    category: { id: 2, name: "Accessories" },
    price: "4899",
    stock: 8,
    status: "low_stock",
    image: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=100&h=100&fit=crop&crop=center",
    description: "RGB mechanical keyboard for gaming"
  },
  {
    id: 4,
    name: "4K Monitor 27-inch",
    category: { id: 1, name: "Electronics" },
    price: "25999",
    stock: 0,
    status: "out_of_stock",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=100&h=100&fit=crop&crop=center",
    description: "Ultra HD 4K display monitor"
  },
  {
    id: 5,
    name: "USB-C Hub",
    category: { id: 2, name: "Accessories" },
    price: "2499",
    stock: 23,
    status: "available",
    image: "https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=100&h=100&fit=crop&crop=center",
    description: "Multi-port USB-C connectivity hub"
  },
  {
    id: 6,
    name: "Smartphone iPhone 15",
    category: { id: 1, name: "Electronics" },
    price: "55999",
    stock: 32,
    status: "available",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100&h=100&fit=crop&crop=center",
    description: "Latest iPhone with advanced features"
  },
  {
    id: 7,
    name: "Wireless Earbuds",
    category: { id: 2, name: "Accessories" },
    price: "8999",
    stock: 67,
    status: "available",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=100&h=100&fit=crop&crop=center",
    description: "Premium wireless earbuds with noise cancellation"
  },
  {
    id: 8,
    name: "Gaming Chair",
    category: { id: 3, name: "Furniture" },
    price: "12999",
    stock: 5,
    status: "low_stock",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=100&h=100&fit=crop&crop=center",
    description: "Ergonomic gaming chair with lumbar support"
  },
  {
    id: 9,
    name: "Desk Lamp LED",
    category: { id: 4, name: "Office Supplies" },
    price: "3499",
    stock: 18,
    status: "available",
    image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=100&h=100&fit=crop&crop=center",
    description: "Adjustable LED desk lamp with touch control"
  },
  {
    id: 10,
    name: "External Hard Drive 2TB",
    category: { id: 1, name: "Electronics" },
    price: "4299",
    stock: 0,
    status: "out_of_stock",
    image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=100&h=100&fit=crop&crop=center",
    description: "Portable external storage drive"
  }
];

// Sample Categories Data
export const SAMPLE_CATEGORIES = [
  {
    id: 1,
    name: "Electronics",
    description: "Electronic devices and gadgets",
    productCount: 125,
    status: "active"
  },
  {
    id: 2,
    name: "Accessories",
    description: "Computer and mobile accessories",
    productCount: 89,
    status: "active"
  },
  {
    id: 3,
    name: "Furniture",
    description: "Office and gaming furniture",
    productCount: 34,
    status: "active"
  },
  {
    id: 4,
    name: "Office Supplies",
    description: "Office equipment and supplies",
    productCount: 67,
    status: "active"
  },
  {
    id: 5,
    name: "Gaming",
    description: "Gaming equipment and accessories",
    productCount: 45,
    status: "active"
  },
  {
    id: 6,
    name: "Audio",
    description: "Audio equipment and speakers",
    productCount: 23,
    status: "inactive"
  },
  {
    id: 7,
    name: "Storage",
    description: "Data storage solutions",
    productCount: 18,
    status: "active"
  },
  {
    id: 8,
    name: "Networking",
    description: "Network equipment and solutions",
    productCount: 12,
    status: "active"
  }
];

// Status color mappings
export const PRODUCT_STATUS_COLORS: Record<string, "success" | "danger" | "warning" | "default"> = {
  available: "success",
  low_stock: "warning",
  out_of_stock: "danger",
};

export const CATEGORY_STATUS_COLORS: Record<string, "success" | "danger" | "warning" | "default"> = {
  active: "success",
  inactive: "danger",
};

// Status options for filters
export const PRODUCT_STATUS_OPTIONS = [
  { key: "all", label: "All Products" },
  { key: "available", label: "Available" },
  { key: "low_stock", label: "Low Stock" },
  { key: "out_of_stock", label: "Out of Stock" },
];

export const CATEGORY_STATUS_OPTIONS = [
  { key: "all", label: "All Categories" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

// Currency formatting
export const formatCurrency = (amount: string | number): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

// Loading states
export const LOADING_MESSAGES = {
  products: "Loading products...",
  categories: "Loading categories...",
  dashboard: "Loading dashboard data...",
  general: "Loading..."
};

// Error messages
export const ERROR_MESSAGES = {
  products: "Failed to load products. Please try again.",
  categories: "Failed to load categories. Please try again.",
  dashboard: "Failed to load dashboard data. Please try again.",
  general: "Something went wrong. Please try again."
};
