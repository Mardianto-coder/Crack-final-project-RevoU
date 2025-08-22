import { PrismaClient, Level, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create demo users
  const pwd = await bcrypt.hash("password", 10);
  await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: {},
    create: { name: "Demo Student", email: "student@example.com", password: pwd, role: Role.STUDENT }
  });
  await prisma.user.upsert({
    where: { email: "instructor@example.com" },
    update: {},
    create: { name: "Demo Instructor", email: "instructor@example.com", password: pwd, role: Role.INSTRUCTOR }
  });

  // Create courses
  const js = await prisma.course.upsert({
    where: { slug: "javascript-fundamentals" },
    update: {},
    create: {
      slug: "javascript-fundamentals",
      title: "JavaScript Fundamentals",
      description: "Start coding with JS: variables, functions, arrays, and DOM.",
      category: "Programming",
      level: Level.BEGINNER,
      durationMins: 180,
      lessons: {
        create: [
          { title: "Intro & Setup", content: "Install VS Code. Try console.log('Hello').", order: 1 },
          { title: "Variables & Types", content: "let/const, primitive types.", order: 2 },
          { title: "Functions & Arrays", content: "Encapsulate logic, map/filter.", order: 3 }
        ]
      },
      quiz: {
        create: {
          title: "JS Basics Quiz",
          questions: [
            { id: "q1", prompt: "Which keyword creates a block-scoped variable?", choices: ["var","let","function","scope"], answerIndex: 1 },
            { id: "q2", prompt: "What method filters items by test?", choices: ["forEach","map","reduce","filter"], answerIndex: 3 }
          ]
        } as any
      }
    }
  });

  const ui = await prisma.course.upsert({
    where: { slug: "ui-ux-essentials" },
    update: {},
    create: {
      slug: "ui-ux-essentials",
      title: "UI/UX Design Essentials",
      description: "Design interfaces that feel good: hierarchy, contrast, spacing.",
      category: "Design",
      level: Level.INTERMEDIATE,
      durationMins: 120,
      lessons: { create: [
        { title: "Design Principles", content: "Hierarchy, contrast, spacing.", order: 1 },
        { title: "Wireframing", content: "Validate ideas with low-fi wireframes.", order: 2 }
      ]},
      quiz: {
        create: {
          title: "UI Essentials Quiz",
          questions: [
            { id: "u1", prompt: "Which is NOT a core design principle?", choices: ["Hierarchy","Repetition","Confusion","Contrast"], answerIndex: 2 }
          ]
        } as any
      }
    }
  });

  console.log("Seeded:", js.slug, ui.slug);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
