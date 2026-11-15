import type { Course, CurriculumData, Lesson, LessonContext, Subject, Unit } from "@/types/curriculum";
import { sampleCurriculum } from "@/data/sample-curriculum";

/**
 * Data access boundary. Components and pages only talk to this interface.
 * Phase 2 swaps the in-memory version for a database-backed one
 * (Postgres/Supabase/Prisma, with tenant scoping per school) without
 * touching any UI code.
 */
export interface CurriculumRepository {
  listSubjects(): Promise<Subject[]>;
  listCourses(subjectId: string): Promise<Course[]>;
  listUnits(courseId: string): Promise<Unit[]>;
  listLessons(unitId: string): Promise<Lesson[]>;
  getLessonContext(lessonId: string): Promise<LessonContext | null>;
  listAllLessonIds(): Promise<string[]>;
}

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;

export function createInMemoryRepository(data: CurriculumData): CurriculumRepository {
  return {
    async listSubjects() {
      return [...data.subjects].sort(byOrder);
    },
    async listCourses(subjectId) {
      return data.courses.filter((c) => c.subjectId === subjectId).sort(byOrder);
    },
    async listUnits(courseId) {
      return data.units.filter((u) => u.courseId === courseId).sort(byOrder);
    },
    async listLessons(unitId) {
      return data.lessons.filter((l) => l.unitId === unitId).sort(byOrder);
    },
    async getLessonContext(lessonId) {
      const lesson = data.lessons.find((l) => l.id === lessonId);
      if (!lesson) return null;
      const unit = data.units.find((u) => u.id === lesson.unitId);
      const course = unit && data.courses.find((c) => c.id === unit.courseId);
      const subject = course && data.subjects.find((s) => s.id === course.subjectId);
      if (!unit || !course || !subject) return null;
      return { subject, course, unit, lesson };
    },
    async listAllLessonIds() {
      return data.lessons.map((l) => l.id);
    },
  };
}

export const curriculum: CurriculumRepository = createInMemoryRepository(sampleCurriculum);
