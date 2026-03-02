import appleSignin from 'apple-signin-auth'
import { logger } from '../../logger'

export class AppleAuthService {
  /**
   * Verifies an Apple identity token from iOS mobile app
   * @param identityToken - The identity token received from Apple Sign-In
   * @returns Decoded token payload with user information
   */
  async verifyIdentityToken(identityToken: string) {
    try {
      // Verify the Apple identity token
      const appleIdTokenClaims = await appleSignin.verifyIdToken(
        identityToken,
        {
          // Verify the token was issued to your app
          audience: process.env.APPLE_BUNDLE_ID || '',
          // Optionally verify the nonce if you're using one
          // nonce: 'nonce_value',
          // Ignore expiration for development (remove in production)
          ignoreExpiration: false
        }
      )

      if (!appleIdTokenClaims) {
        logger.error({
          message: 'Failed to verify Apple identity token - no claims returned'
        })
        return null
      }

      // Apple tokens contain minimal information
      // The email might not be present if the user has already signed in before
      return {
        appleId: appleIdTokenClaims.sub, // Unique user identifier
        email: appleIdTokenClaims.email, // May be undefined on subsequent logins
        emailVerified:
          appleIdTokenClaims.email_verified === 'true' ||
          appleIdTokenClaims.email_verified === true,
        isPrivateEmail:
          appleIdTokenClaims.is_private_email === 'true' ||
          appleIdTokenClaims.is_private_email === true
      }
    } catch (err) {
      logger.error({
        message: 'Error verifying Apple identity token',
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      })
      return null
    }
  }
}

export const appleAuthService = new AppleAuthService()
