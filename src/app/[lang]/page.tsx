import { getLocalePath } from '@/lib/i18n';
import { redirect } from 'next/navigation';

export default async function LangPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  redirect(getLocalePath(lang, 'docs'));
}
