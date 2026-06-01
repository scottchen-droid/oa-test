import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength, IsIn } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateAnnouncementDto {
  @ApiProperty({ example: '教育訓練管理辦法' })
  @IsString()
  @MaxLength(200)
  title: string

  @ApiProperty({ example: '人資公告' })
  @IsString()
  @MaxLength(100)
  category: string

  @ApiProperty({ example: '一般公告' })
  @IsString()
  @MaxLength(100)
  type: string

  @ApiProperty()
  @IsString()
  content: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  contentPreview?: string

  @ApiProperty({ example: 'HR-1' })
  @IsString()
  @MaxLength(100)
  authorName: string

  @ApiProperty()
  @IsDateString()
  publishDate: string

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean

  @ApiPropertyOptional({ enum: ['global', 'company', 'department', 'role'], default: 'global' })
  @IsOptional()
  @IsString()
  @IsIn(['global', 'company', 'department', 'role'])
  scopeType?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scopeId?: string

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  attachments?: Array<{ fileName: string; fileUrl: string; fileType: string; fileSize?: number }>

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  tags?: string[]
}

export class UpdateAnnouncementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  type?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  contentPreview?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  authorName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishDate?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scopeType?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scopeId?: string

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  attachments?: Array<{ fileName: string; fileUrl: string; fileType: string; fileSize?: number }>

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  tags?: string[]
}

export class AnnouncementQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number = 1

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number = 20
}
