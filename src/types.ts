import type { z } from "zod";
import type { galleryItemInputSchema, vehicleInputSchema } from "@shared/schema";

export type Vehicle = {
  id: number;
  make: string;
  model: string;
  variant: string;
  year: number;
  priceInr: number;
  bodyType: string;
  fuelType: string;
  transmission: string;
  kilometers: number;
  owners?: number | null;
  color: string;
  city: string;
  engineType?: string;
  engineCapacityCc?: number | null;
  engineLengthMm?: number | null;
  powerBhp?: number | null;
  torqueNm?: number | null;
  lengthMm?: number | null;
  widthMm?: number | null;
  heightMm?: number | null;
  wheelbaseMm?: number | null;
  groundClearanceMm?: number | null;
  bootSpaceLitres?: number | null;
  seatingCapacity?: number | null;
  fuelEfficiency?: string | null;
  batteryCapacityKwh?: number | null;
  rangeKm?: number | null;
  description: string;
  features: string[];
  imageUrls: string[];
  status: "available" | "sold";
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type GalleryItem = {
  id: number;
  title: string;
  category: string;
  imageUrl: string;
  caption: string;
  sortOrder: number;
  createdAt: string | Date;
};

export type GalleryItemInput = z.infer<typeof galleryItemInputSchema>;

export type Inquiry = {
  id: number;
  type: string;
  name: string;
  phone: string;
  email?: string | null;
  message: string;
  vehicleId?: number | null;
  status: "new" | "contacted" | "completed" | "closed";
  readByAdmin?: boolean;
  readAt?: string | Date | null;
  adminReply?: string | null;
  repliedAt?: string | Date | null;
  repliedBy?: string | null;
  slotConfirmed?: boolean;
  confirmedSlotTime?: string | null;
  createdAt: string | Date;
};

export type VehicleFilters = {
  search?: string;
  brand?: string;
  bodyType?: string;
  minPrice?: number;
  maxPrice?: number;
  yearFrom?: number;
  yearTo?: number;
  fuelType?: string;
  transmission?: string;
  maxKm?: number;
  seats?: number;
  color?: string;
  sort?: "recommended" | "price-asc" | "price-desc" | "year-desc" | "km-asc";
};

export type VehicleInput = z.infer<typeof vehicleInputSchema>;

export type InquiryInput = {
  type: "buy" | "sell" | "contact" | "exchange" | "test_drive" | "service";
  name: string;
  phone: string;
  email?: string;
  message?: string;
  vehicleId?: number | null;
};

export type GoogleRating = {
  rating: number;
  reviewCount: number;
  justdialRating?: number;
  justdialVotes?: number;
  name: string;
  address: string;
  phone: string;
  url: string;
  fetchedAt: string;
};

export type VehicleSuggestion = Partial<VehicleInput> & {
  source: string;
  confidence: string;
  features?: string[];
};

export type AdminUser = {
  email: string;
  role: string;
  name: string;
  photo?: string;
  phone?: string;
};

export type AdminSummary = {
  totalVehicles: number;
  availableVehicles: number;
  soldVehicles: number;
  carsSoldCounter: number;
  totalInquiries: number;
  pendingInquiries: number;
  galleryItemsCount: number;
  admins: AdminUser[];
  totalCustomers?: number;
  totalServiceBookings?: number;
  pendingServiceBookings?: number;
};

export type SiteSettings = {
  carsSold?: number;
  googleRating?: number;
  googleReviews?: number;
  googleReviewsCount?: number;
  phone?: string;
  whatsapp?: string;
  address?: string;
  adminPhoto?: string;
  adminName?: string;
  adminPhone?: string;
  rating?: number;
  reviewsCount?: number;
  showroomHoursMonSat?: string;
  showroomHoursSun?: string;
};

export type CustomerReview = {
  id: number;
  authorName: string;
  rating: number;
  relativeTime: string;
  text: string;
  verified: boolean;
  carModel?: string;
};

export type Customer = {
  id: number;
  name: string;
  phone: string;
  email?: string;
  carModel: string;
  regNumber?: string;
  transactionType: "sold_to_dealership" | "bought_from_dealership" | "current_buyer";
  amountInr?: number;
  date: string;
  status: "completed" | "in_progress" | "pending_rc" | "delivered";
  serviceToken?: string;
  notes?: string;
  createdAt: string | Date;
};

export type CustomerInput = Omit<Customer, "id" | "createdAt">;

export type ServiceBooking = {
  id: number;
  token: string;
  customerName: string;
  phone: string;
  email?: string;
  carDetails: string;
  servicePackage: string;
  date: string;
  timeSlot: string;
  status: "confirmed" | "in_progress" | "completed" | "cancelled" | "postponed";
  notes?: string;
  createdAt: string | Date;
};

export type ServiceBookingInput = Omit<ServiceBooking, "id" | "token" | "status" | "createdAt">;


