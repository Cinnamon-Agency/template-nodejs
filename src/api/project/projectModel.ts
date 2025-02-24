import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm'
import { Media } from '@api/media/mediaModel'
import { User } from '@api/user/userModel'
import { ProjectStatus } from './interface'

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Column({ type: 'varchar' })
  description!: string

  @Column({ type: 'date' })
  deadline!: string

  @Column()
  userId!: string

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: User

  @Column({ type: 'enum', enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  projectStatus?: ProjectStatus

  @OneToMany(() => Media, media => media.project)
  mediaFiles?: Media[]

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
    userId: string,
    name: string,
    description: string,
    deadline: string
  ) {
    ;(this.userId = userId), (this.name = name)
    this.description = description
    this.deadline = deadline
  }
}
