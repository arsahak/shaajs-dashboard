import {
  BiCategory,
  BiChevronDownSquare,
  BiCog,
  BiGroup,
  BiHistory,
  BiHome,
  BiMessage,
  BiMoneyWithdraw,
  BiPackage,
  BiPlusCircle,
  BiPurchaseTagAlt,
  BiReceipt,
  BiShieldQuarter,
  BiStar,
  BiStore,
} from "react-icons/bi";

export interface SubNavItem {
  id: string;
  title: string;
  href: string;
  icon: React.ReactNode;
  label?: string;
}

export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: React.ReactNode;
  label?: string;
  badge?: number;
  sub?: SubNavItem[];
}

export const navigationConfig: NavItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/dashboard",
    icon: <BiHome size={20} />,
  },
  {
    id: "products",
    title: "Products",
    href: "/products",
    icon: <BiPackage size={20} />,
    sub: [
      {
        id: "all-products",
        title: "All Products",
        href: "/products",
        icon: <BiPackage size={16} />,
      },
      {
        id: "add-product",
        title: "Add Product",
        href: "/products/add",
        icon: <BiPlusCircle size={16} />,
      },
      {
        id: "categories",
        title: "Categories",
        href: "/products/categories",
        icon: <BiCategory size={16} />,
      },
      {
        id: "add-category",
        title: "Add Category",
        href: "/products/categories/add",
        icon: <BiPlusCircle size={16} />,
      },
      {
        id: "brand",
        title: "Brand",
        href: "/products/brand",
        icon: <BiPurchaseTagAlt size={16} />,
      },
      {
        id: "add-brand",
        title: "Add Brand",
        href: "/products/brand/add",
        icon: <BiPlusCircle size={16} />,
      },
    ],
  },
  {
    id: "orders",
    title: "Orders",
    href: "/orders",
    icon: <BiReceipt size={20} />,
    sub: [
      {
        id: "all-orders",
        title: "All Orders",
        href: "/orders",
        icon: <BiReceipt size={16} />,
      },
      {
        id: "add-order",
        title: "Add Order",
        href: "/orders/add",
        icon: <BiPlusCircle size={16} />,
      },
    ],
  },
  {
    id: "reviews",
    title: "Reviews",
    href: "/reviews",
    icon: <BiStar size={20} />,
  },
  {
    id: "customers",
    title: "Customers",
    href: "/customers",
    icon: <BiGroup size={20} />,
    sub: [
      {
        id: "all-customers",
        title: "All Customers",
        href: "/customers",
        icon: <BiGroup size={16} />,
      },
      {
        id: "add-customer",
        title: "Add Customer",
        href: "/customers/add",
        icon: <BiPlusCircle size={16} />,
      },
    ],
  },

  {
    id: "inventory",
    title: "Inventory",
    href: "/inventory",
    icon: <BiPackage size={20} />,
    sub: [
      {
        id: "all-stock",
        title: "Stock",
        href: "/inventory/stock",
        icon: <BiGroup size={16} />,
      },
      {
        id: "add-stock",
        title: "Add Stock",
        href: "/inventory/stock/add",
        icon: <BiPlusCircle size={16} />,
      },
      {
        id: "suppliers",
        title: "Suppliers",
        href: "/inventory/supplier",
        icon: <BiStore size={16} />,
      },
      {
        id: "add-supplier",
        title: "Add Supplier",
        href: "/inventory/supplier/add",
        icon: <BiPlusCircle size={16} />,
      },
    ],
  },
  {
    id: "messages",
    title: "Messages",
    href: "/messages",
    icon: <BiMessage size={20} />,
  },
  {
    id: "vendor",
    title: "Vendor",
    href: "/vendor",
    icon: <BiChevronDownSquare size={20} />,
    sub: [
      {
        id: "all-vendors",
        title: "All Vendors",
        href: "/vendors",
        icon: <BiGroup size={16} />,
      },
      {
        id: "add-vendor",
        title: "Add Vendor",
        href: "/vendors/add",
        icon: <BiPlusCircle size={16} />,
      },
    ],
  },
  {
    id: "settings",
    title: "Settings",
    href: "/settings",
    icon: <BiCog size={20} />,
    sub: [
      {
        id: "general-settings",
        title: "General",
        href: "/settings",
        icon: <BiCog size={16} />,
      },
      {
        id: "roles-permissions",
        title: "Roles & Permissions",
        href: "/settings/roles",
        icon: <BiShieldQuarter size={16} />,
      },
      {
        id: "costing",
        title: "Costing",
        href: "/settings/costing",
        icon: <BiMoneyWithdraw size={16} />,
      },
      {
        id: "activity-log",
        title: "Activity Log",
        href: "/settings/activity-log",
        icon: <BiHistory size={16} />,
      },
    ],
  },
];
