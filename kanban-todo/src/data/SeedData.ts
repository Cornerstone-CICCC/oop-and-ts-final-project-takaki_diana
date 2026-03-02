import type { Task } from "../types/task";

export const seedTasks: Task[] = [
  {
    id: "task1",
    title: "Example Task 1",
    description: "Complete Task1",
    status: "todo",
  },
  {
    id: "task2",
    title: "Example Task 2",
    description: "Complete Task 2",
    status: "in-progress",
  },
  {
    id: "task3",
    title: "Example Task 3",
    description: "Complete Task 3",
    status: "done",
  },
];
