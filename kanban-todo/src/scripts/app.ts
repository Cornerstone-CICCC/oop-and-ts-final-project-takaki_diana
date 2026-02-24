
import "./style.css";
import { Task } from "./models/Task";
import type { Status } from "./models/Task";

const tasks: Task[] = [
  new Task("1", "Task 1", "Description for Task 1", "todo"),
  new Task("2", "Task 2", "Description for Task 2", "inprogress"),
  new Task("3", "Task 3", "Description for Task 3", "done"),
];

function render() {
  const cols: Record<Status, HTMLElement> = {
    todo: document.getElementById("col-todo")!,
    inprogress: document.getElementById("col-inprogress")!,
    done: document.getElementById("col-done")!,
  };


  (Object.keys(cols) as Status[]).forEach((s) => {
    cols[s].innerHTML = "";
  });

  
  for (const t of tasks) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <p class="card-title">${t.title}</p>
      <p class="card-desc">${t.description}</p>
    `;
    cols[t.status].appendChild(card);
  }
}

render();
const btn = document.getElementById("addTaskBtn");

btn?.addEventListener("click", () => {
  const newTask = new Task(
    Date.now().toString(),
    "New Task",
    "Description for new task",
    "todo"
  );
  tasks.push(newTask);
  render();
});

const addButtons = document.querySelectorAll<HTMLButtonElement>("[data-add]");
addButtons.forEach(button => {
  button.addEventListener("click", () => {
    const status = button.getAttribute("data-add") as Status;
    const newTask = new Task(
      Date.now().toString(),
      "New Task",
      "Description for new task",
      status
    );
    tasks.push(newTask);
    render();
  });
})