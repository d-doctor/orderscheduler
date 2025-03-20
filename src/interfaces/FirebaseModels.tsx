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
  stepNumber: number;
}

export interface FirebaseNote {
  id: string;
  addedBy: string;
  addedDate: string;
  status: string;
  text: string;
}

export interface FirebaseSettings {
  salesID: boolean;
  dateEntered: boolean;
  orderNumber: boolean;
  jobNumber: boolean;
  partNumber: boolean;
  customerDescription: boolean;
  location: boolean;
  addressBox: boolean;
}

export interface FirebaseActivity {
  user: string;
  action: string;
  text: string;
  jobNumber: string;
  addedDate: Date;
}

export interface FirebaseRoutingSetting {
  routingCode: string;
  calendarID: string;
  calendarName: string;
  locked: boolean;
}
