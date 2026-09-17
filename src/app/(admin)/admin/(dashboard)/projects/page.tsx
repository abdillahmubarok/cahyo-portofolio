import Link from 'next/link'
import Image from 'next/image'
import { getAllProjects } from '@/lib/queries'
import { getStorageUrl } from '@/lib/utils'
import { Plus, Edit, Eye, EyeOff } from 'lucide-react'
import { ProjectActions } from '@/components/admin/project-actions'

export default async function AdminProjectsPage() {
  const projects = await getAllProjects()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium">Proyek</h1>
        <Link href="/admin/projects/new" className="btn btn-primary btn-sm">
          <Plus size={14} />
          Tambah Proyek
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="admin-card text-center py-16">
          <p className="text-muted mb-4">Belum ada proyek.</p>
          <Link href="/admin/projects/new" className="btn btn-outline btn-sm">
            <Plus size={14} />
            Buat Proyek Pertama
          </Link>
        </div>
      ) : (
        <div className="admin-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-label font-medium">Gambar</th>
                  <th className="text-left p-3 text-label font-medium">Judul</th>
                  <th className="text-left p-3 text-label font-medium hidden md:table-cell">Kategori</th>
                  <th className="text-left p-3 text-label font-medium hidden lg:table-cell">Status</th>
                  <th className="text-left p-3 text-label font-medium hidden lg:table-cell">Featured</th>
                  <th className="text-right p-3 text-label font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                    <td className="p-3">
                      {project.cover ? (
                        <Image
                          src={getStorageUrl(project.cover.storage_path)}
                          alt={project.title}
                          width={60}
                          height={40}
                          className="object-cover"
                          style={{ width: 60, height: 40 }}
                        />
                      ) : (
                        <div className="w-[60px] h-[40px] bg-surface flex items-center justify-center">
                          <span className="text-[9px] text-muted">—</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <Link href={`/admin/projects/${project.id}/edit`} className="font-medium hover:text-accent transition-colors">
                        {project.title}
                      </Link>
                    </td>
                    <td className="p-3 text-muted hidden md:table-cell">{project.category || '—'}</td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className={`inline-flex items-center gap-1 text-xs ${project.published ? 'text-success' : 'text-muted'}`}>
                        {project.published ? <Eye size={12} /> : <EyeOff size={12} />}
                        {project.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {project.featured ? (
                        <span className="text-xs text-accent">★ Featured</span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/projects/${project.id}/edit`}
                          className="btn btn-outline btn-sm"
                          aria-label={`Edit ${project.title}`}
                        >
                          <Edit size={12} />
                          Edit
                        </Link>
                        <ProjectActions projectId={project.id} published={project.published} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
