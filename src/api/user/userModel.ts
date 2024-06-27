import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from 'typeorm'
import { Project } from '../project/projectModel'
import { AuthType } from '../auth/interface'

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'varchar', length: 255 })
  email: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  password?: string | null

  @Column({ type: 'enum', enum: AuthType, default: AuthType.USER_PASSWORD })
  authType!: AuthType

  @Column({ type: 'boolean', default: false })
  notifications?: boolean

  @Column({ type: 'varchar', length: 255, nullable: true })
  profilePictureFileName?: string

  @OneToMany(() => Project, (project) => project.user)
  projects?: Project[]

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
    authType: AuthType,
    profilePictureFileName?: string,
    password?: string
  ) {
    this.email = email
    this.authType = authType
    this.profilePictureFileName = profilePictureFileName
    this.password = password
  }
}
