export interface BookingEmailData {
  bookingId: string;
  title: string;
  userName: string;
  userEmail: string;
  resourceName: string;
  location?: string;
  startTime: string; // ISO string or formatted
  endTime: string;   // ISO string or formatted
  checkInUrl?: string;
}

export interface WeeklyDigestData {
  adminName: string;
  adminEmail: string;
  totalBookings: number;
  totalNoShows: number;
  noShowRate: string;
  mostUnusedResource: string;
}

// 1. Booking Confirmation Email Template
export const bookingConfirmationTemplate = (data: BookingEmailData) => {
  const subject = `Booking Confirmed: ${data.title} (${data.resourceName})`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; color: #333; margin: 0; padding: 20px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { border-bottom: 2px solid #6366f1; padding-bottom: 15px; margin-bottom: 20px; }
        .title { color: #1e1b4b; margin: 0; font-size: 24px; font-weight: 700; }
        .badge { background: #e0e7ff; color: #4338ca; padding: 6px 12px; border-radius: 20px; font-weight: 600; display: inline-block; margin-top: 8px; }
        .details { margin: 20px 0; background: #f8fafc; padding: 15px; border-radius: 8px; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .label { color: #64748b; font-size: 14px; }
        .val { font-weight: 600; color: #0f172a; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="title">SpaceSync</h1>
          <span class="badge">Booking Confirmed</span>
        </div>
        <p>Hi <strong>${data.userName}</strong>,</p>
        <p>Your booking for <strong>${data.title}</strong> has been successfully confirmed!</p>
        
        <div class="details">
          <div class="detail-row"><span class="label">Resource:</span> <span class="val">${data.resourceName} ${data.location ? `(${data.location})` : ''}</span></div>
          <div class="detail-row"><span class="label">Start Time:</span> <span class="val">${new Date(data.startTime).toLocaleString()}</span></div>
          <div class="detail-row"><span class="label">End Time:</span> <span class="val">${new Date(data.endTime).toLocaleString()}</span></div>
        </div>
        <p>Please remember to check-in when you arrive within 10 minutes of your start time to prevent auto-release.</p>
        <div class="footer">
          <p>© 2026 SpaceSync - Campus & Office Resource Booking Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return { subject, html };
};

// 2. 24-Hour Reminder Email Template
export const reminder24hTemplate = (data: BookingEmailData) => {
  const subject = `Upcoming Booking Reminder (Tomorrow): ${data.title}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; color: #333; margin: 0; padding: 20px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { border-bottom: 2px solid #3b82f6; padding-bottom: 15px; margin-bottom: 20px; }
        .title { color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 700; }
        .details { margin: 20px 0; background: #eff6ff; padding: 15px; border-radius: 8px; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="title">SpaceSync Reminder</h1>
        </div>
        <p>Hi <strong>${data.userName}</strong>,</p>
        <p>This is a friendly reminder that you have a booking scheduled for tomorrow:</p>
        <div class="details">
          <p><strong>Title:</strong> ${data.title}</p>
          <p><strong>Resource:</strong> ${data.resourceName}</p>
          <p><strong>Start Time:</strong> ${new Date(data.startTime).toLocaleString()}</p>
        </div>
        <p>If your plans have changed, please cancel your booking early to free up the space for others.</p>
        <div class="footer">
          <p>© 2026 SpaceSync - Campus & Office Resource Booking Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return { subject, html };
};

// 3. 10-Minute Reminder + Check-in Nudge Template
export const reminder10mTemplate = (data: BookingEmailData) => {
  const subject = `Action Required: Check-in for ${data.title} in 10 minutes!`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; color: #333; margin: 0; padding: 20px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { border-bottom: 2px solid #f59e0b; padding-bottom: 15px; margin-bottom: 20px; }
        .title { color: #78350f; margin: 0; font-size: 24px; font-weight: 700; }
        .btn { display: inline-block; background: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; margin: 20px 0; text-align: center; }
        .alert { background: #fef3c7; color: #92400e; padding: 12px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-top: 15px; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="title">Check-In Required</h1>
        </div>
        <p>Hi <strong>${data.userName}</strong>,</p>
        <p>Your booking for <strong>${data.title}</strong> at <strong>${data.resourceName}</strong> starts in 10 minutes (${new Date(data.startTime).toLocaleTimeString()}).</p>
        
        <p>Please click the button below to confirm "I'm Here" and complete your check-in:</p>
        
        <div style="text-align: center;">
          <a href="${data.checkInUrl || '#'}" class="btn">I'm Here - Confirm Check-In</a>
        </div>
        
        <div class="alert">
          ⚠️ Note: If you do not check in within 10 minutes of the start time, your booking will automatically be released for someone else to claim.
        </div>
        <div class="footer">
          <p>© 2026 SpaceSync - Campus & Office Resource Booking Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return { subject, html };
};

// 4. Auto-Release / No-Show Notification Template
export const autoReleaseNoticeTemplate = (data: BookingEmailData) => {
  const subject = `Booking Released: ${data.title} (No-Show)`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; color: #333; margin: 0; padding: 20px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { border-bottom: 2px solid #ef4444; padding-bottom: 15px; margin-bottom: 20px; }
        .title { color: #991b1b; margin: 0; font-size: 24px; font-weight: 700; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="title">Booking Auto-Released</h1>
        </div>
        <p>Hi <strong>${data.userName}</strong>,</p>
        <p>Your booking for <strong>${data.title}</strong> at <strong>${data.resourceName}</strong> was automatically released because check-in was not completed within the 10-minute grace window.</p>
        <p>The space has now been made available for other members to reserve.</p>
        <div class="footer">
          <p>© 2026 SpaceSync - Campus & Office Resource Booking Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return { subject, html };
};

// 5. Weekly No-Show Digest Template for Admins
export const weeklyNoShowDigestTemplate = (data: WeeklyDigestData) => {
  const subject = `Weekly SpaceSync Digest: No-Show Statistics`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; color: #333; margin: 0; padding: 20px; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { border-bottom: 2px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
        .title { color: #065f46; margin: 0; font-size: 24px; font-weight: 700; }
        .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .stat-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-val { font-size: 24px; font-weight: 700; color: #047857; }
        .stat-lbl { font-size: 12px; color: #4b5563; }
        .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 class="title">Weekly No-Show Digest</h1>
        </div>
        <p>Hi <strong>${data.adminName}</strong>,</p>
        <p>Here is your weekly summary of resource bookings and no-show protection metrics for your organization:</p>
        
        <div class="stat-grid">
          <div class="stat-box">
            <div class="stat-val">${data.totalBookings}</div>
            <div class="stat-lbl">Total Bookings</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">${data.totalNoShows}</div>
            <div class="stat-lbl">No-Shows Auto-Released</div>
          </div>
        </div>
        <p><strong>Overall No-Show Rate:</strong> ${data.noShowRate}</p>
        <p><strong>Most Unused Resource:</strong> ${data.mostUnusedResource}</p>
        <div class="footer">
          <p>© 2026 SpaceSync - Admin Digest</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return { subject, html };
};
