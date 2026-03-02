import { TaskList } from "../models/TaskList";
import type { Task, TaskStatus } from "../types/task";
import { seedTasks } from "../data/SeedData";

export class KanbanApp {
  addTaskBtn: HTMLButtonElement | null;
  modalRoot: HTMLElement | null;
  modalCloseBtn: HTMLButtonElement | null;
  taskForm: HTMLFormElement | null;
  titleInput: HTMLInputElement | null;
  taskInput: HTMLInputElement | null;
  statusInput: HTMLSelectElement | null;
  taskList: TaskList;
  tasks: Task[];
  boadRoot: HTMLElement | null;
  activeTaskId: string | null;
  modalEditBtn: HTMLButtonElement | null;
  modalDeleteBtn: HTMLButtonElement | null;
  modalMode: "add" | "view" | "edit";
  dragTaskId: string | null;
  isDragging: boolean;

  constructor() {
    this.addTaskBtn =
      document.querySelector<HTMLButtonElement>("#add-task-btn");
    this.modalRoot = document.querySelector<HTMLElement>("#modal-root");
    this.modalCloseBtn =
      document.querySelector<HTMLButtonElement>("#modal-close-btn");
    this.boadRoot = document.querySelector<HTMLElement>("#board-root");

    this.taskForm = document.querySelector<HTMLFormElement>("#task-form");
    this.titleInput = document.querySelector<HTMLInputElement>("#title");
    this.taskInput = document.querySelector<HTMLInputElement>("#task");
    this.statusInput =
      document.querySelector<HTMLSelectElement>("#task-status");

    this.activeTaskId = null;

    this.modalEditBtn =
      document.querySelector<HTMLButtonElement>("#modal-edit-btn");
    this.modalEditBtn?.addEventListener("click", () => {
      this.onEditClick();
    });
    this.modalDeleteBtn =
      document.querySelector<HTMLButtonElement>("#modal-delete-btn");
    this.modalDeleteBtn?.addEventListener("click", () => {
      this.onDeleteClick();
    });

    this.taskList = new TaskList();
    seedTasks.forEach((t) => this.taskList.add(t));
    this.tasks = this.taskList.getAll();

    this.modalMode = "view";

    this.dragTaskId = null;

    this.isDragging = false;
  }
  init() {
    // on load, these need to be fired
    this.taskList.addFunc((tasks) => {
      this.tasks = [...tasks];
      this.renderBoard();
    });
    this.bindEvents();
  }

  bindEvents() {
    this.addBtn();
    this.closeBtn();
    this.handleSubmit();
    this.bindTaskCardClick();
    this.bindDragAndDrop();
  }

  addBtn() {
    this.addTaskBtn?.addEventListener("click", () => {
      this.openAddModal();
    });
  }

  closeBtn() {
    this.modalCloseBtn?.addEventListener("click", () => {
      this.closeModal();
    });
  }

  openAddModal() {
    this.resetForm();
    this.setModalMode("add");
    this.openModal();
  }

  openModal() {
    if (!this.modalRoot) return;
    this.modalRoot.hidden = false;
    this.modalRoot.setAttribute("aria-hidden", "false");
  }

  closeModal() {
    this.activeTaskId = null;
    if (!this.modalRoot) return;
    this.modalRoot.hidden = true;
    this.modalRoot.setAttribute("aria-hidden", "true");
  }

  bindDragAndDrop() {
    this.boadRoot?.addEventListener("dragstart", (e) => {
      this.isDragging = true;
      const target = e.target as HTMLElement;
      const card = target.closest<HTMLElement>(".todoItem");
      if (!card) return;

      const taskId = card.dataset.taskId;
      if (!taskId) return;
      this.dragTaskId = taskId;

      e.dataTransfer?.setData("text/plain", taskId);
      e.dataTransfer!.effectAllowed = "move";
    });

    this.boadRoot?.addEventListener("dragend", () => {
      this.isDragging = false;
      this.dragTaskId = null;
    });

    const zones: Array<{ el: HTMLElement | null; status: TaskStatus }> = [
      { el: document.querySelector("#column-todo-list"), status: "todo" },
      {
        el: document.querySelector("#column-in-progress-list"),
        status: "in-progress",
      },
      { el: document.querySelector("#column-done-list"), status: "done" },
    ];

    // for each column, when elmenet is dropped, change the status of the dropped elment to the corresponding one

    for (const z of zones) {
      z.el?.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = "move";
      });
      z.el?.addEventListener("dragenter", () => {
        z.el!.classList.add("is-over");
      });

      z.el?.addEventListener("dragleave", () =>
        z.el!.classList.remove("is-over"),
      );
      z.el?.addEventListener("drop", (e) => {
        z.el?.classList.remove("is-over");
        const idFromTransfer = e.dataTransfer?.getData("text/plain") || "";
        const taskId = this.dragTaskId ?? idFromTransfer;

        if (!taskId) return;
        const task = this.taskList.findTaskById(taskId);
        if (!task) return;

        if (task.status === z.status) return;

        this.taskList.update({
          ...task,
          status: z.status,
        });

        this.dragTaskId = null;
      });
    }
  }

  handleSubmit() {
    this.taskForm?.addEventListener("submit", (e: Event) => {
      e.preventDefault();
      const title = this.titleInput?.value.trim() ?? "";
      const taskDes = this.taskInput?.value.trim() ?? "";
      const statusValue = this.statusInput?.value as TaskStatus | undefined;

      if (!title || !taskDes || !statusValue) {
        return;
      }

      if (this.modalMode === "edit") {
        if (!this.activeTaskId) return;
        this.taskList.update({
          id: this.activeTaskId,
          title: title,
          description: taskDes,
          status: statusValue,
        });

        this.closeModal();
        this.resetForm();
        return;
      }
      const task: Task = {
        id: crypto.randomUUID(),
        title: title,
        description: taskDes,
        status: statusValue,
      };

      this.taskList.add(task);
      this.resetForm();
      this.closeModal();
    });
  }

  renderBoard() {
    const todoList = document.querySelector<HTMLElement>("#column-todo-list");
    const inProgressList = document.querySelector<HTMLElement>(
      "#column-in-progress-list",
    );
    const doneList = document.querySelector<HTMLElement>("#column-done-list");

    if (!todoList || !inProgressList || !doneList) return;

    todoList.innerHTML = "";
    inProgressList.innerHTML = "";
    doneList.innerHTML = "";

    for (const task of this.tasks) {
      const card = this.renderTaskCard(task);
      if (task.status === "todo") {
        todoList.appendChild(card);
      } else if (task.status === "in-progress") {
        inProgressList.appendChild(card);
      } else if (task.status === "done") {
        doneList.appendChild(card);
      }
    }
  }

  renderTaskCard(task: Task) {
    // Here, recreating TaskCard
    const div = document.createElement("div");
    div.className = "todoItem";
    div.dataset.taskId = task.id;
    div.draggable = true;

    const titleh3 = document.createElement("h3");
    const desP = document.createElement("p");
    const title = task.title;
    titleh3.textContent = title;
    const des = task.description;
    desP.textContent = des;
    div.append(titleh3, desP);
    return div;
  }

  // get curresponding column
  addToColumn(status: TaskStatus) {
    // This returns corresponding column
    const statusMap = {
      todo: "#column-todo",
      "in-progress": "#column-in-progress",
      done: "#column-done",
    };
    return document.querySelector(statusMap[status]);
  }

  resetForm() {
    if (!this.titleInput || !this.taskInput || !this.statusInput) return;
    this.titleInput.value = "";
    this.taskInput.value = "";
    this.statusInput.value = "todo";
  }

  bindTaskCardClick() {
    this.boadRoot?.addEventListener("click", (e) => {
      if (this.isDragging) return;
      console.log("board click bound", this.boadRoot);
      const target = e.target as HTMLElement;
      const card = target.closest<HTMLElement>(".todoItem");
      console.log("card", card);
      if (!card) return;

      const taskId = card.dataset.taskId;
      console.log("taskId:", taskId);
      if (!taskId) return;

      const task = this.taskList.getAll().find((t) => t.id === taskId);
      console.log("task", task);
      if (!task) return;
      this.openViewModal(task);
    });
  }

  openViewModal(task: Task) {
    // Depending on the mode, it opens different modal when clicked
    this.activeTaskId = task.id;
    // const existingTask = this.taskList.findTaskById(this.activeTaskId)
    // if (existingTask) {
    //   // pre-fill the form with the existing data

    // }
    this.setModalMode("view");
    const titleEl = document.querySelector<HTMLElement>("#modal-title");
    const descEl = document.querySelector<HTMLElement>("#modal-description");
    const statusEl = document.querySelector<HTMLElement>("#modal-status");

    if (titleEl) titleEl.textContent = task.title;
    if (descEl) descEl.textContent = task.description;
    if (statusEl) statusEl.textContent = task.status;

    this.openModal();
  }

  setModalMode(mode: "view" | "add" | "edit"): void {
    const formSection = document.querySelector<HTMLElement>(
      "#modal-form-section",
    );
    const viewSection = document.querySelector<HTMLElement>(
      "#modal-view-section",
    );

    if (!formSection || !viewSection) return;

    this.modalMode = mode;

    // Show exactly ONE section
    if (mode === "view") {
      formSection.hidden = true;
      viewSection.hidden = false;
      return;
    }

    // add OR edit
    formSection.hidden = false;
    viewSection.hidden = true;
  }

  onEditClick() {
    this.setModalMode("edit");
    // pre-fill
    if (!this.activeTaskId) return;

    const task = this.taskList.findTaskById(this.activeTaskId);
    if (!task) return;

    this.titleInput!.value = task.title;
    this.taskInput!.value = task.description;
    this.statusInput!.value = task.status;
  }

  onDeleteClick() {
    if (!this.activeTaskId) return;

    const ok = window.confirm("Do you want to delete this item?");
    if (!ok) return;
    this.taskList.delete(this.activeTaskId);
    this.closeModal();
    this.resetForm();
  }
}
