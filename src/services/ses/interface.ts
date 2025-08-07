export enum EmailTemplate {
  VERIFY_LOGIN = 'VerifyLogin',
  RESET_PASSWORD = 'ResetPassword',
  REGISTER = 'Register',
  CONTACT_SUPPORT = 'ContactSupport',
  CONTACT_SUPPORT_SUCCESS = 'ContactSupportSuccess',
  NOTIFICATION = 'Notification'
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
