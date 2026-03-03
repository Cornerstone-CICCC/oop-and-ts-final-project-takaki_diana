import { TaskList } from "../models/TaskList";
import type { Task, TaskStatus } from "../types/task";
import { seedTasks } from "../data/SeedData";

export class KanbanApp {
  addTaskBtn: HTMLButtonElement | null = null;
  addColumnBtn: HTMLButtonElement | null = null;
  modalRoot: HTMLElement | null = null;
  modalCloseBtn: HTMLButtonElement | null = null;
  taskForm: HTMLFormElement | null = null;
  titleInput: HTMLInputElement | null = null;
  taskInput: HTMLInputElement | null = null;
  statusInput: HTMLSelectElement | null = null;
  taskList: TaskList;
  tasks: Task[] = [];
  boardRoot: HTMLElement | null = null;
  activeTaskId: string | null = null;
  modalEditBtn: HTMLButtonElement | null = null;
  modalDeleteBtn: HTMLButtonElement | null = null;
  modalMode: "add" | "view" | "edit" = "view";
  dragTaskId: string | null = null;
  isDragging: boolean = false;
  columns: { id: string; title: string }[] = [];
  readonly STORAGE_COLS = "kanban-columns";
  readonly STORAGE_TASKS = "kanban-tasks";

  constructor() {
    this.taskList = new TaskList();
    const savedTasks = localStorage.getItem(this.STORAGE_TASKS);
    if (savedTasks) {
      JSON.parse(savedTasks).forEach((t: Task) => this.taskList.add(t));
    } else {
      seedTasks.forEach((t) => this.taskList.add(t));
    }
    this.tasks = this.taskList.getAll();
    this.columns = this.loadColumns();
  }

  init() {
    console.log("🚀 KanbanApp.init() called");

    this.boardRoot = document.querySelector<HTMLElement>("#board-root");
    this.addTaskBtn =
      document.querySelector<HTMLButtonElement>("#add-task-btn");
    this.addColumnBtn =
      document.querySelector<HTMLButtonElement>("#add-column-btn");
    this.modalRoot = document.querySelector<HTMLElement>("#modal-root");
    this.modalCloseBtn =
      document.querySelector<HTMLButtonElement>("#modal-close-btn");
    this.taskForm = document.querySelector<HTMLFormElement>("#task-form");
    this.titleInput = document.querySelector<HTMLInputElement>("#title");
    this.taskInput = document.querySelector<HTMLInputElement>("#task");
    this.statusInput =
      document.querySelector<HTMLSelectElement>("#task-status");
    this.modalEditBtn =
      document.querySelector<HTMLButtonElement>("#modal-edit-btn");
    this.modalDeleteBtn =
      document.querySelector<HTMLButtonElement>("#modal-delete-btn");

    console.log("📋 boardRoot:", !!this.boardRoot);
    console.log("📋 Columns:", this.columns);

    if (!this.boardRoot) {
      console.error("❌ #board-root no encontrado!");
      return;
    }

    this.renderBoard();
    this.renderTasks();

    this.initGlobalEvents();
    this.bindDragAndDrop();
    this.addBtn();
    this.closeBtn();
    this.handleSubmit();

    this.taskList.addFunc(() => {
      this.renderTasks();
    });

    if (this.modalEditBtn) {
      this.modalEditBtn.addEventListener("click", () => this.onEditClick());
    }
    if (this.modalDeleteBtn) {
      this.modalDeleteBtn.addEventListener("click", () => this.onDeleteClick());
    }
  }

  initGlobalEvents() {
    const board = this.boardRoot;
    if (!board) return;

    board?.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;

      const card = target.closest(".todoItem") as HTMLElement | null;
      if (card && !this.isDragging) {
        const taskId = card.dataset.taskId;
        if (taskId) {
          const task = this.taskList.findTaskById(taskId);
          if (task) this.openViewModal(task);
          return;
        }
      }

      const deleteBtn = target.closest(".delete-col") as HTMLElement | null;
      if (deleteBtn) {
        const colId = deleteBtn.getAttribute("data-id");
        if (colId && confirm("Delete column and all its tasks?")) {
          this.deleteColumn(colId);
        }
        return;
      }

      const editBtn = target.closest(".edit-col") as HTMLElement | null;
      if (editBtn) {
        const colId = editBtn.getAttribute("data-id");
        if (colId) this.editColumn(colId);
        return;
      }

      const addInColBtn = target.closest(
        ".add-task-in-col",
      ) as HTMLElement | null;
      if (addInColBtn) {
        const colId = addInColBtn.getAttribute("data-col-id");
        if (colId) {
          this.openAddModal(colId as TaskStatus);
        }
        return;
      }
    });
  }

  addBtn() {
    this.addTaskBtn?.addEventListener("click", () => {
      this.openAddModal();
    });
    this.addColumnBtn?.addEventListener("click", () => {
      const title = prompt("New column name:");
      if (!title) return;
      const clean = title.trim();
      if (!clean) return;
      this.addColumn(clean);
    });
  }

  closeBtn() {
    this.modalCloseBtn?.addEventListener("click", () => {
      this.closeModal();
    });
  }

  openAddModal(defaultStatus?: TaskStatus) {
    this.resetForm();

    if (this.statusInput) {
      this.statusInput.innerHTML = this.columns
        .map((col) => `<option value="${col.id}">${col.title}</option>`)
        .join("");

      if (defaultStatus) {
        this.statusInput.value = defaultStatus;
      }
    }
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
    const board = this.boardRoot;
    if (!board) return;

    board.addEventListener("dragstart", (e) => {
      this.isDragging = true;
      const target = e.target as HTMLElement;
      const card = target.closest(".todoItem") as HTMLElement | null;
      if (!card) return;
      this.dragTaskId = card.dataset.taskId || null;
    });

    board.addEventListener("dragend", () => {
      this.isDragging = false;
      this.dragTaskId = null;
      document
        .querySelectorAll(".task-list.is-over")
        .forEach((el) => el.classList.remove("is-over"));
    });

    // board.addEventListener("dragover", (e) => {
    //   e.preventDefault();
    //   const targetList = (e.target as HTMLElement).closest(
    //     ".task-list",
    //   ) as HTMLElement | null;
    //   if (targetList) targetList.classList.add("is-over");
    // });

    board.addEventListener("dragover", (e) => {
    const col = (e.target as HTMLElement).closest(".kanban-column") as HTMLElement | null;
    if (!col) return;

    e.preventDefault();

    const list = col.querySelector(".task-list") as HTMLElement | null;
    list?.classList.add("is-over");
  });

    // board.addEventListener("dragleave", (e) => {
    //   const targetList = (e.target as HTMLElement).closest(
    //     ".task-list",
    //   ) as HTMLElement | null;
    //   if (targetList) targetList.classList.remove("is-over");
    // });

    board.addEventListener("dragleave", (e) => {
    const col = (e.target as HTMLElement).closest(".kanban-column") as HTMLElement | null;
    if (!col) return;

    const list = col.querySelector(".task-list") as HTMLElement | null;
    list?.classList.remove("is-over");
  });

    // board.addEventListener("drop", (e) => {
    //   e.preventDefault();
    //   const targetList = (e.target as HTMLElement).closest(
    //     ".task-list",
    //   ) as HTMLElement | null;
    //   if (!targetList) return;

    //   targetList.classList.remove("is-over");

    //   const newStatus = targetList.id.replace("list-", "") as TaskStatus;
    //   const taskId = this.dragTaskId;

    //   if (taskId) {
    //     const task = this.taskList.findTaskById(taskId);
    //     if (task) {
    //       this.taskList.update({ ...task, status: newStatus });
    //       this.saveTasks();
    //     }
    //   }
    // });

    board.addEventListener("drop", (e) => {
    const col = (e.target as HTMLElement).closest(".kanban-column") as HTMLElement | null;
    if (!col) return;

    e.preventDefault();

    const list = col.querySelector(".task-list") as HTMLElement | null;
    list?.classList.remove("is-over");

    const newStatus = (list?.id ?? "").replace("list-", "") as TaskStatus;
    const taskId = this.dragTaskId;
    if (!newStatus || !taskId) return;

    const task = this.taskList.findTaskById(taskId);
    if (task) {
      this.taskList.update({ ...task, status: newStatus });
      this.saveTasks();
    }
  });
  }

  handleSubmit() {
    this.taskForm?.addEventListener("submit", (e: Event) => {
      e.preventDefault();
      const title = this.titleInput?.value.trim() ?? "";
      const taskDes = this.taskInput?.value.trim() ?? "";
      const statusValue = this.statusInput?.value as TaskStatus | undefined;

      if (!title || !taskDes || !statusValue) {
        alert("Please complete all fields.");
        return;
      }

      if (this.modalMode === "edit") {
        if (!this.activeTaskId) return;

        this.taskList.update({
          id: this.activeTaskId,
          title: title,
          description: taskDes,
          status: statusValue as any,
        });
        this.saveTasks();

        this.closeModal();
        this.resetForm();
        return;
      }

      const task: Task = {
        id: crypto.randomUUID(),
        title: title,
        description: taskDes,
        status: statusValue as any,
      };

      this.taskList.add(task);
      this.saveTasks();
      this.resetForm();
      this.closeModal();
    });
  }

  renderTasks() {
    const allTasks = this.taskList.getAll();

    document
      .querySelectorAll(".task-list")
      .forEach((l) => ((l as HTMLElement).innerHTML = ""));

    allTasks.forEach((task) => {
      let listContainer = document.querySelector(
        `.task-list[id="list-${task.status}"]`,
      ) as HTMLElement;

      if (!listContainer) {
        console.warn(
          `No column was found for: ${task.status}, moving to 'todo'.`,
        );
        listContainer = document.querySelector("#list-todo") as HTMLElement;
        task.status = "todo";
      }
      if (listContainer) {
        listContainer.appendChild(this.renderTaskCard(task));
      }
    });
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

  saveTasks() {
    localStorage.setItem(
      this.STORAGE_TASKS,
      JSON.stringify(this.taskList.getAll()),
    );
  }

  addToColumn(status: TaskStatus) {
    return document.querySelector(`#column-${status}`);
  }

  loadColumns() {
    const saved = localStorage.getItem(this.STORAGE_COLS);
    if (saved) {
      return JSON.parse(saved);
    }

    return [
      { id: "todo", title: "To Do" },
      { id: "in-progress", title: "In Progress" },
      { id: "done", title: "Done" },
    ];
  }

  saveColumns() {
    localStorage.setItem(this.STORAGE_COLS, JSON.stringify(this.columns));
  }

  renderBoard() {
    const boardRoot = this.boardRoot;
    if (!boardRoot) {
      console.warn("boardRoot no encontrado");
      return;
    }
    boardRoot.innerHTML = "";
    console.log("Render columns", this.columns);

    this.columns.forEach((col) => {
      const colEl = document.createElement("div");
      colEl.className = "kanban-column";
      colEl.id = `column-${col.id}`;
      colEl.innerHTML = `
        <div class="column-header">
          <h3>${col.title}</h3>
          <div class="column-actions">
            <button class="edit-col" data-id="${col.id}"><i class="fa-regular fa-pen-to-square"></i></button>
            <button class="delete-col" data-id="${col.id}"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        </div>

        <button class="add-task-in-col" data-col-id="${col.id}"><i class="fa-solid fa-plus"></i></button>

        <div class="task-list" id="list-${col.id}"></div>`;
      boardRoot.appendChild(colEl);
    });
  }

  addColumn(title: string) {
    const newCol = { id: `col-${Date.now()}`, title };
    this.columns.push(newCol);
    this.saveColumns();
    this.renderBoard();
    this.renderTasks();
  }

  deleteColumn(id: string) {
    this.columns = this.columns.filter((c) => c.id !== id);
    this.saveColumns();
    this.renderBoard();
    this.renderTasks();
  }

  editColumn(id: string) {
    const col = this.columns.find((c) => c.id === id);
    const newName = prompt("New name:", col?.title);
    if (newName && col) {
      col!.title = newName.trim();
      if (!col.title) return;
      this.saveColumns();
      this.renderBoard();
      this.renderTasks();
    }
  }

  resetForm() {
    if (!this.titleInput || !this.taskInput || !this.statusInput) return;
    this.titleInput.value = "";
    this.taskInput.value = "";
    this.statusInput.value = "todo";
  }

  openViewModal(task: Task) {
    this.activeTaskId = task.id;

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
    this.saveTasks();
    this.closeModal();
    this.resetForm();
  }
}
