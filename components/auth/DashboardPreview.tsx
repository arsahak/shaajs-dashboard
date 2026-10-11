import Image from "next/image";
import {
  BiBell,
  BiBox,
  BiCheckCircle,
  BiCog,
  BiDollarCircle,
  BiGridAlt,
  BiMessageSquareDetail,
  BiPackage,
  BiReceipt,
  BiSearch,
  BiStar,
  BiStore,
  BiTimeFive,
  BiUser,
  BiXCircle,
} from "react-icons/bi";

// Static, non-interactive mock of the dashboard shown behind the sign-in
// card. Every figure here is placeholder data — nothing is fetched, so no
// real store data is exposed on this public page.
const navItems = [
  { title: "Dashboard", icon: BiGridAlt, active: true },
  { title: "Products", icon: BiPackage },
  { title: "Orders", icon: BiReceipt },
  { title: "Reviews", icon: BiStar },
  { title: "Customers", icon: BiUser },
  { title: "Inventory", icon: BiBox },
  { title: "Messages", icon: BiMessageSquareDetail },
  { title: "Vendor", icon: BiStore },
  { title: "Settings", icon: BiCog },
];

const stats = [
  { title: "All Orders", value: "1,284", change: "+12.4%", icon: BiReceipt, color: "bg-blue-50 text-blue-600" },
  { title: "Delivered", value: "962", change: "+8.1%", icon: BiCheckCircle, color: "bg-green-50 text-green-600" },
  { title: "Pending", value: "214", change: "+3.6%", icon: BiTimeFive, color: "bg-amber-50 text-amber-600" },
  { title: "Cancelled", value: "108", change: "-2.3%", icon: BiXCircle, color: "bg-red-50 text-red-600" },
  { title: "Total Revenue", value: "৳8,42,500", change: "+15.2%", icon: BiDollarCircle, color: "bg-purple-50 text-purple-600" },
];

const bars = [42, 58, 49, 71, 63, 84, 76, 92, 68, 88, 79, 96];

const orders = [
  { id: "#SH-10482", customer: "Nusrat Jahan", status: "Delivered", tone: "bg-green-50 text-green-700", total: "৳2,450" },
  { id: "#SH-10481", customer: "Tanvir Ahmed", status: "Pending", tone: "bg-amber-50 text-amber-700", total: "৳1,180" },
  { id: "#SH-10480", customer: "Sadia Islam", status: "Delivered", tone: "bg-green-50 text-green-700", total: "৳3,920" },
  { id: "#SH-10479", customer: "Rafiul Karim", status: "Cancelled", tone: "bg-red-50 text-red-700", total: "৳760" },
  { id: "#SH-10478", customer: "Mim Akter", status: "Pending", tone: "bg-amber-50 text-amber-700", total: "৳1,640" },
];

const DashboardPreview = () => {
  const linePoints = bars
    .map((value, index) => `${index * 50 + 25},${200 - value * 1.5}`)
    .join(" ");

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex select-none overflow-hidden bg-gray-50"
    >
      {/* Sidebar */}
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-gray-200 px-5">
          <Image
            src="/assets/logo/color-logo.svg"
            alt=""
            width={168}
            height={36}
            className="h-9 w-auto object-contain"
          />
        </div>
        <div className="flex flex-col gap-1 px-3 py-6">
          {navItems.map(({ title, icon: Icon, active }) => (
            <div
              key={title}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                active ? "bg-primary text-white" : "text-gray-600"
              }`}
            >
              <Icon className="h-5 w-5" />
              {title}
            </div>
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="flex h-10 w-72 max-w-[50%] items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-400">
            <BiSearch className="h-4 w-4" />
            Search…
          </div>
          <div className="flex items-center gap-4">
            <BiBell className="h-5 w-5 text-gray-400" />
            <div className="h-9 w-9 rounded-full bg-gray-800" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 overflow-hidden p-6">
          <div>
            <p className="text-2xl font-bold text-gray-900">Dashboard Overview</p>
            <p className="mt-1 text-sm text-gray-500">
              Daily performance over the last 30 days
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {stats.map(({ title, value, change, icon: Icon, color }) => (
              <div
                key={title}
                className="rounded-xl border border-gray-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl ${color}`}
                  >
                    <Icon />
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      change.startsWith("-") ? "text-red-500" : "text-green-600"
                    }`}
                  >
                    {change}
                  </span>
                </div>
                <p className="mt-4 text-xs font-medium text-gray-500">{title}</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 xl:col-span-2">
              <p className="text-base font-bold text-gray-900">
                Order &amp; Revenue Overview
              </p>
              <svg
                viewBox="0 0 600 200"
                preserveAspectRatio="none"
                className="mt-5 h-56 w-full"
              >
                {[50, 100, 150].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    x2="600"
                    y1={y}
                    y2={y}
                    className="stroke-gray-100"
                    strokeWidth="1"
                  />
                ))}
                {bars.map((value, index) => (
                  <rect
                    key={index}
                    x={index * 50 + 11}
                    y={200 - value * 1.8}
                    width="28"
                    height={value * 1.8}
                    rx="4"
                    className="fill-primary/20"
                  />
                ))}
                <polyline
                  points={linePoints}
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white">
              <p className="border-b border-gray-200 px-5 py-5 text-base font-bold text-gray-900">
                Recent Orders
              </p>
              <div className="divide-y divide-gray-100">
                {orders.map(({ id, customer, status, tone, total }) => (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {customer}
                      </p>
                      <p className="text-xs text-gray-400">{id}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-gray-900">{total}</p>
                      <span
                        className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-semibold ${tone}`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPreview;
