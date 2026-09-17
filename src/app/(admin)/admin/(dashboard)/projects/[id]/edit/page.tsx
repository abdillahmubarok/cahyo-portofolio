import { notFound } from 'next/navigation'
import { getProjectById } from '@/lib/queries'
import { ProjectFormEdit } from '@/components/admin/project-form-edit'
import { MediaManager } from '@/components/admin/media-manager'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params
  const project = await getProjectById(id)

  if (!project) notFound()

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-medium">Edit: {project.title}</h1>

      <ProjectFormEdit project={project} />

      <div>
        <h2 className="text-lg font-medium mb-4">Media & Gambar</h2>
        <MediaManager project={project} />
      </div>
    </div>
  )
}
