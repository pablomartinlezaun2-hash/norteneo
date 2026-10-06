import type { Chapter } from '@/content/services/types'
import { ScrubChapter } from './ScrubChapter'
import { StartEndChapter } from './StartEndChapter'
import { VideoChapter } from './VideoChapter'
import { ScenesChapter } from './ScenesChapter'
import { TermsChapter } from './TermsChapter'
import { SitesChapter } from './SitesChapter'
import { GridChapter } from './GridChapter'
import { CutsChapter } from './CutsChapter'
import { ScriptChapter } from './ScriptChapter'
import { PhoneChapter } from './PhoneChapter'
import { LogChapter } from './LogChapter'
import { CameraChapter } from './CameraChapter'

/** Tres capítulos (afirmación + interacción + prueba), uno por pantalla. */
export function Chapters({ chapters, examplesAnchor }: { chapters: Chapter[]; examplesAnchor?: string }) {
  return (
    <>
      {chapters.map((c, i) => {
        const id = `cap-${i + 1}`
        switch (c.kind) {
          case 'scrub':
            return <ScrubChapter key={id} id={id} chapter={c} />
          case 'start-end':
            return <StartEndChapter key={id} id={id} chapter={c} />
          case 'video':
            return <VideoChapter key={id} id={id} chapter={c} />
          case 'scenes':
            return <ScenesChapter key={id} id={id} chapter={c} />
          case 'terms':
            return <TermsChapter key={id} id={id} chapter={c} />
          case 'sites':
            return <SitesChapter key={id} id={id} chapter={c} anchorId={examplesAnchor} />
          case 'grid':
            return <GridChapter key={id} id={id} chapter={c} />
          case 'cuts':
            return <CutsChapter key={id} id={id} chapter={c} />
          case 'script':
            return <ScriptChapter key={id} id={id} chapter={c} />
          case 'phone':
            return <PhoneChapter key={id} id={id} chapter={c} />
          case 'log':
            return <LogChapter key={id} id={id} chapter={c} />
          case 'camera':
            return <CameraChapter key={id} id={id} chapter={c} />
        }
      })}
    </>
  )
}
