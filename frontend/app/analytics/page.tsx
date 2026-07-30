'use client';

/* ============================================================
   Analytics — SpaceSync
  
   ============================================================ */

import { useState, useMemo } from 'react';
import {
  BarChart3, TrendingUp, Users, Clock, Download, Calendar,
  ArrowUp, ArrowDown, Activity, Award, Zap, Filter,
  UserCheck, UserX, TrendingDown as TrendingDownIcon,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, PolarAngleAxis, ScatterChart, Scatter,
  ZAxis,
} from 'recharts';
import AppShell from '@/components/AppShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

/* ============================================================
   TYPES & INTERFACES
   ============================================================ */

interface KPI {
  id: string;
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: any;
  color: string;
}

interface CategorySplit {
  name: string;
  value: number;
  color: string;
}

interface TopResource {
  name: string;
  bookings: number;
  utilisation: number;
  trend: 'up' | 'down';
  noShowRate?: number;
}

interface HourlyBooking {
  hour: string;
  count: number;
}

interface ActiveBooker {
  name: string;
  bookings: number;
  hours: number;
  noShows: number;
  trend: 'up' | 'down';
}

/* ============================================================
   MOCK DATA
   ============================================================ */

const KPIS: KPI[] = [
  { id: 'util', label: 'Avg Utilisation', value: '72%', change: '+8.2%', up: true, icon: Activity, color: 'var(--ss-cyan)' },
  { id: 'bookings', label: 'Total Bookings', value: '7,827', change: '+15.3%', up: true, icon: Calendar, color: 'var(--ss-teal)' },
  { id: 'users', label: 'Active Users', value: '1,248', change: '+12.5%', up: true, icon: Users, color: 'var(--ss-info)' },
  { id: 'hours', label: 'Booked Hours', value: '4,392', change: '-3.1%', up: false, icon: Clock, color: 'var(--ss-warning)' },
];

const YEAR_TREND = [
  { month: 'Aug', bookings: 980, cancellations: 82 },
  { month: 'Sep', bookings: 1120, cancellations: 95 },
  { month: 'Oct', bookings: 1050, cancellations: 78 },
  { month: 'Nov', bookings: 1180, cancellations: 110 },
  { month: 'Dec', bookings: 890, cancellations: 120 },
  { month: 'Jan', bookings: 1240, cancellations: 88 },
  { month: 'Feb', bookings: 1320, cancellations: 92 },
  { month: 'Mar', bookings: 1410, cancellations: 105 },
  { month: 'Apr', bookings: 1380, cancellations: 98 },
  { month: 'May', bookings: 1520, cancellations: 112 },
  { month: 'Jun', bookings: 1620, cancellations: 95 },
  { month: 'Jul', bookings: 1710, cancellations: 108 },
];

const HOURLY_BOOKINGS: HourlyBooking[] = [
  { hour: '6am', count: 12 },
  { hour: '7am', count: 28 },
  { hour: '8am', count: 65 },
  { hour: '9am', count: 112 },
  { hour: '10am', count: 145 },
  { hour: '11am', count: 132 },
  { hour: '12pm', count: 78 },
  { hour: '1pm', count: 95 },
  { hour: '2pm', count: 158 },
  { hour: '3pm', count: 168 },
  { hour: '4pm', count: 142 },
  { hour: '5pm', count: 98 },
  { hour: '6pm', count: 52 },
  { hour: '7pm', count: 28 },
  { hour: '8pm', count: 14 },
];

const HEATMAP_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HEATMAP_SLOTS = ['8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'];
const HEATMAP_DATA: number[][] = [
  [2, 4, 5, 4, 2, 3, 5, 5, 4, 3, 1, 0],
  [3, 5, 5, 4, 3, 4, 5, 5, 5, 3, 2, 1],
  [3, 4, 5, 5, 2, 3, 4, 5, 4, 4, 2, 1],
  [4, 5, 5, 5, 3, 4, 5, 5, 5, 4, 2, 1],
  [3, 4, 4, 3, 2, 3, 4, 4, 3, 3, 1, 0],
  [1, 2, 2, 1, 0, 1, 2, 2, 1, 1, 0, 0],
  [0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0],
];

const CATEGORY_SPLIT: CategorySplit[] = [
  { name: 'Meeting Rooms', value: 1850, color: 'var(--ss-cyan)' },
  { name: 'Labs', value: 1240, color: 'var(--ss-teal)' },
  { name: 'Equipment', value: 980, color: 'var(--ss-chart-3)' },
  { name: 'Auditoriums', value: 620, color: 'var(--ss-chart-4)' },
  { name: 'Studios', value: 340, color: 'var(--ss-chart-5)' },
];

const TOP_RESOURCES: TopResource[] = [
  { name: 'Meeting Room A-201', bookings: 142, utilisation: 92, trend: 'up', noShowRate: 12 },
  { name: 'Computer Lab B-105', bookings: 128, utilisation: 88, trend: 'up', noShowRate: 8 },
  { name: 'Auditorium C-001', bookings: 95, utilisation: 76, trend: 'up', noShowRate: 5 },
  { name: 'Conference Room D-14', bookings: 87, utilisation: 71, trend: 'down', noShowRate: 15 },
  { name: '3D Printer Lab', bookings: 64, utilisation: 65, trend: 'up', noShowRate: 10 },
  { name: 'Photography Studio', bookings: 42, utilisation: 48, trend: 'down', noShowRate: 22 },
];

// Most Active Bookers Data
const ACTIVE_BOOKERS: ActiveBooker[] = [
  { name: 'Sarah Chen', bookings: 48, hours: 72, noShows: 2, trend: 'up' },
  { name: 'Mike Johnson', bookings: 42, hours: 58, noShows: 4, trend: 'up' },
  { name: 'Emma Wilson', bookings: 38, hours: 52, noShows: 1, trend: 'up' },
  { name: 'David Park', bookings: 35, hours: 45, noShows: 3, trend: 'down' },
  { name: 'Lisa Anderson', bookings: 32, hours: 48, noShows: 5, trend: 'up' },
  { name: 'John Doe', bookings: 28, hours: 40, noShows: 2, trend: 'down' },
];

// No-Show Rate by Resource
const NO_SHOW_BY_RESOURCE = [
  { resource: 'Equipment Center', rate: 22, bookings: 95, noShows: 21 },
  { resource: 'Photography Studio', rate: 18, bookings: 42, noShows: 8 },
  { resource: 'Meeting Room A-201', rate: 15, bookings: 120, noShows: 18 },
  { resource: '3D Printer Lab', rate: 12, bookings: 64, noShows: 8 },
  { resource: 'Conference Room D-14', rate: 10, bookings: 87, noShows: 9 },
  { resource: 'Computer Lab B-105', rate: 8, bookings: 85, noShows: 7 },
  { resource: 'Lab B', rate: 8, bookings: 85, noShows: 7 },
  { resource: 'Conference Room B', rate: 5, bookings: 160, noShows: 8 },
];

const RADIAL_DATA = [
  { name: 'Utilisation', value: 72, fill: 'var(--ss-cyan)' },
];

/* ============================================================
   CUSTOM CHART TOOLTIP
   ============================================================ */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-xl max-w-[200px]"
      style={{
        background: 'var(--ss-bg-elevated)',
        border: '1px solid var(--ss-border)',
      }}
    >
      {label && (
        <p className="font-semibold mb-1 truncate" style={{ color: 'var(--ss-text-primary)' }}>
          {label}
        </p>
      )}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill || p.stroke }}>
          {p.name}: <span className="font-semibold">
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

/* ============================================================
   MAIN ANALYTICS COMPONENT
   ============================================================ */

export default function AnalyticsPage() {
  // ===== State =====
  const [range, setRange] = useState<'7d' | '30d' | '12m'>('12m');
  const [category, setCategory] = useState<'all' | string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'users'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  // ===== Derived Data =====

  const peakHour = useMemo(() => {
    return HOURLY_BOOKINGS.reduce(
      (max, h) => (h.count > max.count ? h : max),
      HOURLY_BOOKINGS[0]
    );
  }, []);

  const busiestDay = useMemo(() => {
    const totals = HEATMAP_DATA.map((row, i) => ({
      day: HEATMAP_DAYS[i],
      total: row.reduce((a, b) => a + b, 0),
    }));
    return totals.reduce((max, d) => (d.total > max.total ? d : max));
  }, []);

  const totalBookings = useMemo(() => {
    return YEAR_TREND.reduce((sum, d) => sum + d.bookings, 0);
  }, []);

  const categoryPercentages = useMemo(() => {
    const total = CATEGORY_SPLIT.reduce((sum, c) => sum + c.value, 0);
    return CATEGORY_SPLIT.map((c) => ({
      ...c,
      percentage: Math.round((c.value / total) * 100),
    }));
  }, []);

  const topCategory = useMemo(() => {
    return CATEGORY_SPLIT.reduce((max, c) => (c.value > max.value ? c : max));
  }, []);

  // No-show statistics
  const noShowStats = useMemo(() => {
    const total = NO_SHOW_BY_RESOURCE.reduce((sum, item) => sum + item.noShows, 0);
    const totalBookingsAll = NO_SHOW_BY_RESOURCE.reduce((sum, item) => sum + item.bookings, 0);
    const avgRate = totalBookingsAll > 0 ? (total / totalBookingsAll) * 100 : 0;
    return { total, avgRate: Math.round(avgRate) };
  }, []);

  // Top booker stats
  const topBookerStats = useMemo(() => {
    const total = ACTIVE_BOOKERS.reduce((sum, b) => sum + b.bookings, 0);
    const avg = Math.round(total / ACTIVE_BOOKERS.length);
    return { total, avg };
  }, []);

  // ===== Handlers =====

  const handleExport = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    console.log('Exporting analytics report...');
  };

  return (
    <AppShell title="Analytics" subtitle="Deep insights into resource usage and booking patterns">
      <div className="space-y-6">
        {/* ===== Top Toolbar ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <Select value={range} onValueChange={(v) => setRange(v as any)}>
              <SelectTrigger className="w-full sm:w-36 bg-[--ss-bg-surface] border-[--ss-border]">
                <Calendar className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: 'var(--ss-text-muted)' }} />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full sm:w-44 bg-[--ss-bg-surface] border-[--ss-border]">
                <Filter className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: 'var(--ss-text-muted)' }} />
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORY_SPLIT.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="bg-[--ss-cyan] text-[--ss-bg-base] hover:opacity-90 font-semibold flex items-center gap-2 w-full sm:w-auto"
            onClick={handleExport}
            disabled={isLoading}
          >
            <Download className="w-4 h-4" />
            {isLoading ? 'Exporting...' : 'Export Report'}
          </Button>
        </div>

       <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'overview' | 'resources' | 'users')}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          {/* ============================================================
            OVERVIEW TAB
            ============================================================ */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* KPI Tiles */}
            <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
              {KPIS.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <Card
                    key={kpi.id}
                    className="ss-stat-card"
                    style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}
                  >
                    <CardContent className="p-3 sm:p-5">
                      <div className="flex items-start justify-between">
                        <div
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: `${kpi.color}20`,
                            border: `1px solid ${kpi.color}40`,
                          }}
                        >
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: kpi.color }} />
                        </div>
                        <div
                          className="flex items-center gap-1 text-xs font-medium flex-shrink-0 ml-2"
                          style={{ color: kpi.up ? 'var(--ss-success)' : 'var(--ss-danger)' }}
                        >
                          {kpi.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          {kpi.change}
                        </div>
                      </div>
                      <p className="text-lg sm:text-2xl font-bold mt-2 sm:mt-4" style={{ color: 'var(--ss-text-primary)' }}>
                        {kpi.value}
                      </p>
                      <p className="text-xs sm:text-sm mt-0.5 sm:mt-1 truncate" style={{ color: 'var(--ss-text-secondary)' }}>
                        {kpi.label}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            {/* Year Trend + Radial Gauge */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2" style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
                <CardHeader>
                  <CardTitle style={{ color: 'var(--ss-text-primary)' }}>Bookings vs Cancellations</CardTitle>
                  <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>
                    12-month trend · {totalBookings.toLocaleString()} total bookings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={YEAR_TREND}>
                        <defs>
                          <linearGradient id="gradBookingsA" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--ss-cyan)" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="var(--ss-cyan)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--ss-border-subtle)" />
                        <XAxis dataKey="month" stroke="var(--ss-text-muted)" fontSize={10} tickLine={false} axisLine={false} interval={1} />
                        <YAxis stroke="var(--ss-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 11, color: 'var(--ss-text-secondary)' }} />
                        <Area type="monotone" dataKey="bookings" name="Bookings" stroke="var(--ss-cyan)" strokeWidth={2} fill="url(#gradBookingsA)" />
                        <Line type="monotone" dataKey="cancellations" name="Cancellations" stroke="var(--ss-danger)" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Radial Gauge */}
              <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
                <CardHeader>
                  <CardTitle style={{ color: 'var(--ss-text-primary)' }}>Overall Utilisation</CardTitle>
                  <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>All resources combined</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px] sm:h-[220px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart innerRadius="70%" outerRadius="100%" data={RADIAL_DATA} startAngle={90} endAngle={-270}>
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar background={{ fill: 'var(--ss-bg-elevated)' }} dataKey="value" cornerRadius={10} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--ss-cyan)' }}>72%</p>
                      <p className="text-[10px] sm:text-xs mt-1" style={{ color: 'var(--ss-text-muted)' }}>in use right now</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t" style={{ borderColor: 'var(--ss-border)' }}>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>Peak utilisation</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--ss-text-primary)' }}>94% (3pm)</p>
                    </div>
                    <div>
                      <p className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>Lowest utilisation</p>
                      <p className="text-sm font-bold" style={{ color: 'var(--ss-text-primary)' }}>8% (6am)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Hourly Bookings + Category Donut */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2" style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                  <div>
                    <CardTitle style={{ color: 'var(--ss-text-primary)' }}>Bookings by Hour</CardTitle>
                    <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>
                      Peak at {peakHour.hour} with {peakHour.count} bookings
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg flex-shrink-0" style={{ background: 'var(--ss-cyan-dim)', color: 'var(--ss-cyan)' }}>
                    <Zap className="w-3 h-3" /> Peak {peakHour.hour}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] sm:h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={HOURLY_BOOKINGS}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--ss-border-subtle)" vertical={false} />
                        <XAxis dataKey="hour" stroke="var(--ss-text-muted)" fontSize={10} tickLine={false} axisLine={false} interval={1} />
                        <YAxis stroke="var(--ss-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,212,255,0.05)' }} />
                        <Bar dataKey="count" name="Bookings" radius={[4, 4, 0, 0]}>
                          {HOURLY_BOOKINGS.map((h) => (
                            <Cell key={h.hour} fill={h.hour === peakHour.hour ? 'var(--ss-cyan)' : 'rgba(0, 212, 255, 0.4)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
                <CardHeader>
                  <CardTitle style={{ color: 'var(--ss-text-primary)' }}>Bookings by Category</CardTitle>
                  <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>
                    {topCategory.name} leads with {Math.round((topCategory.value / CATEGORY_SPLIT.reduce((s, c) => s + c.value, 0)) * 100)}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px] sm:h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={CATEGORY_SPLIT} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                          {CATEGORY_SPLIT.map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke="var(--ss-bg-surface)" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-1 sm:gap-2 mt-2 sm:mt-3">
                    {categoryPercentages.map((c) => (
                      <div key={c.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm flex-shrink-0" style={{ background: c.color }} />
                          <span className="truncate text-xs sm:text-sm" style={{ color: 'var(--ss-text-secondary)' }}>{c.name}</span>
                        </div>
                        <span className="font-medium text-xs sm:text-sm flex-shrink-0 ml-2" style={{ color: 'var(--ss-text-primary)' }}>{c.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          {/* ============================================================
            RESOURCES TAB
            ============================================================ */}
          <TabsContent value="resources" className="space-y-6 mt-6">
            {/* No-Show Rate by Resource */}
            <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--ss-text-primary)' }} className="flex items-center gap-2">
                  <UserX className="w-4 h-4" style={{ color: 'var(--ss-danger)' }} />
                  No-Show Rate by Resource
                </CardTitle>
                <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>
                  {noShowStats.total} total no-shows · {noShowStats.avgRate}% average rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {NO_SHOW_BY_RESOURCE.sort((a, b) => b.rate - a.rate).map((item) => (
                    <div key={item.resource} className="flex items-center gap-3">
                      <div className="w-32 sm:w-48 flex-shrink-0">
                        <span className="text-sm truncate" style={{ color: 'var(--ss-text-primary)' }}>
                          {item.resource}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--ss-bg-elevated)' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(item.rate, 100)}%`,
                              background: item.rate > 15 ? 'var(--ss-danger)' : item.rate > 10 ? 'var(--ss-warning)' : 'var(--ss-success)',
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="text-sm font-semibold" style={{ color: 'var(--ss-text-primary)' }}>
                          {item.rate}%
                        </span>
                        <span className="text-xs block" style={{ color: 'var(--ss-text-muted)' }}>
                          {item.noShows}/{item.bookings}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Resources with No-Show Rate */}
            <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" style={{ color: 'var(--ss-cyan)' }} />
                  <CardTitle style={{ color: 'var(--ss-text-primary)' }}>Top Resources</CardTitle>
                </div>
                <span className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>By bookings</span>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {TOP_RESOURCES.map((resource, index) => (
                    <div key={resource.name} className="flex items-center gap-2 sm:gap-3">
                      <div
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0"
                        style={{
                          background: index === 0 ? 'var(--ss-cyan-dim)' : 'var(--ss-bg-elevated)',
                          color: index === 0 ? 'var(--ss-cyan)' : 'var(--ss-text-muted)',
                          border: `1px solid ${index === 0 ? 'var(--ss-cyan)' : 'var(--ss-border)'}`,
                        }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs sm:text-sm font-medium truncate" style={{ color: 'var(--ss-text-primary)' }}>
                            {resource.name}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            {resource.trend === 'up' ? (
                              <TrendingUp className="w-3 h-3" style={{ color: 'var(--ss-success)' }} />
                            ) : (
                              <TrendingDownIcon className="w-3 h-3" style={{ color: 'var(--ss-danger)' }} />
                            )}
                            <span className="text-xs font-semibold" style={{ color: 'var(--ss-text-secondary)' }}>
                              {resource.bookings}
                            </span>
                            {resource.noShowRate && (
                              <Badge
                                className="text-xs"
                                style={{
                                  background: resource.noShowRate > 15 ? 'var(--ss-danger-dim)' : 'var(--ss-success-dim)',
                                  color: resource.noShowRate > 15 ? 'var(--ss-danger)' : 'var(--ss-success)',
                                }}
                              >
                                {resource.noShowRate}% no-show
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="h-1 sm:h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--ss-bg-elevated)' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${resource.utilisation}%`, background: 'var(--ss-cyan)' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================
            USERS TAB
            ============================================================ */}
          <TabsContent value="users" className="space-y-6 mt-6">
            {/* Most Active Bookers */}
            <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--ss-text-primary)' }} className="flex items-center gap-2">
               <Users className="w-4 h-4" style={{ color: 'var(--ss-cyan)' }} />
                  Most Active Bookers
                </CardTitle>
                <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>
                  {topBookerStats.total} total bookings · {topBookerStats.avg} avg per user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ACTIVE_BOOKERS.map((booker, index) => (
                    <div key={booker.name} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--ss-bg-elevated)' }}>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{
                          background: index < 3 ? 'var(--ss-cyan-dim)' : 'var(--ss-bg-surface)',
                          color: index < 3 ? 'var(--ss-cyan)' : 'var(--ss-text-muted)',
                          border: `1px solid ${index < 3 ? 'var(--ss-cyan)' : 'var(--ss-border)'}`,
                        }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium" style={{ color: 'var(--ss-text-primary)' }}>
                            {booker.name}
                          </span>
                          <div className="flex items-center gap-2">
                            {booker.trend === 'up' ? (
                              <TrendingUp className="w-3 h-3" style={{ color: 'var(--ss-success)' }} />
                            ) : (
                              <TrendingDownIcon className="w-3 h-3" style={{ color: 'var(--ss-danger)' }} />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs mt-1" style={{ color: 'var(--ss-text-muted)' }}>
                          <span>{booker.bookings} bookings</span>
                          <span>{booker.hours} hours</span>
                          {booker.noShows > 0 && (
                            <span className="text-[--ss-danger]">{booker.noShows} no-shows</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Booking Distribution by User */}
            <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--ss-text-primary)' }}>Booking Distribution</CardTitle>
                <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>
                  Top bookers vs average user activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] sm:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ACTIVE_BOOKERS}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--ss-border-subtle)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--ss-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--ss-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, color: 'var(--ss-text-secondary)' }} />
                      <Bar dataKey="bookings" name="Bookings" fill="var(--ss-cyan)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="hours" name="Hours" fill="var(--ss-teal)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ============================================================
          HEATMAP (Visible in all tabs)
          ============================================================ */}
        <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--ss-text-primary)' }}>Booking Intensity Heatmap</CardTitle>
            <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>
              Day vs hour · busiest day is {busiestDay.day}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-2 px-2">
              <div className="min-w-[380px] sm:min-w-[420px]">
                <div className="flex items-center gap-0.5 sm:gap-1 mb-1">
                  <div className="w-8 sm:w-10 flex-shrink-0" />
                  {HEATMAP_SLOTS.map((slot) => (
                    <div key={slot} className="flex-1 text-center text-[8px] sm:text-xs" style={{ color: 'var(--ss-text-muted)' }}>
                      {slot}
                    </div>
                  ))}
                </div>
                {HEATMAP_DATA.map((row, dayIdx) => (
                  <div key={dayIdx} className="flex items-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                    <div className="w-8 sm:w-10 flex-shrink-0 text-[10px] sm:text-xs font-medium" style={{ color: 'var(--ss-text-secondary)' }}>
                      {HEATMAP_DAYS[dayIdx]}
                    </div>
                    {row.map((val, slotIdx) => (
                      <div
                        key={slotIdx}
                        className={cn('flex-1 h-5 sm:h-7 rounded transition-transform hover:scale-110 cursor-default', `heatmap-${Math.min(val, 5)}`)}
                        title={`${HEATMAP_DAYS[dayIdx]} ${HEATMAP_SLOTS[slotIdx]}:00 — intensity ${val}`}
                      />
                    ))}
                  </div>
                ))}
                <div className="flex items-center justify-end gap-1 sm:gap-2 mt-2 sm:mt-3">
                  <span className="text-[10px] sm:text-xs" style={{ color: 'var(--ss-text-muted)' }}>Less</span>
                  {[0, 1, 2, 3, 4, 5].map((v) => (
                    <div key={v} className={cn('w-3 h-3 sm:w-4 sm:h-4 rounded', `heatmap-${v}`)} />
                  ))}
                  <span className="text-[10px] sm:text-xs" style={{ color: 'var(--ss-text-muted)' }}>More</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ============================================================
          KEY INSIGHT BANNER
          ============================================================ */}
        <Card className="ss-stat-card" style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--ss-cyan-dim)', border: '1px solid var(--ss-cyan)' }}>
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: 'var(--ss-cyan)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base" style={{ color: 'var(--ss-text-primary)' }}>Key Insights</h3>
                <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--ss-text-secondary)' }}>
                  Bookings peak on <span className="font-semibold" style={{ color: 'var(--ss-cyan)' }}>{busiestDay.day}</span> around{' '}
                  <span className="font-semibold" style={{ color: 'var(--ss-cyan)' }}>{peakHour.hour}</span>.
                  Meeting rooms account for{' '}
                  <span className="font-semibold" style={{ color: 'var(--ss-cyan)' }}>
                    {Math.round((CATEGORY_SPLIT[0].value / CATEGORY_SPLIT.reduce((s, x) => s + x.value, 0)) * 100)}%
                  </span>{' '}
                  of all bookings. The highest no-show rate is{' '}
                  <span className="font-semibold" style={{ color: 'var(--ss-danger)' }}>
                    {NO_SHOW_BY_RESOURCE.sort((a, b) => b.rate - a.rate)[0]?.rate}%
                  </span>{' '}
                  on {NO_SHOW_BY_RESOURCE.sort((a, b) => b.rate - a.rate)[0]?.resource}.
                  Consider adding more meeting room capacity during peak hours and implementing check-in reminders.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}