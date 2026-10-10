import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  AdminSummary,
  AdminUser,
  Customer,
  CustomerInput,
  GalleryItem,
  GalleryItemInput,
  GoogleRating,
  Inquiry,
  InquiryInput,
  ServiceBooking,
  ServiceBookingInput,
  SiteSettings,
  Vehicle,
  VehicleFilters,
  VehicleInput,
  VehicleSuggestion,
} from "@/types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getAdminToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("pc_admin_token") : null;
}

export function setAdminToken(token: string | null) {
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("pc_admin_token", token);
    } else {
      localStorage.removeItem("pc_admin_token");
    }
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    ...(init?.body ? { "Content-Type": "application/json" } : {}),
    ...(init?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    credentials: "include",
    ...init,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, data.error ?? "The request could not be completed.");
  }
  return data as T;
}

function filterQuery(filters: VehicleFilters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "" && value !== null) {
      params.set(key, String(value));
    }
  }
  return params.toString();
}

export const vehicleKeys = {
  all: ["vehicles"] as const,
  list: (filters: VehicleFilters) => ["vehicles", "list", filters] as const,
  detail: (id: number) => ["vehicles", "detail", id] as const,
};
export const settingsKey = ["site-settings"] as const;
export const adminKeys = {
  summary: ["admin", "summary"] as const,
  inquiries: ["admin", "inquiries"] as const,
  vehicles: ["admin", "vehicles"] as const,
  gallery: ["admin", "gallery"] as const,
  session: ["admin", "session"] as const,
  customers: (filters?: any) => ["admin", "customers", filters] as const,
  serviceTokens: ["admin", "service-tokens"] as const,
};
export const galleryKey = (category?: string) => ["gallery", category ?? "all"] as const;
export const googleRatingKey = ["google-rating"] as const;

export function useVehicles(filters: VehicleFilters = {}) {
  return useQuery({
    queryKey: vehicleKeys.list(filters),
    queryFn: () => request<Vehicle[]>(`/api/vehicles?${filterQuery(filters)}`),
  });
}

export function useVehicle(id: number | null) {
  return useQuery({
    queryKey: id === null ? ["vehicles", "detail", "none"] : vehicleKeys.detail(id),
    queryFn: () => request<Vehicle>(`/api/vehicles/${id}`),
    enabled: id !== null,
  });
}

export function useSiteSettings() {
  return useQuery({
    queryKey: settingsKey,
    queryFn: () => request<SiteSettings>("/api/settings"),
  });
}

export function useGoogleRating() {
  return useQuery({
    queryKey: googleRatingKey,
    queryFn: () => request<GoogleRating>("/api/google-rating"),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useGallery(category?: string) {
  return useQuery({
    queryKey: galleryKey(category),
    queryFn: () => request<GalleryItem[]>(`/api/gallery${category && category !== "all" ? `?category=${category}` : ""}`),
  });
}

export function useVehicleSuggestions(input: {
  make: string;
  model: string;
  variant?: string;
  year?: number;
  fuelType: VehicleInput["fuelType"];
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return useQuery({
    queryKey: ["vehicle-suggestions", input.make, input.model, input.fuelType],
    queryFn: () => request<VehicleSuggestion>(`/api/vehicle-suggestions?${params}`),
    enabled: Boolean(input.make.trim() && input.model.trim() && input.fuelType),
    retry: false,
    staleTime: 60_000,
  });
}

export function useCreateInquiry() {
  return useMutation({
    mutationFn: (input: InquiryInput) =>
      request<{ id: number }>("/api/inquiries", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useAdminSession() {
  return useQuery({
    queryKey: adminKeys.session,
    queryFn: async () => {
      const token = getAdminToken();
      if (!token) return { authenticated: false, user: null };
      return request<{ authenticated: boolean; user: AdminUser }>("/api/auth/session");
    },
    retry: false,
  });
}

export function useAdminLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (credentials: { email: string; password?: string }) => {
      const res = await request<{ success: boolean; token: string; user: AdminUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      setAdminToken(res.token);
      return res;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: adminKeys.session });
      client.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}

export function useGoogleLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; credential?: string; name?: string; photo?: string }) => {
      const res = await request<{ success: boolean; token: string; user: AdminUser }>("/api/auth/google", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAdminToken(res.token);
      return res;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: adminKeys.session });
      client.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}

export function useCustomerPinLogin() {
  return useMutation({
    mutationFn: (payload: { phone: string; name?: string; pin?: string }) =>
      request<{ success: boolean; customer: { id: string; name: string; phone: string; email: string; photo: string } }>(
        "/api/customer/pin-login",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      ),
  });
}

export function useCustomerGoogleLogin() {
  return useMutation({
    mutationFn: (payload: { email: string; name?: string; photo?: string }) =>
      request<{ success: boolean; customer: { id: string; name: string; phone: string; email: string; photo: string } }>(
        "/api/customer/google-login",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      ),
  });
}

export function useUpdateCustomerProfile() {
  return useMutation({
    mutationFn: (payload: { id: string; name?: string; phone?: string; email?: string; photo?: string }) =>
      request<{ success: boolean; customer: { id: string; name: string; phone: string; email: string; photo: string } }>(
        "/api/customer/profile",
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      ),
  });
}

export function useResetAdminPassword() {
  return useMutation({
    mutationFn: (payload: { email: string; otp: string; newPassword: string }) =>
      request<{ success: boolean; message: string }>("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useTwoStepInit() {
  return useMutation({
    mutationFn: (payload: { method: "google" | "password" | "select"; email: string; password?: string }) =>
      request<{
        success: boolean;
        requireStep2: boolean;
        twoFactorToken: string;
        email: string;
        role: string;
        adminName?: string;
        magicToken: string;
        magicUrl: string;
        message: string;
      }>("/api/auth/two-step/init", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useTwoStepVerify() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { twoFactorToken: string; otp?: string; magicUrl?: string; magicToken?: string; pin?: string }) => {
      const res = await request<{
        success: boolean;
        token: string;
        user: AdminUser;
        message: string;
      }>("/api/auth/two-step/verify", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAdminToken(res.token);
      return res;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: adminKeys.session });
      client.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}

export function useBookServiceSlot() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ServiceBookingInput) =>
      request<{ success: boolean; token: string; booking: ServiceBooking; message: string }>("/api/service-booking", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: adminKeys.serviceTokens });
      client.invalidateQueries({ queryKey: adminKeys.inquiries });
    },
  });
}

export function useSendOtp() {
  return useMutation({
    mutationFn: async (payload: { phone: string }) => {
      return request<{ success: boolean; message: string; otpHint: string }>("/api/auth/otp/send", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  });
}

export function useVerifyOtp() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { phone: string; otp: string }) => {
      const res = await request<{ success: boolean; token: string; user: AdminUser }>("/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setAdminToken(res.token);
      return res;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: adminKeys.session });
      client.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}

export function useGenerateMagicLink() {
  return useMutation({
    mutationFn: async (payload: { email?: string }) => {
      return request<{ success: boolean; magicUrl: string; token: string; message: string }>(
        "/api/auth/magic-link/generate",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },
  });
}

export function useVerifyMagicLink() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await request<{ success: boolean; token: string; user: AdminUser }>(
        "/api/auth/magic-link/verify",
        {
          method: "POST",
          body: JSON.stringify({ token }),
        }
      );
      setAdminToken(res.token);
      return res;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: adminKeys.session });
      client.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}

export function useAdminLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await request<{ success: true }>("/api/auth/logout", { method: "POST" }).catch(() => {});
      setAdminToken(null);
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: adminKeys.session });
    },
  });
}

export function useAdminSummary(enabled = true) {
  return useQuery({
    queryKey: adminKeys.summary,
    queryFn: () => request<AdminSummary>("/api/admin/summary"),
    enabled,
    retry: false,
  });
}

export function useAdminVehicles(enabled = true) {
  return useQuery({
    queryKey: adminKeys.vehicles,
    queryFn: () => request<Vehicle[]>("/api/vehicles?includeSold=true"),
    enabled,
    retry: false,
  });
}

export function useAdminInquiries(enabled = true) {
  return useQuery({
    queryKey: adminKeys.inquiries,
    queryFn: () => request<Inquiry[]>("/api/admin/inquiries"),
    enabled,
    retry: false,
  });
}

export function useCreateVehicle() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: VehicleInput) =>
      request<Vehicle>("/api/admin/vehicles", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: vehicleKeys.all });
      client.invalidateQueries({ queryKey: adminKeys.summary });
      client.invalidateQueries({ queryKey: adminKeys.vehicles });
    },
  });
}

export function useUpdateVehicle() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input, ...rest }: { id: number; input?: Partial<VehicleInput>; [key: string]: any }) => {
      const payload = input !== undefined ? input : rest;
      return request<Vehicle>(`/api/admin/vehicles/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: vehicleKeys.all });
      client.invalidateQueries({ queryKey: vehicleKeys.detail(variables.id) });
      client.invalidateQueries({ queryKey: adminKeys.summary });
      client.invalidateQueries({ queryKey: adminKeys.vehicles });
    },
  });
}

export function useDeleteVehicle() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      request<{ success: true }>(`/api/admin/vehicles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: vehicleKeys.all });
      client.invalidateQueries({ queryKey: adminKeys.summary });
      client.invalidateQueries({ queryKey: adminKeys.vehicles });
    },
  });
}

export function useCreateGalleryItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: GalleryItemInput) =>
      request<GalleryItem>("/api/admin/gallery", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["gallery"] });
      client.invalidateQueries({ queryKey: adminKeys.gallery });
      client.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}

export function useUpdateGalleryItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<GalleryItemInput> }) =>
      request<GalleryItem>(`/api/admin/gallery/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["gallery"] });
      client.invalidateQueries({ queryKey: adminKeys.gallery });
    },
  });
}

export function useDeleteGalleryItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      request<{ success: true }>(`/api/admin/gallery/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["gallery"] });
      client.invalidateQueries({ queryKey: adminKeys.gallery });
      client.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}

export function useUpdateSiteSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      carsSold?: number;
      phone?: string;
      whatsapp?: string;
      address?: string;
      adminPhoto?: string;
      adminName?: string;
      adminPhone?: string;
    }) =>
      request<SiteSettings>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: settingsKey });
      client.invalidateQueries({ queryKey: adminKeys.session });
      client.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}

export function useUploadImage() {
  return useMutation({
    mutationFn: (payload: { image: string; name?: string }) =>
      request<{ success: boolean; url: string; filename: string }>("/api/upload", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useUploadMultipleImages() {
  return useMutation({
    mutationFn: (payload: { images: Array<{ image: string; name?: string }> }) =>
      request<{ success: boolean; urls: string[] }>("/api/upload-multiple", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  });
}

export function useUpdateInquiryStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "new" | "contacted" | "completed" | "closed" }) =>
      request<Inquiry>(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: adminKeys.inquiries });
      client.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}

export function useDeleteInquiry() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      request<{ success: boolean }>(`/api/admin/inquiries/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: adminKeys.inquiries });
      client.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}

export function useReplyToInquiry() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      reply: string;
      status?: string;
      confirmedSlotTime?: string;
      slotConfirmed?: boolean;
    }) =>
      request<Inquiry>(`/api/admin/inquiries/${id}/reply`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: adminKeys.inquiries });
      client.invalidateQueries({ queryKey: ["customer", "activity"] });
    },
  });
}

export function useMarkInquiryRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      request<Inquiry>(`/api/admin/inquiries/${id}/mark-read`, {
        method: "POST",
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: adminKeys.inquiries });
      client.invalidateQueries({ queryKey: ["customer", "activity"] });
    },
  });
}

export function useAdminCustomers(filters: { type?: string; search?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  if (filters.search) params.set("search", filters.search);
  return useQuery({
    queryKey: adminKeys.customers(filters),
    queryFn: () => request<Customer[]>(`/api/admin/customers?${params.toString()}`),
  });
}

export function useCreateCustomer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) =>
      request<Customer>("/api/admin/customers", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin", "customers"] });
      client.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}

export function useUpdateCustomer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Partial<CustomerInput>) =>
      request<Customer>(`/api/admin/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin", "customers"] });
    },
  });
}

export function useDeleteCustomer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      request<{ success: boolean }>(`/api/admin/customers/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin", "customers"] });
      client.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}

export function useAdminServiceTokens() {
  return useQuery({
    queryKey: adminKeys.serviceTokens,
    queryFn: () => request<ServiceBooking[]>("/api/admin/service-tokens"),
  });
}

export function useUpdateServiceTokenStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      request<ServiceBooking>(`/api/admin/service-tokens/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: adminKeys.serviceTokens });
      client.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}

export function useDeleteServiceToken() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      request<{ success: boolean }>(`/api/admin/service-tokens/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: adminKeys.serviceTokens });
      client.invalidateQueries({ queryKey: adminKeys.summary });
    },
  });
}

export function useCustomerActivity(params: { phone?: string; email?: string }, enabled = true) {
  const q = new URLSearchParams();
  if (params.phone) q.set("phone", params.phone);
  if (params.email) q.set("email", params.email);
  return useQuery({
    queryKey: ["customer", "activity", params.phone, params.email],
    queryFn: () =>
      request<{ inquiries: Inquiry[]; serviceBookings: ServiceBooking[] }>(
        `/api/customer/my-activity?${q.toString()}`
      ),
    enabled: Boolean(enabled && (params.phone || params.email)),
  });
}

