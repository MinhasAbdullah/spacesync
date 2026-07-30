'use client';

/* ============================================================
   IMPORTS SECTION
   ============================================================ */
// Third-party imports
import { Pencil } from "lucide-react";
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, Layers, Calendar, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, Clock, ArrowRight, Plus,
  Download, Activity, UserCheck, UserX, Shield, Settings,
  XCircle, CheckCircle, Eye, EyeOff, Filter, Search,
  Zap, BarChart3, PieChart as PieChartIcon, FileText,
  Mail, Bell, MoreVertical, ExternalLink, RefreshCw,
  Upload, Tag, MapPin, Users as UsersIcon, Timer,
  ChevronDown, ChevronUp, Menu, LayoutDashboard, 
  ListChecks, Gauge, BellRing, Sparkles
} from 'lucide-react';

// Chart library imports
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
  CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';

// Custom component imports
import AppShell from '@/components/AppShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

/* ============================================================
   TYPES & INTERFACES
   ============================================================ */

interface Conflict {
  id: number;
  resource: string;
  time: string;
  date: string;
  users: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'unresolved' | 'in-review' | 'resolved';
  description: string;
  alternatives?: { time: string; available: boolean }[];
}

interface NoShowData {
  resource: string;
  rate: number;
  trend: 'up' | 'down';
  totalBookings: number;
  noShows: number;
}

interface PendingApproval {
  id: number;
  requester: string;
  resource: string;
  date: string;
  time: string;
  attendees: number;
  purpose: string;
  priority: 'high' | 'medium' | 'low';
  submitted: string;
  autoApprove?: boolean;
}

interface AccessGroup {
  id: string;
  name: string;
  resources: string[];
  users: number;
  visibility: 'public' | 'private';
}

interface ActiveBooking {
  id: string;
  resource: string;
  user: string;
  startTime: string;
  endTime: string;
  checkedIn: boolean;
  graceTime: number;
}

/* ============================================================
   MOCK DATA STARTS HERE
   ============================================================ */

const STATS = [
  { id: 'users', label: 'Active Users', value: 1248, change: '+12.5%', up: true, icon: Users, color: 'var(--ss-cyan)' },
  { id: 'resources', label: 'Total Resources', value: 86, change: '+4.2%', up: true, icon: Layers, color: 'var(--ss-teal)' },
  { id: 'bookings', label: 'Bookings Today', value: 342, change: '-2.8%', up: false, icon: Calendar, color: 'var(--ss-warning)' },
  { id: 'conflicts', label: 'Active Conflicts', value: 7, change: '+3', up: false, icon: AlertTriangle, color: 'var(--ss-danger)' },
];

const BOOKING_TREND = [
  { month: 'Jan', bookings: 820, resources: 240 },
  { month: 'Feb', bookings: 932, resources: 286 },
  { month: 'Mar', bookings: 901, resources: 300 },
  { month: 'Apr', bookings: 1134, resources: 310 },
  { month: 'May', bookings: 1290, resources: 330 },
  { month: 'Jun', bookings: 1330, resources: 355 },
  { month: 'Jul', bookings: 1420, resources: 372 },
];

const CATEGORY_DATA = [
  { name: 'Meeting Rooms', value: 32, color: 'var(--ss-cyan)' },
  { name: 'Labs', value: 18, color: 'var(--ss-teal)' },
  { name: 'Equipment', value: 24, color: 'var(--ss-chart-3)' },
  { name: 'Auditoriums', value: 12, color: 'var(--ss-chart-4)' },
];

const WEEKLY_ACTIVITY = [
  { day: 'Mon', count: 45 },
  { day: 'Tue', count: 62 },
  { day: 'Wed', count: 58 },
  { day: 'Thu', count: 71 },
  { day: 'Fri', count: 84 },
  { day: 'Sat', count: 32 },
  { day: 'Sun', count: 18 },
];

const ACTIVITY = [
  { id: 1, user: 'Sarah Chen', action: 'booked', target: 'Meeting Room A-201', time: '2 min ago', type: 'booking' },
  { id: 2, user: 'Mike Johnson', action: 'requested', target: 'Projector #PT-12', time: '15 min ago', type: 'request' },
  { id: 3, user: 'System', action: 'flagged', target: 'Lab B conflict', time: '32 min ago', type: 'conflict' },
  { id: 4, user: 'Emma Wilson', action: 'approved', target: 'Auditorium booking', time: '1 hour ago', type: 'approval' },
  { id: 5, user: 'David Park', action: 'cancelled', target: 'Room C-105', time: '2 hours ago', type: 'cancel' },
  { id: 6, user: 'Lisa Anderson', action: 'booked', target: 'Conference Room B', time: '3 hours ago', type: 'booking' },
  { id: 7, user: 'System', action: 'auto-released', target: 'Meeting Room A-201 (no-show)', time: '4 hours ago', type: 'no-show' },
];

const CONFLICT_DATA: Conflict[] = [
  {
    id: 1,
    resource: 'Meeting Room A-201',
    time: '2:00 PM - 3:00 PM',
    date: 'Today',
    users: ['Alice Johnson', 'Bob Smith'],
    priority: 'high',
    status: 'unresolved',
    description: 'Double booking for project review meeting',
    alternatives: [
      { time: '3:30 PM - 4:30 PM', available: true },
      { time: '4:00 PM - 5:00 PM', available: true },
      { time: 'Tomorrow 10:00 AM - 11:00 AM', available: true },
    ]
  },
  {
    id: 2,
    resource: 'Lab B',
    time: '10:00 AM - 12:00 PM',
    date: 'Tomorrow',
    users: ['Carol White', 'Dave Brown'],
    priority: 'medium',
    status: 'in-review',
    description: 'Lab equipment reservation overlap',
    alternatives: [
      { time: '1:00 PM - 3:00 PM', available: true },
      { time: 'Tomorrow 3:00 PM - 5:00 PM', available: false },
    ]
  },
  {
    id: 3,
    resource: 'Boardroom',
    time: '4:00 PM - 5:30 PM',
    date: 'Today',
    users: ['Eve Davis', 'Frank Wilson'],
    priority: 'critical',
    status: 'unresolved',
    description: 'Executive meeting conflict',
    alternatives: [
      { time: '6:00 PM - 7:30 PM', available: true },
      { time: 'Tomorrow 9:00 AM - 10:30 AM', available: true },
    ]
  },
];

const NO_SHOW_DATA: NoShowData[] = [
  { resource: 'Meeting Room A-201', rate: 15, trend: 'up', totalBookings: 120, noShows: 18 },
  { resource: 'Lab B', rate: 8, trend: 'down', totalBookings: 85, noShows: 7 },
  { resource: 'Equipment Center', rate: 22, trend: 'up', totalBookings: 95, noShows: 21 },
  { resource: 'Conference Room B', rate: 5, trend: 'down', totalBookings: 160, noShows: 8 },
];

const PENDING_APPROVALS: PendingApproval[] = [
  {
    id: 1,
    requester: 'John Doe',
    resource: 'Boardroom',
    date: 'Tomorrow',
    time: '10:00 AM - 11:30 AM',
    attendees: 12,
    purpose: 'Client presentation',
    priority: 'high',
    submitted: '2 hours ago',
    autoApprove: false,
  },
  {
    id: 2,
    requester: 'Sarah Lee',
    resource: 'Lab B',
    date: 'Friday',
    time: '2:00 PM - 4:00 PM',
    attendees: 8,
    purpose: 'Research experiment',
    priority: 'medium',
    submitted: '5 hours ago',
    autoApprove: false,
  },
  {
    id: 3,
    requester: 'Mike Chen',
    resource: 'Auditorium',
    date: 'Next Monday',
    time: '9:00 AM - 12:00 PM',
    attendees: 45,
    purpose: 'All-hands meeting',
    priority: 'high',
    submitted: '1 day ago',
    autoApprove: false,
  },
];

const ACCESS_GROUPS: AccessGroup[] = [
  { id: '1', name: 'Executive Team', resources: ['Boardroom', 'Executive Lounge'], users: 12, visibility: 'private' },
  { id: '2', name: 'Engineering', resources: ['Lab B', '3D Printer Lab', 'Meeting Room A-201'], users: 45, visibility: 'public' },
  { id: '3', name: 'Marketing', resources: ['Conference Room B', 'Photography Studio'], users: 18, visibility: 'public' },
];

const ACTIVE_BOOKINGS: ActiveBooking[] = [
  { id: '1', resource: 'Meeting Room A-201', user: 'Sarah Chen', startTime: '2:00 PM', endTime: '3:00 PM', checkedIn: true, graceTime: 0 },
  { id: '2', resource: 'Lab B', user: 'Mike Johnson', startTime: '2:30 PM', endTime: '4:30 PM', checkedIn: false, graceTime: 8 },
  { id: '3', resource: 'Boardroom', user: 'Emma Wilson', startTime: '3:00 PM', endTime: '5:00 PM', checkedIn: false, graceTime: 5 },
];

const CALENDAR_SYNC_STATUS = [
  { provider: 'Google Calendar', status: 'connected', users: 342, lastSync: '2 min ago' },
  { provider: 'Outlook', status: 'connected', users: 156, lastSync: '5 min ago' },
  { provider: 'Apple Calendar', status: 'disconnected', users: 0, lastSync: 'N/A' },
];

/* ============================================================
   DUMMY DATA ENDS HERE
   ============================================================ */

const ACTIVITY_STYLE: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  booking: { color: 'var(--ss-cyan)', icon: CheckCircle2 },
  request: { color: 'var(--ss-info)', icon: Clock },
  conflict: { color: 'var(--ss-danger)', icon: AlertTriangle },
  approval: { color: 'var(--ss-success)', icon: CheckCircle2 },
  cancel: { color: 'var(--ss-warning)', icon: AlertTriangle },
  'no-show': { color: 'var(--ss-danger)', icon: UserX },
};

/* ============================================================
   COMPONENTS
   ============================================================ */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-xl"
      style={{
        background: 'var(--ss-bg-elevated)',
        border: '1px solid var(--ss-border)',
      }}
    >
      <p className="font-semibold mb-1" style={{ color: 'var(--ss-text-primary)' }}>
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// No Show Weekly Digest Dialog Component
function NoShowDigestDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const weeklyData = [
    { day: 'Mon', noShows: 3, bookings: 45 },
    { day: 'Tue', noShows: 2, bookings: 62 },
    { day: 'Wed', noShows: 5, bookings: 58 },
    { day: 'Thu', noShows: 1, bookings: 71 },
    { day: 'Fri', noShows: 4, bookings: 84 },
    { day: 'Sat', noShows: 6, bookings: 32 },
    { day: 'Sun', noShows: 2, bookings: 18 },
  ];

  const totalNoShows = weeklyData.reduce((sum, d) => sum + d.noShows, 0);
  const totalBookings = weeklyData.reduce((sum, d) => sum + d.bookings, 0);
  const avgRate = Math.round((totalNoShows / totalBookings) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-w-[95vw]"
        style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--ss-text-primary)' }}>
            Weekly No-Show Digest
          </DialogTitle>
          <DialogDescription style={{ color: 'var(--ss-text-secondary)' }}>
            Overview of no-shows for the current week
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--ss-bg-elevated)' }}>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--ss-danger)' }}>{totalNoShows}</p>
              <p className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>Total No-Shows</p>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--ss-bg-elevated)' }}>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--ss-cyan)' }}>{totalBookings}</p>
              <p className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>Total Bookings</p>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--ss-bg-elevated)' }}>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--ss-warning)' }}>{avgRate}%</p>
              <p className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>Avg Rate</p>
            </div>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--ss-border-subtle)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--ss-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--ss-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="noShows" name="No-Shows" radius={[6, 6, 0, 0]} fill="var(--ss-danger)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" style={{ color: 'var(--ss-warning)' }} />
              Highest no-show day: Saturday (6 no-shows)
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// No Show Details Dialog Component
function NoShowDetailsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [showWeeklyDigest, setShowWeeklyDigest] = useState(false);
  const noShowData = [
    { resource: 'Meeting Room A-201', rate: 15, trend: 'up', totalBookings: 120, noShows: 18 },
    { resource: 'Lab B', rate: 8, trend: 'down', totalBookings: 85, noShows: 7 },
    { resource: 'Equipment Center', rate: 22, trend: 'up', totalBookings: 95, noShows: 21 },
    { resource: 'Conference Room B', rate: 5, trend: 'down', totalBookings: 160, noShows: 8 },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-2xl max-w-[95vw]"
          style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--ss-text-primary)' }}>
              No-Show Details
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--ss-text-secondary)' }}>
              Detailed view of no-show statistics
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {noShowData.map((item) => (
                <div
                  key={item.resource}
                  className="p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  style={{ background: 'var(--ss-bg-elevated)', border: '1px solid var(--ss-border)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--ss-text-primary)' }}>
                        {item.resource}
                      </span>
                      {item.trend === 'up' ? (
                        <TrendingUp className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--ss-danger)' }} />
                      ) : (
                        <TrendingDown className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--ss-success)' }} />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--ss-text-muted)' }}>
                      <span>{item.noShows} no-shows</span>
                      <span>·</span>
                      <span>{item.totalBookings} bookings</span>
                      <span>·</span>
                      <span
                        className="font-semibold"
                        style={{
                          color: item.rate > 15 ? 'var(--ss-danger)' :
                                 item.rate > 10 ? 'var(--ss-warning)' : 'var(--ss-success)'
                        }}
                      >
                        {item.rate}%
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto"
                    style={{ borderColor: 'var(--ss-border)' }}
                    onClick={() => {
                      // Would navigate to resource details page in production
                      console.log(`View details for ${item.resource}`);
                    }}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View Details
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t" style={{ borderColor: 'var(--ss-border)' }}>
              <Button
                onClick={() => setShowWeeklyDigest(true)}
                className="w-full sm:w-auto bg-[--ss-cyan] text-white hover:opacity-90"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Weekly No-Show Digest
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                style={{ borderColor: 'var(--ss-border)', color: 'var(--ss-text-secondary)' }}
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <NoShowDigestDialog open={showWeeklyDigest} onOpenChange={setShowWeeklyDigest} />
    </>
  );
}

// Access Group Edit Dialog Component
function AccessGroupEditDialog({ 
  group, 
  open, 
  onOpenChange,
  onSave 
}: { 
  group: AccessGroup | null; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSave: (updatedGroup: AccessGroup) => void;
}) {
  const [editedGroup, setEditedGroup] = useState<AccessGroup | null>(group);

  useEffect(() => {
    setEditedGroup(group);
  }, [group]);

  if (!editedGroup) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md max-w-[95vw]"
        style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--ss-text-primary)' }}>Edit Access Group</DialogTitle>
          <DialogDescription style={{ color: 'var(--ss-text-secondary)' }}>
            Update group details and permissions
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>Group Name</Label>
            <Input
              value={editedGroup.name}
              onChange={(e) => setEditedGroup({ ...editedGroup, name: e.target.value })}
              className="mt-1.5 bg-[--ss-bg-elevated] border-[--ss-border]"
            />
          </div>
          <div>
            <Label className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>Resources</Label>
            <Input
              value={editedGroup.resources.join(', ')}
              onChange={(e) => setEditedGroup({ 
                ...editedGroup, 
                resources: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
              })}
              className="mt-1.5 bg-[--ss-bg-elevated] border-[--ss-border]"
              placeholder="Enter resources separated by commas"
            />
          </div>
          <div>
            <Label className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>Visibility</Label>
            <select
              value={editedGroup.visibility}
              onChange={(e) => setEditedGroup({ 
                ...editedGroup, 
                visibility: e.target.value as 'public' | 'private' 
              })}
              className="mt-1.5 w-full rounded-md px-3 py-2 text-sm bg-[--ss-bg-elevated] border-[--ss-border]"
              style={{ color: 'var(--ss-text-primary)' }}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[--ss-border] text-[--ss-text-secondary] w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(editedGroup);
              onOpenChange(false);
            }}
            className="bg-[--ss-cyan] text-white hover:opacity-90 w-full sm:w-auto"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Recent Activity Dialog Component
function RecentActivityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const allActivities = ACTIVITY;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-w-[95vw] max-h-[90vh]"
        style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--ss-text-primary)' }}>All Recent Activity</DialogTitle>
          <DialogDescription style={{ color: 'var(--ss-text-secondary)' }}>
            Complete history of recent actions
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {allActivities.map((a) => {
            const style = ACTIVITY_STYLE[a.type] || ACTIVITY_STYLE.booking;
            const Icon = style.icon;
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-white/5"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${style.color}20`,
                    border: `1px solid ${style.color}40`,
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: style.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: 'var(--ss-text-primary)' }}>
                    <span className="font-medium">{a.user}</span>{' '}
                    <span style={{ color: 'var(--ss-text-muted)' }}>{a.action}</span>{' '}
                    <span className="font-medium">{a.target}</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--ss-text-muted)' }}>{a.time}</p>
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ============================================================
   MAIN DASHBOARD COMPONENT
   ============================================================ */

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'urgent' | 'insights'>('overview');
  const [chartRange, setChartRange] = useState<'7d' | '30d'>('7d');
  const [showNoShowDetails, setShowNoShowDetails] = useState(false);
  const [showNoShowDigest, setShowNoShowDigest] = useState(false);
  const [showNoShowDetailsDialog, setShowNoShowDetailsDialog] = useState(false);
  const [showConflictDetails, setShowConflictDetails] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<AccessGroup | null>(null);
  const [showGroupEditDialog, setShowGroupEditDialog] = useState(false);
  const [showRecentActivityDialog, setShowRecentActivityDialog] = useState(false);
  const [accessGroups, setAccessGroups] = useState<AccessGroup[]>(ACCESS_GROUPS);
  const [visibleGroups, setVisibleGroups] = useState<Record<string, boolean>>(
    ACCESS_GROUPS.reduce((acc, g) => ({ ...acc, [g.id]: true }), {})
  );

  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>(ACTIVE_BOOKINGS);
  const [noShowData, setNoShowData] = useState<NoShowData[]>(NO_SHOW_DATA);
  const [conflicts, setConflicts] = useState<Conflict[]>(CONFLICT_DATA);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>(PENDING_APPROVALS);

  const utilisation = [
    { name: 'Meeting Rooms', pct: 78 },
    { name: 'Labs', pct: 65 },
    { name: 'Equipment', pct: 92 },
    { name: 'Auditoriums', pct: 45 },
  ];

  const totalBookings = useMemo(
    () => BOOKING_TREND.reduce((sum, item) => sum + item.bookings, 0),
    []
  );

  const noShowStats = useMemo(() => {
    const total = noShowData.reduce((sum, item) => sum + item.noShows, 0);
    const totalBookingsAll = noShowData.reduce((sum, item) => sum + item.totalBookings, 0);
    const avgRate = totalBookingsAll > 0 ? (total / totalBookingsAll) * 100 : 0;
    return { total, avgRate: Math.round(avgRate) };
  }, [noShowData]);

  const conflictStats = useMemo(() => {
    const unresolved = conflicts.filter(c => c.status === 'unresolved').length;
    const critical = conflicts.filter(c => c.priority === 'critical').length;
    return { unresolved, critical, total: conflicts.length };
  }, [conflicts]);

  const approvalStats = useMemo(() => {
    const highPriority = pendingApprovals.filter(a => a.priority === 'high').length;
    return { total: pendingApprovals.length, highPriority };
  }, [pendingApprovals]);

  const checkInStats = useMemo(() => {
    const total = activeBookings.length;
    const checkedIn = activeBookings.filter(b => b.checkedIn).length;
    const pending = activeBookings.filter(b => !b.checkedIn && b.graceTime > 0).length;
    const expired = activeBookings.filter(b => !b.checkedIn && b.graceTime === 0).length;
    return { total, checkedIn, pending, expired };
  }, [activeBookings]);

  const handleCheckIn = (bookingId: string) => {
    setActiveBookings(prev =>
      prev.map(b =>
        b.id === bookingId ? { ...b, checkedIn: true, graceTime: 0 } : b
      )
    );
    console.log(`Checked in booking ${bookingId}`);
  };

  const handleAutoRelease = (bookingId: string) => {
    setActiveBookings(prev => prev.filter(b => b.id !== bookingId));
    setNoShowData(prev =>
      prev.map(item => ({
        ...item,
        noShows: item.noShows + 1,
        rate: Math.round(((item.noShows + 1) / item.totalBookings) * 100),
      }))
    );
    console.log(`Auto-released booking ${bookingId} due to no-show`);
  };

  const handleResolveConflict = (
    conflictId: number,
    action: 'approve' | 'deny' | 'override',
    alternativeTime?: string
  ) => {
    if (action === 'override') {
      setShowOverrideDialog(true);
      setSelectedConflict(conflicts.find(c => c.id === conflictId) || null);
      return;
    }

    setConflicts(prev =>
      prev.map(c =>
        c.id === conflictId
          ? { ...c, status: action === 'approve' ? 'resolved' : 'in-review' }
          : c
      )
    );

    if (alternativeTime) {
      console.log(`Conflict ${conflictId} resolved with alternative: ${alternativeTime}`);
    }

    console.log(`Conflict ${conflictId} ${action}ed`);
  };

  const handleAdminOverride = () => {
    if (!selectedConflict || !overrideReason.trim()) return;

    setConflicts(prev =>
      prev.map(c =>
        c.id === selectedConflict.id
          ? { ...c, status: 'resolved' }
          : c
      )
    );

    console.log(`Admin override for conflict ${selectedConflict.id}`);
    console.log(`Reason: ${overrideReason}`);
    console.log(`Notification sent to: ${selectedConflict.users[1]}`);

    setShowOverrideDialog(false);
    setOverrideReason('');
    setSelectedConflict(null);
  };

  const handleApprovalAction = (approvalId: number, action: 'approve' | 'deny') => {
    setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));

    if (action === 'approve') {
      console.log(`Approved booking request ${approvalId}`);
    } else {
      console.log(`Denied booking request ${approvalId}`);
    }
  };

  const handleAutoApprove = (approvalId: number) => {
    setPendingApprovals(prev =>
      prev.map(a =>
        a.id === approvalId ? { ...a, autoApprove: true } : a
      )
    );
    console.log(`Auto-approve enabled for request ${approvalId}`);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const toggleGroupVisibility = (groupId: string) => {
    setVisibleGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleEditGroup = (group: AccessGroup) => {
    setSelectedGroup(group);
    setShowGroupEditDialog(true);
  };

  const handleSaveGroup = (updatedGroup: AccessGroup) => {
    setAccessGroups(prev =>
      prev.map(g =>
        g.id === updatedGroup.id ? updatedGroup : g
      )
    );
    console.log(`Updated group ${updatedGroup.id}:`, updatedGroup);
  };

  const urgentCount = conflicts.filter(c => c.status === 'unresolved').length + 
                     pendingApprovals.filter(a => a.priority === 'high').length;

  // Quick Actions with navigation
  const quickActions: {
    id: string;
    label: string;
    icon: typeof Plus;
    href?: string;
    action?: () => void;
    color: string;
    description: string;
  }[] = [
    { 
      id: 'add-resource', 
      label: 'Add Resource', 
      icon: Plus, 
      href: '/resources?action=add',
      color: 'var(--ss-cyan)',
      description: 'Create new resource'
    },
    { 
      id: 'bulk-import', 
      label: 'Bulk Import', 
      icon: Upload, 
      href: '/resources?import=true',
      color: 'var(--ss-teal)',
      description: 'Import from CSV'
    },
    { 
      id: 'view-calendar', 
      label: 'View Calendar', 
      icon: Calendar, 
      href: '/resources?view=calendar',
      color: 'var(--ss-warning)',
      description: 'Calendar view'
    },
    { 
      id: 'manage-conflicts', 
      label: 'Manage Conflicts', 
      icon: AlertTriangle, 
      action: () => setActiveTab('urgent'),
      color: 'var(--ss-danger)',
      description: 'Resolve conflicts'
    },
    { 
      id: 'review-approvals', 
      label: 'Review Approvals', 
      icon: UserCheck, 
      action: () => setActiveTab('urgent'),
      color: 'var(--ss-success)',
      description: 'Pending requests'
    },
    { 
      id: 'access-groups', 
      label: 'Access Groups', 
      icon: Shield, 
      action: () => setActiveTab('insights'),
      color: 'var(--ss-info)',
      description: 'Manage groups'
    },
    { 
      id: 'run-report', 
      label: 'Run Report', 
      icon: FileText, 
      href: '/analytics',
      color: 'var(--ss-chart-3)',
      description: 'Generate report'
    },
  ];

  return (
    <AppShell title="Dashboard" subtitle="Welcome back, here's what's happening today">
      <div className="space-y-6">
        {/* Quick Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATS.map(stat => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.id}
                className="ss-stat-card hover:border-[--ss-cyan] transition-all duration-300 hover:scale-[1.02]"
                style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}
              >
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: `${stat.color}20`,
                        border: `1px solid ${stat.color}40`,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <div
                      className="flex items-center gap-1 text-xs font-medium"
                      style={{ color: stat.up ? 'var(--ss-success)' : 'var(--ss-danger)' }}
                    >
                      {stat.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {stat.change}
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold mt-4" style={{ color: 'var(--ss-text-primary)' }}>
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-sm mt-1" style={{ color: 'var(--ss-text-secondary)' }}>
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* Tabs Navigation - FIXED */}
        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'overview' | 'urgent' | 'insights')}>
          <TabsList className="grid grid-cols-3 max-w-md w-full" style={{ background: 'var(--ss-bg-elevated)' }}>
            <TabsTrigger 
              value="overview"
              className="data-[state=active]:bg-[--ss-cyan-dim] data-[state=active]:text-[--ss-cyan] text-xs sm:text-sm"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="urgent"
              className="relative data-[state=active]:bg-[--ss-cyan-dim] data-[state=active]:text-[--ss-cyan] text-xs sm:text-sm"
            >
              <BellRing className="w-4 h-4 mr-2" />
              Urgent
              {urgentCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 text-xs rounded-full w-5 h-5 flex items-center justify-center"
                  style={{ background: 'var(--ss-danger)', color: 'white' }}
                >
                  {urgentCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="insights"
              className="data-[state=active]:bg-[--ss-cyan-dim] data-[state=active]:text-[--ss-cyan] text-xs sm:text-sm"
            >
              <Gauge className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Charts Row */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* ... keep your existing overview content ... */}
              <Card
                className="lg:col-span-2"
                style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}
              >
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
                  <div>
                    <CardTitle style={{ color: 'var(--ss-text-primary)' }}>Booking Trends</CardTitle>
                    <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>
                      Monthly bookings vs active resources · {totalBookings.toLocaleString()} total
                    </CardDescription>
                  </div>
                  <div
                    className="flex gap-1 p-1 rounded-lg w-full sm:w-auto"
                    style={{ background: 'var(--ss-bg-elevated)' }}
                  >
                    {(['7d', '30d'] as const).map(range => (
                      <button
                        key={range}
                        onClick={() => setChartRange(range)}
                        className={`flex-1 sm:flex-none px-3 py-1 text-xs rounded-md transition-all ${
                          chartRange === range ? '' : 'opacity-60'
                        }`}
                        style={
                          chartRange === range
                            ? { background: 'var(--ss-cyan-dim)', color: 'var(--ss-cyan)' }
                            : { color: 'var(--ss-text-secondary)' }
                        }
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px] sm:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={BOOKING_TREND}>
                        <defs>
                          <linearGradient id="gradBookings" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--ss-cyan)" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="var(--ss-cyan)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradResources" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--ss-teal)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="var(--ss-teal)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--ss-border-subtle)" />
                        <XAxis
                          dataKey="month"
                          stroke="var(--ss-text-muted)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="var(--ss-text-muted)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: 12, color: 'var(--ss-text-secondary)' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="bookings"
                          name="Bookings"
                          stroke="var(--ss-cyan)"
                          strokeWidth={2}
                          fill="url(#gradBookings)"
                        />
                        <Area
                          type="monotone"
                          dataKey="resources"
                          name="Resources"
                          stroke="var(--ss-teal)"
                          strokeWidth={2}
                          fill="url(#gradResources)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
                <CardHeader>
                  <CardTitle style={{ color: 'var(--ss-text-primary)' }}>Resource Mix</CardTitle>
                  <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>By category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px] sm:h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={CATEGORY_DATA}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {CATEGORY_DATA.map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke="var(--ss-bg-surface)" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-1 gap-1 sm:gap-2 mt-3">
                    {CATEGORY_DATA.map(c => (
                      <div key={c.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: c.color }} />
                          <span className="truncate" style={{ color: 'var(--ss-text-secondary)' }}>{c.name}</span>
                        </div>
                        <span className="font-medium flex-shrink-0" style={{ color: 'var(--ss-text-primary)' }}>
                          {c.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Weekly Activity + Stats */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
                <CardHeader>
                  <CardTitle style={{ color: 'var(--ss-text-primary)' }}>Weekly Activity</CardTitle>
                  <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>
                    Bookings per day this week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={WEEKLY_ACTIVITY}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--ss-border-subtle)" vertical={false} />
                        <XAxis
                          dataKey="day"
                          stroke="var(--ss-text-muted)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="var(--ss-text-muted)"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,212,255,0.05)' }} />
                        <Bar dataKey="count" name="Bookings" radius={[6, 6, 0, 0]}>
                          {WEEKLY_ACTIVITY.map((_, i) => (
                            <Cell key={i} fill="var(--ss-cyan)" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
                <CardHeader>
                  <CardTitle style={{ color: 'var(--ss-text-primary)' }}>Resource Utilisation</CardTitle>
                  <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>
                    Current usage by category
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {utilisation.map((u) => (
                    <div key={u.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span style={{ color: 'var(--ss-text-secondary)' }}>{u.name}</span>
                        <span className="font-semibold" style={{ color: 'var(--ss-text-primary)' }}>{u.pct}%</span>
                      </div>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ background: 'var(--ss-bg-elevated)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${u.pct}%`, background: 'var(--ss-cyan)' }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t" style={{ borderColor: 'var(--ss-border)' }}>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--ss-text-secondary)' }}>Overall</span>
                      <span className="font-bold" style={{ color: 'var(--ss-cyan)' }}>70%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
                <CardHeader>
                  <CardTitle style={{ color: 'var(--ss-text-primary)' }} className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" style={{ color: 'var(--ss-success)' }} />
                    Check-in Status
                  </CardTitle>
                  <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>
                    {checkInStats.checkedIn} checked in · {checkInStats.pending} pending
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {activeBookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="p-3 rounded-lg"
                        style={{
                          background: booking.checkedIn
                            ? 'var(--ss-success-dim)'
                            : booking.graceTime > 0
                            ? 'var(--ss-warning-dim)'
                            : 'var(--ss-danger-dim)',
                          border: `1px solid ${
                            booking.checkedIn
                              ? 'var(--ss-success)'
                              : booking.graceTime > 0
                              ? 'var(--ss-warning)'
                              : 'var(--ss-danger)'
                          }`,
                        }}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--ss-text-primary)' }}>
                              {booking.resource}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>
                              {booking.user} · {booking.startTime} - {booking.endTime}
                            </p>
                            {!booking.checkedIn && booking.graceTime > 0 && (
                              <p className="text-xs" style={{ color: 'var(--ss-warning)' }}>
                                Grace period: {booking.graceTime} min remaining
                              </p>
                            )}
                            {!booking.checkedIn && booking.graceTime === 0 && (
                              <p className="text-xs" style={{ color: 'var(--ss-danger)' }}>
                                Grace period expired
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 w-full sm:w-auto">
                            {!booking.checkedIn ? (
                              <>
                                <Button
                                  size="sm"
                                  className="h-7 px-3 text-xs flex-1 sm:flex-none"
                                  style={{ background: 'var(--ss-success)', color: 'white' }}
                                  onClick={() => handleCheckIn(booking.id)}
                                >
                                  Check In
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs flex-1 sm:flex-none"
                                  style={{ borderColor: 'var(--ss-danger)', color: 'var(--ss-danger)' }}
                                  onClick={() => handleAutoRelease(booking.id)}
                                >
                                  <XCircle className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <Badge style={{ background: 'var(--ss-success)', color: 'white' }}>
                                Checked In
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {activeBookings.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>No active bookings</p>
                      </div>
                    )}
                    {activeBookings.length > 3 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        style={{ color: 'var(--ss-cyan)' }}
                        onClick={() => {/* Show all bookings dialog */}}
                      >
                        View all {activeBookings.length} bookings
                      </Button>
                    )}
                    <div className="flex flex-wrap items-center justify-between text-xs pt-2 border-t gap-2" style={{ borderColor: 'var(--ss-border)' }}>
                      <span style={{ color: 'var(--ss-text-muted)' }}>
                        <span className="text-green-500">●</span> {checkInStats.checkedIn} checked in
                      </span>
                      <span style={{ color: 'var(--ss-text-muted)' }}>
                        <span className="text-yellow-500">●</span> {checkInStats.pending} pending
                      </span>
                      <span style={{ color: 'var(--ss-text-muted)' }}>
                        <span className="text-red-500">●</span> {checkInStats.expired} expired
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Recent Activity - Full Width */}
            <section className="grid grid-cols-1 gap-4">
              <Card
                className="lg:col-span-3"
                style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}
              >
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" style={{ color: 'var(--ss-cyan)' }} />
                    <CardTitle style={{ color: 'var(--ss-text-primary)' }}>Recent Activity</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs flex items-center gap-1 w-full sm:w-auto"
                    style={{ color: 'var(--ss-cyan)' }}
                    onClick={() => setShowRecentActivityDialog(true)}
                  >
                    View all <ArrowRight className="w-3 h-3" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {ACTIVITY.slice(0, 4).map((a) => {
                      const style = ACTIVITY_STYLE[a.type] || ACTIVITY_STYLE.booking;
                      const Icon = style.icon;
                      return (
                        <div
                          key={a.id}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-white/5"
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{
                              background: `${style.color}20`,
                              border: `1px solid ${style.color}40`,
                            }}
                          >
                            <Icon className="w-4 h-4" style={{ color: style.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate" style={{ color: 'var(--ss-text-primary)' }}>
                              <span className="font-medium">{a.user}</span>{' '}
                              <span style={{ color: 'var(--ss-text-muted)' }}>{a.action}</span>{' '}
                              <span className="font-medium">{a.target}</span>
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--ss-text-muted)' }}>{a.time}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          {/* Urgent Tab */}
          <TabsContent value="urgent" className="space-y-6 mt-6">
            {/* Quick Actions Section */}
            <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle style={{ color: 'var(--ss-text-primary)' }} className="flex items-center gap-2">
                      <Zap className="w-5 h-5" style={{ color: 'var(--ss-warning)' }} />
                      Quick Actions
                    </CardTitle>
                    <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>
                      Common admin tasks
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {quickActions.map((qa) => {
                    const Icon = qa.icon;

                    const buttonContent = (
                      <Button
                        variant="outline"
                        className="w-full h-auto py-3 px-2 flex flex-col items-center gap-1.5 border-[--ss-border] hover:border-[--ss-cyan] transition-all duration-200 hover:scale-[1.02] group"
                        style={{ 
                          background: 'var(--ss-bg-elevated)',
                          color: 'var(--ss-text-secondary)'
                        }}
                        onClick={qa.action}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors group-hover:bg-opacity-20"
                          style={{ 
                            background: `${qa.color}15`,
                            border: `1px solid ${qa.color}30`,
                          }}
                        >
                          <Icon 
                            className="w-4 h-4 transition-transform group-hover:scale-110" 
                            style={{ color: qa.color }} 
                          />
                        </div>
                        <span className="text-[10px] sm:text-xs font-medium text-center leading-tight">
                          {qa.label}
                        </span>
                        <span className="text-[8px] sm:text-[10px] opacity-60 text-center leading-tight hidden sm:block">
                          {qa.description}
                        </span>
                      </Button>
                    );

                    if (qa.href) {
                      return (
                        <Link key={qa.id} href={qa.href} className="w-full">
                          {buttonContent}
                        </Link>
                      );
                    }

                    return (
                      <div key={qa.id} className="w-full">
                        {buttonContent}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Conflicts Section */}
            <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                <div>
                  <CardTitle style={{ color: 'var(--ss-text-primary)' }} className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" style={{ color: 'var(--ss-danger)' }} />
                    Active Conflicts
                  </CardTitle>
                  <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>
                    {conflictStats.unresolved} unresolved · {conflictStats.critical} critical
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConflictDetails(!showConflictDetails)}
                    style={{ color: 'var(--ss-cyan)' }}
                    className="flex-1 sm:flex-none"
                  >
                    {showConflictDetails ? 'Less' : 'More'}
                  </Button>
                  <Button
                    size="sm"
                    style={{ background: 'var(--ss-danger)', color: 'white' }}
                    className="flex-1 sm:flex-none"
                    onClick={handleRefresh}
                  >
                    Resolve All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conflicts
                    .filter(c => c.status === 'unresolved' || c.status === 'in-review')
                    .slice(0, showConflictDetails ? 3 : 2)
                    .map((conflict) => (
                      <div
                        key={conflict.id}
                        className="p-4 rounded-lg border-l-4"
                        style={{
                          background: 'var(--ss-bg-elevated)',
                          borderColor: conflict.priority === 'critical' ? 'var(--ss-danger)' :
                                      conflict.priority === 'high' ? 'var(--ss-warning)' : 'var(--ss-info)'
                        }}
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-semibold truncate" style={{ color: 'var(--ss-text-primary)' }}>
                                  {conflict.resource}
                                </p>
                                <span
                                  className="text-xs px-2 py-0.5 rounded flex-shrink-0"
                                  style={{
                                    background: conflict.priority === 'critical' ? 'var(--ss-danger)' :
                                               conflict.priority === 'high' ? 'var(--ss-warning)' : 'var(--ss-info)',
                                    color: 'white'
                                  }}
                                >
                                  {conflict.priority}
                                </span>
                              </div>
                              <p className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>
                                {conflict.date} · {conflict.time}
                              </p>
                              <p className="text-xs mt-1" style={{ color: 'var(--ss-text-secondary)' }}>
                                {conflict.users.join(' vs ')}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1 flex-shrink-0 w-full sm:w-auto">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-3 flex-1 sm:flex-none"
                                style={{ color: 'var(--ss-success)' }}
                                onClick={() => handleResolveConflict(conflict.id, 'approve')}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-3 flex-1 sm:flex-none"
                                style={{ color: 'var(--ss-danger)' }}
                                onClick={() => handleResolveConflict(conflict.id, 'deny')}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Deny
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-3 flex-1 sm:flex-none"
                                style={{ color: 'var(--ss-warning)' }}
                                onClick={() => {
                                  setSelectedConflict(conflict);
                                  setShowOverrideDialog(true);
                                }}
                              >
                                <Shield className="w-4 h-4 mr-1" />
                                Override
                              </Button>
                            </div>
                          </div>

                          {/* Alternatives */}
                          <div className="pt-2 border-t" style={{ borderColor: 'var(--ss-border)' }}>
                            <button
                              className="text-xs flex items-center gap-1 hover:underline"
                              style={{ color: 'var(--ss-cyan)' }}
                              onClick={() => setShowAlternatives(showAlternatives === conflict.id ? null : conflict.id)}
                            >
                              {showAlternatives === conflict.id ? 'Hide' : 'Show'} alternative slots
                              {showAlternatives === conflict.id ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                            {showAlternatives === conflict.id && conflict.alternatives && (
                              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                                {conflict.alternatives.map((alt, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 rounded text-xs"
                                    style={{
                                      background: alt.available
                                        ? 'var(--ss-bg-elevated)'
                                        : 'var(--ss-danger-dim)',
                                      border: `1px solid ${
                                        alt.available ? 'var(--ss-border)' : 'var(--ss-danger)'
                                      }`,
                                    }}
                                  >
                                    <span style={{ color: 'var(--ss-text-secondary)' }}>{alt.time}</span>
                                    {alt.available ? (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-xs"
                                        style={{ color: 'var(--ss-cyan)' }}
                                        onClick={() => handleResolveConflict(conflict.id, 'approve', alt.time)}
                                      >
                                        Book
                                      </Button>
                                    ) : (
                                      <span className="text-xs" style={{ color: 'var(--ss-danger)' }}>
                                        Unavailable
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                  {conflicts.filter(c => c.status === 'unresolved').length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--ss-success)' }} />
                      <p className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>No active conflicts</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--ss-text-muted)' }}>All clear!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Approvals Section */}
            <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                <div>
                  <CardTitle style={{ color: 'var(--ss-text-primary)' }} className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5" style={{ color: 'var(--ss-warning)' }} />
                    Pending Approvals
                  </CardTitle>
                  <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>
                    {approvalStats.total} requests · {approvalStats.highPriority} high priority
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    style={{ borderColor: 'var(--ss-border)', color: 'var(--ss-cyan)' }}
                    className="flex-1 sm:flex-none"
                    onClick={() => pendingApprovals.forEach(a => handleAutoApprove(a.id))}
                  >
                    Auto-Approve All
                  </Button>
                  <Link href="/approvals" className="flex-1 sm:flex-none">
                    <Button size="sm" variant="outline" className="w-full" style={{ borderColor: 'var(--ss-border)' }}>
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingApprovals.map((approval) => (
                    <div
                      key={approval.id}
                      className="p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      style={{ background: 'var(--ss-bg-elevated)', border: '1px solid var(--ss-border)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium" style={{ color: 'var(--ss-text-primary)' }}>
                            {approval.requester}
                          </p>
                          {approval.priority === 'high' && (
                            <span className="text-xs px-2 py-0.5 rounded" style={{
                              background: 'var(--ss-warning)',
                              color: 'white'
                            }}>
                              Urgent
                            </span>
                          )}
                          {approval.autoApprove && (
                            <span className="text-xs px-2 py-0.5 rounded" style={{
                              background: 'var(--ss-success)',
                              color: 'white'
                            }}>
                              Auto-Approve
                            </span>
                          )}
                        </div>
                        <p className="text-sm" style={{ color: 'var(--ss-text-primary)' }}>
                          {approval.resource}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>
                          {approval.date} · {approval.time} · {approval.attendees} attendees
                        </p>
                        <p className="text-xs mt-1 truncate" style={{ color: 'var(--ss-text-secondary)' }}>
                          {approval.purpose}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--ss-text-muted)' }}>
                          Submitted {approval.submitted}
                          {approval.autoApprove && ' · Will auto-approve in 24 hours'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1 flex-shrink-0 w-full sm:w-auto">
                        <Button
                          size="sm"
                          className="h-8 px-4 flex-1 sm:flex-none"
                          style={{ background: 'var(--ss-success)', color: 'white' }}
                          onClick={() => handleApprovalAction(approval.id, 'approve')}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-4 flex-1 sm:flex-none"
                          style={{ borderColor: 'var(--ss-border)', color: 'var(--ss-text-secondary)' }}
                          onClick={() => handleApprovalAction(approval.id, 'deny')}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Deny
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-3 flex-1 sm:flex-none"
                          style={{ color: 'var(--ss-cyan)' }}
                          onClick={() => handleAutoApprove(approval.id)}
                        >
                          <Timer className="w-3 h-3 mr-1" />
                          Auto
                        </Button>
                      </div>
                    </div>
                  ))}

                  {pendingApprovals.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--ss-success)' }} />
                      <p className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>No pending approvals</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--ss-text-muted)' }}>All requests processed</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* No-Show Tracking */}
            <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                <div>
                  <CardTitle style={{ color: 'var(--ss-text-primary)' }} className="flex items-center gap-2">
                    <UserX className="w-5 h-5" style={{ color: 'var(--ss-danger)' }} />
                    No-Show Tracking
                  </CardTitle>
                  <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>
                    {noShowStats.total} no-shows this month · {noShowStats.avgRate}% avg rate
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNoShowDetailsDialog(true)}
                    style={{ color: 'var(--ss-cyan)' }}
                    className="flex-1 sm:flex-none"
                  >
                    Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNoShowDigest(true)}
                    style={{ borderColor: 'var(--ss-border)', color: 'var(--ss-cyan)' }}
                    className="flex-1 sm:flex-none"
                  >
                    <BarChart3 className="w-3 h-3 mr-1" />
                    Weekly Digest
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {noShowData.slice(0, 2).map((item) => (
                    <div key={item.resource} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate" style={{ color: 'var(--ss-text-primary)' }}>
                            {item.resource}
                          </span>
                          {item.trend === 'up' ? (
                            <TrendingUp className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--ss-danger)' }} />
                          ) : (
                            <TrendingDown className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--ss-success)' }} />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--ss-text-muted)' }}>
                          <span>{item.noShows} no-shows</span>
                          <span>·</span>
                          <span>{item.totalBookings} bookings</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span
                          className="text-sm font-semibold"
                          style={{
                            color: item.rate > 15 ? 'var(--ss-danger)' :
                                   item.rate > 10 ? 'var(--ss-warning)' : 'var(--ss-success)'
                          }}
                        >
                          {item.rate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6 mt-6">
            {/* Access Groups */}
            <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                <div>
                  <CardTitle style={{ color: 'var(--ss-text-primary)' }} className="flex items-center gap-2">
                    <Shield className="w-5 h-5" style={{ color: 'var(--ss-cyan)' }} />
                    Access Groups
                  </CardTitle>
                  <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>
                    Control resource visibility and permissions
                  </CardDescription>
                </div>
                <Link href="/access-groups" className="w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    style={{ borderColor: 'var(--ss-border)', color: 'var(--ss-cyan)' }}
                    className="w-full sm:w-auto"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    New Group
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accessGroups.map((group) => (
                    <div
                      key={group.id}
                      className="p-4 rounded-lg"
                      style={{ background: 'var(--ss-bg-elevated)', border: '1px solid var(--ss-border)' }}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--ss-text-primary)' }}>
                            {group.name}
                          </p>
                          <Badge
                            className="text-xs flex-shrink-0"
                            style={{
                              background: group.visibility === 'private'
                                ? 'var(--ss-danger-dim)'
                                : 'var(--ss-success-dim)',
                              color: group.visibility === 'private'
                                ? 'var(--ss-danger)'
                                : 'var(--ss-success)',
                            }}
                          >
                            {group.visibility}
                          </Badge>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2"
                            onClick={() => toggleGroupVisibility(group.id)}
                          >
                            {visibleGroups[group.id] ? (
                              <Eye className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2"
                            onClick={() => handleEditGroup(group)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {visibleGroups[group.id] && (
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs" style={{ color: 'var(--ss-text-muted)' }}>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {group.resources.length} resources
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {group.users} users
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Calendar Integration */}
            <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--ss-text-primary)' }} className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" style={{ color: 'var(--ss-cyan)' }} />
                  Calendar Integration
                </CardTitle>
                <CardDescription style={{ color: 'var(--ss-text-secondary)' }}>
                  Google/Outlook sync health
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {CALENDAR_SYNC_STATUS.map((provider) => (
                    <div
                      key={provider.provider}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg gap-2"
                      style={{ background: 'var(--ss-bg-elevated)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            provider.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--ss-text-primary)' }}>
                            {provider.provider}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>
                            {provider.users} users · Last sync: {provider.lastSync}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          provider.status === 'connected'
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-red-500/20 text-red-500'
                        }`}
                      >
                        {provider.status === 'connected' ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  ))}

                  <div
                    className="p-3 rounded-lg text-xs mt-3"
                    style={{
                      background: 'var(--ss-warning-dim)',
                      border: '1px solid var(--ss-warning)',
                    }}
                  >
                    <p style={{ color: 'var(--ss-warning)' }} className="flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" />
                      <span>v1 Limitation: External calendar busy/free data not synced</span>
                    </p>
                    <p className="mt-1" style={{ color: 'var(--ss-text-muted)' }}>
                      This feature is coming in v1.1 to prevent double-booking with external meetings.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    style={{ borderColor: 'var(--ss-border)', color: 'var(--ss-text-secondary)' }}
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-3 h-3 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Syncing...' : 'Sync All Calendars'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Snapshot */}
            <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" style={{ color: 'var(--ss-cyan)' }} />
                  <CardTitle style={{ color: 'var(--ss-text-primary)' }}>Analytics Snapshot</CardTitle>
                </div>
                <Link href="/analytics" className="w-full sm:w-auto">
                  <Button size="sm" variant="ghost" style={{ color: 'var(--ss-cyan)' }} className="w-full sm:w-auto">
                    View Full Analytics <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg" style={{ background: 'var(--ss-bg-elevated)' }}>
                    <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--ss-cyan)' }}>72%</p>
                    <p className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>Utilisation</p>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ background: 'var(--ss-bg-elevated)' }}>
                    <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--ss-teal)' }}>3PM</p>
                    <p className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>Peak Hour</p>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ background: 'var(--ss-bg-elevated)' }}>
                    <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--ss-warning)' }}>22%</p>
                    <p className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>Highest No-Show</p>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ background: 'var(--ss-bg-elevated)' }}>
                    <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--ss-success)' }}>37%</p>
                    <p className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>Top Category</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <NoShowDigestDialog 
          open={showNoShowDigest} 
          onOpenChange={setShowNoShowDigest} 
        />

        <NoShowDetailsDialog
          open={showNoShowDetailsDialog}
          onOpenChange={setShowNoShowDetailsDialog}
        />

        <AccessGroupEditDialog
          group={selectedGroup}
          open={showGroupEditDialog}
          onOpenChange={setShowGroupEditDialog}
          onSave={handleSaveGroup}
        />

        <RecentActivityDialog
          open={showRecentActivityDialog}
          onOpenChange={setShowRecentActivityDialog}
        />

        {/* Admin Override Dialog */}
        <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
          <DialogContent
            className="sm:max-w-md max-w-[95vw]"
            style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--ss-text-primary)' }}>Admin Override</DialogTitle>
              <DialogDescription style={{ color: 'var(--ss-text-secondary)' }}>
                Override this conflict and notify the displaced booker.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                  Conflict Details
                </Label>
                {selectedConflict && (
                  <div className="mt-1 p-3 rounded-lg" style={{ background: 'var(--ss-bg-elevated)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--ss-text-primary)' }}>
                      {selectedConflict.resource}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>
                      {selectedConflict.date} · {selectedConflict.time}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--ss-text-secondary)' }}>
                      Conflict between: {selectedConflict.users.join(' and ')}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                  Override Reason
                </Label>
                <Textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why this override is necessary..."
                  className="mt-1.5 bg-[--ss-bg-elevated] border-[--ss-border]"
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--ss-text-muted)' }}>
                <AlertTriangle className="w-3 h-3" style={{ color: 'var(--ss-warning)' }} />
                <span>The displaced booker will be notified via email</span>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowOverrideDialog(false)}
                className="border-[--ss-border] text-[--ss-text-secondary] w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdminOverride}
                className="bg-[--ss-danger] text-white hover:opacity-90 w-full sm:w-auto"
                disabled={!overrideReason.trim()}
              >
                <Shield className="w-4 h-4 mr-2" />
                Override Conflict
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}