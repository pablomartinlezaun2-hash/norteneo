import type { ServiceId } from '@/content/services'
import type { ServiceDetail } from './types'
import { aiVideo } from './ai-video'
import { ai3d } from './ai-3d'
import { websites } from './websites'
import { editing } from './editing'
import { content } from './content'
import { mobileCinema } from './mobile-cinema'

/** Detalle de cada subpágina de servicio, por id. */
export const details: Record<ServiceId, ServiceDetail> = {
  'ai-video': aiVideo,
  'ai-3d': ai3d,
  websites,
  editing,
  content,
  'mobile-cinema': mobileCinema,
}

export type { ServiceDetail, Chapter } from './types'
