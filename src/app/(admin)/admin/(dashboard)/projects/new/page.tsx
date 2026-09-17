import { ProjectFormCreate } from '@/components/admin/project-form-create'

export default function NewProjectPage() {
  return (
    <div>
      <h1 className="text-xl font-medium mb-6">Tambah Proyek Baru</h1>
      <ProjectFormCreate />
    </div>
  )
}
