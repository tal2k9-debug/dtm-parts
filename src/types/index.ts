export type Position = "FRONT" | "REAR";

export type Status = "PENDING" | "QUOTED" | "CLOSED" | "CANCELLED";

export type Role = "CUSTOMER" | "VIP" | "ADMIN";

export type BumperStatus = "במלאי" | "אזל" | "בהזמנה";

export interface Bumper {
  id: string;
  mondayItemId: string;
  name: string;
  carMake: string;
  carModel: string;
  carYear: string;
  position: Position | null;
  price: number | null;
  status: BumperStatus;
  imageUrl: string | null;
  lastSynced: Date;
}

export interface QuoteRequest {
  id: string;
  userId: string | null;
  guestName: string | null;
  guestPhone: string | null;
  carMake: string;
  carModel: string;
  carYear: string;
  position: Position;
  notes: string | null;
  imageUrl: string | null;
  status: Status;
  quotedPrice: number | null;
  createdAt: Date;
  closedAt: Date | null;
}

export interface Message {
  id: string;
  requestId: string;
  userId: string | null;
  senderRole: "customer" | "admin";
  content: string | null;
  imageUrl: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface VehicleSelection {
  make: string;
  model: string;
  year: string;
  position: Position;
}

export interface CarMakeData {
  make: string;
  models: {
    model: string;
    years: string[];
  }[];
}
