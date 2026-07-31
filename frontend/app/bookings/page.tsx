"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import './wizard.css';

export default function BookingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // Real date logic
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  }, []);
  
  // Step 2
  const [duration, setDuration] = useState('1');
  const [supportItems, setSupportItems] = useState("Visual's power eyes tracing");
  const [guidelines, setGuidelines] = useState(true);

  const allTimeSlots = [
    { label: '9:00 AM - 10:00 AM', hour: 9, min: 0 },
    { label: '11:30 AM - 1:00 PM', hour: 11, min: 30 },
    { label: '1:30 PM - 2:30 PM', hour: 13, min: 30 },
    { label: '2:30 PM - 3:30 PM', hour: 14, min: 30 },
    { label: '4:00 PM - 5:00 PM', hour: 16, min: 0 },
    { label: '5:00 PM - 6:00 PM', hour: 17, min: 0 },
    { label: '6:30 PM - 7:30 PM', hour: 18, min: 30 },
    { label: '8:00 PM - 9:00 PM', hour: 20, min: 0 },
  ];

  const getAvailableTimeSlots = () => {
    if (!selectedDate) return allTimeSlots.map(s => ({ ...s, disabled: true }));
    
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isToday = selectedDate.getTime() === today.getTime();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    return allTimeSlots.filter(slot => {
      if (isToday) {
        // If the current hour is greater than the slot hour, or it's the same hour but minutes have passed
        if (currentHour > slot.hour || (currentHour === slot.hour && currentMin >= slot.min)) {
          return false; // Do not include this slot
        }
      }
      return true;
    }).map(slot => ({ ...slot, disabled: false }));
  };

  const handleNext = () => {
    if (step === 1 && (!selectedDate || !selectedTimeSlot)) {
      alert('Please select a valid date and time slot.');
      return;
    }
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const renderStepper = () => {
    if (step === 4) return null; // Hide stepper on success
    
    return (
      <div className="wizard-stepper">
        <div className="stepper-line">
          <div 
            className="stepper-progress" 
            style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
          ></div>
        </div>
        
        <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
          <div className="step-number">
            {step > 1 ? '✓' : '1'}
          </div>
          <div className="step-label">Select mode</div>
        </div>
        
        <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
          <div className="step-number">
            {step > 2 ? '✓' : '2'}
          </div>
          <div className="step-label">Details</div>
        </div>
        
        <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Confirm</div>
        </div>
      </div>
    );
  };

  const handlePrevMonth = () => {
    const today = new Date();
    if (
      currentMonthDate.getFullYear() > today.getFullYear() || 
      (currentMonthDate.getFullYear() === today.getFullYear() && currentMonthDate.getMonth() > today.getMonth())
    ) {
      setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1));
    }
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1));
  };

  const isPrevMonthDisabled = () => {
    const today = new Date();
    return currentMonthDate.getFullYear() === today.getFullYear() && currentMonthDate.getMonth() === today.getMonth();
  };

  const renderCalendarDays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentYear = currentMonthDate.getFullYear();
    const currentMonth = currentMonthDate.getMonth();
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const cellDate = new Date(currentYear, currentMonth, i);
      const isPast = cellDate.getTime() < today.getTime();
      const isSelected = selectedDate && cellDate.getTime() === selectedDate.getTime();
      
      days.push(
        <div 
          key={i} 
          className={`calendar-cell ${isSelected ? 'active' : ''} ${isPast ? 'disabled muted' : ''}`}
          onClick={() => {
            if (!isPast) {
              setSelectedDate(cellDate);
              setSelectedTimeSlot('');
            }
          }}
        >
          {i}
        </div>
      );
    }
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const formattedDateString = selectedDate 
    ? selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="wizard-page-wrapper">
      <div className="wizard-card">
        {renderStepper()}
        
        <div className="step-content">
          {step === 1 && (
            <div className="select-mode-layout">
              <div>
                <h4 className="section-title">Select Date</h4>
                <div className="calendar-container">
                  <div className="calendar-header">
                    <button 
                      onClick={handlePrevMonth} 
                      disabled={isPrevMonthDisabled()}
                      className={isPrevMonthDisabled() ? 'disabled' : ''}
                    >&lt;</button>
                    <span>{monthNames[currentMonthDate.getMonth()]} {currentMonthDate.getFullYear()}</span>
                    <button onClick={handleNextMonth}>&gt;</button>
                  </div>
                  <div className="calendar-grid">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                      <div key={d} className="calendar-day-header">{d}</div>
                    ))}
                    {renderCalendarDays()}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="section-title">Select Time Slot</h4>
                <div className="time-slots-container">
                  {getAvailableTimeSlots().map(slot => (
                    <button
                      key={slot.label}
                      className={`time-slot-btn ${selectedTimeSlot === slot.label ? 'active' : ''} ${slot.disabled ? 'disabled' : ''}`}
                      onClick={() => {
                        if (!slot.disabled) {
                          setSelectedTimeSlot(slot.label);
                        }
                      }}
                      disabled={slot.disabled}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="details-wrapper">
              <h4 className="section-title" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>Booking Details</h4>
              <p style={{ textAlign: 'center', color: '#8ba4c4', marginBottom: '2.5rem', fontSize: '0.875rem' }}>Provide details for Meeting Room A</p>
              
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="text" className="form-input" value={formattedDateString} readOnly />
              </div>
              
              <div className="form-group">
                <label className="form-label">Duration</label>
                <select className="form-select" value={duration} onChange={(e) => setDuration(e.target.value)}>
                  <option value="1">1 Hour</option>
                  <option value="2">2 Hours</option>
                  <option value="3">3 Hours</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Support Items</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={supportItems}
                  onChange={(e) => setSupportItems(e.target.value)} 
                />
              </div>
              
              <label className="checkbox-group">
                <input 
                  type="checkbox" 
                  checked={guidelines} 
                  onChange={(e) => setGuidelines(e.target.checked)} 
                />
                <div className="checkbox-custom"></div>
                <span className="checkbox-label">Agree to guidelines (policies)</span>
              </label>
            </div>
          )}
          
          {step === 3 && (
            <div className="confirm-wrapper">
              <div className="confirm-header">
                <h3>Confirm Booking</h3>
                <p>Please review your booking details below.</p>
              </div>
              
              <div className="summary-card">
                <div className="summary-item">
                  <div className="summary-label">Room</div>
                  <div className="summary-value">Meeting Room A</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Date</div>
                  <div className="summary-value">{formattedDateString}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Time</div>
                  <div className="summary-value">{selectedTimeSlot}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Duration</div>
                  <div className="summary-value">{duration} Hour{duration !== '1' ? 's' : ''}</div>
                </div>
                <div className="summary-item">
                  <div className="summary-label">Support</div>
                  <div className="summary-value">{supportItems}</div>
                </div>
              </div>
            </div>
          )}
          
          {step === 4 && (
            <div className="success-wrapper">
              <div className="success-icon">✓</div>
              <h2>Booking Confirmed</h2>
              <p>Your booking details have been sent to your email.</p>
              
              <div className="booking-ticket">
                <div className="room-name">Meeting Room A</div>
                <div className="details-row">
                  <div className="detail-block">
                    <span>Date</span>
                    <span>{formattedDateString}</span>
                  </div>
                  <div className="detail-block">
                    <span>Time</span>
                    <span>{selectedTimeSlot}</span>
                  </div>
                </div>
              </div>
              
              <button 
                className="btn-primary" 
                onClick={() => router.push('/')}
              >
                Go to Homepage
              </button>
            </div>
          )}
        </div>
        
        {step < 4 && (
          <div className="wizard-footer">
            <button 
              className="btn-secondary" 
              onClick={handleBack}
              style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
            >
              Back
            </button>
            <button className="btn-primary" onClick={handleNext}>
              {step === 3 ? 'Confirm & Book' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
