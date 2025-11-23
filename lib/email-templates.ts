// lib/email-templates.ts - UPDATED WITH PROJECT TEMPLATES

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

  // Internal notification templates
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

    return {
      subject: subjectMap[type],
      data: {
        title: `Appointment ${status}`,
        message: `A client appointment has been ${type} in the system. Please review the details below and ensure all relevant team members are informed about this update.<br><br>Appointment details:`,
        details,
        nextSteps:
          "Please ensure all relevant team members are informed about this appointment update and take any necessary follow-up actions.",
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
        title: "New Consultation Inquiry",
        message: `A potential client has submitted a consultation request and is awaiting confirmation. This represents a new business opportunity that requires your immediate attention and professional follow-up.<br><br>Client inquiry details:`,
        details,
        nextSteps:
          "Please review this inquiry promptly and contact the client within 24 hours to confirm the appointment and provide excellent customer service.",
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
};
