export type Status = "todo" | "inprogress" | "done"; 

export class Task {
    id: string;
    title: string ;
    description: string;
    status: Status;

constructor(
 id: string,
 title: string,
 description: string,
 status: Status
  ) {this.id = id;
    this.title = title;
    this.description = description;
    this.status = status;}



  
  changeStatus(newStatus: Status) {
    this.status = newStatus;
  }
}

console.log("Task model loaded");
