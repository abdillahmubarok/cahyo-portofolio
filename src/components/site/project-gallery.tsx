import Image from 'next/image'
import { getStorageUrl } from '@/lib/utils'
import { ImageReveal } from '@/components/motion/reveal'
import type { ProjectMedia } from '@/lib/types'

type ProjectGalleryProps = {
  images: ProjectMedia[]
  projectTitle: string
}

export function ProjectGallery({ images, projectTitle }: ProjectGalleryProps) {
  if (!images || images.length === 0) {
    return null
  }

  // Organize images into layout blocks while guaranteeing EVERY image is rendered
  const blocks: Array<
    | { type: 'single'; item: ProjectMedia; index: number }
    | { type: 'pair'; items: [ProjectMedia, ProjectMedia]; startIndex: number }
  > = []

  let i = 0
  while (i < images.length) {
    const current = images[i]
    const next = images[i + 1]

    const currentRatio = (current.width && current.height)
      ? current.width / current.height
      : (current.aspect_ratio || 1.33)

    // If there is a next image and neither is super wide, pair them up
    if (next) {
      const nextRatio = (next.width && next.height)
        ? next.width / next.height
        : (next.aspect_ratio || 1.33)

      const isCurrentWide = currentRatio >= 1.6
      const isNextWide = nextRatio >= 1.6

      // Pair if neither is ultra-wide landscape
      if (!isCurrentWide && !isNextWide) {
        blocks.push({
          type: 'pair',
          items: [current, next],
          startIndex: i,
        })
        i += 2
        continue
      }
    }

    // Otherwise render as single block
    blocks.push({
      type: 'single',
      item: current,
      index: i,
    })
    i += 1
  }

  return (
    <div className="space-y-8 md:space-y-12">
      {blocks.map((block, blockIndex) => {
        if (block.type === 'pair') {
          const [imgA, imgB] = block.items
          const urlA = getStorageUrl(imgA.storage_path)
          const urlB = getStorageUrl(imgB.storage_path)

          return (
            <div
              key={`pair-${imgA.id}-${imgB.id}`}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start"
            >
              {/* Left Image */}
              <div className="flex flex-col">
                <ImageReveal delay={0.1}>
                  <div className="relative overflow-hidden bg-surface">
                    <Image
                      src={urlA}
                      alt={imgA.alt_text || `${projectTitle} — gambar ${block.startIndex + 1}`}
                      width={imgA.width || 1200}
                      height={imgA.height || 800}
                      className="w-full h-auto block"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      loading="lazy"
                    />
                  </div>
                </ImageReveal>
                {imgA.caption && (
                  <p className="text-xs text-muted mt-2 tracking-wide font-mono">
                    {imgA.caption}
                  </p>
                )}
              </div>

              {/* Right Image */}
              <div className="flex flex-col">
                <ImageReveal delay={0.2}>
                  <div className="relative overflow-hidden bg-surface">
                    <Image
                      src={urlB}
                      alt={imgB.alt_text || `${projectTitle} — gambar ${block.startIndex + 2}`}
                      width={imgB.width || 1200}
                      height={imgB.height || 800}
                      className="w-full h-auto block"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      loading="lazy"
                    />
                  </div>
                </ImageReveal>
                {imgB.caption && (
                  <p className="text-xs text-muted mt-2 tracking-wide font-mono">
                    {imgB.caption}
                  </p>
                )}
              </div>
            </div>
          )
        }

        // Single Block
        const img = block.item
        const url = getStorageUrl(img.storage_path)
        const ratio = (img.width && img.height) ? img.width / img.height : (img.aspect_ratio || 1.33)
        const isPortrait = ratio < 0.85

        return (
          <div
            key={`single-${img.id}`}
            className={isPortrait ? 'max-w-2xl mx-auto' : 'w-full'}
          >
            <ImageReveal delay={blockIndex % 2 === 0 ? 0.1 : 0.15}>
              <div className="relative overflow-hidden bg-surface">
                <Image
                  src={url}
                  alt={img.alt_text || `${projectTitle} — gambar ${block.index + 1}`}
                  width={img.width || 1600}
                  height={img.height || 900}
                  className="w-full h-auto block"
                  sizes={isPortrait ? '(max-width: 768px) 100vw, 672px' : '100vw'}
                  loading="lazy"
                />
              </div>
            </ImageReveal>
            {img.caption && (
              <p className="text-xs text-muted mt-2 tracking-wide font-mono">
                {img.caption}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
