export type ChangeType = "positive" | "negative" | "neutral";

export interface DashboardStat {
  title: string;
  value: string;
  change: string;
  changeType: ChangeType;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface QuickActionItem {
  id: string;
  label: string;
  color?: "primary" | "default" | "danger" | "success" | "warning" | "secondary";
  variant?: "solid" | "flat" | "bordered" | "light" | "ghost" | "faded";
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href?: string;
}

export interface ProductSummaryItem {
  id: string;
  name: string;
  category: string;
  price: string;
  stock?: number;
  status?: string;
}

export interface Product {
  id: number;
  name: string;
  category: {
    id: number;
    name: string;
  };
  price: string;
  stock: number;
  status: string;
  image: string;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  productCount?: number;
  status?: string;
}
import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};
