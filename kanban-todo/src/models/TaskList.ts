import { type Task, type TaskStatus } from "../types/task";

type TaskListener = (tasks: Task[]) => void;

export class TaskList {
  tasks: Task[];
  funcs: TaskListener[];
  constructor() {
    this.tasks = [];
    this.funcs = [];
  }

  add(task: Task) {
    this.tasks.push(task);
    this.reRender();
  }

  delete(id: string) {
    const foundIdx = this.tasks.findIndex((t) => t.id === id);
    if (foundIdx === -1) return;
    this.tasks.splice(foundIdx, 1);
    this.reRender();
  }

  update(task: Task) {
    const foundIdx = this.tasks.findIndex((t) => t.id === task.id);
    if (foundIdx === -1) return;
    this.tasks[foundIdx] = task;
    this.reRender();
  }

  getAll() {
    return [...this.tasks];
  }

  getByStatus(status: TaskStatus) {
    const foundTasks = this.tasks.filter((t) => t.status === status);
    return foundTasks;
  }

  findTaskById(id: string) {
    const found = this.tasks.find((t) => t.id === id);
    if (!found) return;
    return found;
  }

  addFunc(func: TaskListener) {
    this.funcs.push(func);
  }
  reRender() {
    this.funcs.forEach((func) => func(this.tasks));
  }
}
