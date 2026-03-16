/**
 * Mock Email Service (Resend Integration Concept)
 * In a real production environment, this would be a Supabase Edge Function 
 * that uses the Resend SDK to send transactional emails.
 */

export async function sendWelcomeEmail(email: string, name: string) {
  console.log(`[Resend Mock] Sending welcome email to ${name} (${email})...`)
  // Implementation would involve:
  // await resend.emails.send({ ... })
}

export async function sendWorkoutSummaryEmail(email: string, summary: unknown) {
  void summary
  console.log(`[Resend Mock] Sending workout summary to ${email}...`)
}

export async function sendPremiumWelcomeEmail(email: string) {
  console.log(`[Resend Mock] Sending premium welcome email to ${email}...`)
}
