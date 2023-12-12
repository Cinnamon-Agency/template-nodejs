import express from 'express'

import { authRouter } from '../api/auth/auth.router'
import { profileRouter } from '../api/profile/profile.router'
import { messageRouter } from '../api/messages/messageRouter'

const router = express.Router()

router.use('/auth', authRouter)
router.use('/profile', profileRouter)
router.use('/messages', messageRouter)

export default router
