import type { Task } from "../types/task";

export const seedTasks: Task[] = [
  {
    id: "task1",
    title: "Setup Astro project",
    description: "Create base Kanban UI structure",
    status: "todo",
  },
  {
    id: "task2",
    title: "Build TaskCard component",
    description: "Render title and description",
    status: "in-progress",
  },
  {
    id: "task3",
    title: "Fix TaskList typings",
    description: "Add proper Task typing and delete guard",
    status: "done",
  },
];
