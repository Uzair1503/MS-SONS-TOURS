import nodemailer from "nodemailer";

const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_APP_PASSWORD = process.env.SMTP_APP_PASSWORD || "";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: SMTP_USER,
    pass: SMTP_APP_PASSWORD,
  },
});

if (!SMTP_USER || !SMTP_APP_PASSWORD) {
  console.warn("SMTP_USER/SMTP_APP_PASSWORD not set — booking notification emails will not be sent");
}

type BookingInquiry = Record<string, unknown>;

function row(label: string, value: unknown): string {
  const display = value === undefined || value === null || value === "" ? "—" : String(value);
  return `<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:600;width:220px">${label}</td><td style="padding:8px 12px;border:1px solid #ddd">${display}</td></tr>`;
}

function buildEmailBody(inquiry: BookingInquiry): string {
  const rows = [
    row("Reference Number", inquiry.referenceNumber),
    row("Full Name", inquiry.fullName),
    row("WhatsApp Number", inquiry.whatsappNumber),
    row("Email", inquiry.email),
    row("Package", inquiry.package ? (inquiry.package as Record<string, unknown>).title ?? inquiry.packageId : inquiry.packageId),
    row("Duration (Days)", inquiry.durationDays),
    row("Departure Date", inquiry.departureDate),
    row("Adults", inquiry.adults),
    row("Children", inquiry.children),
    row("Infants", inquiry.infants),
    row("Hotel Preference", inquiry.hotelPreference),
    row("Room Type", inquiry.roomType),
    row("Airline", inquiry.airline ? (inquiry.airline as Record<string, unknown>).name ?? inquiry.airlineId : inquiry.airlineId),
    row("Special Requirements", inquiry.specialRequirements),
    row("Message", inquiry.message),
    row("Estimated Price", inquiry.estimatedPrice !== undefined && inquiry.estimatedPrice !== null ? `${inquiry.estimatedPrice} ${String(inquiry.currency || "PKR")}` : undefined),
    row("Status", inquiry.status),
  ];

  return `
    <div style="font-family:Arial,sans-serif;color:#333;max-width:640px;margin:0 auto">
      <h2 style="color:#0b5d3a;margin-bottom:4px">New Booking Inquiry</h2>
      <p style="margin:0 0 16px;color:#666">A customer has submitted a new booking request on MS Sons Tours.</p>
      <table style="border-collapse:collapse;width:100%">${rows.join("")}</table>
      <p style="margin-top:16px;color:#999;font-size:12px">This email was generated automatically by MS Sons Tours.</p>
    </div>
  `;
}

export async function sendBookingNotification(inquiry: BookingInquiry): Promise<void> {
  if (!SMTP_USER || !SMTP_APP_PASSWORD) {
    throw new Error("SMTP credentials not configured (SMTP_USER / SMTP_APP_PASSWORD)");
  }

  const referenceNumber = String(inquiry.referenceNumber || "N/A");
  const fullName = String(inquiry.fullName || "N/A");
  const html = buildEmailBody(inquiry);

  await transporter.sendMail({
    from: SMTP_USER,
    to: "mssonstravel@gmail.com",
    subject: `New Booking - ${referenceNumber} - ${fullName}`,
    html,
  });
}