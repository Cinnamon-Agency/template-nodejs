// At the moment for the sake of simplicity will use sendgrid
// Possible changes in the future

import nodemailer from 'nodemailer'
import config from '@core/config'
import { ISendEmail } from './interface'
import { logger } from '@core/logger'

export const sendEmail = ({ revieverMail, message }: ISendEmail) => {
  // Create a transporter object
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // use SSL
    auth: {
      user: config.GMAIL_MAIL,
      pass: config.GMAIL_PASSWORD,
    },
  })

  // Configure the mailoptions object
  const mailOptions = {
    from: config.GMAIL_MAIL,
    to: revieverMail,
    subject: message.title,
    text: message.content,
  }

  // Send the email
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      logger.error(`Error: ${error}`)
    } else {
      logger.error('Email sent: ' + info.response)
    }
  })
}
