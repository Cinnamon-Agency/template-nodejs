import express from 'express'

import { docsRouter } from '@documentation'
import { authRouter } from '@api/auth/authRouter'
import { projectRouter } from '@api/project/projectRouter'
import { userRouter } from '@api/user/userRouter'
import { notificationRouter } from '@api/notification/notificationRouter'
import { supportRequestRouter } from '@api/support_request/supportRequestRouter'

export const router = express.Router()

const v1 = express.Router()

v1.use('/auth', authRouter)
v1.use('/user', userRouter)
v1.use('/project', projectRouter)
v1.use('/notification', notificationRouter)
v1.use('/support_request', supportRequestRouter)

router.use('/api/v1', v1)
router.use('/api-docs', docsRouter)
