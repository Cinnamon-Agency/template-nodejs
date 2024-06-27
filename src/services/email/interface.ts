export interface ISendEmail {
  revieverMail: string
  message: IMessage
}

interface IMessage {
  title: string
  content: string
}
