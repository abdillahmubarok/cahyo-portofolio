import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function ProjectDetailRedirect({ params }: Props) {
  const { slug } = await params
  redirect(`/?project=${slug}#projects`)
}
