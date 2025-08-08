import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column
} from 'typeorm'
import { SupportRequestStatus } from './interface'

@Entity()
export class SupportRequest {
  @PrimaryGeneratedColumn('increment')
  id!: number

  @Column({ type: 'varchar' })
  email!: string

  @Column({ type: 'varchar' })
  firstName!: string

  @Column({ type: 'varchar' })
  lastName!: string

  @Column({ type: 'varchar' })
  subject!: string

  @Column({ type: 'text' })
  message!: string

  @Column({
    type: 'enum',
    enum: SupportRequestStatus,
    default: SupportRequestStatus.OPEN
  })
  status?: SupportRequestStatus

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)'
  })
  createdAt!: Date

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)'
  })
  updatedAt!: Date

  constructor(
    email: string,
    firstName: string,
    lastName: string,
    subject: string,
    message: string
  ) {
    this.email = email
    this.firstName = firstName
    this.lastName = lastName
    this.subject = subject
    this.message = message
  }
}
