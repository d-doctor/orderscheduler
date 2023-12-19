export interface Routing {
  stepNumber: number;
  departmentNumber: string;
  description: string;
  employeeCode: string;
  partNumber: string;
  workCenter: string;
  cycleTime: number;
}

export interface Data {
  jobNumber: string;
  orderNumber: string;
  partNumber: string;
  partDescription: string;
  dueDate: Date;
  uniqueID: number;
  unitPrice: number;
  quantityOrdered: number;
  orderTotal: number;
  dueDateString: string;
}

export interface ShippingAddress {
  customerCode: string;
  shippingAddress1: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  shippingCountry: string;
}

export interface Order {
  salesID: string;
  orderNumber: string;
  customerCode: string;
  customerDescription: string;
  location: string;
  dateEntered: Date;
}
