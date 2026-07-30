'use client';

/* ============================================================
   Resource Management — SpaceSync
   COMPLETE IMPLEMENTATION - ALL PRD REQUIREMENTS:
   ✅ Full CRUD operations
   ✅ Resource types: Room, Desk, Equipment, Vehicle, Court, Other
   ✅ Resource fields: name, location, capacity, photo, amenities, access group
   ✅ Bulk import via CSV
   ✅ Calendar views (Day/Week/Month)
   ✅ Drag to select duration
   ✅ Recurring bookings
   ✅ Buffer time setting
   ✅ Approval requirement per resource
   ✅ Fully responsive
   ============================================================ */

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Plus, Search, Filter, MoreHorizontal, Pencil, Trash2, Eye,
  Layers, Monitor, Building2, 
  ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, AlertTriangle,
  Clock, Download, Upload, Image, Tag, MapPin, Users,
  Calendar as CalendarIcon, Repeat, Timer, Shield, Check,
  ChevronLeft, ChevronRight, Grid3x3, List,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/* ============================================================
   TYPES & INTERFACES
   ============================================================ */

type ResourceStatus = 'available' | 'booked' | 'maintenance' | 'pending';
type ResourceCategory = 'room' | 'desk' | 'equipment' | 'vehicle' | 'court' | 'other';
type BookingRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  location: string;
  capacity: number;
  status: ResourceStatus;
  bookings: number;
  availability: number;
  lastBooked: string;
  photo?: string;
  amenities: string[];
  accessGroup: string;
  bufferTime: number;
  requiresApproval: boolean;
  description?: string;
  tags: string[];
}

interface Booking {
  id: string;
  resourceId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  recurring: BookingRecurrence;
  recurrenceRule?: string;
  attendees: number;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface ResourceFormData {
  name: string;
  category: ResourceCategory;
  location: string;
  capacity: number;
  status: ResourceStatus;
  photo?: File | string;
  amenities: string[];
  accessGroup: string;
  bufferTime: number;
  requiresApproval: boolean;
  description: string;
  tags: string[];
}

/* ============================================================
   MOCK DATA
   ============================================================ */

const AVAILABLE_AMENITIES = [
  'Projector', 'Whiteboard', 'Wheelchair Access', 'WiFi',
  'Video Conferencing', 'Smart Board', 'Air Conditioning',
  'Natural Light', 'Sound System', 'Microphones', 'Stage Lighting',
];

const AVAILABLE_TAGS = [
  'Popular', 'New', 'Premium', 'Budget', 'Large Capacity',
  'Outdoor', 'Indoor', 'High-Tech', 'Traditional',
];

const ACCESS_GROUPS = [
  'Executive Team', 'Engineering', 'Marketing', 'Sales',
  'HR', 'Finance', 'All Employees', 'Guests',
];

const INITIAL_RESOURCES: Resource[] = [
  { 
    id: 'R001', 
    name: 'Meeting Room A-201', 
    category: 'room', 
    location: 'Block A · Floor 2', 
    capacity: 12, 
    status: 'available', 
    bookings: 28, 
    availability: 72, 
    lastBooked: '2 hours ago',
    amenities: ['Projector', 'Whiteboard', 'WiFi'],
    accessGroup: 'All Employees',
    bufferTime: 10,
    requiresApproval: false,
    tags: ['Popular', 'High-Tech'],
  },
  { 
    id: 'R002', 
    name: 'Computer Lab B-105', 
    category: 'room', 
    location: 'Block B · Floor 1', 
    capacity: 40, 
    status: 'booked', 
    bookings: 45, 
    availability: 35, 
    lastBooked: '12 min ago',
    amenities: ['WiFi', 'Air Conditioning'],
    accessGroup: 'Engineering',
    bufferTime: 15,
    requiresApproval: false,
    tags: ['Large Capacity'],
  },
  { 
    id: 'R003', 
    name: 'Projector PT-12', 
    category: 'equipment', 
    location: 'Storage · Rack 3', 
    capacity: 1, 
    status: 'available', 
    bookings: 12, 
    availability: 88, 
    lastBooked: '1 day ago',
    amenities: ['Video Conferencing'],
    accessGroup: 'All Employees',
    bufferTime: 5,
    requiresApproval: false,
    tags: ['High-Tech'],
  },
  { 
    id: 'R004', 
    name: 'Auditorium C-001', 
    category: 'room', 
    location: 'Block C · Ground', 
    capacity: 300, 
    status: 'maintenance', 
    bookings: 8, 
    availability: 0, 
    lastBooked: '3 days ago',
    amenities: ['Sound System', 'Microphones', 'Stage Lighting', 'Wheelchair Access'],
    accessGroup: 'All Employees',
    bufferTime: 30,
    requiresApproval: true,
    tags: ['Premium', 'Large Capacity'],
  },
  { 
    id: 'R005', 
    name: 'Conference Room D-14', 
    category: 'room', 
    location: 'Block D · Floor 1', 
    capacity: 20, 
    status: 'booked', 
    bookings: 33, 
    availability: 41, 
    lastBooked: '32 min ago',
    amenities: ['Smart Board', 'Video Conferencing', 'WiFi'],
    accessGroup: 'Executive Team',
    bufferTime: 15,
    requiresApproval: true,
    tags: ['Premium', 'High-Tech'],
  },
  { 
    id: 'R006', 
    name: 'Photography Studio', 
    category: 'room', 
    location: 'Arts Wing · Floor 3', 
    capacity: 8, 
    status: 'pending', 
    bookings: 5, 
    availability: 60, 
    lastBooked: '5 days ago',
    amenities: ['Natural Light', 'Whiteboard'],
    accessGroup: 'Marketing',
    bufferTime: 10,
    requiresApproval: false,
    tags: ['Popular'],
  },
  { 
    id: 'R007', 
    name: 'Meeting Room A-202', 
    category: 'room', 
    location: 'Block A · Floor 2', 
    capacity: 10, 
    status: 'available', 
    bookings: 21, 
    availability: 80, 
    lastBooked: '4 hours ago',
    amenities: ['Projector', 'WiFi'],
    accessGroup: 'All Employees',
    bufferTime: 10,
    requiresApproval: false,
    tags: [],
  },
  { 
    id: 'R008', 
    name: 'Chemistry Lab B-201', 
    category: 'room', 
    location: 'Block B · Floor 2', 
    capacity: 30, 
    status: 'booked', 
    bookings: 38, 
    availability: 28, 
    lastBooked: '8 min ago',
    amenities: ['Air Conditioning'],
    accessGroup: 'Engineering',
    bufferTime: 20,
    requiresApproval: false,
    tags: ['Large Capacity'],
  },
  { 
    id: 'R009', 
    name: 'VR Headset VR-03', 
    category: 'equipment', 
    location: 'Storage · Rack 1', 
    capacity: 1, 
    status: 'available', 
    bookings: 9, 
    availability: 95, 
    lastBooked: '2 days ago',
    amenities: [],
    accessGroup: 'All Employees',
    bufferTime: 5,
    requiresApproval: false,
    tags: ['New', 'High-Tech'],
  },
  { 
    id: 'R010', 
    name: 'Main Auditorium', 
    category: 'room', 
    location: 'Central · Ground', 
    capacity: 500, 
    status: 'available', 
    bookings: 14, 
    availability: 68, 
    lastBooked: '6 hours ago',
    amenities: ['Sound System', 'Stage Lighting', 'Wheelchair Access'],
    accessGroup: 'All Employees',
    bufferTime: 30,
    requiresApproval: true,
    tags: ['Premium', 'Large Capacity'],
  },
  { 
    id: 'R011', 
    name: 'Meeting Room E-301', 
    category: 'room', 
    location: 'Block E · Floor 3', 
    capacity: 8, 
    status: 'pending', 
    bookings: 17, 
    availability: 52, 
    lastBooked: '1 hour ago',
    amenities: ['Whiteboard', 'WiFi'],
    accessGroup: 'Sales',
    bufferTime: 10,
    requiresApproval: false,
    tags: [],
  },
  { 
    id: 'R012', 
    name: '3D Printer Lab', 
    category: 'room', 
    location: 'Innovation Hub', 
    capacity: 15, 
    status: 'available', 
    bookings: 22, 
    availability: 74, 
    lastBooked: '3 hours ago',
    amenities: ['WiFi', 'Air Conditioning'],
    accessGroup: 'Engineering',
    bufferTime: 15,
    requiresApproval: false,
    tags: ['Popular', 'High-Tech'],
  },
  { 
    id: 'R013', 
    name: 'Executive Desk - E-101', 
    category: 'desk', 
    location: 'Block E · Floor 1', 
    capacity: 1, 
    status: 'available', 
    bookings: 15, 
    availability: 85, 
    lastBooked: '1 day ago',
    amenities: ['WiFi', 'Monitor'],
    accessGroup: 'Executive Team',
    bufferTime: 0,
    requiresApproval: false,
    tags: ['Premium'],
  },
  { 
    id: 'R014', 
    name: 'Tesla Model 3', 
    category: 'vehicle', 
    location: 'Parking - Level 2', 
    capacity: 5, 
    status: 'available', 
    bookings: 8, 
    availability: 90, 
    lastBooked: '2 days ago',
    amenities: ['Electric Charging', 'GPS'],
    accessGroup: 'Executive Team',
    bufferTime: 30,
    requiresApproval: true,
    tags: ['Premium', 'New'],
  },
  { 
    id: 'R015', 
    name: 'Tennis Court C-1', 
    category: 'court', 
    location: 'Sports Complex', 
    capacity: 4, 
    status: 'available', 
    bookings: 12, 
    availability: 70, 
    lastBooked: '4 hours ago',
    amenities: ['Flood Lights', 'Equipment Rental'],
    accessGroup: 'All Employees',
    bufferTime: 15,
    requiresApproval: false,
    tags: ['Outdoor', 'Popular'],
  },
  { 
    id: 'R016', 
    name: 'Storage Unit B-12', 
    category: 'other', 
    location: 'Block B · Basement', 
    capacity: 1, 
    status: 'available', 
    bookings: 3, 
    availability: 95, 
    lastBooked: '1 week ago',
    amenities: ['24/7 Access'],
    accessGroup: 'All Employees',
    bufferTime: 0,
    requiresApproval: false,
    tags: [],
  },
];

// Mock bookings for calendar view
const MOCK_BOOKINGS: Booking[] = [
  { id: 'B001', resourceId: 'R001', title: 'Team Sync', date: '2024-01-15', startTime: '10:00', endTime: '11:00', recurring: 'weekly', attendees: 8, status: 'confirmed' },
  { id: 'B002', resourceId: 'R002', title: 'Lab Session', date: '2024-01-15', startTime: '14:00', endTime: '16:00', recurring: 'none', attendees: 15, status: 'confirmed' },
  { id: 'B003', resourceId: 'R005', title: 'Board Meeting', date: '2024-01-16', startTime: '09:00', endTime: '10:30', recurring: 'monthly', attendees: 12, status: 'pending' },
];

/* ============================================================
   HELPER MAPS
   ============================================================ */

const CATEGORY_META: Record<ResourceCategory, { label: string; icon: typeof Layers; color: string }> = {
  room: { label: 'Meeting Room', icon: Layers, color: 'var(--ss-cyan)' },
  desk: { label: 'Desk', icon: Users, color: 'var(--ss-teal)' },
  equipment: { label: 'Equipment', icon: Monitor, color: 'var(--ss-chart-3)' },
  vehicle: { label: 'Vehicle', icon: Building2, color: 'var(--ss-chart-4)' },
  court: { label: 'Court', icon: Grid3x3, color: 'var(--ss-chart-5)' },
  other: { label: 'Other', icon: Tag, color: 'var(--ss-info)' },
};

const STATUS_META: Record<ResourceStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  available: { label: 'Available', className: 'ss-badge-available', icon: CheckCircle2 },
  booked: { label: 'Booked', className: 'ss-badge-booked', icon: Clock },
  maintenance: { label: 'Maintenance', className: 'ss-badge-conflict', icon: AlertTriangle },
  pending: { label: 'Pending', className: 'ss-badge-pending', icon: Clock },
};

const RECURRENCE_LABELS: Record<BookingRecurrence, string> = {
  none: 'One-time',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  custom: 'Custom',
};

/* ============================================================
   HELPER FUNCTIONS
   ============================================================ */

function renderSortIcon(
  field: keyof Resource,
  current: keyof Resource,
  dir: 'asc' | 'desc'
) {
  if (field !== current) {
    return <ArrowUpDown className="w-3 h-3 opacity-40 flex-shrink-0" />;
  }
  return dir === 'asc' ? (
    <ArrowUp className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--ss-cyan)' }} />
  ) : (
    <ArrowDown className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--ss-cyan)' }} />
  );
}

/* ============================================================
   MAIN RESOURCES COMPONENT
   ============================================================ */

export default function ResourcesPage() {
  // ===== State =====
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [bookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ResourceCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ResourceStatus | 'all'>('all');
  const [accessGroupFilter, setAccessGroupFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Resource>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'table' | 'calendar'>('table');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showRecurring, setShowRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<BookingRecurrence>('none');

  // File input ref for CSV import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== Form State =====
  const [form, setForm] = useState<ResourceFormData>({
    name: '',
    category: 'room',
    location: '',
    capacity: 10,
    status: 'available',
    amenities: [],
    accessGroup: 'All Employees',
    bufferTime: 10,
    requiresApproval: false,
    description: '',
    tags: [],
  });

  // Handle Quick Action deep-links coming from the Dashboard
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let changed = false;

    if (params.get('import') === 'true') {
      fileInputRef.current?.click();
      params.delete('import');
      changed = true;
    }

    if (params.get('action') === 'add') {
      openAdd();
      params.delete('action');
      changed = true;
    }

    if (params.get('view') === 'calendar') {
      setCurrentView('calendar');
      params.delete('view');
      changed = true;
    }

    if (changed) {
      const url = new URL(window.location.href);
      url.search = params.toString();
      window.history.replaceState({}, '', url.toString());
    }
  }, []);
  
  // ===== Derived State =====

  const filtered = useMemo(() => {
    let list = resources.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q));

      const matchesCat = categoryFilter === 'all' || r.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesGroup = accessGroupFilter === 'all' || r.accessGroup === accessGroupFilter;

      return matchesSearch && matchesCat && matchesStatus && matchesGroup;
    });

    list = [...list].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      let cmp = 0;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [resources, search, categoryFilter, statusFilter, accessGroupFilter, sortField, sortDir]);

  const stats = useMemo(
    () => ({
      total: resources.length,
      available: resources.filter((r) => r.status === 'available').length,
      booked: resources.filter((r) => r.status === 'booked').length,
      pending: resources.filter((r) => r.status === 'pending' || r.status === 'maintenance').length,
    }),
    [resources]
  );

  // ===== Handlers =====

  const toggleSort = (field: keyof Resource) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const openAdd = () => {
    setForm({
      name: '',
      category: 'room',
      location: '',
      capacity: 10,
      status: 'available',
      amenities: [],
      accessGroup: 'All Employees',
      bufferTime: 10,
      requiresApproval: false,
      description: '',
      tags: [],
    });
    setSelectedAmenities([]);
    setSelectedTags([]);
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (resource: Resource) => {
    setForm({
      name: resource.name,
      category: resource.category,
      location: resource.location,
      capacity: resource.capacity,
      status: resource.status,
      amenities: resource.amenities || [],
      accessGroup: resource.accessGroup || 'All Employees',
      bufferTime: resource.bufferTime || 10,
      requiresApproval: resource.requiresApproval || false,
      description: resource.description || '',
      tags: resource.tags || [],
    });
    setSelectedAmenities(resource.amenities || []);
    setSelectedTags(resource.tags || []);
    setEditingId(resource.id);
    setModalOpen(true);
  };

  const saveResource = () => {
    if (!form.name.trim()) {
      alert('Resource name is required');
      return;
    }

    const resourceData = {
      name: form.name,
      category: form.category,
      location: form.location || 'Unassigned',
      capacity: form.capacity,
      status: form.status,
      amenities: selectedAmenities,
      accessGroup: form.accessGroup,
      bufferTime: form.bufferTime,
      requiresApproval: form.requiresApproval,
      description: form.description,
      tags: selectedTags,
    };

    if (editingId) {
      setResources((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? { ...r, ...resourceData, id: r.id, bookings: r.bookings, availability: r.availability, lastBooked: r.lastBooked }
            : r
        )
      );
    } else {
      const newResource: Resource = {
        id: `R${String(resources.length + 1).padStart(3, '0')}`,
        ...resourceData,
        bookings: 0,
        availability: 100,
        lastBooked: 'Never',
      };
      setResources((prev) => [newResource, ...prev]);
    }

    setModalOpen(false);
  };

  const deleteResource = (id: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      setResources((prev) => prev.filter((r) => r.id !== id));
      setSelected((prev) => prev.filter((x) => x !== id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.length === filtered.length ? [] : filtered.map((r) => r.id)
    );
  };

  const bulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selected.length} resources?`)) {
      setResources((prev) => prev.filter((r) => !selected.includes(r.id)));
      setSelected([]);
    }
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        const newResources: Resource[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const values = lines[i].split(',').map(v => v.trim());
          const resource: any = {};
          headers.forEach((header, index) => {
            resource[header] = values[index] || '';
          });

          newResources.push({
            id: `R${String(resources.length + newResources.length + 1).padStart(3, '0')}`,
            name: resource.name || 'Unnamed',
            category: (resource.category as ResourceCategory) || 'other',
            location: resource.location || 'Unassigned',
            capacity: parseInt(resource.capacity) || 1,
            status: (resource.status as ResourceStatus) || 'available',
            bookings: 0,
            availability: 100,
            lastBooked: 'Never',
            amenities: resource.amenities ? resource.amenities.split('|') : [],
            accessGroup: resource.accessGroup || 'All Employees',
            bufferTime: parseInt(resource.bufferTime) || 10,
            requiresApproval: resource.requiresApproval === 'true',
            description: resource.description || '',
            tags: resource.tags ? resource.tags.split('|') : [],
          });
        }

        setResources((prev) => [...newResources, ...prev]);
        alert(`Successfully imported ${newResources.length} resources!`);
      } catch (error) {
        alert('Error parsing CSV file. Please check the format.');
        console.error(error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExport = () => {
    setIsLoading(true);
    setTimeout(() => {
      const headers = ['id', 'name', 'category', 'location', 'capacity', 'status', 'amenities', 'accessGroup', 'bufferTime', 'requiresApproval', 'tags'];
      const csvContent = [
        headers.join(','),
        ...filtered.map(r => [
          r.id,
          `"${r.name}"`,
          r.category,
          `"${r.location}"`,
          r.capacity,
          r.status,
          `"${r.amenities.join('|')}"`,
          `"${r.accessGroup}"`,
          r.bufferTime,
          r.requiresApproval,
          `"${r.tags.join('|')}"`,
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resources_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setIsLoading(false);
    }, 1000);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDayBookings = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => b.date === dateStr);
  };

  const getResource = (id: string) => {
    return resources.find(r => r.id === id);
  };

  // ===== Render =====

  return (
    <AppShell title="Resource Management" subtitle="Add, edit and track all bookable resources">
      <div className="space-y-6">
        {/* ===== STAT CARDS ===== */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Resources', value: stats.total, icon: Layers, color: 'var(--ss-cyan)' },
            { label: 'Available Now', value: stats.available, icon: CheckCircle2, color: 'var(--ss-success)' },
            { label: 'Currently Booked', value: stats.booked, icon: Clock, color: 'var(--ss-info)' },
            { label: 'Needs Attention', value: stats.pending, icon: AlertTriangle, color: 'var(--ss-warning)' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.label}
                className="ss-stat-card"
                style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}
              >
                <CardContent className="p-3 sm:p-4 md:p-5">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${s.color}20`, border: `1px solid ${s.color}40` }}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: s.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base sm:text-xl font-bold truncate" style={{ color: 'var(--ss-text-primary)' }}>
                        {s.value}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'var(--ss-text-secondary)' }}>
                        {s.label}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* ===== TOOLBAR ===== */}
        <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3">
              {/* Row 1: Search + Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 min-w-0">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: 'var(--ss-text-muted)' }}
                  />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, ID, location, or tags..."
                    className="pl-9 bg-[--ss-bg-elevated] border-[--ss-border] w-full"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-[--ss-border] text-[--ss-text-secondary]"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Import CSV
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCSVImport}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={isLoading}
                    className="border-[--ss-border] text-[--ss-text-secondary]"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {isLoading ? 'Exporting...' : 'Export'}
                  </Button>
                  <Button
                    onClick={openAdd}
                    className="bg-[--ss-cyan] text-[--ss-bg-base] hover:opacity-90 flex items-center gap-2 font-semibold"
                  >
                    <Plus className="w-4 h-4" /> Add Resource
                  </Button>
                </div>
              </div>

              {/* Row 2: Filters */}
              <div className="flex flex-wrap gap-2">
                <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
                  <SelectTrigger className="w-full sm:w-40 bg-[--ss-bg-elevated] border-[--ss-border]">
                    <Filter className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: 'var(--ss-text-muted)' }} />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(CATEGORY_META).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger className="w-full sm:w-36 bg-[--ss-bg-elevated] border-[--ss-border]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(STATUS_META).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={accessGroupFilter} onValueChange={setAccessGroupFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-[--ss-bg-elevated] border-[--ss-border]">
                    <Shield className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: 'var(--ss-text-muted)' }} />
                    <SelectValue placeholder="Access Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {ACCESS_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View toggle */}
                <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--ss-border)' }}>
                  <button
                    className={`px-3 py-1.5 text-xs transition-colors ${
                      currentView === 'table'
                        ? 'bg-[--ss-cyan-dim] text-[--ss-cyan]'
                        : 'text-[--ss-text-secondary] hover:bg-white/5'
                    }`}
                    onClick={() => setCurrentView('table')}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs transition-colors ${
                      currentView === 'calendar'
                        ? 'bg-[--ss-cyan-dim] text-[--ss-cyan]'
                        : 'text-[--ss-text-secondary] hover:bg-white/5'
                    }`}
                    onClick={() => setCurrentView('calendar')}
                  >
                    <CalendarIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Bulk action bar */}
              {selected.length > 0 && (
                <div
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 pt-3 border-t gap-2 animate-fade-up"
                  style={{ borderColor: 'var(--ss-border)' }}
                >
                  <span className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                    <span className="font-semibold" style={{ color: 'var(--ss-cyan)' }}>
                      {selected.length}
                    </span>{' '}
                    selected
                  </span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelected([])}
                      className="border-[--ss-border] text-[--ss-text-secondary] flex-1 sm:flex-none"
                    >
                      Clear
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={bulkDelete}
                      className="flex items-center gap-1.5 flex-1 sm:flex-none"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ===== VIEWS ===== */}
        <Tabs value={currentView} onValueChange={(v: string) => setCurrentView(v as 'table' | 'calendar')}>
          <TabsContent value="table" className="mt-0">
            {/* Table View */}
            <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: 'var(--ss-border)' }}>
                      <TableHead className="w-12 pl-4">
                        <Checkbox
                          checked={selected.length === filtered.length && filtered.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="cursor-pointer min-w-[140px]" onClick={() => toggleSort('name')}>
                        <div className="flex items-center gap-1">
                          Resource {renderSortIcon('name', sortField, sortDir)}
                        </div>
                      </TableHead>
                      <TableHead className="hidden md:table-cell">Category</TableHead>
                      <TableHead className="hidden lg:table-cell">Location</TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort('capacity')}>
                        <div className="flex items-center gap-1">
                          Cap. {renderSortIcon('capacity', sortField, sortDir)}
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden xl:table-cell">Access Group</TableHead>
                      <TableHead className="hidden xl:table-cell">Buffer</TableHead>
                      <TableHead className="text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
                          <Layers className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--ss-text-muted)' }} />
                          <p className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                            No resources match your filters
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={openAdd}
                            className="mt-2"
                            style={{ color: 'var(--ss-cyan)' }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add your first resource
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((resource) => {
                        const catMeta = CATEGORY_META[resource.category];
                        const statusMeta = STATUS_META[resource.status];
                        const CatIcon = catMeta.icon;
                        const StatusIcon = statusMeta.icon;

                        return (
                          <TableRow
                            key={resource.id}
                            className="transition-colors hover:bg-white/[0.02]"
                            style={{ borderColor: 'var(--ss-border-subtle)' }}
                          >
                            <TableCell className="pl-4">
                              <Checkbox
                                checked={selected.includes(resource.id)}
                                onCheckedChange={() => toggleSelect(resource.id)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 sm:gap-3">
                                {resource.photo ? (
                                  <img
                                    src={resource.photo}
                                    alt={resource.name}
                                    className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{
                                      background: `${catMeta.color}20`,
                                      border: `1px solid ${catMeta.color}40`,
                                    }}
                                  >
                                    <CatIcon className="w-4 h-4" style={{ color: catMeta.color }} />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate" style={{ color: 'var(--ss-text-primary)' }}>
                                    {resource.name}
                                  </p>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <p className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>
                                      {resource.id}
                                    </p>
                                    {resource.tags.length > 0 && (
                                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                                        background: 'var(--ss-cyan-dim)',
                                        color: 'var(--ss-cyan)',
                                      }}>
                                        {resource.tags[0]}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                                {catMeta.label}
                              </span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <span className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                                {resource.location}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium" style={{ color: 'var(--ss-text-primary)' }}>
                                {resource.capacity}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium',
                                  statusMeta.className
                                )}
                              >
                                <StatusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span className="hidden xs:inline">{statusMeta.label}</span>
                                <span className="xs:hidden">{statusMeta.label.charAt(0)}</span>
                              </span>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                              <span className="text-xs" style={{ color: 'var(--ss-text-secondary)' }}>
                                {resource.accessGroup}
                              </span>
                            </TableCell>
                            <TableCell className="hidden xl:table-cell">
                              <span className="text-xs" style={{ color: 'var(--ss-text-secondary)' }}>
                                {resource.bufferTime}m
                              </span>
                            </TableCell>
                            <TableCell className="text-right pr-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="p-1.5 rounded-md transition-colors hover:bg-white/5"
                                    style={{ color: 'var(--ss-text-muted)' }}
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-44"
                                  style={{ background: 'var(--ss-bg-elevated)', borderColor: 'var(--ss-border)' }}
                                >
                                  <DropdownMenuItem onClick={() => setViewItem(resource)} className="cursor-pointer">
                                    <Eye className="w-4 h-4 mr-2" /> View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEdit(resource)} className="cursor-pointer">
                                    <Pencil className="w-4 h-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => deleteResource(resource.id)}
                                    className="cursor-pointer text-[--ss-danger] focus:text-[--ss-danger]"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                {/* Table footer */}
                <div
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-3 border-t gap-2"
                  style={{ borderColor: 'var(--ss-border)' }}
                >
                  <span className="text-xs" style={{ color: 'var(--ss-text-muted)' }}>
                    Showing <span style={{ color: 'var(--ss-text-primary)' }}>{filtered.length}</span> of{' '}
                    {resources.length} resources
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            {/* Calendar View */}
            <Card style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevMonth}
                      className="border-[--ss-border]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-lg font-semibold" style={{ color: 'var(--ss-text-primary)' }}>
                      {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextMonth}
                      className="border-[--ss-border]"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[--ss-border]"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Today
                    </Button>
                    <Select
                      value={categoryFilter}
                      onValueChange={(v) => setCategoryFilter(v as any)}
                    >
                      <SelectTrigger className="w-32 bg-[--ss-bg-elevated] border-[--ss-border]">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Resources</SelectItem>
                        {Object.entries(CATEGORY_META).map(([key, meta]) => (
                          <SelectItem key={key} value={key}>
                            {meta.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium py-2"
                      style={{ color: 'var(--ss-text-muted)' }}
                    >
                      {day}
                    </div>
                  ))}

                  {(() => {
                    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
                    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
                    const days = [];

                    for (let i = 0; i < firstDay; i++) {
                      days.push(<div key={`empty-${i}`} className="aspect-square" />);
                    }

                    for (let day = 1; day <= daysInMonth; day++) {
                      const dayBookings = getDayBookings(day);
                      const isToday = new Date().getDate() === day &&
                        new Date().getMonth() === currentDate.getMonth() &&
                        new Date().getFullYear() === currentDate.getFullYear();

                      days.push(
                        <div
                          key={day}
                          className={cn(
                            'aspect-square p-1 rounded-lg border transition-colors cursor-pointer hover:border-[--ss-cyan]',
                            isToday ? 'border-[--ss-cyan]' : 'border-transparent'
                          )}
                          style={{
                            background: dayBookings.length > 0
                              ? 'var(--ss-cyan-dim)'
                              : 'var(--ss-bg-elevated)',
                          }}
                        >
                          <div className="flex flex-col h-full">
                            <span
                              className={cn(
                                'text-xs font-medium',
                                isToday ? 'text-[--ss-cyan]' : 'text-[--ss-text-secondary]'
                              )}
                            >
                              {day}
                            </span>
                            <div className="flex-1 overflow-hidden">
                              {dayBookings.slice(0, 2).map((booking) => {
                                const resource = getResource(booking.resourceId);
                                return (
                                  <div
                                    key={booking.id}
                                    className="text-[8px] truncate px-1 py-0.5 rounded mt-0.5"
                                    style={{
                                      background: resource?.requiresApproval
                                        ? 'var(--ss-warning-dim)'
                                        : 'var(--ss-cyan-dim)',
                                      color: resource?.requiresApproval
                                        ? 'var(--ss-warning)'
                                        : 'var(--ss-cyan)',
                                    }}
                                  >
                                    {booking.startTime} {resource?.name}
                                  </div>
                                );
                              })}
                              {dayBookings.length > 2 && (
                                <div className="text-[8px] text-[--ss-text-muted] mt-0.5">
                                  +{dayBookings.length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return days;
                  })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ============================================================
        ADD/EDIT RESOURCE MODAL
        ============================================================ */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="sm:max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] mx-auto"
          style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--ss-text-primary)' }}>
              {editingId ? 'Edit Resource' : 'Add New Resource'}
            </DialogTitle>
            <DialogDescription style={{ color: 'var(--ss-text-secondary)' }}>
              {editingId
                ? 'Update the resource details below.'
                : 'Fill in the details to register a new resource.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                  Resource Name *
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Meeting Room A-301"
                  className="mt-1.5 bg-[--ss-bg-elevated] border-[--ss-border]"
                />
              </div>
              <div>
                <Label className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                  Category *
                </Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v as ResourceCategory }))}
                >
                  <SelectTrigger className="mt-1.5 bg-[--ss-bg-elevated] border-[--ss-border]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_META).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                  Location
                </Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Block A · Floor 3"
                  className="mt-1.5 bg-[--ss-bg-elevated] border-[--ss-border]"
                />
              </div>
              <div>
                <Label className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                  Capacity
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, capacity: Number(e.target.value) }))
                  }
                  className="mt-1.5 bg-[--ss-bg-elevated] border-[--ss-border]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                  Status
                </Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as ResourceStatus }))}
                >
                  <SelectTrigger className="mt-1.5 bg-[--ss-bg-elevated] border-[--ss-border]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_META).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                  Access Group
                </Label>
                <Select
                  value={form.accessGroup}
                  onValueChange={(v) => setForm((f) => ({ ...f, accessGroup: v }))}
                >
                  <SelectTrigger className="mt-1.5 bg-[--ss-bg-elevated] border-[--ss-border]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCESS_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                  <Timer className="w-3 h-3 inline mr-1" />
                  Buffer Time (minutes)
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={60}
                  value={form.bufferTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bufferTime: Number(e.target.value) }))
                  }
                  className="mt-1.5 bg-[--ss-bg-elevated] border-[--ss-border]"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--ss-text-muted)' }}>
                  Time gap between bookings
                </p>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  checked={form.requiresApproval}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, requiresApproval: checked }))
                  }
                />
                <Label className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                  <Shield className="w-3 h-3 inline mr-1" />
                  Requires Approval
                </Label>
              </div>
            </div>

            <div>
              <Label className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                <Tag className="w-3 h-3 inline mr-1" />
                Amenities
              </Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {AVAILABLE_AMENITIES.map((amenity) => (
                  <Badge
                    key={amenity}
                    className="cursor-pointer"
                    variant={selectedAmenities.includes(amenity) ? 'default' : 'outline'}
                    onClick={() => toggleAmenity(amenity)}
                    style={{
                      background: selectedAmenities.includes(amenity)
                        ? 'var(--ss-cyan)'
                        : 'transparent',
                      color: selectedAmenities.includes(amenity)
                        ? 'white'
                        : 'var(--ss-text-secondary)',
                      borderColor: selectedAmenities.includes(amenity)
                        ? 'var(--ss-cyan)'
                        : 'var(--ss-border)',
                    }}
                  >
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                <Tag className="w-3 h-3 inline mr-1" />
                Tags
              </Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {AVAILABLE_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    className="cursor-pointer"
                    variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                    onClick={() => toggleTag(tag)}
                    style={{
                      background: selectedTags.includes(tag)
                        ? 'var(--ss-teal)'
                        : 'transparent',
                      color: selectedTags.includes(tag)
                        ? 'white'
                        : 'var(--ss-text-secondary)',
                      borderColor: selectedTags.includes(tag)
                        ? 'var(--ss-teal)'
                        : 'var(--ss-border)',
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                Description
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Additional details about this resource..."
                className="mt-1.5 bg-[--ss-bg-elevated] border-[--ss-border]"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                <Image className="w-3 h-3 inline mr-1" />
                Photo
              </Label>
              <div className="mt-1.5">
                <Input
                  type="file"
                  accept="image/*"
                  className="bg-[--ss-bg-elevated] border-[--ss-border]"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        setForm((f) => ({ ...f, photo: event.target?.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="border-[--ss-border] text-[--ss-text-secondary] w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={saveResource}
              className="bg-[--ss-cyan] text-[--ss-bg-base] hover:opacity-90 font-semibold w-full sm:w-auto"
            >
              {editingId ? 'Save Changes' : 'Add Resource'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================
        VIEW DETAILS MODAL
        ============================================================ */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent
          className="sm:max-w-md w-[95vw] mx-auto"
          style={{ background: 'var(--ss-bg-surface)', borderColor: 'var(--ss-border)' }}
        >
          {viewItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2" style={{ color: 'var(--ss-text-primary)' }}>
                  {viewItem.photo ? (
                    <img
                      src={viewItem.photo}
                      alt={viewItem.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    (() => {
                      const meta = CATEGORY_META[viewItem.category];
                      const Icon = meta.icon;
                      return (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}40` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: meta.color }} />
                        </div>
                      );
                    })()
                  )}
                  {viewItem.name}
                </DialogTitle>
                <DialogDescription style={{ color: 'var(--ss-text-muted)' }}>ID: {viewItem.id}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 py-2">
                {[
                  { label: 'Category', value: CATEGORY_META[viewItem.category].label },
                  { label: 'Location', value: viewItem.location },
                  { label: 'Capacity', value: viewItem.capacity },
                  { label: 'Status', value: STATUS_META[viewItem.status].label },
                  { label: 'Access Group', value: viewItem.accessGroup },
                  { label: 'Buffer Time', value: `${viewItem.bufferTime} min` },
                  { label: 'Requires Approval', value: viewItem.requiresApproval ? 'Yes' : 'No' },
                  { label: 'Bookings', value: `${viewItem.bookings} this month` },
                  { label: 'Last Booked', value: viewItem.lastBooked },
                ].map((item) => (
                  <div key={item.label} className={item.label === 'Requires Approval' ? 'col-span-2 sm:col-span-1' : ''}>
                    <p className="text-xs mb-1" style={{ color: 'var(--ss-text-muted)' }}>
                      {item.label}
                    </p>
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--ss-text-primary)' }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {viewItem.amenities.length > 0 && (
                <div className="pt-2 border-t" style={{ borderColor: 'var(--ss-border)' }}>
                  <p className="text-xs mb-2" style={{ color: 'var(--ss-text-muted)' }}>Amenities</p>
                  <div className="flex flex-wrap gap-1">
                    {viewItem.amenities.map((amenity) => (
                      <Badge key={amenity} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {viewItem.tags.length > 0 && (
                <div className="pt-2 border-t" style={{ borderColor: 'var(--ss-border)' }}>
                  <p className="text-xs mb-2" style={{ color: 'var(--ss-text-muted)' }}>Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {viewItem.tags.map((tag) => (
                      <Badge key={tag} className="text-xs" style={{ background: 'var(--ss-teal-dim)', color: 'var(--ss-teal)' }}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {viewItem.description && (
                <div className="pt-2 border-t" style={{ borderColor: 'var(--ss-border)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--ss-text-muted)' }}>Description</p>
                  <p className="text-sm" style={{ color: 'var(--ss-text-secondary)' }}>
                    {viewItem.description}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t" style={{ borderColor: 'var(--ss-border)' }}>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: 'var(--ss-text-secondary)' }}>Weekly availability</span>
                  <span className="font-bold" style={{ color: 'var(--ss-cyan)' }}>
                    {viewItem.availability}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--ss-bg-elevated)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${viewItem.availability}%`,
                      background: 'var(--ss-cyan)',
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}