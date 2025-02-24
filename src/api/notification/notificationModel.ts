import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm'
import { User } from '@api/user/userModel'
import { NotificationType } from './interface'

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column()
  senderId!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'sender_id' })
  sender!: User

  @Column()
  receiverId!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'receiver_id' })
  receiver!: User

  @Column()
  message!: string

  @Column({ type: 'boolean', default: true })
  read!: boolean

  @Column({ type: 'enum', enum: NotificationType })
  notificationType!: NotificationType

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt!: Date

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt!: Date

  constructor(
    senderId: string,
    receiverId: string,
    message: string,
    read: boolean,
    notificationType: NotificationType
  ) {
    this.senderId = senderId
    this.receiverId = receiverId
    this.message = message
    this.read = read
    this.notificationType = notificationType
  }
}
