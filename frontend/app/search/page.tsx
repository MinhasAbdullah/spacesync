'use client';

import React, { useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  ChevronUp,
  Users,
  LayoutGrid,
  SlidersHorizontal,
  Tag,
  MapPin,
} from 'lucide-react';

const cards = [
  {
    id: 1,
    title: 'Country Room A',
    subtitle: 'Internal Events',
    capacity: 12,
    tag: 'Popular',
    range: '1-100',
    status: 'Confirmed',
    statusBg: '#065f46',
    statusText: '#34d399',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=700',
  },
  {
    id: 2,
    title: 'Lab 2',
    subtitle: 'Human Biology',
    capacity: 10,
    tag: 'Conferences',
    range: null,
    status: 'Upcoming',
    statusBg: '#134e4a',
    statusText: '#2dd4bf',
    image: 'https://images.unsplash.com/photo-1446776858070-70c3d5ed6758?auto=format&fit=crop&q=80&w=700',
  },
  {
    id: 3,
    title: 'Conference Hall',
    subtitle: 'Global Dept',
    capacity: 10,
    tag: 'Popular',
    range: '1-100',
    status: 'Upcoming',
    statusBg: '#134e4a',
    statusText: '#2dd4bf',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=700',
  },
  {
    id: 4,
    title: 'Town Council',
    subtitle: 'Town Center',
    capacity: 8,
    tag: 'Popular',
    range: null,
    status: 'Confirmed',
    statusBg: '#065f46',
    statusText: '#34d399',
    image: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=700',
  },
  {
    id: 5,
    title: 'Board Room 3',
    subtitle: 'Human Res.',
    capacity: 6,
    tag: 'Meetings',
    range: null,
    status: 'Upcoming',
    statusBg: '#134e4a',
    statusText: '#2dd4bf',
    image: 'https://images.unsplash.com/photo-1531973576160-7125cd663d86?auto=format&fit=crop&q=80&w=700',
  },
  {
    id: 6,
    title: 'Parking Bps-112',
    subtitle: 'External Lot',
    capacity: 2,
    tag: 'Outdoor',
    range: null,
    status: 'Unavailable',
    statusBg: '#4c0519',
    statusText: '#fb7185',
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&q=80&w=700',
  },
];

export default function SearchPage() {
  const [sliderValue, setSliderValue] = useState(80);
  const [analyticsView, setAnalyticsView] = useState(true);
  const [nextstoreOpen, setNextstoreOpen] = useState(true);
  const [activityOpen, setActivityOpen] = useState(true);
  const [checkedFeatures, setCheckedFeatures] = useState<string[]>(['Monitor', 'Whiteboard']);
  const [searchVal, setSearchVal] = useState('');

  const toggleFeature = (f: string) => {
    setCheckedFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0d1117',
        color: '#c9d1d9',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Top Title Bar ── */}
      <div
        style={{
          padding: '18px 24px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: '#00ebff22',
            border: '1px solid #00ebff55',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00ebff',
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          S
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#e6edf3' }}>Search</span>
      </div>

      {/* ── Search Bar Row ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 24px',
        }}
      >
        {/* Grid icon */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#161b27',
            border: '1px solid #1e2a3a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        >
          <LayoutGrid style={{ width: 16, height: 16, color: '#00ebff' }} />
        </div>

        {/* Search input */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Search
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 15,
              height: 15,
              color: '#4a5568',
            }}
          />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search resources..."
            style={{
              width: '100%',
              background: '#161b27',
              border: '1px solid #1e2a3a',
              borderRadius: 8,
              padding: '9px 12px 9px 36px',
              color: '#c9d1d9',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Filter icon */}
        <button
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#161b27',
            border: '1px solid #1e2a3a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <SlidersHorizontal style={{ width: 15, height: 15, color: '#6b7280' }} />
        </button>

        {/* Bell icon */}
        <button
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: '#161b27',
            border: '1px solid #1e2a3a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <Bell style={{ width: 15, height: 15, color: '#6b7280' }} />
          <span
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#00ebff',
              border: '1.5px solid #0d1117',
            }}
          />
        </button>
      </div>

      {/* ── Body: Sidebar + Main ── */}
      <div style={{ display: 'flex', flex: 1, gap: 0 }}>

        {/* ── Left Sidebar ── */}
        <aside
          style={{
            width: 220,
            flexShrink: 0,
            padding: '10px 18px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            borderRight: '1px solid #1c2230',
          }}
        >
          {/* Filters Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 600, fontSize: 14, color: '#e6edf3' }}>
              <SlidersHorizontal style={{ width: 13, height: 13, color: '#00ebff' }} />
              Filters
            </div>
            <button style={{ fontSize: 12, color: '#00ebff', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Save all
            </button>
          </div>

          {/* Building */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>Building</span>
            <div style={{ position: 'relative' }}>
              <select
                style={{
                  width: '100%',
                  background: '#161b27',
                  border: '1px solid #1e2a3a',
                  borderRadius: 7,
                  padding: '7px 28px 7px 10px',
                  color: '#9ca3af',
                  fontSize: 13,
                  appearance: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option>All Buildings</option>
                <option>Main Building</option>
                <option>Central Block</option>
              </select>
              <ChevronDown style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#4a5568', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Room Type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>Room Type</span>
            <div style={{ position: 'relative' }}>
              <select
                style={{
                  width: '100%',
                  background: '#161b27',
                  border: '1px solid #1e2a3a',
                  borderRadius: 7,
                  padding: '7px 28px 7px 10px',
                  color: '#9ca3af',
                  fontSize: 13,
                  appearance: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option>All Rooms</option>
                <option>Meeting Room</option>
                <option>Lab</option>
                <option>Sports</option>
              </select>
              <ChevronDown style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#4a5568', pointerEvents: 'none' }} />
            </div>
          </div>

          {/* Features */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>Features</span>
            <div style={{ position: 'relative' }}>
              <select
                style={{
                  width: '100%',
                  background: '#161b27',
                  border: '1px solid #1e2a3a',
                  borderRadius: 7,
                  padding: '7px 28px 7px 10px',
                  color: '#9ca3af',
                  fontSize: 13,
                  appearance: 'none',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option>All Features</option>
                <option>Projector</option>
                <option>Whiteboard</option>
                <option>AC</option>
              </select>
              <ChevronDown style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#4a5568', pointerEvents: 'none' }} />
            </div>

            {/* Slider */}
            <div style={{ paddingTop: 4 }}>
              <input
                type="range"
                min={1}
                max={100}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#00ebff',
                  cursor: 'pointer',
                  height: 4,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4a5568', marginTop: 2 }}>
                <span>1</span>
                <span style={{ color: '#00ebff', fontSize: 11 }}>Maximum</span>
                <span>100</span>
              </div>
            </div>
          </div>

          {/* Nextstore (collapsible) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => setNextstoreOpen(!nextstoreOpen)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>Nextstore</span>
              {nextstoreOpen
                ? <ChevronUp style={{ width: 14, height: 14, color: '#4a5568' }} />
                : <ChevronDown style={{ width: 14, height: 14, color: '#4a5568' }} />
              }
            </button>
            {nextstoreOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 2 }}>
                {['Monitor', 'Whiteboard', 'Wifi', 'AC', 'Heater'].map((f) => (
                  <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#9ca3af' }}>
                    <div
                      onClick={() => toggleFeature(f)}
                      style={{
                        width: 15,
                        height: 15,
                        borderRadius: 3,
                        border: `1.5px solid ${checkedFeatures.includes(f) ? '#00ebff' : '#374151'}`,
                        background: checkedFeatures.includes(f) ? '#00ebff22' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      {checkedFeatures.includes(f) && (
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="#00ebff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    {f}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Activivity (collapsible) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => setActivityOpen(!activityOpen)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>Activivity</span>
              {activityOpen
                ? <ChevronUp style={{ width: 14, height: 14, color: '#4a5568' }} />
                : <ChevronDown style={{ width: 14, height: 14, color: '#4a5568' }} />
              }
            </button>
            {activityOpen && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#9ca3af' }}>Analytics view</span>
                <button
                  onClick={() => setAnalyticsView(!analyticsView)}
                  style={{
                    width: 36,
                    height: 20,
                    borderRadius: 10,
                    background: analyticsView ? '#00ebff' : '#1e2a3a',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px 3px',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#fff',
                      transform: analyticsView ? 'translateX(16px)' : 'translateX(0)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Apply Button */}
          <button
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: 8,
              background: '#00ebff',
              color: '#0a0e17',
              fontWeight: 700,
              fontSize: 13,
              border: 'none',
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            Apply Filters
          </button>
        </aside>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, padding: '14px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Results + Sort */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, color: '#c9d1d9', fontWeight: 500 }}>
              24 Resources found
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280' }}>
              <span>Sort by</span>
              <div style={{ position: 'relative' }}>
                <select
                  style={{
                    background: '#161b27',
                    border: '1px solid #1e2a3a',
                    borderRadius: 6,
                    padding: '5px 24px 5px 10px',
                    color: '#e6edf3',
                    fontSize: 13,
                    appearance: 'none',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option>Popular</option>
                  <option>Capacity: High to Low</option>
                  <option>Name: A-Z</option>
                </select>
                <ChevronDown style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, color: '#4a5568', pointerEvents: 'none' }} />
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
            }}
          >
            {cards.map((card) => (
              <div
                key={card.id}
                style={{
                  background: '#161b27',
                  border: '1px solid #1c2230',
                  borderRadius: 12,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = '#00ebff44')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = '#1c2230')}
              >
                {/* Image with status badge overlaid */}
                <div style={{ position: 'relative', height: 170, overflow: 'hidden' }}>
                  <img
                    src={card.image}
                    alt={card.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Dark gradient at bottom of image */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '50%',
                      background: 'linear-gradient(to top, rgba(13,17,23,0.85) 0%, transparent 100%)',
                    }}
                  />
                  {/* Top right small icon */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      background: 'rgba(0,0,0,0.5)',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LayoutGrid style={{ width: 12, height: 12, color: '#c9d1d9' }} />
                  </div>
                  {/* Status badge overlaid on bottom of image */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      right: 10,
                      padding: '3px 10px',
                      borderRadius: 20,
                      background: card.statusBg,
                      color: card.statusText,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {card.status}
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '10px 14px 14px' }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3', margin: 0 }}>{card.title}</p>
                  <p style={{ fontSize: 11, color: '#4a5568', margin: '2px 0 8px' }}>{card.subtitle}</p>

                  {/* Meta row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#6b7280', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users style={{ width: 12, height: 12 }} />
                      {card.capacity}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Tag style={{ width: 12, height: 12 }} />
                      {card.tag}
                    </span>
                    {card.range && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin style={{ width: 12, height: 12 }} />
                        {card.range}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
