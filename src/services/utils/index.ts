import { ResponseCode, ResponseMessage } from "../../interfaces"

export function getResponseMessage(code: number): ResponseMessage {
    const key = ResponseCode[code] as keyof typeof ResponseMessage
    return ResponseMessage[key] || ResponseMessage.SERVER_ERROR
  }