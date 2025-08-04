export enum EmailTemplate {
  LOGIN = 'Login',
  RESET_PASSWORD = 'ResetPassword',
  REGISTER_PATIENT = 'RegisterPatient',
  REGISTER_TEAM_MEMBER = 'RegisterTeamMember',
  REGISTER_PROVIDER = 'RegisterProvider',
  REGISTER_ADMIN = 'RegisterAdmin',
  APPOINTMENT_REMINDER = 'AppointmentReminder',
  ASK_RATING_REMINDER = 'AskRatingReminder',
  CONTACT_SUPPORT = 'ContactSupport',
  APPOINTMENT_CANCELED_PATIENT = 'AppointmentCanceledPatient',
  APPOINTMENT_CANCELED_PROVIDER = 'AppointmentCanceledProvider',
  APPOINTMENT_BOOKED_PATIENT = 'AppointmentBookedPatient',
  APPOINTMENT_BOOKED_PROVIDER = 'AppointmentBookedProvider',
  YEARLY_REMINDER = 'YearlyReminder',
  MONTHLY_REPORT = 'MonthlyReport',
  CONTACT_SUPPORT_SUCCESS = 'ContactSupportSuccess',
  PAYMENT_SUCCESS = 'PaymentSuccess'
}

export interface IEmailData {
  [key: string]: string
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  template?: EmailTemplate;
  dynamicData?: IEmailData;
}
