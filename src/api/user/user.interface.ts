import fileUpload from 'express-fileupload'
import { AsyncResponse } from '../../interfaces'

export type FullUser = {
  id: number
  firstName: string
  lastName: string
  email: string
  password: string
  profilePicture: string
  createdAt: string
  updatedAt: string
}

export type User = Omit<FullUser, 'password' | 'createdAt' | 'updatedAt'>

export interface ICreateUser {
  firstName: string
  lastName: string
  email: string
  password: string
  profileImage: string
}

export interface IGetUserByEmail {
  email: string
}

export interface IGetUserById {
  userId: number
}

export enum UserStatus {
  UNVERIFIED = 'Unverified',
  VERIFIED = 'Verified',
  DELETED = 'Deleted'
}

export type Profile = Omit<User, 'email'>

export interface ISaveProfileImage {
  userId: number
  image: fileUpload.UploadedFile
}

export interface IGetProfile {
  userId: number
}

export interface IEditProfile {
  userId: number
  firstName: string
  lastName: string
  email: string
  profileImage: string
}

export interface IUpdateProfile {
  userId: number
  firstName?: string
  lastName?: string
  email?: string
  profileImage?: string
}

export interface ISetUserStatus {
  userId: number,
  status: UserStatus
}

export interface IUserService {
  getUserByEmail(params: IGetUserByEmail): AsyncResponse<FullUser>
  getUserById(params: IGetUserById): AsyncResponse<FullUser>
  create(params: ICreateUser): AsyncResponse<FullUser>
  setUserStatus(params: ISetUserStatus): AsyncResponse<null>
  getProfile(params: IGetProfile): AsyncResponse<Profile>
  editProfile(params: IEditProfile): AsyncResponse<Profile>
  updateProfile(params: IUpdateProfile): AsyncResponse<Profile>
  saveProfileImage(params: ISaveProfileImage): AsyncResponse<Profile>
}
