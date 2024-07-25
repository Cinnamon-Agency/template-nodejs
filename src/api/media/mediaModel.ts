import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne
} from 'typeorm'
import { Project } from '../project/projectModel'
import { MediaType } from './interface'

@Entity()
export class Media {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'enum', enum: MediaType })
  mediaType!: MediaType

  @Column({ type: 'varchar', unique: true })
  mediaFileName!: string

  @Column()
  projectId!: string

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project!: Project

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

  constructor(mediaType: MediaType, mediaFileName: string, projectId: string) {
    ;(this.mediaType = mediaType), (this.mediaFileName = mediaFileName)
    this.projectId = projectId
  }
}
