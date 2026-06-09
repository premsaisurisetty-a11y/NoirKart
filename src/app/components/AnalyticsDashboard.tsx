import { useState, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { 
  TrendingUp, 
  Eye, 
  MousePointerClick, 
  DollarSign, 
  Search, 
  Database, 
  Trash2, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Globe,
  Tag,
  ArrowUpRight
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { motion, AnimatePresence } from "motion/react";

const COMMISSION_RATE = 0.08; // 8% affiliate commission

export function AnalyticsDashboard() {
  const { 
    analyticsEvents, 
    products 
  } = useCart();

  const [timeRange, setTimeRange] = useState<7 | 30>(30);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"views" | "clicks" | "ctr" | "revenue">("revenue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter events by date range and exclude demo logs
  const filteredEvents = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);
    return analyticsEvents.filter(event => {
      const matchesDate = new Date(event.timestamp) >= cutoffDate;
      const isDemo = event.id.startsWith("demo-");
      return matchesDate && !isDemo;
    });
  }, [analyticsEvents, timeRange]);

  // Aggregate metrics
  const stats = useMemo(() => {
    let views = 0;
    let clicks = 0;
    let grossSales = 0;

    filteredEvents.forEach(event => {
      if (event.type === "view") {
        views++;
      } else if (event.type === "click") {
        clicks++;
        grossSales += event.productPrice;
      }
    });

    const ctr = views > 0 ? (clicks / views) * 100 : 0;
    const estRevenue = grossSales * COMMISSION_RATE;

    return {
      views,
      clicks,
      ctr,
      grossSales,
      estRevenue
    };
  }, [filteredEvents]);

  // Chart Data: Group events by date (for last 7/30 days)
  const chartData = useMemo(() => {
    const dataMap: { [dateStr: string]: { date: string; views: number; clicks: number; revenue: number } } = {};
    const now = new Date();

    // Initialize map with all dates in the range to prevent gaps
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dataMap[dateStr] = { date: dateStr, views: 0, clicks: 0, revenue: 0 };
    }

    filteredEvents.forEach(event => {
      const eventDate = new Date(event.timestamp);
      const dateStr = eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      
      if (dataMap[dateStr]) {
        if (event.type === "view") {
          dataMap[dateStr].views++;
        } else if (event.type === "click") {
          dataMap[dateStr].clicks++;
          dataMap[dateStr].revenue += event.productPrice * COMMISSION_RATE;
        }
      }
    });

    return Object.values(dataMap);
  }, [filteredEvents, timeRange]);

  // Product Performance Table Data
  const productPerformance = useMemo(() => {
    const pMap: { [id: number]: { id: number; name: string; category: string; image: string; views: number; clicks: number; revenue: number } } = {};

    // Initialize with all current products
    products.forEach(p => {
      pMap[p.id] = {
        id: p.id,
        name: p.name,
        category: p.category,
        image: p.image,
        views: 0,
        clicks: 0,
        revenue: 0
      };
    });

    filteredEvents.forEach(event => {
      // If product exists in current list or was deleted but present in logs
      if (!pMap[event.productId]) {
        pMap[event.productId] = {
          id: event.productId,
          name: event.productName,
          category: event.category,
          image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100",
          views: 0,
          clicks: 0,
          revenue: 0
        };
      }

      if (event.type === "view") {
        pMap[event.productId].views++;
      } else if (event.type === "click") {
        pMap[event.productId].clicks++;
        pMap[event.productId].revenue += event.productPrice * COMMISSION_RATE;
      }
    });

    // Convert to array and filter by search term
    return Object.values(pMap)
      .map(p => {
        const ctr = p.views > 0 ? (p.clicks / p.views) * 100 : 0;
        return {
          ...p,
          ctr
        };
      })
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [filteredEvents, products, searchTerm]);

  // Sort Product Table Data
  const sortedProducts = useMemo(() => {
    return [...productPerformance].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [productPerformance, sortBy, sortOrder]);

  // Affiliate / Merchant Domain Breakdown
  const merchantBreakdown = useMemo(() => {
    const mMap: { [domain: string]: { domain: string; clicks: number; revenue: number } } = {};

    const getDomainName = (url?: string) => {
      if (!url) return "Unknown Merchant";
      try {
        const hostname = new URL(url).hostname.toLowerCase();
        if (hostname.includes("amazon") || hostname.includes("amzn")) return "Amazon";
        if (hostname.includes("myntra") || hostname.includes("myntr")) return "Myntra";
        if (hostname.includes("flipkart") || hostname.includes("fkrt")) return "Flipkart";
        if (hostname.includes("ajio")) return "Ajio";

        const parts = hostname.replace("www.", "").split(".");
        return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      } catch {
        return "Affiliate Redirect";
      }
    };

    filteredEvents.forEach(event => {
      if (event.type === "click") {
        const domain = getDomainName(event.merchantUrl);
        if (!mMap[domain]) {
          mMap[domain] = { domain, clicks: 0, revenue: 0 };
        }
        mMap[domain].clicks++;
        mMap[domain].revenue += event.productPrice * COMMISSION_RATE;
      }
    });

    const list = Object.values(mMap);
    const totalClicks = list.reduce((sum, item) => sum + item.clicks, 0);

    return list.map(item => ({
      ...item,
      share: totalClicks > 0 ? (item.clicks / totalClicks) * 100 : 0
    })).sort((a, b) => b.clicks - a.clicks);
  }, [filteredEvents]);

  // Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const catMap: { [cat: string]: { category: string; views: number; clicks: number; revenue: number } } = {};

    filteredEvents.forEach(event => {
      const cat = event.category || "Uncategorized";
      if (!catMap[cat]) {
        catMap[cat] = { category: cat, views: 0, clicks: 0, revenue: 0 };
      }

      if (event.type === "view") {
        catMap[cat].views++;
      } else if (event.type === "click") {
        catMap[cat].clicks++;
        catMap[cat].revenue += event.productPrice * COMMISSION_RATE;
      }
    });

    const list = Object.values(catMap);
    const totalRevenue = list.reduce((sum, item) => sum + item.revenue, 0);

    return list.map(item => ({
      ...item,
      ctr: item.views > 0 ? (item.clicks / item.views) * 100 : 0,
      share: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredEvents]);

  const toggleSort = (field: "views" | "clicks" | "ctr" | "revenue") => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-xl p-3.5 shadow-xl text-left text-xs text-white">
          <p className="font-bold text-gray-400 mb-1.5">{payload[0].payload.date}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-6">
              <span className="text-gray-400">Views:</span>
              <span className="font-bold text-blue-400">{payload[0].payload.views}</span>
            </div>
            <div className="flex justify-between gap-6">
              <span className="text-gray-400">Clicks:</span>
              <span className="font-bold text-rose-400">{payload[0].payload.clicks}</span>
            </div>
            <div className="h-px bg-[#2A2A2A] my-1" />
            <div className="flex justify-between gap-6 text-[13px]">
              <span className="text-gray-400">Est. Revenue:</span>
              <span className="font-black text-emerald-400">₹{payload[0].payload.revenue.toFixed(0)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 lg:col-span-3">
      {/* Filters & Control Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4.5 rounded-2xl border border-[#E8E8E8]">
        <div>
          <h2 className="text-lg font-bold text-gray-900 leading-tight">Overview Analytics</h2>
          <p className="text-xs text-gray-500">Track impressions, conversions, click behaviors, and simulated affiliate payouts.</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days as any)}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                timeRange === days
                  ? "bg-[#E23744] border-[#E23744] text-white shadow-xs"
                  : "bg-white border-[#E8E8E8] text-gray-500 hover:text-gray-900"
              }`}
            >
              Last {days} Days
            </button>
          ))}
        </div>
      </div>      {filteredEvents.length === 0 ? (
        /* No Real Traffic State */
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E8E8E8] rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 bg-[#FFF0F1] text-[#E23744] rounded-full flex items-center justify-center mx-auto mb-5 text-2xl">
            📈
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Traffic Recorded Yet</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
            Real product views and outbound partner link clicks will automatically populate here as users browse the directory.
          </p>
        </motion.div>
      ) : (
        <>
          {/* Metrics Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                label: "Gross Sales Referred",
                val: `₹${stats.grossSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                desc: "Total value of items clicked",
                icon: DollarSign,
                col: "text-blue-500 bg-blue-500/10 border-blue-100"
              },
              {
                label: "Est. Earnings (8%)",
                val: `₹${stats.estRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
                desc: "Estimated commissions generated",
                icon: ArrowUpRight,
                col: "text-emerald-500 bg-emerald-500/10 border-emerald-100"
              },
              {
                label: "Total Views",
                val: stats.views.toLocaleString(),
                desc: "Product details page visits",
                icon: Eye,
                col: "text-indigo-500 bg-indigo-500/10 border-indigo-100"
              },
              {
                label: "Referral Clicks",
                val: stats.clicks.toLocaleString(),
                desc: "Redirects to partner stores",
                icon: MousePointerClick,
                col: "text-rose-500 bg-rose-500/10 border-rose-100"
              },
              {
                label: "Click-Through Rate",
                val: `${stats.ctr.toFixed(1)}%`,
                desc: "Click conversion proportion",
                icon: TrendingUp,
                col: "text-amber-500 bg-amber-500/10 border-amber-100"
              }
            ].map((card, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-[#E8E8E8] flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">{card.label}</span>
                  <div className={`p-2 rounded-lg ${card.col} border`}>
                    <card.icon size={16} />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-black text-gray-900">{card.val}</p>
                  <p className="text-[10px] text-gray-400 mt-1 leading-snug">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Trends Chart */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8E8E8]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Affiliate Earnings Over Time</h3>
                <p className="text-xs text-gray-500">Daily breakdown of estimated referal payouts.</p>
              </div>
              <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Commission Share Locked
              </span>
            </div>

            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E23744" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#E23744" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F3F3" />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: "#696969", fontSize: 10, fontWeight: 600 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: "#696969", fontSize: 10, fontWeight: 600 }}
                    tickFormatter={(val) => `₹${val}`}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#E23744" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#revenueGrad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Split breakdowns Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Affiliate Merchant Performance */}
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E8] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Top Affiliate Partners</h3>
                    <p className="text-xs text-gray-500">Redirect share and earnings by merchant domain.</p>
                  </div>
                  <Globe size={18} className="text-[#E23744]" />
                </div>

                <div className="space-y-4">
                  {merchantBreakdown.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-4">No outbound clicks recorded.</p>
                  ) : (
                    merchantBreakdown.map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-900">{item.domain.replace(/(^\w+:|^)\/\//, '').replace('www.', '').split('.')[0].charAt(0).toUpperCase() + item.domain.replace(/(^\w+:|^)\/\//, '').replace('www.', '').split('.')[0].slice(1)}</span>
                          <span className="text-gray-500">
                            {item.clicks} clicks · <strong className="text-emerald-600 font-bold">₹{item.revenue.toFixed(0)}</strong>
                          </span>
                        </div>
                        <div className="w-full bg-[#F5F5F5] h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-[#E23744] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${item.share}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-400">
                          <span>Outbound Volume</span>
                          <span>{item.share.toFixed(1)}% Share</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Top Categories */}
            <div className="bg-white rounded-2xl p-6 border border-[#E8E8E8] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Category Performance</h3>
                    <p className="text-xs text-gray-500">Breakdown of earnings generated per catalog section.</p>
                  </div>
                  <Tag size={18} className="text-[#E23744]" />
                </div>

                <div className="space-y-4">
                  {categoryBreakdown.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-4">No activity logged yet.</p>
                  ) : (
                    categoryBreakdown.map((item, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-900">{item.category}</span>
                          <span className="text-gray-500">
                            {item.clicks}/{item.views} CTR: {item.ctr.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-[#F5F5F5] h-2 rounded-full overflow-hidden">
                          {/* Vary color shades of red/pink/orange based on category index */}
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${item.share}%`,
                              backgroundColor: idx === 0 ? "#E23744" : idx === 1 ? "#FF6B6B" : idx === 2 ? "#D97706" : "#4F46E5"
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-400">
                          <span>Referral Income: ₹{item.revenue.toFixed(0)}</span>
                          <span>{item.share.toFixed(1)}% Revenue Share</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Product Performance Table Leaderboard */}
          <div className="bg-white rounded-2xl p-6 border border-[#E8E8E8]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Product Performance Leaderboard</h3>
                <p className="text-xs text-gray-500">Details of views, clicks, CTR, and generated income per product.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Filter products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#F8F8F8] border border-[#E8E8E8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E23744]/50 text-xs text-gray-950 placeholder-gray-400"
                />
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-[#E8E8E8] text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="pb-3 w-16">Item</th>
                    <th className="pb-3">Details</th>
                    <th className="pb-3 cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort("views")}>
                      Views {sortBy === "views" && (sortOrder === "desc" ? "↓" : "↑")}
                    </th>
                    <th className="pb-3 cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort("clicks")}>
                      Clicks {sortBy === "clicks" && (sortOrder === "desc" ? "↓" : "↑")}
                    </th>
                    <th className="pb-3 cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort("ctr")}>
                      CTR {sortBy === "ctr" && (sortOrder === "desc" ? "↓" : "↑")}
                    </th>
                    <th className="pb-3 cursor-pointer select-none hover:text-gray-700 text-right" onClick={() => toggleSort("revenue")}>
                      Est. Revenue {sortBy === "revenue" && (sortOrder === "desc" ? "↓" : "↑")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F5]">
                  {sortedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-gray-400 italic">
                        No product search matches found.
                      </td>
                    </tr>
                  ) : (
                    sortedProducts.map((p) => (
                      <tr key={p.id} className="text-sm">
                        <td className="py-4 pr-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F8F8F8] border border-[#E8E8E8] flex-shrink-0 flex items-center justify-center p-0.5">
                            <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain" />
                          </div>
                        </td>
                        <td className="py-4 min-w-[200px] pr-3">
                          <p className="font-bold text-gray-900 line-clamp-1 leading-snug">{p.name}</p>
                          <span className="text-[9px] bg-[#F8F8F8] text-gray-400 uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded mt-1 inline-block border border-[#E8E8E8]">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-4 font-semibold text-gray-700">{p.views}</td>
                        <td className="py-4 font-semibold text-gray-700">{p.clicks}</td>
                        <td className="py-4 min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 w-10 text-xs">{p.ctr.toFixed(1)}%</span>
                            <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-[#E23744] h-full rounded-full" 
                                style={{ width: `${Math.min(p.ctr * 4, 100)}%` }} // Scaling representation (e.g. 25% fills 100%)
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 font-black text-gray-950 text-right text-base text-emerald-600">
                          ₹{p.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
