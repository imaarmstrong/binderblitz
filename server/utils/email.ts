import { $fetch } from 'ofetch'
import { useRuntimeConfig } from '#imports'

export async function sendVerificationEmail(to: string, code: string) {
  const { resendApiKey, resendFromEmail } = useRuntimeConfig() as {
    resendApiKey?: string
    resendFromEmail?: string
  }

  if (!resendApiKey || !resendFromEmail) {
    // eslint-disable-next-line no-console
    console.warn('Resend is not fully configured. Skipping verification email send.')
    return
  }

  try {
    await $fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: {
        from: resendFromEmail,
        to,
        subject: 'Verify your BinderBlitz account',
        html: `
          <p>Welcome to <strong>BinderBlitz</strong>!</p>
          <p>Your verification code is:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 0.2em;">${code}</p>
          <p>This code will expire in 15 minutes.</p>
        `,
      },
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to send verification email via Resend', error)
  }
}
