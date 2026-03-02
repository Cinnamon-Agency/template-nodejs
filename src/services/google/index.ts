import { OAuth2Client } from 'google-auth-library'  
import config from '@core/config'
import { sendLogEvents } from '../cloudwatch'

export class GoogleAuthService {
  constructor() {}

  /**
   * Verifies a Google ID token from mobile apps (Android/iOS) or web
   * @param idToken - The ID token received from Google Sign-In
   * @returns Decoded token payload with user information
   */
  async verifyIdToken(idToken: string) {
    try {
      // Try to verify with each client ID
      const client = new OAuth2Client(config.GOOGLE_CLIENT_ID)

      try {
        const ticket = await client.verifyIdToken({
          idToken,
          audience: config.GOOGLE_CLIENT_ID
        })

        const payload = ticket.getPayload()

        if (!payload) {
          await sendLogEvents(
            'Failed to verify Google ID token with any client' +
              ' idToken: ' +
              idToken.substring(0, 20) +
              '...'
          )
          return null
        }

        return {
          googleId: payload.sub,
          email: payload.email,
          emailVerified: payload.email_verified,
          firstName: payload.given_name,
          lastName: payload.family_name,
          picture: payload.picture
        }
      } catch (err) {
        await sendLogEvents(
          'Failed to verify Google ID token with any client' +
            ' idToken: ' +
            idToken.substring(0, 20) +
            '...'
        )
      }

      return null
    } catch (err) {
      await sendLogEvents(
        'Error verifying Google ID token' +
          ' error: ' +
          (err instanceof Error ? err.message : 'Unknown error') +
          ' stack: ' +
          (err instanceof Error ? err.stack : undefined)
      )
      return null
    }
  }
}

export const googleAuthService = new GoogleAuthService()
