export interface FirebaseEvent {
  id: string;
  calendar: string;
  eventId: string;
  htmlLink: string;
  routing: string;
  updatedDueDate: string;
  description: string;
  duration: string;
  title: string;
  addedDate: string;
}

export interface FirebaseNote {
  id: string;
  addedBy: string;
  addedDate: string;
  status: string;
  text: string;
}
