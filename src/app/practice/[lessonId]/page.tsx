import { notFound } from "next/navigation";
import { curriculum } from "@/lib/curriculum/repository";
import { PracticeScreen } from "@/components/practice/PracticeScreen";

export async function generateStaticParams() {
  return (await curriculum.listAllLessonIds()).map((lessonId) => ({ lessonId }));
}

export default async function PracticePage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const context = await curriculum.getLessonContext(lessonId);
  if (!context) notFound();
  return <PracticeScreen context={context} />;
}
