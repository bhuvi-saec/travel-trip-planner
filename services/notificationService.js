const nodemailer = require("nodemailer");

function missingConfigMessage(keys) {
  return `Not configured — add ${keys.join(", ")} to .env`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function getEmailTransporter() {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) return null;

  const port = Number(EMAIL_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("EMAIL_PORT must be a valid port number.");
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST.trim(),
    port,
    secure: port === 465,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: {
      user: EMAIL_USER.trim(),
      pass: EMAIL_PASS.trim().replace(/\s+/g, "")
    }
  });
}

function getNotificationContent(trip, event) {
  if (event.type === "reminder") {
    return {
      subject: `A reminder about your ${trip.destination} trip`,
      heading: "Your trip is coming up",
      intro: `This is a reminder about your upcoming trip to ${trip.destination}.`
    };
  }
  if (event.type === "status") {
    return {
      subject: `Trip ${trip.status.toLowerCase()}: ${trip.tripId}`,
      heading: `Trip ${trip.status.toLowerCase()}`,
      intro: `The status of your trip to ${trip.destination} is now ${trip.status.toLowerCase()}.`
    };
  }
  return {
    subject: `Trip confirmed: ${trip.tripId}`,
    heading: "Your trip is confirmed",
    intro: `Your trip to ${trip.destination} has been confirmed.`
  };
}

async function sendEmail(trip, event) {
  const transporter = getEmailTransporter();
  if (!transporter || !trip.email) return missingConfigMessage(["EMAIL_HOST", "EMAIL_USER", "EMAIL_PASS"]);

  const content = getNotificationContent(trip, event);
  const escaped = {
    name: escapeHtml(trip.name),
    destination: escapeHtml(trip.destination),
    tripId: escapeHtml(trip.tripId),
    travelDate: escapeHtml(new Date(trip.travelDate).toLocaleDateString("en-IN", { dateStyle: "long" })),
    plan: escapeHtml(trip.plan),
    status: escapeHtml(trip.status),
    intro: escapeHtml(content.intro)
  };
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: trip.email,
    subject: content.subject.replace(/[\r\n]+/g, " ").slice(0, 180),
    text: `Hello ${trip.name},\n\n${content.intro}\nTrip ID: ${trip.tripId}\nTravel date: ${new Date(trip.travelDate).toLocaleDateString("en-IN", { dateStyle: "long" })}\nPlan: ${trip.plan}\nTotal: ₹${trip.finalPrice}\nStatus: ${trip.status}`,
    html: `
      <div style="max-width:600px;margin:24px auto;padding:32px;font-family:Arial,sans-serif;color:#20352b;background:#f7f7f1">
        <p style="color:#668071;font-size:12px;font-weight:bold;letter-spacing:2px">TRAVEL TRIP PLANNER</p>
        <h1 style="font-size:28px">${escapeHtml(content.heading)}</h1>
        <p>Hello ${escaped.name},</p>
        <p>${escaped.intro}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:24px">
          <tr><td style="padding:10px;border-bottom:1px solid #dce3dc">Trip ID</td><td style="padding:10px;border-bottom:1px solid #dce3dc"><strong>${escaped.tripId}</strong></td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #dce3dc">Destination</td><td style="padding:10px;border-bottom:1px solid #dce3dc">${escaped.destination}</td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #dce3dc">Travel date</td><td style="padding:10px;border-bottom:1px solid #dce3dc">${escaped.travelDate}</td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #dce3dc">Plan</td><td style="padding:10px;border-bottom:1px solid #dce3dc">${escaped.plan}</td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #dce3dc">Travelers</td><td style="padding:10px;border-bottom:1px solid #dce3dc">${escapeHtml(trip.travelers)}</td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #dce3dc">Total</td><td style="padding:10px;border-bottom:1px solid #dce3dc">₹${escapeHtml(trip.finalPrice)}</td></tr>
          <tr><td style="padding:10px">Status</td><td style="padding:10px">${escaped.status}</td></tr>
        </table>
        <p style="margin-top:24px">We look forward to helping you travel comfortably.</p>
      </div>
    `
  });
  return "sent";
}

async function sendTripNotification(trip, event = { type: "confirmation" }) {
  try {
    return { email: await sendEmail(trip, event) };
  } catch (error) {
    console.error(`Trip email notification failed for ${trip.tripId}:`, error.message);
    if (error.code === "EAUTH" || error.responseCode === 535) {
      return {
        email: "Gmail rejected the sender login. Set EMAIL_USER to your real Gmail address and EMAIL_PASS to a valid Google App Password."
      };
    }
    if (error.code === "ENOTFOUND") {
      return {
        email: "Could not find the SMTP host. Check EMAIL_HOST and your internet connection."
      };
    }
    if (error.code === "ETIMEDOUT" || error.code === "ECONNECTION" || error.code === "ESOCKET") {
      return {
        email: "Could not connect to SMTP. Check EMAIL_HOST, EMAIL_PORT, and your internet or firewall settings."
      };
    }
    if (error.code === "EENVELOPE" || error.responseCode === 550) {
      return {
        email: "The recipient email was rejected. Check the email address entered for this booking."
      };
    }
    return {
      email: "Email sending failed. Check the SMTP settings in .env and the server log for details."
    };
  }
}

module.exports = { sendTripNotification };
