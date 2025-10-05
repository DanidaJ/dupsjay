interface BookedAppointmentDetails {
  // Slot details
  scanType: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  
  // Booking details
  patientName: string;
  patientPhone: string;
  notes?: string;
    bookerName?: string;
  bookedAt: string;
  
  // Additional details
  slotNumber?: number;
}

export const downloadAppointmentDetails = (appointmentDetails: BookedAppointmentDetails, format: 'txt' | 'html' = 'txt') => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  let content: string;
  let fileName: string;
  let mimeType: string;

  if (format === 'html') {
    content = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Appointment Details</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
        .scan-type { background-color: #dbeafe; padding: 10px; border-radius: 6px; margin-bottom: 10px; }
        .detail-row { display: flex; justify-content: space-between; margin: 5px 0; }
        .label { font-weight: bold; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="color: #059669; margin: 0;">✓ Appointment Confirmed</h1>
        <p style="margin: 5px 0 0 0;">Your scan appointment has been successfully booked</p>
    </div>

    <div class="section">
        <h2>Appointment Details</h2>
        <div class="scan-type">
            <h3 style="margin: 0;">${appointmentDetails.scanType}</h3>
        </div>
        <div class="detail-row">
            <span class="label">Date:</span>
            <span>${formatDate(appointmentDetails.date)}</span>
        </div>
        <div class="detail-row">
            <span class="label">Time:</span>
            <span>${appointmentDetails.startTime} - ${appointmentDetails.endTime}</span>
        </div>
        <div class="detail-row">
            <span class="label">Duration:</span>
            <span>${appointmentDetails.duration} minutes</span>
        </div>
        ${appointmentDetails.slotNumber ? `
        <div class="detail-row">
            <span class="label">Slot Number:</span>
            <span>#${appointmentDetails.slotNumber}</span>
        </div>
        ` : ''}
    </div>

    <div class="section">
        <h2>Patient Information</h2>
        <div class="detail-row">
            <span class="label">Patient Name:</span>
            <span>${appointmentDetails.patientName}</span>
        </div>
        <div class="detail-row">
            <span class="label">Phone Number:</span>
            <span>${appointmentDetails.patientPhone}</span>
        </div>
        ${appointmentDetails.notes ? `
        <div style="margin-top: 10px;">
            <span class="label">Notes:</span>
            <p style="margin: 5px 0;">${appointmentDetails.notes}</p>
        </div>
        ` : ''}
    </div>

    <div class="section">
        <h2>Booking Information</h2>
        <div class="detail-row">
            <span class="label">Booked By:</span>
            <span>${appointmentDetails.bookerName}</span>
        </div>
        <div class="detail-row">
            <span class="label">Booking Time:</span>
            <span>${formatDateTime(appointmentDetails.bookedAt)}</span>
        </div>
    </div>

    <div class="footer">
        <p>Please arrive 15 minutes before your appointment time.</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>`;
    fileName = `appointment-${appointmentDetails.patientName.replace(/\s+/g, '-')}-${appointmentDetails.date}.html`;
    mimeType = 'text/html';
  } else {
    content = `
APPOINTMENT CONFIRMATION
========================

✓ Your scan appointment has been successfully booked!

APPOINTMENT DETAILS
-------------------
Scan Type: ${appointmentDetails.scanType}
Date: ${formatDate(appointmentDetails.date)}
Time: ${appointmentDetails.startTime} - ${appointmentDetails.endTime}
Duration: ${appointmentDetails.duration} minutes${appointmentDetails.slotNumber ? `\nSlot Number: #${appointmentDetails.slotNumber}` : ''}

PATIENT INFORMATION
-------------------
Patient Name: ${appointmentDetails.patientName}
Phone Number: ${appointmentDetails.patientPhone}${appointmentDetails.notes ? `\nNotes: ${appointmentDetails.notes}` : ''}

BOOKING INFORMATION
-------------------
Booked By: ${appointmentDetails.bookerName}
Booking Time: ${formatDateTime(appointmentDetails.bookedAt)}

IMPORTANT REMINDERS
-------------------
• Please arrive 15 minutes before your appointment time
• Bring a valid ID and any relevant medical documents
• A confirmation email has been sent to your registered email address

Generated on: ${new Date().toLocaleString()}
`;
    fileName = `appointment-${appointmentDetails.patientName.replace(/\s+/g, '-')}-${appointmentDetails.date}.txt`;
    mimeType = 'text/plain';
  }

  // Create blob and download
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default downloadAppointmentDetails;