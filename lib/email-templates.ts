// lib/email-templates.ts - UPDATED WITH PROJECT AND PDC TEMPLATES

export interface EmailData {
  title: string;
  message: string;
  details?: string;
  nextSteps?: string;
  showButton?: boolean;
  buttonText?: string;
  buttonUrl?: string;
  isInternal?: boolean;
}

export function generateEmailTemplate(data: EmailData): string {
  const {
    title,
    message,
    details,
    nextSteps,
    showButton = false,
    buttonText = "Confirm",
    buttonUrl = "#",
    isInternal = false,
  } = data;

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
<head>
<title></title>
<meta charset="UTF-8" />
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<!--[if !mso]>-->
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<!--<![endif]-->
<meta name="x-apple-disable-message-reformatting" content="" />
<meta content="target-densitydpi=device-dpi" name="viewport" />
<meta content="true" name="HandheldFriendly" />
<meta content="width=device-width" name="viewport" />
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
<style type="text/css">
body {
  margin: 0;
  padding: 0;
  background-color: #FFFFFF;
  font-family: 'Open Sans', Arial, sans-serif;
}
.email-wrapper {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background: #FFFFFF;
  border: 1px solid #EBEBEB;
  border-radius: 3px;
}
.email-header {
  background: #FFFFFF;
  padding: 44px 42px 0 42px;
  text-align: center;
}
.email-content {
  padding: 0 42px 32px 42px;
}
.brand-name {
  font-family: 'Montserrat', Arial, sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #f97316;
  text-align: center;
  margin: 0 0 18px 0;
  border-bottom: 1px solid #EFF1F4;
  padding-bottom: 18px;
}
.email-title {
  font-family: 'Montserrat', Arial, sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #141414;
  text-align: center;
  margin: 30px 0 18px 0;
  border-bottom: 1px solid #EFF1F4;
  padding-bottom: 18px;
}
.email-message {
  font-family: 'Open Sans', Arial, sans-serif;
  font-size: 15px;
  line-height: 25px;
  color: #141414;
  margin: 0 0 24px 0;
}
.details-container {
  background-color: #f8fafc;
  padding: 20px;
  border-radius: 8px;
  margin: 24px 0;
}
.detail-row {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-label {
  font-weight: 600;
  color: #374151;
  width: 40%;
  min-width: 120px;
}
.detail-value {
  color: #1f2937;
  width: 60%;
}
.next-steps {
  background: #ecfdf5;
  padding: 20px;
  border-radius: 8px;
  margin: 24px 0;
}
.next-steps strong {
  color: #065f46;
  display: block;
  margin-bottom: 8px;
}
.email-footer {
  border-top: 1px solid #DFE1E4;
  padding: 24px 0 0 0;
  text-align: center;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.5;
}
.action-button {
  display: inline-block;
  background: #f97316;
  color: white;
  padding: 14px 32px;
  text-decoration: none;
  border-radius: 40px;
  font-family: 'Sofia Sans', Arial, sans-serif;
  font-weight: 700;
  font-size: 16px;
  text-align: center;
  margin: 24px 0;
}
@media (max-width: 480px) {
  .email-header, .email-content {
    padding: 40px 24px;
  }
  .detail-row {
    flex-direction: column;
    gap: 4px;
  }
  .detail-label, .detail-value {
    width: 100%;
  }
}
</style>
<!--[if !mso]>-->
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700&amp;family=Sofia+Sans:wght@700&amp;family=Open+Sans:wght@400;500;600&amp;display=swap" rel="stylesheet" type="text/css" />
<!--<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
<div class="email-wrapper">
  <div class="email-header">
    <div class="brand-name">GianConstruct</div>
  </div>

  <div class="email-content">
    <div class="email-title">${title}</div>

    <div class="email-message">
      ${message}
    </div>

    ${details || ""}

    ${
      nextSteps
        ? `
    <div class="next-steps">
      <strong>Next Steps:</strong>
      ${nextSteps}
    </div>
    `
        : ""
    }

    ${
      showButton
        ? `
    <div style="text-align: center;">
      <a href="${buttonUrl}" class="action-button">${buttonText}</a>
    </div>
    `
        : ""
    }

    <div class="email-footer">
      <p style="margin: 8px 0;"><strong>JY PEREZ AVENUE, KABANKALAN, PHILIPPINES 6111</strong></p>
      <p style="margin: 8px 0;">Tel: 0908 982 1649 | Email: gianconstruct@gmail.com</p>
      <p style="margin: 8px 0;">Website: www.gianconstruct.com</p>
      <p style="margin: 16px 0 0 0; font-size: 11px; color: #9ca3af;">Building Dreams, Creating Excellence</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

// Helper functions for different email types
export const EmailTemplates = {
  // Client-facing templates
  appointmentConfirmed: (
    inquiry: any,
    formatDate: Function,
    formatTime: Function
  ) => {
    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Date</div>
    <div class="detail-value">${formatDate(inquiry.preferredDate)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Time</div>
    <div class="detail-value">${formatTime(inquiry.preferredTime)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Meeting Type</div>
    <div class="detail-value">${inquiry.meetingType.charAt(0).toUpperCase() + inquiry.meetingType.slice(1)} Consultation</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Design Package</div>
    <div class="detail-value">${inquiry.design.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Reference ID</div>
    <div class="detail-value">GC-${inquiry._id.toString().slice(-6).toUpperCase()}</div>
  </div>
</div>
    `;

    return {
      subject: `Appointment Confirmed - ${formatDate(inquiry.preferredDate)} at ${formatTime(inquiry.preferredTime)}`,
      data: {
        title: "Appointment Confirmed",
        message: `Dear ${inquiry.name},<br><br>We are pleased to inform you that your consultation for <strong>${inquiry.design.name}</strong> has been successfully confirmed. Our team is looking forward to discussing your project requirements and providing you with exceptional service.`,
        details,
        nextSteps:
          "Please prepare any relevant documents, questions, or materials you would like to discuss during our consultation. We recommend joining the meeting 5 minutes early to ensure a smooth start.",
      },
    };
  },

  appointmentCancelled: (
    inquiry: any,
    formatDate: Function,
    formatTime: Function,
    reason?: string
  ) => {
    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Original Date</div>
    <div class="detail-value">${formatDate(inquiry.preferredDate)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Original Time</div>
    <div class="detail-value">${formatTime(inquiry.preferredTime)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Design Package</div>
    <div class="detail-value">${inquiry.design.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Reference ID</div>
    <div class="detail-value">GC-${inquiry._id.toString().slice(-6).toUpperCase()}</div>
  </div>
  ${
    reason
      ? `
  <div class="detail-row">
    <div class="detail-label">Cancellation Reason</div>
    <div class="detail-value">${reason}</div>
  </div>
  `
      : ""
  }
</div>
    `;

    return {
      subject: `Appointment Cancelled - ${formatDate(inquiry.preferredDate)}`,
      data: {
        title: "Appointment Cancelled",
        message: `Dear ${inquiry.name},<br><br>We regret to inform you that your appointment for <strong>${inquiry.design.name}</strong> has been cancelled as per your request. We understand that circumstances may change and we appreciate you informing us in a timely manner.`,
        details,
        nextSteps:
          "Should you wish to reschedule your consultation in the future, please do not hesitate to contact us. We would be delighted to assist you with your construction and design needs at a more convenient time.",
      },
    };
  },

  appointmentRescheduled: (
    inquiry: any,
    formatDate: Function,
    formatTime: Function,
    newDate?: string,
    newTime?: string,
    notes?: string
  ) => {
    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">New Date</div>
    <div class="detail-value">${formatDate(newDate || inquiry.preferredDate)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">New Time</div>
    <div class="detail-value">${formatTime(newTime || inquiry.preferredTime)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Meeting Type</div>
    <div class="detail-value">${inquiry.meetingType.charAt(0).toUpperCase() + inquiry.meetingType.slice(1)} Consultation</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Design Package</div>
    <div class="detail-value">${inquiry.design.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Reference ID</div>
    <div class="detail-value">GC-${inquiry._id.toString().slice(-6).toUpperCase()}</div>
  </div>
  ${
    notes
      ? `
  <div class="detail-row">
    <div class="detail-label">Reschedule Notes</div>
    <div class="detail-value">${notes}</div>
  </div>
  `
      : ""
  }
</div>
    `;

    return {
      subject: `Appointment Rescheduled - ${formatDate(newDate || inquiry.preferredDate)} at ${formatTime(newTime || inquiry.preferredTime)}`,
      data: {
        title: "Appointment Rescheduled",
        message: `Dear ${inquiry.name},<br><br>Your consultation for <strong>${inquiry.design.name}</strong> has been successfully rescheduled. We have updated our records with your new appointment time and look forward to connecting with you.`,
        details,
        nextSteps:
          "Please update your calendar with the new appointment details. We recommend preparing any questions or materials you'd like to discuss during our consultation to make the most of our time together.",
      },
    };
  },

  appointmentCompleted: (
    inquiry: any,
    formatDate: Function,
    formatTime: Function
  ) => {
    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Date</div>
    <div class="detail-value">${formatDate(inquiry.preferredDate)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Time</div>
    <div class="detail-value">${formatTime(inquiry.preferredTime)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Meeting Type</div>
    <div class="detail-value">${inquiry.meetingType.charAt(0).toUpperCase() + inquiry.meetingType.slice(1)} Consultation</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Design Package</div>
    <div class="detail-value">${inquiry.design.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Reference ID</div>
    <div class="detail-value">GC-${inquiry._id.toString().slice(-6).toUpperCase()}</div>
  </div>
</div>
    `;

    return {
      subject: `Consultation Completed - ${formatDate(inquiry.preferredDate)}`,
      data: {
        title: "Consultation Completed",
        message: `Dear ${inquiry.name},<br><br>Thank you for completing your consultation regarding <strong>${inquiry.design.name}</strong>. We truly appreciate the opportunity to discuss your vision and requirements for your project.`,
        details,
        nextSteps:
          "Our team will now prepare a detailed proposal based on our discussion. You can expect to receive this comprehensive document within 3-5 business days. Should you have any immediate questions or require additional information, please don't hesitate to contact us.",
      },
    };
  },

  // Internal notification templates - FOR ADMIN TEAM ONLY
  internalAppointmentUpdate: (
    inquiry: any,
    type: string,
    formatDate: Function,
    formatTime: Function,
    additionalData?: any
  ) => {
    const statusMap: { [key: string]: string } = {
      confirmed: "Confirmed",
      cancelled: "Cancelled",
      rescheduled: "Rescheduled",
      completed: "Completed",
    };

    const status = statusMap[type];

    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Client Name</div>
    <div class="detail-value">${inquiry.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Contact Email</div>
    <div class="detail-value">${inquiry.email}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Contact Phone</div>
    <div class="detail-value">${inquiry.phone}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Design Package</div>
    <div class="detail-value">${inquiry.design.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Appointment Date</div>
    <div class="detail-value">${formatDate(inquiry.preferredDate)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Appointment Time</div>
    <div class="detail-value">${formatTime(inquiry.preferredTime)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Meeting Type</div>
    <div class="detail-value">${inquiry.meetingType.charAt(0).toUpperCase() + inquiry.meetingType.slice(1)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">User Type</div>
    <div class="detail-value">${inquiry.userType === "registered" ? "Registered User" : "Guest User"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Reference ID</div>
    <div class="detail-value">GC-${inquiry._id.toString().slice(-6).toUpperCase()}</div>
  </div>
  ${
    additionalData?.reason
      ? `
  <div class="detail-row">
    <div class="detail-label">Cancellation Reason</div>
    <div class="detail-value">${additionalData.reason}</div>
  </div>
  `
      : ""
  }
  ${
    additionalData?.notes
      ? `
  <div class="detail-row">
    <div class="detail-label">Reschedule Notes</div>
    <div class="detail-value">${additionalData.notes}</div>
  </div>
  `
      : ""
  }
  ${
    type === "rescheduled" && additionalData?.newDate
      ? `
  <div class="detail-row">
    <div class="detail-label">New Date</div>
    <div class="detail-value">${formatDate(additionalData.newDate)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">New Time</div>
    <div class="detail-value">${formatTime(additionalData.newTime)}</div>
  </div>
  `
      : ""
  }
</div>
    `;

    const subjectMap: { [key: string]: string } = {
      confirmed: `Appointment Confirmed - ${inquiry.name} - ${formatDate(inquiry.preferredDate)}`,
      cancelled: `Appointment Cancelled - ${inquiry.name} - ${formatDate(inquiry.preferredDate)}`,
      rescheduled: `Appointment Rescheduled - ${inquiry.name} - ${formatDate(additionalData?.newDate || inquiry.preferredDate)}`,
      completed: `Consultation Completed - ${inquiry.name} - ${formatDate(inquiry.preferredDate)}`,
    };

    let adminMessage = "";
    let adminNextSteps = "";

    switch (type) {
      case "confirmed":
        adminMessage = `A client appointment has been confirmed in the system. Please review the details below and prepare for the upcoming consultation.<br><br><strong>Client:</strong> ${inquiry.name}<br><strong>Appointment:</strong> ${formatDate(inquiry.preferredDate)} at ${formatTime(inquiry.preferredTime)}<br><strong>Package:</strong> ${inquiry.design.name}`;
        adminNextSteps =
          "Please ensure all relevant team members are informed about this confirmed appointment. Prepare consultation materials and confirm resource availability for the scheduled date and time.";
        break;
      case "cancelled":
        adminMessage = `A client appointment has been cancelled. Please update your schedule and records accordingly.<br><br><strong>Client:</strong> ${inquiry.name}<br><strong>Original Appointment:</strong> ${formatDate(inquiry.preferredDate)} at ${formatTime(inquiry.preferredTime)}<br><strong>Cancellation Reason:</strong> ${additionalData?.reason || "Not specified"}`;
        adminNextSteps =
          "Update team schedules and release any allocated resources. Consider following up with the client to understand their needs better and potentially reschedule in the future.";
        break;
      case "rescheduled":
        adminMessage = `A client appointment has been rescheduled. Please note the new appointment details.<br><br><strong>Client:</strong> ${inquiry.name}<br><strong>New Appointment:</strong> ${formatDate(additionalData?.newDate || inquiry.preferredDate)} at ${formatTime(additionalData?.newTime || inquiry.preferredTime)}<br><strong>Previous Appointment:</strong> ${formatDate(inquiry.preferredDate)} at ${formatTime(inquiry.preferredTime)}`;
        adminNextSteps =
          "Update all team schedules and confirm resource availability for the new appointment time. Ensure calendar systems are updated to reflect the change.";
        break;
      case "completed":
        adminMessage = `A client consultation has been completed. Please proceed with follow-up actions.<br><br><strong>Client:</strong> ${inquiry.name}<br><strong>Completed Appointment:</strong> ${formatDate(inquiry.preferredDate)} at ${formatTime(inquiry.preferredTime)}<br><strong>Consultation Package:</strong> ${inquiry.design.name}`;
        adminNextSteps =
          "Begin preparing the client proposal based on consultation notes. Schedule follow-up communication and assign team members for next steps in the client journey.";
        break;
      default:
        adminMessage = `A client appointment update has been recorded in the system.`;
        adminNextSteps =
          "Review the appointment details and take appropriate action as needed.";
    }

    return {
      subject: subjectMap[type],
      data: {
        title: `Appointment ${status} - Admin Notification`,
        message: adminMessage,
        details,
        nextSteps: adminNextSteps,
        isInternal: true,
      },
    };
  },

  internalNewInquiry: (
    inquiry: any,
    formatDate: Function,
    formatTime: Function
  ) => {
    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Client Name</div>
    <div class="detail-value">${inquiry.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Contact Email</div>
    <div class="detail-value">${inquiry.email}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Contact Phone</div>
    <div class="detail-value">${inquiry.phone}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Design Package</div>
    <div class="detail-value">${inquiry.design.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Preferred Date</div>
    <div class="detail-value">${formatDate(inquiry.preferredDate)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Preferred Time</div>
    <div class="detail-value">${formatTime(inquiry.preferredTime)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Meeting Type</div>
    <div class="detail-value">${inquiry.meetingType.charAt(0).toUpperCase() + inquiry.meetingType.slice(1)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">User Type</div>
    <div class="detail-value">${inquiry.userType === "registered" ? "Registered User" : "Guest User"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Reference ID</div>
    <div class="detail-value">GC-${inquiry._id.toString().slice(-6).toUpperCase()}</div>
  </div>
  ${
    inquiry.message
      ? `
  <div class="detail-row">
    <div class="detail-label">Client Message</div>
    <div class="detail-value">${inquiry.message}</div>
  </div>
  `
      : ""
  }
</div>
    `;

    return {
      subject: `New Consultation Inquiry - ${inquiry.name} - ${inquiry.design.name}`,
      data: {
        title: "New Consultation Inquiry - Admin Notification",
        message: `A potential client has submitted a consultation request and is awaiting confirmation. This represents a new business opportunity that requires your immediate attention.<br><br><strong>Client:</strong> ${inquiry.name}<br><strong>Preferred Date:</strong> ${formatDate(inquiry.preferredDate)}<br><strong>Package Interest:</strong> ${inquiry.design.name}`,
        details,
        nextSteps:
          "Please review this inquiry promptly and contact the client within 24 hours to confirm the appointment. Assign a sales representative to follow up and convert this lead into a confirmed appointment.",
        isInternal: true,
      },
    };
  },

  // ========== PROJECT EMAIL TEMPLATES ==========
  projectTimelineUpdate: (
    project: any,
    user: any,
    updateTitle: string,
    updateDescription?: string,
    progress?: number
  ) => {
    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Project Name</div>
    <div class="detail-value">${project.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project ID</div>
    <div class="detail-value">${project.project_id}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Update Title</div>
    <div class="detail-value">${updateTitle}</div>
  </div>
  ${
    updateDescription
      ? `
  <div class="detail-row">
    <div class="detail-label">Description</div>
    <div class="detail-value">${updateDescription}</div>
  </div>
  `
      : ""
  }
  ${
    progress !== undefined
      ? `
  <div class="detail-row">
    <div class="detail-label">Progress</div>
    <div class="detail-value">${progress}% Complete</div>
  </div>
  `
      : ""
  }
  <div class="detail-row">
    <div class="detail-label">Location</div>
    <div class="detail-value">${project.location?.fullAddress || "Not specified"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Status</div>
    <div class="detail-value" style="text-transform: capitalize;">${project.status}</div>
  </div>
</div>
    `;

    return {
      subject: `Project Update: ${project.name} - ${updateTitle}`,
      data: {
        title: "Project Timeline Updated",
        message: `Dear ${user?.name || "Valued Client"},<br><br>We're excited to share a new update for your project <strong>${project.name}</strong>. Our team has been making progress and we want to keep you informed every step of the way.`,
        details,
        nextSteps:
          "You can view more details and photos of the progress by logging into your account. If you have any questions about this update, please don't hesitate to contact our project team.",
        showButton: true,
        buttonText: "View Project Updates",
        buttonUrl: `${process.env.NEXTAUTH_URL}/user/projects/${project.project_id}`,
      },
    };
  },

  projectMilestoneReached: (
    project: any,
    user: any,
    milestone: string,
    progress: number
  ) => {
    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Project Name</div>
    <div class="detail-value">${project.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project ID</div>
    <div class="detail-value">${project.project_id}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Milestone</div>
    <div class="detail-value">${milestone}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Overall Progress</div>
    <div class="detail-value">${progress}% Complete</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Location</div>
    <div class="detail-value">${project.location?.fullAddress || "Not specified"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Status</div>
    <div class="detail-value" style="text-transform: capitalize;">${project.status}</div>
  </div>
</div>
    `;

    return {
      subject: `Milestone Reached: ${project.name} - ${progress}% Complete`,
      data: {
        title: "Project Milestone Achieved!",
        message: `Dear ${user?.name || "Valued Client"},<br><br>Great news! Your project <strong>${project.name}</strong> has reached an important milestone. We're now ${progress}% complete and making excellent progress toward completion.`,
        details,
        nextSteps:
          "This milestone represents significant progress in your project. Our team continues to work diligently to ensure the highest quality standards are met. We'll keep you updated as we move toward the next phase.",
        showButton: true,
        buttonText: "View Project Progress",
        buttonUrl: `${process.env.NEXTAUTH_URL}/user/projects/${project.project_id}`,
      },
    };
  },

  projectStatusUpdate: (
    project: any,
    user: any,
    oldStatus: string,
    newStatus: string
  ) => {
    const statusLabels: { [key: string]: string } = {
      pending: "Pending Confirmation",
      active: "Active",
      completed: "Completed",
      cancelled: "Cancelled",
    };

    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Project Name</div>
    <div class="detail-value">${project.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project ID</div>
    <div class="detail-value">${project.project_id}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Previous Status</div>
    <div class="detail-value" style="text-transform: capitalize;">${statusLabels[oldStatus] || oldStatus}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">New Status</div>
    <div class="detail-value" style="text-transform: capitalize;">${statusLabels[newStatus] || newStatus}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Location</div>
    <div class="detail-value">${project.location?.fullAddress || "Not specified"}</div>
  </div>
  ${
    project.startDate
      ? `
  <div class="detail-row">
    <div class="detail-label">Start Date</div>
    <div class="detail-value">${new Date(project.startDate).toLocaleDateString()}</div>
  </div>
  `
      : ""
  }
  ${
    project.endDate
      ? `
  <div class="detail-row">
    <div class="detail-label">Estimated Completion</div>
    <div class="detail-value">${new Date(project.endDate).toLocaleDateString()}</div>
  </div>
  `
      : ""
  }
</div>
    `;

    let message = "";
    let nextSteps = "";

    switch (newStatus) {
      case "active":
        message = `Dear ${user?.name || "Valued Client"},<br><br>We're excited to inform you that your project <strong>${project.name}</strong> is now officially active! Our team has begun work and we're committed to delivering exceptional results.`;
        nextSteps =
          "Our project team will provide regular updates as work progresses. You can track all updates through your client portal. If you have any questions, please contact your project manager.";
        break;
      case "completed":
        message = `Dear ${user?.name || "Valued Client"},<br><br>We're thrilled to announce that your project <strong>${project.name}</strong> has been successfully completed! Thank you for trusting GianConstruct with your project.`;
        nextSteps =
          "A final walkthrough has been scheduled. Our team will contact you to arrange a convenient time. We appreciate your partnership and look forward to serving you in future projects.";
        break;
      case "cancelled":
        message = `Dear ${user?.name || "Valued Client"},<br><br>This email confirms that your project <strong>${project.name}</strong> has been cancelled as requested.`;
        nextSteps =
          "If you have any questions about this cancellation or would like to discuss future projects, please don't hesitate to contact our team. We hope to have the opportunity to work with you again.";
        break;
      default:
        message = `Dear ${user?.name || "Valued Client"},<br><br>This email is to inform you about a status update for your project <strong>${project.name}</strong>.`;
        nextSteps =
          "Please log in to your client portal for more details about this status change and what to expect next.";
    }

    return {
      subject: `Project Status Update: ${project.name} - ${statusLabels[newStatus] || newStatus}`,
      data: {
        title: "Project Status Updated",
        message,
        details,
        nextSteps,
        showButton: true,
        buttonText: "View Project Details",
        buttonUrl: `${process.env.NEXTAUTH_URL}/user/projects/${project.project_id}`,
      },
    };
  },

  projectCreated: (project: any, user: any) => {
    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Project Name</div>
    <div class="detail-value">${project.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project ID</div>
    <div class="detail-value">${project.project_id}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Status</div>
    <div class="detail-value" style="text-transform: capitalize;">Pending Confirmation</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Location</div>
    <div class="detail-value">${project.location?.fullAddress || "Not specified"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Estimated Start</div>
    <div class="detail-value">${new Date(project.startDate).toLocaleDateString()}</div>
  </div>
  ${
    project.endDate
      ? `
  <div class="detail-row">
    <div class="detail-label">Estimated Completion</div>
    <div class="detail-value">${new Date(project.endDate).toLocaleDateString()}</div>
  </div>
  `
      : ""
  }
  <div class="detail-row">
    <div class="detail-label">Total Cost</div>
    <div class="detail-value">₱${project.totalCost?.toLocaleString() || "0"}</div>
  </div>
</div>
    `;

    return {
      subject: `New Project Created: ${project.name}`,
      data: {
        title: "New Project Created",
        message: `Dear ${user?.name || "Valued Client"},<br><br>Thank you for choosing GianConstruct! We're excited to inform you that your new project <strong>${project.name}</strong> has been successfully created and is awaiting confirmation.`,
        details,
        nextSteps:
          "Our team will review your project details and contact you within 24-48 hours to confirm the start date and discuss next steps. In the meantime, you can track your project status through your client portal.",
        showButton: true,
        buttonText: "View Project Details",
        buttonUrl: `${process.env.NEXTAUTH_URL}/user/projects/${project.project_id}`,
      },
    };
  },

  projectUpdated: (project: any, user: any, changes: string[] = []) => {
    const changeList =
      changes.length > 0
        ? changes
            .map((field) => {
              const labels: Record<string, string> = {
                name: "Project Name",
                startDate: "Start Date",
                endDate: "Estimated Completion Date",
                totalCost: "Total Project Cost",
                location: "Project Location",
                status: "Project Status",
              };
              return labels[field] || field;
            })
            .join(", ")
        : "details";

    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Project Name</div>
    <div class="detail-value">${project.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project ID</div>
    <div class="detail-value">${project.project_id}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Updated Fields</div>
    <div class="detail-value">${changeList.charAt(0).toUpperCase() + changeList.slice(1)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Current Status</div>
    <div class="detail-value" style="text-transform: capitalize;">${project.status}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Location</div>
    <div class="detail-value">${project.location?.fullAddress || "Not specified"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Total Cost</div>
    <div class="detail-value">₱${project.totalCost?.toLocaleString() || "0"}</div>
  </div>
</div>
    `;

    return {
      subject: `Project Updated: ${project.name}`,
      data: {
        title: "Your Project Has Been Updated",
        message: `Dear ${user?.name || "Valued Client"},<br><br>This is to inform you that some details of your project <strong>${project.name}</strong> have been updated by our team.<br><br>The following information has been modified: <strong>${changeList}</strong>.`,
        details,
        nextSteps:
          "You can now view the updated project information in your client portal. If you have any questions about these changes, please feel free to reach out to your project coordinator.",
        showButton: true,
        buttonText: "View Updated Project",
        buttonUrl: `${process.env.NEXTAUTH_URL}/user/projects/${project.project_id}`,
      },
    };
  },

  projectTimelinePhotoUpdate: (
    project: any,
    user: any,
    updateTitle: string,
    updateDescription?: string,
    progress?: number,
    photoCount?: number
  ) => {
    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Project Name</div>
    <div class="detail-value">${project.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project ID</div>
    <div class="detail-value">${project.project_id}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Update Type</div>
    <div class="detail-value">Timeline Photo Update</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Update Title</div>
    <div class="detail-value">${updateTitle}</div>
  </div>
  ${
    updateDescription
      ? `
  <div class="detail-row">
    <div class="detail-label">Description</div>
    <div class="detail-value">${updateDescription}</div>
  </div>
  `
      : ""
  }
  ${
    progress !== undefined && progress !== null
      ? `
  <div class="detail-row">
    <div class="detail-label">Progress Update</div>
    <div class="detail-value"><strong>${progress}% Complete</strong></div>
  </div>
  `
      : ""
  }
  ${
    photoCount && photoCount > 0
      ? `
  <div class="detail-row">
    <div class="detail-label">Photos Added</div>
    <div class="detail-value">${photoCount} new photo${photoCount > 1 ? "s" : ""} added to timeline</div>
  </div>
  `
      : ""
  }
  <div class="detail-row">
    <div class="detail-label">Project Location</div>
    <div class="detail-value">${project.location?.fullAddress || "Not specified"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Update Date</div>
    <div class="detail-value">${new Date().toLocaleDateString()}</div>
  </div>
</div>
    `;

    const photoMessage =
      photoCount && photoCount > 0
        ? `Our team has uploaded ${photoCount} photo${photoCount > 1 ? "s" : ""} showing the latest construction progress and developments.`
        : "New progress updates have been added to your project timeline.";

    const progressMessage =
      progress && progress > 0
        ? ` Your project is currently <strong>${progress}% complete</strong> and progressing according to schedule.`
        : " The work is progressing steadily according to our construction timeline.";

    return {
      subject: `Timeline Update: ${project.name} - ${updateTitle}`,
      data: {
        title: "New Timeline Photos Added",
        message: `Dear ${user?.name || "Valued Client"},<br><br>We're pleased to inform you that new progress photos have been added to your project timeline for <strong>${project.name}</strong>.<br><br>${photoMessage}${progressMessage}<br><br>These updates provide you with a transparent view of the ongoing work and the quality craftsmanship being applied to your project.`,
        details,
        nextSteps:
          "You can view all the newly added photos and track your project's progress by accessing your client portal. We'll continue to update the timeline regularly as work advances.",
        showButton: true,
        buttonText: "View Timeline Photos",
        buttonUrl: `${process.env.NEXTAUTH_URL}/user/projects/${project.project_id}`,
      },
    };
  },

  invoiceSent: (
    project: any,
    user: any,
    transactionId: string,
    amount: number,
    dueDate: string,
    type: string
  ) => {
    const paymentTypeLabels: Record<string, string> = {
      downpayment: "Down Payment",
      partial_payment: "Partial Payment",
      balance: "Balance Payment",
      full: "Full Payment",
    };

    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Project Name</div>
    <div class="detail-value">${project.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project ID</div>
    <div class="detail-value">${project.project_id}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Invoice Number</div>
    <div class="detail-value">INV-${transactionId.slice(-8).toUpperCase()}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Payment Type</div>
    <div class="detail-value">${paymentTypeLabels[type] || type}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Amount Due</div>
    <div class="detail-value"><strong>₱${amount.toLocaleString()}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Due Date</div>
    <div class="detail-value">${new Date(dueDate).toLocaleDateString()}</div>
  </div>
</div>
  `;

    return {
      subject: `Invoice for ${project.name} - ₱${amount.toLocaleString()}`,
      data: {
        title: "Invoice for Your Project",
        message: `Dear ${user?.name || "Valued Client"},<br><br>This is your official invoice for <strong>${project.name}</strong>. Please review the payment details below and complete the payment by the due date to avoid any delays in your project timeline.`,
        details,
        nextSteps: `
<strong>Payment Instructions:</strong><br>
1. You can pay directly through our secure payment portal<br>
2. Bank Transfer: BPI Account # 1234-5678-90 (GianConstruct Inc.)<br>
3. GCash: 0908 982 1649 (GianConstruct)<br>
4. Please include the invoice number as payment reference
      `,
        showButton: true,
        buttonText: "Pay Now",
        buttonUrl: `${process.env.NEXTAUTH_URL}/payments/${transactionId}`,
      },
    };
  },

  invoicePaid: (
    project: any,
    user: any,
    transactionId: string,
    amount: number,
    paidDate: string
  ) => {
    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Project Name</div>
    <div class="detail-value">${project.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project ID</div>
    <div class="detail-value">${project.project_id}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Transaction ID</div>
    <div class="detail-value">${transactionId}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Amount Paid</div>
    <div class="detail-value"><strong>₱${amount.toLocaleString()}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Payment Date</div>
    <div class="detail-value">${new Date(paidDate).toLocaleDateString()}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Confirmation Number</div>
    <div class="detail-value">CONF-${transactionId.slice(-8).toUpperCase()}</div>
  </div>
</div>
  `;

    return {
      subject: `Payment Confirmation - ${project.name}`,
      data: {
        title: "Payment Received Successfully",
        message: `Dear ${user?.name || "Valued Client"},<br><br>Thank you for your payment of <strong>₱${amount.toLocaleString()}</strong> for <strong>${project.name}</strong>. Your payment has been processed successfully and we have received your funds.`,
        details,
        nextSteps:
          "Your project will continue as scheduled. You can track all updates through your client portal.",
        showButton: true,
        buttonText: "View Project",
        buttonUrl: `${process.env.NEXTAUTH_URL}/user/projects/${project.project_id}`,
      },
    };
  },

  paymentReceived: (
    project: any,
    user: any,
    transactionId: string,
    amount: number,
    paidDate: string
  ) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    return {
      subject: `Payment Received - ${project.name}`,
      data: {
        title: "Payment Received Confirmation",
        message: `Dear ${user.name},<br><br>We have successfully received your payment for <strong>${project.name}</strong>. Thank you for your prompt payment!`,
        details: `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Transaction ID</div>
    <div class="detail-value">${transactionId}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project Name</div>
    <div class="detail-value">${project.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project ID</div>
    <div class="detail-value">${project.project_id}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Amount Paid</div>
    <div class="detail-value"><strong>${formatCurrency(amount)}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Payment Date</div>
    <div class="detail-value">${formatDate(paidDate)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Payment Status</div>
    <div class="detail-value"><strong class="text-green-600">Confirmed</strong></div>
  </div>
</div>
      `,
        nextSteps: `
<strong>Next Steps:</strong><br>
1. Your payment has been recorded in our system<br>
2. Your project progress will continue as scheduled<br>
3. You can view your updated payment status in your account<br>
4. A receipt will be issued for your records
      `,
        showButton: true,
        buttonText: "View Project",
        buttonUrl: `${process.env.NEXTAUTH_URL}/user/projects/${project.project_id}`,
      },
    };
  },

  projectConfirmed: (
    project: any,
    user: any,
    downpaymentAmount: number,
    remainingBalance: number,
    transactionId: string,
    paymentDeadline: string
  ) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Project Name</div>
    <div class="detail-value">${project.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project ID</div>
    <div class="detail-value">${project.project_id}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Transaction ID</div>
    <div class="detail-value">${transactionId}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Total Project Cost</div>
    <div class="detail-value">${formatCurrency(project.totalCost || 0)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Downpayment Amount</div>
    <div class="detail-value"><strong>${formatCurrency(downpaymentAmount)}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Remaining Balance</div>
    <div class="detail-value">${formatCurrency(remainingBalance)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Payment Deadline</div>
    <div class="detail-value"><strong>${new Date(
      paymentDeadline
    ).toLocaleDateString("en-PH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project Location</div>
    <div class="detail-value">${project.location?.fullAddress || "Construction Site"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Current Status</div>
    <div class="detail-value"><span style="color: #059669; font-weight: 600;">Active - Awaiting Downpayment</span></div>
  </div>
</div>
  `;

    return {
      subject: `Project Confirmed: ${project.name}`,
      data: {
        title: "Project Confirmed Successfully! 🎉",
        message: `Dear ${user?.name || "Valued Client"},<br><br>Your project <strong>"${project.name}"</strong> has been successfully confirmed and is now active. Construction will begin shortly.<br><br>Here are your project confirmation details:`,
        details,
        nextSteps: `
<strong>Next Steps:</strong><br>
1. Please pay the downpayment of <strong>${formatCurrency(downpaymentAmount)}</strong> within 48 hours (by ${new Date(
          paymentDeadline
        ).toLocaleDateString("en-PH", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })})
<br>2. Payments must be made in cash at our office
<br>3. Office hours: Monday-Friday, 8:00 AM - 5:00 PM
<br>4. Official receipts will be provided upon payment
<br>5. Construction will commence after downpayment is received
<br>6. You will receive regular progress updates via email and in-app notifications
      `,
        showButton: true,
        buttonText: "View My Projects",
        buttonUrl: `${process.env.NEXTAUTH_URL}/user/projects`,
      },
    };
  },

  projectConfirmedAdmin: (
    project: any,
    client: any,
    downpaymentAmount: number,
    remainingBalance: number,
    transactionId: string,
    paymentDeadline: string
  ) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Project Name</div>
    <div class="detail-value">${project.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project ID</div>
    <div class="detail-value">${project.project_id}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Client Name</div>
    <div class="detail-value">${client.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Client Email</div>
    <div class="detail-value">${client.email}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Transaction ID</div>
    <div class="detail-value">${transactionId}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Downpayment Amount</div>
    <div class="detail-value"><strong>${formatCurrency(downpaymentAmount)}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Remaining Balance</div>
    <div class="detail-value">${formatCurrency(remainingBalance)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Payment Deadline</div>
    <div class="detail-value"><strong>${new Date(
      paymentDeadline
    ).toLocaleDateString("en-PH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project Location</div>
    <div class="detail-value">${project.location?.fullAddress || "Construction Site"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Current Status</div>
    <div class="detail-value"><span style="color: #2563eb; font-weight: 600;">Active - Awaiting Downpayment</span></div>
  </div>
</div>
  `;

    return {
      subject: `🔔 Project Confirmed by Client: ${project.name}`,
      data: {
        title: "Project Confirmed - Awaiting Payment",
        message: `Project <strong>"${project.name}"</strong> has been confirmed by <strong>${client.name}</strong> (${client.email}).<br><br>The project is now active and awaiting downpayment. Please prepare for construction commencement upon payment receipt.`,
        details,
        nextSteps: `
<strong>Action Required:</strong><br>
1. Await client's downpayment payment (48-hour deadline)
<br>2. Prepare project materials and schedule
<br>3. Assign project team members
<br>4. Schedule initial site visit
<br>5. Prepare construction permits and documentation
<br>6. Notify suppliers about upcoming material requirements
      `,
        showButton: true,
        buttonText: "View Project Details",
        buttonUrl: `${process.env.NEXTAUTH_URL}/admin/admin-project?project=${project.project_id}`,
        isInternal: true,
      },
    };
  },

  internalNewProject: (project: any, client: any) => {
    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Project Name</div>
    <div class="detail-value">${project.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project ID</div>
    <div class="detail-value">${project.project_id}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Client Name</div>
    <div class="detail-value">${client.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Client Email</div>
    <div class="detail-value">${client.email}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project Location</div>
    <div class="detail-value">${project.location?.fullAddress || "Construction Site"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Estimated Budget</div>
    <div class="detail-value">₱${(project.totalCost || 0).toLocaleString()}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Start Date</div>
    <div class="detail-value">${new Date(project.startDate).toLocaleDateString(
      "en-PH",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    )}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Current Status</div>
    <div class="detail-value"><span style="color: #f59e0b; font-weight: 600;">Pending Client Confirmation</span></div>
  </div>
</div>
  `;

    return {
      subject: `🏗️ New Project Created: ${project.name}`,
      data: {
        title: "New Project Created - Action Required",
        message: `A new project has been created and requires your attention.<br><br><strong>Client:</strong> ${client.name} (${client.email})<br><strong>Project:</strong> ${project.name}<br><strong>Estimated Budget:</strong> ₱${(project.totalCost || 0).toLocaleString()}<br><strong>Status:</strong> Pending Client Confirmation`,
        details,
        nextSteps: `
<strong>Action Required:</strong><br>
1. Prepare detailed project proposal and designs
<br>2. Schedule initial project kickoff meeting
<br>3. Assign project manager and team members
<br>4. Estimate materials and resources needed
<br>5. Set up project timeline and milestones
<br>6. Prepare contract documents for client review
      `,
        showButton: true,
        buttonText: "View Project Details",
        buttonUrl: `${process.env.NEXTAUTH_URL}/admin/admin-project?project=${project.project_id}`,
        isInternal: true,
      },
    };
  },

  internalProjectCompleted: (project: any, client: any) => {
    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Project Name</div>
    <div class="detail-value">${project.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project ID</div>
    <div class="detail-value">${project.project_id}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Client Name</div>
    <div class="detail-value">${client.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project Location</div>
    <div class="detail-value">${project.location?.fullAddress || "Construction Site"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Start Date</div>
    <div class="detail-value">${new Date(project.startDate).toLocaleDateString(
      "en-PH",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    )}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Completion Date</div>
    <div class="detail-value">${new Date().toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Total Value</div>
    <div class="detail-value">₱${(project.totalCost || 0).toLocaleString()}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Status</div>
    <div class="detail-value"><span style="color: #059669; font-weight: 600;">Completed</span></div>
  </div>
</div>
  `;

    return {
      subject: `✅ Project Completed: ${project.name}`,
      data: {
        title: "Project Successfully Completed",
        message: `Project <strong>"${project.name}"</strong> has been successfully completed.<br><br><strong>Client:</strong> ${client.name} (${client.email})<br><strong>Total Project Value:</strong> ₱${(project.totalCost || 0).toLocaleString()}<br><strong>Completion Date:</strong> ${new Date().toLocaleDateString(
          "en-PH",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        )}`,
        details,
        nextSteps: `
<strong>Final Steps Required:</strong><br>
1. Schedule final walkthrough with client
<br>2. Collect final payment (if any balance remains)
<br>3. Provide completion certificate and warranty documents
<br>4. Update project financial records
<br>5. Archive project documentation
<br>6. Request client testimonial or review
<br>7. Conduct project post-mortem with team
      `,
        showButton: true,
        buttonText: "View Project Details",
        buttonUrl: `${process.env.NEXTAUTH_URL}/admin/admin-project?project=${project.project_id}`,
        isInternal: true,
      },
    };
  },

  internalProjectCancelled: (project: any, client: any) => {
    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Project Name</div>
    <div class="detail-value">${project.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project ID</div>
    <div class="detail-value">${project.project_id}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Client Name</div>
    <div class="detail-value">${client.name}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Client Email</div>
    <div class="detail-value">${client.email}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Project Location</div>
    <div class="detail-value">${project.location?.fullAddress || "Construction Site"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Cancellation Date</div>
    <div class="detail-value">${new Date().toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Status</div>
    <div class="detail-value"><span style="color: #dc2626; font-weight: 600;">Cancelled</span></div>
  </div>
</div>
  `;

    return {
      subject: `🚫 Project Cancelled: ${project.name}`,
      data: {
        title: "Project Has Been Cancelled",
        message: `Project <strong>"${project.name}"</strong> has been cancelled.<br><br><strong>Client:</strong> ${client.name} (${client.email})<br><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString(
          "en-PH",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        )}<br><br>Please review the cancellation details below and take appropriate actions.`,
        details,
        nextSteps: `
<strong>Action Required:</strong><br>
1. Stop all work on this project immediately
<br>2. Calculate any cancellation fees or refunds due
<br>3. Notify all team members and suppliers
<br>4. Return any unused materials to inventory
<br>5. Update financial records and billing
<br>6. Archive project documentation
<br>7. Follow up with client regarding final settlement
<br>8. Document reasons for cancellation for future reference
      `,
        showButton: true,
        buttonText: "View Project Details",
        buttonUrl: `${process.env.NEXTAUTH_URL}/admin/admin-project?project=${project.project_id}`,
        isInternal: true,
      },
    };
  },

  // ========== PDC EMAIL TEMPLATES ==========
  pdcCreated: (metadata: any) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const daysUntilCheck = metadata.daysUntilCheck || 0;
    const daysMessage =
      daysUntilCheck > 0
        ? `in ${daysUntilCheck} day${daysUntilCheck > 1 ? "s" : ""}`
        : "today";

    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Check Number</div>
    <div class="detail-value">${metadata.checkNumber || "N/A"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Supplier</div>
    <div class="detail-value">${metadata.supplier || "Supplier"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Amount</div>
    <div class="detail-value"><strong>${formatCurrency(metadata.amount || 0)}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Check Date</div>
    <div class="detail-value">${formatDate(metadata.checkDate || new Date().toISOString())}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Status</div>
    <div class="detail-value">${(metadata.status || "pending").charAt(0).toUpperCase() + (metadata.status || "pending").slice(1)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Items</div>
    <div class="detail-value">${metadata.itemCount || 0} item${(metadata.itemCount || 0) > 1 ? "s" : ""}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Time to Issue</div>
    <div class="detail-value">${daysMessage}</div>
  </div>
</div>
    `;

    return {
      subject: `New PDC Created: ${metadata.checkNumber || "Unknown"} - ${formatCurrency(metadata.amount || 0)}`,
      data: {
        title: "New PDC Created",
        message: `A new Post-Dated Check has been created for <strong>${metadata.supplier || "Supplier"}</strong>.<br><br><strong>Check Details:</strong><br>• Check Number: ${metadata.checkNumber || "N/A"}<br>• Amount: ${formatCurrency(metadata.amount || 0)}<br>• Check Date: ${formatDate(metadata.checkDate || new Date().toISOString())}<br>• Status: ${(metadata.status || "pending").charAt(0).toUpperCase() + (metadata.status || "pending").slice(1)}`,
        details,
        nextSteps: `
<strong>Next Steps:</strong><br>
1. Review the PDC details<br>
2. Verify the check amount and date<br>
3. Monitor for auto-issuing on check date<br>
4. Keep track of inventory items linked to this PDC<br>
5. Update financial records accordingly
      `,
        showButton: true,
        buttonText: "View PDC Details",
        buttonUrl: `${process.env.NEXTAUTH_URL}/admin/pdc?check=${metadata.checkNumber}`,
        isInternal: true,
      },
    };
  },

  pdcIssued: (metadata: any) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const formatDateTime = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Check Number</div>
    <div class="detail-value">${metadata.checkNumber || "N/A"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Supplier</div>
    <div class="detail-value">${metadata.supplier || "Supplier"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Amount</div>
    <div class="detail-value"><strong>${formatCurrency(metadata.amount || 0)}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Check Date</div>
    <div class="detail-value">${formatDate(metadata.checkDate || new Date().toISOString())}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Issued On</div>
    <div class="detail-value">${formatDateTime(metadata.issuedAt || new Date().toISOString())}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Items Covered</div>
    <div class="detail-value">${metadata.itemCount || 0} inventory item${(metadata.itemCount || 0) > 1 ? "s" : ""}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Status</div>
    <div class="detail-value"><span style="color: #059669; font-weight: 600;">Issued</span></div>
  </div>
</div>
    `;

    return {
      subject: `PDC Issued: ${metadata.checkNumber || "Unknown"} - ${formatCurrency(metadata.amount || 0)}`,
      data: {
        title: "PDC Has Been Issued",
        message: `Post-Dated Check <strong>${metadata.checkNumber || "Unknown"}</strong> has been issued to <strong>${metadata.supplier || "Supplier"}</strong>.<br><br><strong>Issue Details:</strong><br>• Amount: ${formatCurrency(metadata.amount || 0)}<br>• Check Date: ${formatDate(metadata.checkDate || new Date().toISOString())}<br>• Issued On: ${formatDateTime(metadata.issuedAt || new Date().toISOString())}<br>• Items Covered: ${metadata.itemCount || 0} inventory item${(metadata.itemCount || 0) > 1 ? "s" : ""}`,
        details,
        nextSteps: `
<strong>Next Steps:</strong><br>
1. Track payment receipt from supplier<br>
2. Update inventory records if needed<br>
3. File PDC record for accounting<br>
4. Monitor for any issues with the check<br>
5. Update supplier payment history
      `,
        showButton: true,
        buttonText: "View PDC Details",
        buttonUrl: `${process.env.NEXTAUTH_URL}/admin/pdc?check=${metadata.checkNumber}`,
        isInternal: true,
      },
    };
  },

  pdcStatusUpdated: (metadata: any) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Check Number</div>
    <div class="detail-value">${metadata.checkNumber || "N/A"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Supplier</div>
    <div class="detail-value">${metadata.supplier || "Supplier"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Amount</div>
    <div class="detail-value"><strong>${formatCurrency(metadata.amount || 0)}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Previous Status</div>
    <div class="detail-value">${(metadata.oldStatus || "unknown").charAt(0).toUpperCase() + (metadata.oldStatus || "unknown").slice(1)}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">New Status</div>
    <div class="detail-value"><span style="color: #2563eb; font-weight: 600;">${(metadata.newStatus || "unknown").charAt(0).toUpperCase() + (metadata.newStatus || "unknown").slice(1)}</span></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Updated</div>
    <div class="detail-value">${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}</div>
  </div>
</div>
    `;

    return {
      subject: `PDC Status Update: ${metadata.checkNumber || "Unknown"} - ${metadata.oldStatus || "unknown"} → ${metadata.newStatus || "unknown"}`,
      data: {
        title: "PDC Status Updated",
        message: `Post-Dated Check <strong>${metadata.checkNumber || "Unknown"}</strong> status has been updated.<br><br><strong>Status Change:</strong><br>• From: ${(metadata.oldStatus || "unknown").charAt(0).toUpperCase() + (metadata.oldStatus || "unknown").slice(1)}<br>• To: ${(metadata.newStatus || "unknown").charAt(0).toUpperCase() + (metadata.newStatus || "unknown").slice(1)}<br>• Supplier: ${metadata.supplier || "Supplier"}<br>• Amount: ${formatCurrency(metadata.amount || 0)}`,
        details,
        nextSteps: `
<strong>Action Required:</strong><br>
1. Review the status change<br>
2. Update financial records if needed<br>
3. Notify relevant team members<br>
4. Take any necessary follow-up actions<br>
5. Document reason for status change
      `,
        showButton: true,
        buttonText: "View PDC Details",
        buttonUrl: `${process.env.NEXTAUTH_URL}/admin/pdc?check=${metadata.checkNumber}`,
        isInternal: true,
      },
    };
  },

  pdcStatsSummary: (metadata: any) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Total PDCs</div>
    <div class="detail-value">${metadata.totalPDCs || 0}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Total Amount</div>
    <div class="detail-value"><strong>${formatCurrency(metadata.totalAmount || 0)}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Issued PDCs</div>
    <div class="detail-value">${metadata.issuedPDCs || 0} (${formatCurrency(metadata.issuedAmount || 0)})</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Pending PDCs</div>
    <div class="detail-value">${metadata.pendingPDCs || 0} (${formatCurrency(metadata.pendingAmount || 0)})</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Cancelled PDCs</div>
    <div class="detail-value">${metadata.cancelledPDCs || 0} (${formatCurrency(metadata.cancelledAmount || 0)})</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Report Period</div>
    <div class="detail-value">${new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}</div>
  </div>
</div>
    `;

    return {
      subject: `PDC Statistics Summary - ${metadata.totalPDCs || 0} PDCs (${formatCurrency(metadata.totalAmount || 0)})`,
      data: {
        title: "PDC Statistics Summary",
        message: `Summary of Post-Dated Checks for the period ending ${new Date().toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        )}.<br><br><strong>Key Statistics:</strong><br>• Total PDCs: ${metadata.totalPDCs || 0}<br>• Total Amount: ${formatCurrency(metadata.totalAmount || 0)}<br>• Issued PDCs: ${metadata.issuedPDCs || 0}<br>• Pending PDCs: ${metadata.pendingPDCs || 0}<br>• Cancelled PDCs: ${metadata.cancelledPDCs || 0}`,
        details,
        nextSteps: `
<strong>Insights:</strong><br>
• ${metadata.issuedPDCs || 0} issued checks awaiting payment<br>
• ${metadata.pendingPDCs || 0} pending checks for future dates<br>
• Monitor upcoming check dates for auto-issuing<br>
• Review supplier payment patterns<br>
• Check for any overdue payments requiring follow-up
      `,
        showButton: true,
        buttonText: "View PDC Dashboard",
        buttonUrl: `${process.env.NEXTAUTH_URL}/admin/pdc`,
        isInternal: true,
      },
    };
  },

  pdcCancelled: (metadata: any) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const formatDateTime = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const details = `
<div class="details-container">
  <div class="detail-row">
    <div class="detail-label">Check Number</div>
    <div class="detail-value">${metadata.checkNumber || "N/A"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Supplier</div>
    <div class="detail-value">${metadata.supplier || "Supplier"}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Amount</div>
    <div class="detail-value"><strong>${formatCurrency(metadata.amount || 0)}</strong></div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Cancelled On</div>
    <div class="detail-value">${formatDateTime(metadata.cancelledAt || new Date().toISOString())}</div>
  </div>
  <div class="detail-row">
    <div class="detail-label">Status</div>
    <div class="detail-value"><span style="color: #dc2626; font-weight: 600;">Cancelled</span></div>
  </div>
</div>
    `;

    return {
      subject: `PDC Cancelled: ${metadata.checkNumber || "Unknown"} - ${formatCurrency(metadata.amount || 0)}`,
      data: {
        title: "PDC Cancelled",
        message: `Post-Dated Check <strong>${metadata.checkNumber || "Unknown"}</strong> has been cancelled.<br><br><strong>Cancellation Details:</strong><br>• Supplier: ${metadata.supplier || "Supplier"}<br>• Amount: ${formatCurrency(metadata.amount || 0)}<br>• Cancelled On: ${formatDateTime(metadata.cancelledAt || new Date().toISOString())}<br>• Reason: ${metadata.reason || "Not specified"}`,
        details,
        nextSteps: `
<strong>Action Required:</strong><br>
1. Update financial records<br>
2. Remove from pending payments<br>
3. Notify relevant departments<br>
4. Review reason for cancellation<br>
5. Update supplier payment history<br>
6. Document cancellation for audit purposes
      `,
        showButton: true,
        buttonText: "View PDC Details",
        buttonUrl: `${process.env.NEXTAUTH_URL}/admin/pdc?check=${metadata.checkNumber}`,
        isInternal: true,
      },
    };
  },
};
