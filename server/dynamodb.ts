import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
  Customer,
  GalleryItem,
  Inquiry,
  NewGalleryItem,
  NewVehicle,
  ServiceBooking,
  Vehicle,
} from "@shared/schema";
import { sanitizeVehicleImages, storage as localStore } from "./storage";

export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "PassionCarStore";
export const AWS_REGION = process.env.AWS_REGION || "ap-south-1";

export const isDynamoConfigured = Boolean(
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
);

const rawClient = isDynamoConfigured
  ? new DynamoDBClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

export const ddbDocClient = rawClient
  ? DynamoDBDocumentClient.from(rawClient, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    })
  : null;

export class DynamoDbStorage {
  async getVehicles(filters: any = {}): Promise<Vehicle[]> {
    if (!ddbDocClient) {
      return localStore.getVehicles(filters);
    }

    try {
      const response = await ddbDocClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "pk = :pk",
          ExpressionAttributeValues: {
            ":pk": "VEHICLE",
          },
        })
      );
      let list = (response.Items || []) as Vehicle[];
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (v) =>
            v.make.toLowerCase().includes(q) ||
            v.model.toLowerCase().includes(q) ||
            v.variant.toLowerCase().includes(q)
        );
      }
      if (filters.fuelType && filters.fuelType !== "all") {
        list = list.filter((v) => v.fuelType.toLowerCase() === filters.fuelType.toLowerCase());
      }
      return list.map(sanitizeVehicleImages);
    } catch (err) {
      console.warn("DynamoDB Query error, falling back to local store:", err);
      return localStore.getVehicles(filters);
    }
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    if (!ddbDocClient) {
      return localStore.getVehicle(id);
    }

    try {
      const response = await ddbDocClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            pk: "VEHICLE",
            sk: `VEHICLE#${id}`,
          },
        })
      );
      return response.Item ? sanitizeVehicleImages(response.Item as Vehicle) : undefined;
    } catch (err) {
      console.warn("DynamoDB Get error:", err);
      return localStore.getVehicle(id);
    }
  }

  async createVehicle(input: any): Promise<Vehicle> {
    const created = await localStore.createVehicle(input);
    if (ddbDocClient) {
      try {
        await ddbDocClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: {
              pk: "VEHICLE",
              sk: `VEHICLE#${created.id}`,
              ...created,
            },
          })
        );
      } catch (err) {
        console.warn("DynamoDB Put item failed:", err);
      }
    }
    return created;
  }

  async updateVehicle(id: number, input: any): Promise<Vehicle | undefined> {
    const updated = await localStore.updateVehicle(id, input);
    if (ddbDocClient && updated) {
      try {
        await ddbDocClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: {
              pk: "VEHICLE",
              sk: `VEHICLE#${id}`,
              ...updated,
            },
          })
        );
      } catch (err) {
        console.warn("DynamoDB Update item failed:", err);
      }
    }
    return updated;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const res = await localStore.deleteVehicle(id);
    if (ddbDocClient) {
      try {
        await ddbDocClient.send(
          new DeleteCommand({
            TableName: TABLE_NAME,
            Key: {
              pk: "VEHICLE",
              sk: `VEHICLE#${id}`,
            },
          })
        );
      } catch (err) {
        console.warn("DynamoDB Delete item failed:", err);
      }
    }
    return res;
  }

  async getInquiries(): Promise<Inquiry[]> {
    if (!ddbDocClient) {
      return localStore.getInquiries();
    }
    try {
      const response = await ddbDocClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "pk = :pk",
          ExpressionAttributeValues: { ":pk": "INQUIRY" },
        })
      );
      return (response.Items || []) as Inquiry[];
    } catch (err) {
      return localStore.getInquiries();
    }
  }

  async createInquiry(input: any): Promise<Inquiry> {
    const inq = await localStore.createInquiry(input);
    if (ddbDocClient) {
      try {
        await ddbDocClient.send(
          new PutCommand({
            TableName: TABLE_NAME,
            Item: {
              pk: "INQUIRY",
              sk: `INQUIRY#${inq.id}`,
              ...inq,
            },
          })
        );
      } catch (err) {
        console.warn("DynamoDB Put inquiry failed:", err);
      }
    }
    return inq;
  }

  async updateInquiryStatus(id: number, status: string, confirmedSlotTime?: string, slotConfirmed?: boolean): Promise<Inquiry | undefined> {
    return localStore.updateInquiryStatus(id, status, confirmedSlotTime, slotConfirmed);
  }

  async replyToInquiry(id: number, data: any): Promise<Inquiry | undefined> {
    return localStore.replyToInquiry(id, data);
  }

  async markInquiryRead(id: number): Promise<Inquiry | undefined> {
    return localStore.markInquiryRead(id);
  }

  async deleteInquiry(id: number): Promise<boolean> {
    return localStore.deleteInquiry(id);
  }

  async deleteServiceBooking(id: number): Promise<boolean> {
    return (localStore as any).deleteServiceBooking(id);
  }

  async getCarsSold(): Promise<number> {
    return localStore.getCarsSold();
  }

  async setCarsSold(count: number): Promise<number> {
    return localStore.setCarsSold(count);
  }

  async getSettings(): Promise<any> {
    return localStore.getSettings();
  }

  async updateSettings(update: any): Promise<any> {
    return localStore.updateSettings(update);
  }

  async getGallery(category?: string): Promise<GalleryItem[]> {
    return localStore.getGallery(category);
  }

  async createGalleryItem(item: any): Promise<GalleryItem> {
    return localStore.createGalleryItem(item);
  }

  async updateGalleryItem(id: number, item: any): Promise<GalleryItem | undefined> {
    return localStore.updateGalleryItem(id, item);
  }

  async deleteGalleryItem(id: number): Promise<boolean> {
    return localStore.deleteGalleryItem(id);
  }

  async getVehicleSuggestions(make: string, model: string, fuelType: string): Promise<any> {
    return localStore.getVehicleSuggestions(make, model, fuelType);
  }

  async getCustomers(filters?: any): Promise<Customer[]> {
    return localStore.getCustomers(filters);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return localStore.getCustomer(id);
  }

  async createCustomer(input: any): Promise<Customer> {
    return localStore.createCustomer(input);
  }

  async updateCustomer(id: number, input: any): Promise<Customer | undefined> {
    return localStore.updateCustomer(id, input);
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return localStore.deleteCustomer(id);
  }

  async getServiceBookings(): Promise<ServiceBooking[]> {
    return localStore.getServiceBookings();
  }

  async createServiceBooking(input: any): Promise<ServiceBooking> {
    return localStore.createServiceBooking(input);
  }

  async updateServiceBookingStatus(id: number, status: string, date?: string, timeSlot?: string): Promise<ServiceBooking | undefined> {
    return localStore.updateServiceBookingStatus(id, status, date, timeSlot);
  }
}

export const dynamoStore = new DynamoDbStorage();
