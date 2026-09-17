import Image from 'next/image'
import { getStorageUrl } from '@/lib/utils'
import type { ProjectMedia } from '@/lib/types'

export function DrawerProjectGallery({ images, title }: { images: ProjectMedia[]; title: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-6">
      {images.map((image, index) => {
        const ratio = image.width && image.height ? image.width / image.height : image.aspect_ratio
        const wide = ratio !== null && ratio >= 1.6
        return (
          <figure key={image.id} data-media-id={image.id} className={wide ? 'md:col-span-2' : ''}>
            <Image src={getStorageUrl(image.storage_path)} alt={image.alt_text || `${title} — gambar ${index + 1}`}
              width={image.width || 1200} height={image.height || 800} className="w-full h-auto block bg-surface"
              sizes={wide ? '(max-width: 768px) 100vw, 75vw' : '(max-width: 768px) 100vw, 38vw'} loading="lazy" />
            {image.caption && <figcaption className="text-xs text-muted mt-2 tracking-wide font-mono">{image.caption}</figcaption>}
          </figure>
        )
      })}
    </div>
  )
}
