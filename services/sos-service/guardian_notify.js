// =============================================================
//  Kanad S.H.I.E.L.D. — Guardian Notification Service
//  Owner: Developer 1
//
//  Notifies all emergency contacts of a user when SOS is fired.
//  NOTIFY_MODE=mock  → console log (safe for demo, no credentials)
//  NOTIFY_MODE=twilio → real SMS via Twilio REST API
//
//  silent=true  → SMS is sent without triggering an audible alert
//    on the victim's phone (used for Silent SOS mode).
// =============================================================
'use strict';

let twilioClient = null;

function getTwilioClient() {
  if (!twilioClient) {
    const twilio = require('twilio');
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return twilioClient;
}

/**
 * Sends an SOS notification to all emergency contacts of a user.
 *
 * @param {Object} pg          - node-postgres Pool instance
 * @param {string} userId      - UUID of the victim user
 * @param {string} incidentId  - UUID of the created incident
 * @param {Object} location    - { lat, lng }
 * @param {boolean} silent     - If true, omit ringtone/vibration hint in message
 */
async function notifyGuardians(pg, userId, incidentId, location, silent = false) {
  const { rows } = await pg.query(
    `SELECT ec.contact_name, ec.contact_phone, u.full_name
     FROM emergency_contacts ec
     JOIN users u ON u.id = ec.user_id
     WHERE ec.user_id = $1`,
    [userId]
  );

  if (rows.length === 0) {
    console.log(`[GUARDIAN] No emergency contacts for user ${userId}`);
    return { sent: 0 };
  }

  const mapsLink = `https://maps.google.com/?q=${location.lat},${location.lng}`;
  const alertType = silent ? '🔕 SILENT SOS' : '🚨 SOS ALERT';
  const victimName = rows[0].full_name || 'A user';

  const messageBody = [
    `${alertType} — Kanad S.H.I.E.L.D.`,
    `${victimName} has triggered an emergency alert.`,
    `Location: ${mapsLink}`,
    `Incident Ref: ${incidentId.slice(0, 8).toUpperCase()}`,
    `Reply SAFE if she contacts you and is safe.`,
  ].join('\n');

  const results = await Promise.allSettled(
    rows.map((contact) => sendSMS(contact.contact_phone, messageBody, contact.contact_name))
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.length - sent;
  console.log(`[GUARDIAN] Notified ${sent}/${rows.length} contacts for incident ${incidentId} (silent=${silent})`);
  if (failed > 0) {
    console.warn(`[GUARDIAN] ${failed} notification(s) failed for incident ${incidentId}`);
  }
  return { sent, failed, total: rows.length };
}

/**
 * Low-level SMS sender — dispatches to Twilio or console-mock.
 */
async function sendSMS(toPhone, body, contactName = '') {
  if (process.env.NOTIFY_MODE === 'twilio') {
    const client = getTwilioClient();
    await client.messages.create({
      body,
      from: process.env.TWILIO_FROM_NUMBER,
      to: toPhone,
    });
    console.log(`[GUARDIAN] Twilio SMS sent to ${contactName} (${toPhone})`);
  } else {
    // Mock mode — logs the message instead of sending
    console.log(`[GUARDIAN-MOCK] SMS to ${contactName} (${toPhone}):\n${body}\n`);
  }
}

/**
 * Sends a status-update SMS to guardians when incident is resolved.
 */
async function notifyResolved(pg, userId, incidentId) {
  const { rows } = await pg.query(
    'SELECT contact_name, contact_phone FROM emergency_contacts WHERE user_id = $1',
    [userId]
  );

  const body = [
    `✅ Kanad S.H.I.E.L.D. — Incident Update`,
    `Incident ${incidentId.slice(0, 8).toUpperCase()} has been RESOLVED.`,
    `Police have confirmed the situation is under control.`,
  ].join('\n');

  await Promise.allSettled(rows.map((c) => sendSMS(c.contact_phone, body, c.contact_name)));
}

module.exports = { notifyGuardians, notifyResolved };
