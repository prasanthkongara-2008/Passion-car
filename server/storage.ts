import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./db";
import {
  customers,
  inquiries,
  serviceBookings,
  showroomGallery,
  siteSettings,
  vehicles,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import type {
  Customer,
  GalleryItem,
  Inquiry,
  NewGalleryItem,
  NewVehicle,
  ServiceBooking,
  SiteSetting,
  Vehicle,
} from "@shared/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

export interface IStorage {
  getVehicles(filters?: {
    search?: string;
    brand?: string;
    bodyType?: string;
    fuelType?: string;
    transmission?: string;
    color?: string;
    minPrice?: number;
    maxPrice?: number;
    yearFrom?: number;
    yearTo?: number;
    maxKm?: number;
    sort?: string;
  }): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: Omit<NewVehicle, "id" | "createdAt" | "updatedAt">): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<NewVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;

  getInquiries(): Promise<Inquiry[]>;
  createInquiry(inquiry: {
    type: string;
    name: string;
    phone: string;
    email?: string | null;
    message?: string;
    vehicleId?: number | null;
  }): Promise<Inquiry>;
  updateInquiryStatus(id: number, status: string): Promise<Inquiry | undefined>;
  replyToInquiry(id: number, data: {
    reply: string;
    repliedBy?: string;
    status?: string;
    confirmedSlotTime?: string;
    slotConfirmed?: boolean;
  }): Promise<Inquiry | undefined>;
  markInquiryRead(id: number): Promise<Inquiry | undefined>;
  deleteInquiry(id: number): Promise<boolean>;

  getCarsSold(): Promise<number>;
  setCarsSold(count: number): Promise<number>;

  getGallery(category?: string): Promise<GalleryItem[]>;
  createGalleryItem(item: Omit<NewGalleryItem, "id" | "createdAt">): Promise<GalleryItem>;
  updateGalleryItem(id: number, item: Partial<NewGalleryItem>): Promise<GalleryItem | undefined>;
  deleteGalleryItem(id: number): Promise<boolean>;

  getCustomers(filters?: { type?: string; search?: string }): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(input: Omit<Customer, "id" | "createdAt">): Promise<Customer>;
  updateCustomer(id: number, input: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  getServiceBookings(): Promise<ServiceBooking[]>;
  createServiceBooking(input: Omit<ServiceBooking, "id" | "token" | "status" | "createdAt"> & { token?: string }): Promise<ServiceBooking>;
  updateServiceBookingStatus(id: number, status: string): Promise<ServiceBooking | undefined>;
  deleteServiceBooking(id: number): Promise<boolean>;

  getVehicleSuggestions(make: string, model: string, fuelType: string): Promise<any>;
}

export const AUTOMOTIVE_CATALOG: Record<
  string,
  Record<
    string,
    {
      bodyType: string;
      lengthMm: number;
      widthMm: number;
      heightMm: number;
      wheelbaseMm: number;
      groundClearanceMm: number;
      bootSpaceLitres: number;
      seatingCapacity: number;
      variants: Record<
        string,
        {
          engineType: string;
          engineCapacityCc?: number;
          powerBhp: number;
          torqueNm: number;
          fuelEfficiency: string;
          batteryCapacityKwh?: number;
          rangeKm?: number;
          transmission: string;
        }
      >;
      features: string[];
    }
  >
> = {
  volkswagen: {
    polo: {
      bodyType: "Hatchback",
      lengthMm: 3971,
      widthMm: 1682,
      heightMm: 1469,
      wheelbaseMm: 2470,
      groundClearanceMm: 165,
      bootSpaceLitres: 280,
      seatingCapacity: 5,
      variants: {
        petrol: {
          engineType: "1.0L TSI 3-Cylinder Turbocharged Petrol Engine",
          engineCapacityCc: 999,
          powerBhp: 109,
          torqueNm: 175,
          fuelEfficiency: "18.2 kmpl",
          transmission: "Manual",
        },
        diesel: {
          engineType: "1.5L TDI 4-Cylinder Turbocharged Diesel Engine",
          engineCapacityCc: 1498,
          powerBhp: 108,
          torqueNm: 250,
          fuelEfficiency: "21.5 kmpl",
          transmission: "Manual",
        },
      },
      features: [
        "Dual Front Airbags",
        "Anti-lock Braking System (ABS)",
        "Cornering Light Assist",
        "Touchscreen Infotainment with Apple CarPlay & Android Auto",
        "Climatronic Auto AC",
        "Rain Sensing Wipers",
        "Cruise Control",
        "Rear Parking Sensors",
        "16-inch Portago Alloy Wheels",
      ],
    },
    vento: {
      bodyType: "Sedan",
      lengthMm: 4390,
      widthMm: 1699,
      heightMm: 1467,
      wheelbaseMm: 2553,
      groundClearanceMm: 163,
      bootSpaceLitres: 494,
      seatingCapacity: 5,
      variants: {
        petrol: {
          engineType: "1.0L TSI Turbocharged Stratified Injection Petrol",
          engineCapacityCc: 999,
          powerBhp: 109,
          torqueNm: 175,
          fuelEfficiency: "17.7 kmpl",
          transmission: "Automatic",
        },
        diesel: {
          engineType: "1.5L TDI 4-Cylinder DOHC Diesel",
          engineCapacityCc: 1498,
          powerBhp: 108,
          torqueNm: 250,
          fuelEfficiency: "22.2 kmpl",
          transmission: "Manual",
        },
      },
      features: [
        "4 Airbags",
        "Electronic Stability Program (ESP)",
        "Hill Hold Control",
        "Leatherette Upholstery",
        "Auto Dimming IRVM",
        "Touchscreen Infotainment",
        "Rear AC Vents",
      ],
    },
    taigun: {
      bodyType: "SUV",
      lengthMm: 4221,
      widthMm: 1760,
      heightMm: 1612,
      wheelbaseMm: 2651,
      groundClearanceMm: 188,
      bootSpaceLitres: 385,
      seatingCapacity: 5,
      variants: {
        petrol: {
          engineType: "1.5L TSI EVO 4-Cylinder Turbo with Active Cylinder Tech",
          engineCapacityCc: 1498,
          powerBhp: 148,
          torqueNm: 250,
          fuelEfficiency: "18.5 kmpl",
          transmission: "Automatic DSG",
        },
      },
      features: [
        "6 Airbags",
        "Ventilated Front Seats",
        "Electric Sunroof",
        "Digital Cockpit",
        "Wireless Phone Charging",
        "10-inch Infotainment",
        "Electronic Stability Control (ESC)",
      ],
    },
  },
  honda: {
    city: {
      bodyType: "Sedan",
      lengthMm: 4549,
      widthMm: 1748,
      heightMm: 1489,
      wheelbaseMm: 2600,
      groundClearanceMm: 165,
      bootSpaceLitres: 506,
      seatingCapacity: 5,
      variants: {
        petrol: {
          engineType: "1.5L i-VTEC DOHC with VTC 4-Cylinder Petrol",
          engineCapacityCc: 1498,
          powerBhp: 119,
          torqueNm: 145,
          fuelEfficiency: "17.8 kmpl",
          transmission: "CVT Automatic",
        },
        diesel: {
          engineType: "1.5L i-DTEC DOHC 4-Cylinder Earth Dreams Diesel",
          engineCapacityCc: 1498,
          powerBhp: 98,
          torqueNm: 200,
          fuelEfficiency: "24.1 kmpl",
          transmission: "Manual",
        },
        hybrid: {
          engineType: "1.5L Atkinson Cycle e:HEV Dual-Motor Strong Hybrid",
          engineCapacityCc: 1498,
          powerBhp: 124,
          torqueNm: 253,
          fuelEfficiency: "27.1 kmpl",
          transmission: "e-CVT",
        },
      },
      features: [
        "Honda Sensing ADAS",
        "LaneWatch Camera",
        "Electric Sunroof",
        "Full LED Headlamps with 9 LED Array",
        "8-inch Touchscreen Audio with Alexa Connectivity",
        "Walk-Away Auto Lock",
        "6 Airbags",
      ],
    },
    jazz: {
      bodyType: "Hatchback",
      lengthMm: 3989,
      widthMm: 1694,
      heightMm: 1544,
      wheelbaseMm: 2530,
      groundClearanceMm: 165,
      bootSpaceLitres: 354,
      seatingCapacity: 5,
      variants: {
        petrol: {
          engineType: "1.2L i-VTEC 4-Cylinder SOHC 16V Engine",
          engineCapacityCc: 1199,
          powerBhp: 89,
          torqueNm: 110,
          fuelEfficiency: "17.1 kmpl",
          transmission: "Manual",
        },
        diesel: {
          engineType: "1.5L i-DTEC Earth Dreams Turbocharged Diesel",
          engineCapacityCc: 1498,
          powerBhp: 98,
          torqueNm: 200,
          fuelEfficiency: "27.3 kmpl",
          transmission: "Manual",
        },
      },
      features: [
        "Magic Seats Flexibility",
        "One-touch Electric Sunroof",
        "Paddle Shifters",
        "Digipad 2.0 Touchscreen Infotainment",
        "Cruise Control",
        "ABS with EBD",
      ],
    },
    elevate: {
      bodyType: "SUV",
      lengthMm: 4312,
      widthMm: 1790,
      heightMm: 1650,
      wheelbaseMm: 2650,
      groundClearanceMm: 220,
      bootSpaceLitres: 458,
      seatingCapacity: 5,
      variants: {
        petrol: {
          engineType: "1.5L i-VTEC DOHC 4-Cylinder Petrol Engine",
          engineCapacityCc: 1498,
          powerBhp: 119,
          torqueNm: 145,
          fuelEfficiency: "16.9 kmpl",
          transmission: "CVT Automatic",
        },
      },
      features: [
        "Honda Sensing Level-2 ADAS",
        "Class-leading 220mm Ground Clearance",
        "Wireless Apple CarPlay & Android Auto",
        "LaneWatch Blind-Spot Monitor",
        "Single-pane Sunroof",
      ],
    },
  },
  hyundai: {
    creta: {
      bodyType: "SUV",
      lengthMm: 4330,
      widthMm: 1790,
      heightMm: 1635,
      wheelbaseMm: 2610,
      groundClearanceMm: 190,
      bootSpaceLitres: 433,
      seatingCapacity: 5,
      variants: {
        petrol: {
          engineType: "1.5L MPi Naturally Aspirated 4-Cylinder Smartstream",
          engineCapacityCc: 1497,
          powerBhp: 113,
          torqueNm: 144,
          fuelEfficiency: "17.4 kmpl",
          transmission: "IVT Automatic",
        },
        diesel: {
          engineType: "1.5L U2 CRDi 4-Cylinder Turbocharged Diesel",
          engineCapacityCc: 1493,
          powerBhp: 114,
          torqueNm: 250,
          fuelEfficiency: "21.8 kmpl",
          transmission: "Automatic",
        },
      },
      features: [
        "Panoramic Sunroof",
        "Bose Premium 8-Speaker Sound System",
        "Ventilated Front Seats",
        "Dual Zone Climate Control",
        "Level 2 ADAS (SmartSense)",
        "360 Degree Surround Camera",
      ],
    },
    i20: {
      bodyType: "Hatchback",
      lengthMm: 3995,
      widthMm: 1775,
      heightMm: 1505,
      wheelbaseMm: 2580,
      groundClearanceMm: 170,
      bootSpaceLitres: 311,
      seatingCapacity: 5,
      variants: {
        petrol: {
          engineType: "1.2L Kappa Dual VTVT 4-Cylinder Petrol",
          engineCapacityCc: 1197,
          powerBhp: 82,
          torqueNm: 115,
          fuelEfficiency: "20.3 kmpl",
          transmission: "Manual",
        },
        diesel: {
          engineType: "1.5L U2 CRDi Diesel Engine",
          engineCapacityCc: 1493,
          powerBhp: 99,
          torqueNm: 240,
          fuelEfficiency: "25.0 kmpl",
          transmission: "Manual",
        },
      },
      features: [
        "Bose 7-Speaker Sound System",
        "Electric Sunroof",
        "Wireless Charger with Cooling Pad",
        "10.25-inch Touchscreen HD Nav",
        "Digital Cluster",
        "6 Airbags",
      ],
    },
  },
  tata: {
    nexon: {
      bodyType: "SUV",
      lengthMm: 3995,
      widthMm: 1804,
      heightMm: 1620,
      wheelbaseMm: 2498,
      groundClearanceMm: 208,
      bootSpaceLitres: 382,
      seatingCapacity: 5,
      variants: {
        petrol: {
          engineType: "1.2L Revotron 3-Cylinder Turbocharged Petrol Engine",
          engineCapacityCc: 1199,
          powerBhp: 118,
          torqueNm: 170,
          fuelEfficiency: "17.4 kmpl",
          transmission: "Manual",
        },
        diesel: {
          engineType: "1.5L Revotorq 4-Cylinder Turbocharged Diesel Engine",
          engineCapacityCc: 1497,
          powerBhp: 113,
          torqueNm: 260,
          fuelEfficiency: "23.2 kmpl",
          transmission: "Automatic AMT",
        },
        ev: {
          engineType: "Permanent Magnet Synchronous Motor (PMSM) Long Range",
          batteryCapacityKwh: 40.5,
          powerBhp: 143,
          torqueNm: 215,
          rangeKm: 465,
          fuelEfficiency: "105 Wh/km",
          transmission: "Single-Speed Automatic",
        },
      },
      features: [
        "5-Star Global NCAP Safety Rating",
        "Ventilated Leatherette Seats",
        "360 Degree 3D Surround Camera",
        "10.25-inch Floating Cinematic Touchscreen",
        "JBL 9-Speaker Audio with Subwoofer",
        "Blind View Monitor",
      ],
    },
  },
  "maruti suzuki": {
    swift: {
      bodyType: "Hatchback",
      lengthMm: 3860,
      widthMm: 1735,
      heightMm: 1520,
      wheelbaseMm: 2450,
      groundClearanceMm: 163,
      bootSpaceLitres: 265,
      seatingCapacity: 5,
      variants: {
        petrol: {
          engineType: "1.2L Z-Series / DualJet 3/4-Cylinder VVT Petrol Engine",
          engineCapacityCc: 1197,
          powerBhp: 80,
          torqueNm: 112,
          fuelEfficiency: "24.8 kmpl",
          transmission: "Manual",
        },
        cng: {
          engineType: "1.2L DualJet Dual-VVT Bi-Fuel Factory CNG",
          engineCapacityCc: 1197,
          powerBhp: 76,
          torqueNm: 98,
          fuelEfficiency: "30.9 km/kg",
          transmission: "Manual",
        },
      },
      features: [
        "6 Airbags Standard",
        "9-inch SmartPlay Pro+ Touchscreen",
        "Wireless Apple CarPlay & Android Auto",
        "Rear AC Vents",
        "Cruise Control",
        "LED Projector Headlamps",
      ],
    },
  },
  toyota: {
    fortuner: {
      bodyType: "SUV",
      lengthMm: 4795,
      widthMm: 1855,
      heightMm: 1835,
      wheelbaseMm: 2745,
      groundClearanceMm: 225,
      bootSpaceLitres: 296,
      seatingCapacity: 7,
      variants: {
        diesel: {
          engineType: "2.8L 4-Cylinder Inline DOHC 16V Turbo Diesel Intercooler",
          engineCapacityCc: 2755,
          powerBhp: 201,
          torqueNm: 500,
          fuelEfficiency: "14.2 kmpl",
          transmission: "6-Speed Automatic 4x4",
        },
        petrol: {
          engineType: "2.7L Dual VVT-i 4-Cylinder DOHC Petrol",
          engineCapacityCc: 2694,
          powerBhp: 164,
          torqueNm: 245,
          fuelEfficiency: "10.0 kmpl",
          transmission: "Automatic",
        },
      },
      features: [
        "4x4 High/Low Range with Auto Limited Slip Differential",
        "11-Speaker JBL Audio System",
        "Ventilated Front Seats",
        "Powered Tailgate with Kick Sensor",
        "7 Airbags",
        "Vehicle Stability Control (VSC)",
      ],
    },
  },
};

const INITIAL_VEHICLES: Omit<Vehicle, "id" | "createdAt" | "updatedAt">[] = [
  {
    make: "Volkswagen",
    model: "Polo",
    variant: "TSI MT BSIV",
    year: 2021,
    priceInr: 650000,
    bodyType: "Hatchback",
    fuelType: "Petrol",
    transmission: "Manual",
    kilometers: 25000,
    owners: 1,
    color: "Flash Red",
    city: "Hyderabad",
    engineType: "1.0L TSI 3-Cylinder Turbocharged Petrol Engine",
    engineCapacityCc: 999,
    engineLengthMm: 3971,
    powerBhp: 109,
    torqueNm: 175,
    lengthMm: 3971,
    widthMm: 1682,
    heightMm: 1469,
    wheelbaseMm: 2470,
    groundClearanceMm: 165,
    bootSpaceLitres: 280,
    seatingCapacity: 5,
    fuelEfficiency: "18.2 kmpl",
    batteryCapacityKwh: null,
    rangeKm: null,
    description:
      "This 2021 Volkswagen Polo TSI MT BSIV has passed our stringent 150-point inspection and comes with certified warranty coverage, verified single-owner history, zero meter tampering, and full after-sales support from Passion Car.",
    features: [
      "Power Steering",
      "Anti-lock Braking System (ABS)",
      "Dual Airbags",
      "Touchscreen Infotainment",
      "Rear Camera",
      "Portago Alloy Wheels",
      "Climatronic Auto AC",
      "Cruise Control",
      "Cornering Fog Lamps",
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "available",
  },
  {
    make: "Honda",
    model: "City",
    variant: "ZX CVT I VTEC BSIV",
    year: 2017,
    priceInr: 780000,
    bodyType: "Sedan",
    fuelType: "Petrol",
    transmission: "Automatic",
    kilometers: 91383,
    owners: 1,
    color: "Golden Brown Metallic",
    city: "Hyderabad",
    engineType: "1.5L i-VTEC DOHC 4-Cylinder Petrol Engine",
    engineCapacityCc: 1498,
    engineLengthMm: 4549,
    powerBhp: 119,
    torqueNm: 145,
    lengthMm: 4549,
    widthMm: 1748,
    heightMm: 1489,
    wheelbaseMm: 2600,
    groundClearanceMm: 165,
    bootSpaceLitres: 506,
    seatingCapacity: 5,
    fuelEfficiency: "17.8 kmpl",
    batteryCapacityKwh: null,
    rangeKm: null,
    description:
      "Flagship Honda City ZX CVT with top-of-the-line luxury features including full LED headlamps, electric sunroof, leather interiors, and effortless 7-step paddle-shift CVT automatic transmission. Inspected and certified by Passion Car.",
    features: [
      "Electric Sunroof",
      "6 Airbags",
      "Full LED Headlamps",
      "Leather Upholstery",
      "Touchscreen Infotainment with Navigation",
      "Paddle Shifters",
      "Multi-angle Rear Camera",
      "Alloy Wheels",
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "available",
  },
  {
    make: "Honda",
    model: "Jazz",
    variant: "1.5 SV MT IDTECH BSIV",
    year: 2015,
    priceInr: 450000,
    bodyType: "Hatchback",
    fuelType: "Diesel",
    transmission: "Manual",
    kilometers: 50000,
    owners: 2,
    color: "Alabaster Silver",
    city: "Hyderabad",
    engineType: "1.5L i-DTEC Earth Dreams Turbocharged Diesel Engine",
    engineCapacityCc: 1498,
    engineLengthMm: 3989,
    powerBhp: 98,
    torqueNm: 200,
    lengthMm: 3989,
    widthMm: 1694,
    heightMm: 1544,
    wheelbaseMm: 2530,
    groundClearanceMm: 165,
    bootSpaceLitres: 354,
    seatingCapacity: 5,
    fuelEfficiency: "27.3 kmpl",
    batteryCapacityKwh: null,
    rangeKm: null,
    description:
      "Exceptionally fuel-efficient Honda Jazz 1.5 SV i-DTEC delivering up to 27+ kmpl. Loaded with spacious Magic Seat flexibility, outstanding cabin headroom, and certified pristine engine condition verified by Passion Car technicians.",
    features: [
      "Electric Power Steering",
      "ABS with EBD",
      "Dual Airbags",
      "Steering Mounted Audio Controls",
      "Spacious Magic Seats",
      "Rear Parking Sensors",
      "Power Windows All 4",
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
    ],
    status: "available",
  },
  {
    make: "Volkswagen",
    model: "Polo",
    variant: "Comfortline 1.2 MPI",
    year: 2015,
    priceInr: 550000,
    bodyType: "Hatchback",
    fuelType: "Petrol",
    transmission: "Manual",
    kilometers: 50000,
    owners: 1,
    color: "Candy White",
    city: "Hyderabad",
    engineType: "1.2L MPI 3-Cylinder Petrol Engine",
    engineCapacityCc: 1198,
    engineLengthMm: 3971,
    powerBhp: 74,
    torqueNm: 110,
    lengthMm: 3971,
    widthMm: 1682,
    heightMm: 1469,
    wheelbaseMm: 2470,
    groundClearanceMm: 165,
    bootSpaceLitres: 280,
    seatingCapacity: 5,
    fuelEfficiency: "16.4 kmpl",
    batteryCapacityKwh: null,
    rangeKm: null,
    description:
      "Classic Volkswagen build quality with laser-welded high-strength steel chassis. Single-owner maintained with complete authorized service records, verified odometer, and zero accident history.",
    features: [
      "Anti-lock Braking System (ABS)",
      "Dual Front Airbags",
      "Electrically Adjustable ORVMs",
      "Rear Defogger",
      "Premium Fabric Seats",
      "Central Locking",
    ],
    imageUrls: [
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
      "/images/reviews/review-02.webp",
    ],
    status: "available",
  },
];

const INITIAL_GALLERY: Omit<GalleryItem, "id" | "createdAt">[] = [
  {
    title: "Handover of Certified Hatchback",
    category: "Customer Deliveries",
    imageUrl: "/images/reviews/review-07.webp",
    caption: "Happy customer smiles receiving verified single-owner vehicle keys.",
    sortOrder: 1,
  },
  {
    title: "Passion Car Official Emblem & Brand",
    category: "Showroom",
    imageUrl: "/images/reviews/review-08.webp",
    caption: "Passion Car - Your car your passion. Luxury pre-owned showroom Kavuri Hills, Madhapur.",
    sortOrder: 2,
  },
  {
    title: "Passion Car Main Showroom & Fleet",
    category: "Showroom",
    imageUrl: "/images/hero-delivery.webp",
    caption: "Our premium pre-owned luxury car showroom on 100 Feet Road, Kavuri Hills, Madhapur, Hyderabad.",
    sortOrder: 3,
  },
  {
    title: "Happy Customer Key Handover Moment",
    category: "Customer Deliveries",
    imageUrl: "/images/reviews/review-01.webp",
    caption: "Proud customer receiving ceremonial giant key for their verified Volkswagen Polo.",
    sortOrder: 4,
  },
  {
    title: "Premium Vehicle Handover Ceremony",
    category: "Customer Deliveries",
    imageUrl: "/images/reviews/review-02.webp",
    caption: "Smiles and trust: delivering certified pre-owned excellence to our valued family.",
    sortOrder: 5,
  },
  {
    title: "Delighted Honda City Delivery",
    category: "Customer Deliveries",
    imageUrl: "/images/reviews/review-04.webp",
    caption: "Another dream car safely handed over with verified documentation and warranty.",
    sortOrder: 6,
  },
  {
    title: "150-Point Certified Inspection Bay",
    category: "Facilities",
    imageUrl: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1200&q=80",
    caption: "Dedicated diagnostics facility where every car undergoes our strict 150-point inspection.",
    sortOrder: 7,
  },
  {
    title: "Customer Welcome Lounge & Consultation",
    category: "Facilities",
    imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80",
    caption: "Air-conditioned customer lounge for transparent consultation, loan processing, and RC transfer assistance.",
    sortOrder: 8,
  },
  {
    title: "Family Receiving Their Sedan Handover",
    category: "Customer Deliveries",
    imageUrl: "/images/reviews/review-06.webp",
    caption: "A joyful family receiving the keys to their premium sedan at Passion Car Madhapur.",
    sortOrder: 9,
  },
  {
    title: "Kavuri Hills Showroom Frontage",
    category: "Showroom",
    imageUrl: "/images/reviews/review-10.webp",
    caption: "Prime display zone for handpicked luxury pre-owned inventory in Madhapur.",
    sortOrder: 10,
  },
];

interface DataStore {
  vehicles: Vehicle[];
  inquiries: Inquiry[];
  settings: Record<string, any>;
  gallery: GalleryItem[];
  customers: Customer[];
  serviceBookings: ServiceBooking[];
}

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: "Vikram Sharma",
    phone: "+91 98490 12345",
    email: "vikram.sharma@gmail.com",
    carModel: "Honda City 1.5 V i-VTEC 2019",
    regNumber: "TS 09 EB 3219",
    transactionType: "sold_to_dealership",
    amountInr: 680000,
    date: "2026-02-12",
    status: "completed",
    notes: "Direct seller purchase. Instant RTGS payment processed, RC transferred cleanly.",
    createdAt: new Date("2026-02-12T10:00:00Z"),
  },
  {
    id: 2,
    name: "Rajesh Varma",
    phone: "+91 98480 87654",
    email: "rajesh.varma@outlook.com",
    carModel: "Hyundai Creta SX Petrol 2020",
    regNumber: "TS 07 HK 9042",
    transactionType: "sold_to_dealership",
    amountInr: 920000,
    date: "2026-02-28",
    status: "completed",
    notes: "Old client traded in for upgrade. Valuation approved on spot.",
    createdAt: new Date("2026-02-28T14:30:00Z"),
  },
  {
    id: 3,
    name: "Dr. Ananya Rao",
    phone: "+91 97012 34567",
    email: "dr.ananya.rao@apollo.com",
    carModel: "Volkswagen Polo TSI MT 2021",
    regNumber: "TS 09 FL 7821",
    transactionType: "bought_from_dealership",
    amountInr: 650000,
    date: "2026-03-04",
    status: "completed",
    notes: "Purchased Flash Red Polo TSI. 1-year Passion Car warranty active.",
    createdAt: new Date("2026-03-04T11:15:00Z"),
  },
  {
    id: 4,
    name: "Srikanth Reddy",
    phone: "+91 99890 55443",
    email: "srikanth.reddy@techm.com",
    carModel: "BMW 3 Series 320d Luxury Line 2020",
    regNumber: "TS 08 FA 1109",
    transactionType: "bought_from_dealership",
    amountInr: 2850000,
    date: "2026-03-18",
    status: "completed",
    notes: "Financed via HDFC Bank. Ceremonial key handover completed at Kavuri Hills.",
    createdAt: new Date("2026-03-18T16:00:00Z"),
  },
  {
    id: 5,
    name: "Karthik Nambiar",
    phone: "+91 98499 33221",
    email: "karthik.nambiar@gmail.com",
    carModel: "Audi A4 2.0 TDI Premium Plus 2021",
    regNumber: "TS 09 GL 6620",
    transactionType: "current_buyer",
    amountInr: 2450000,
    date: "2026-10-08",
    status: "in_progress",
    notes: "Token advance received. PDI inspection cleared, delivery scheduled for this week.",
    createdAt: new Date("2026-10-08T09:00:00Z"),
  },
  {
    id: 6,
    name: "Divya Patel",
    phone: "+91 98850 77112",
    email: "divya.patel@gmail.com",
    carModel: "Honda Jazz 1.5 SV i-DTEC 2015",
    regNumber: "TS 10 EH 4410",
    transactionType: "current_buyer",
    amountInr: 450000,
    date: "2026-10-09",
    status: "in_progress",
    notes: "Booking confirmed today. Paperwork & insurance endorsement underway.",
    createdAt: new Date("2026-10-09T08:30:00Z"),
  },
];

const INITIAL_SERVICE_BOOKINGS: ServiceBooking[] = [
  {
    id: 1,
    token: "PCS-SRV-8941",
    customerName: "Ramesh Sharma",
    phone: "+91 98490 12345",
    email: "ramesh.sharma@example.com",
    carDetails: "2021 Volkswagen Polo TSI (TS 09 FL 7821)",
    servicePackage: "Periodic Comprehensive Service",
    date: "2026-10-12",
    timeSlot: "09:30 AM - 11:00 AM",
    status: "confirmed",
    notes: "Engine oil change, synthetic Motul oil requested, AC filter cleaning.",
    createdAt: new Date("2026-10-09T07:00:00Z"),
  },
  {
    id: 2,
    token: "PCS-SRV-4120",
    customerName: "Sanjay Kulkarni",
    phone: "+91 98661 22880",
    email: "sanjay.k@gmail.com",
    carDetails: "2020 BMW 320d Luxury Line",
    servicePackage: "Ceramic Coating & Detailing",
    date: "2026-10-13",
    timeSlot: "11:00 AM - 12:30 PM",
    status: "confirmed",
    notes: "9H Ceramic shield + deep interior steam detailing.",
    createdAt: new Date("2026-10-09T08:00:00Z"),
  },
];

export function sanitizeVehicleImages(v: Vehicle): Vehicle {
  const deliveryRegex = /\/images\/(reviews\/|hero-delivery)/i;
  const filtered = (v.imageUrls || []).filter((url) => !deliveryRegex.test(url));
  if (filtered.length > 0) {
    return { ...v, imageUrls: filtered };
  }
  const isCity = /city/i.test(v.model);
  const isJazz = /jazz/i.test(v.model);
  let defaultPhotos: string[] = [
    "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
  ];
  if (isCity) {
    defaultPhotos = [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
    ];
  } else if (isJazz) {
    defaultPhotos = [
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
    ];
  }
  return { ...v, imageUrls: defaultPhotos };
}

export class JsonStorage implements IStorage {
  private data: DataStore;

  constructor() {
    this.data = this.loadData();
    this.syncFromDb().catch(() => {});
  }

  private loadData(): DataStore {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.vehicles && parsed.settings) {
          if (!parsed.customers || !Array.isArray(parsed.customers) || parsed.customers.length === 0) {
            parsed.customers = INITIAL_CUSTOMERS;
          }
          if (!parsed.serviceBookings || !Array.isArray(parsed.serviceBookings) || parsed.serviceBookings.length === 0) {
            parsed.serviceBookings = INITIAL_SERVICE_BOOKINGS;
          }
          if (!parsed.gallery) parsed.gallery = [];
          if (!parsed.inquiries) parsed.inquiries = [];
          parsed.inquiries = parsed.inquiries.filter((i: any) => i.status !== "completed" && i.status !== "closed");
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read existing store.json, reinitializing default data.");
    }

    const now = new Date();
    const defaultData: DataStore = {
      vehicles: INITIAL_VEHICLES.map((v, i) => ({
        ...v,
        id: i + 1,
        createdAt: now,
        updatedAt: now,
      })),
      inquiries: [
        {
          id: 1,
          type: "buy",
          name: "Ramesh Sharma",
          phone: "+91 98490 12345",
          email: "ramesh.sharma@example.com",
          message: "Interested in the 2021 Volkswagen Polo TSI. Is a test drive available this weekend?",
          vehicleId: 1,
          status: "new",
          createdAt: now,
        },
      ],
      settings: {
        carsSold: 250,
        googleRating: 4.2,
        googleReviews: 24,
        phone: "+91 88858 58380",
        whatsapp: "+918885858380",
        address: "Plot No: 25, 100 Feet Rd, Sri Rama Colony, Kavuri Hills, Madhapur, Hyderabad, Telangana 500081",
        adminPhoto: "",
        adminName: "Mohammed Akbar",
        adminPhone: "+91 88858 58380",
      },
      gallery: INITIAL_GALLERY.map((g, i) => ({
        ...g,
        id: i + 1,
        createdAt: now,
      })),
      customers: INITIAL_CUSTOMERS,
      serviceBookings: INITIAL_SERVICE_BOOKINGS,
    };

    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(data = this.data): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save data to store.json:", e);
    }
  }

  private ensureFreshData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.vehicles && parsed.settings) {
          if (!parsed.customers || !Array.isArray(parsed.customers)) {
            parsed.customers = INITIAL_CUSTOMERS;
          }
          if (!parsed.serviceBookings || !Array.isArray(parsed.serviceBookings)) {
            parsed.serviceBookings = INITIAL_SERVICE_BOOKINGS;
          }
          if (!parsed.gallery) parsed.gallery = [];
          if (!parsed.inquiries) parsed.inquiries = [];
          this.data = parsed;
        }
      }
    } catch (e) {}
  }

  async syncFromDb() {
    if (!db) return;
    try {
      const [dbVehicles, dbGallery, dbInquiries, dbCustomers, dbBookings, dbSettings] = await Promise.all([
        db.select().from(vehicles),
        db.select().from(showroomGallery),
        db.select().from(inquiries),
        db.select().from(customers),
        db.select().from(serviceBookings),
        db.select().from(siteSettings),
      ]);
      if (dbVehicles && dbVehicles.length > 0) this.data.vehicles = dbVehicles;
      if (dbGallery && dbGallery.length > 0) this.data.gallery = dbGallery;
      if (dbInquiries && dbInquiries.length > 0) {
        this.data.inquiries = dbInquiries.filter((i: any) => i.status !== "completed" && i.status !== "closed");
      }
      if (dbCustomers && dbCustomers.length > 0) this.data.customers = dbCustomers as any;
      if (dbBookings && dbBookings.length > 0) this.data.serviceBookings = dbBookings as any;
      if (dbSettings && dbSettings.length > 0) {
        for (const s of dbSettings) {
          if (s.value && typeof s.value === "object" && "val" in s.value) {
            this.data.settings[s.key] = (s.value as any).val;
          }
        }
      }
      this.saveData();
    } catch (e: any) {
      console.warn("Supabase initial sync error:", e?.message || e);
    }
  }

  async getVehicles(filters: any = {}): Promise<Vehicle[]> {
    this.ensureFreshData();
    let list = this.data.vehicles.filter((v) => v.status === "available" || filters.includeSold);

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (v) =>
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.variant.toLowerCase().includes(q)
      );
    }

    if (filters.brand && filters.brand !== "all") {
      list = list.filter((v) => v.make.toLowerCase() === filters.brand.toLowerCase());
    }

    if (filters.bodyType && filters.bodyType !== "all") {
      list = list.filter((v) => v.bodyType.toLowerCase() === filters.bodyType.toLowerCase());
    }

    if (filters.fuelType && filters.fuelType !== "all") {
      list = list.filter((v) => v.fuelType.toLowerCase() === filters.fuelType.toLowerCase());
    }

    if (filters.transmission && filters.transmission !== "all") {
      list = list.filter((v) => v.transmission.toLowerCase().includes(filters.transmission.toLowerCase()));
    }

    if (filters.minPrice !== undefined) {
      list = list.filter((v) => v.priceInr >= filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      list = list.filter((v) => v.priceInr <= filters.maxPrice);
    }

    if (filters.yearFrom !== undefined) {
      list = list.filter((v) => v.year >= filters.yearFrom);
    }

    if (filters.yearTo !== undefined) {
      list = list.filter((v) => v.year <= filters.yearTo);
    }

    if (filters.maxKm !== undefined) {
      list = list.filter((v) => v.kilometers <= filters.maxKm);
    }

    switch (filters.sort) {
      case "price-asc":
        list.sort((a, b) => a.priceInr - b.priceInr);
        break;
      case "price-desc":
        list.sort((a, b) => b.priceInr - a.priceInr);
        break;
      case "year-desc":
        list.sort((a, b) => b.year - a.year);
        break;
      case "km-asc":
        list.sort((a, b) => a.kilometers - b.kilometers);
        break;
      default:
        list.sort((a, b) => b.id - a.id);
    }

    return list.map(sanitizeVehicleImages);
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const v = this.data.vehicles.find((v) => v.id === id);
    return v ? sanitizeVehicleImages(v) : undefined;
  }

  async createVehicle(input: any): Promise<Vehicle> {
    const nextId = this.data.vehicles.reduce((max, v) => Math.max(max, v.id), 0) + 1;
    const now = new Date();
    const newVehicle: Vehicle = {
      ...input,
      id: nextId,
      createdAt: now,
      updatedAt: now,
    };
    this.data.vehicles.unshift(newVehicle);
    this.saveData();
    if (db) {
      db.insert(vehicles).values(input).returning().then(([inserted]) => {
        if (inserted?.id) newVehicle.id = inserted.id;
      }).catch((e) => console.error("Supabase createVehicle error:", e));
    }
    return newVehicle;
  }

  async updateVehicle(id: number, input: any): Promise<Vehicle | undefined> {
    const idx = this.data.vehicles.findIndex((v) => v.id === id);
    if (idx === -1) return undefined;
    const updated: Vehicle = {
      ...this.data.vehicles[idx],
      ...input,
      updatedAt: new Date(),
    };
    this.data.vehicles[idx] = updated;
    this.saveData();
    if (db) {
      db.update(vehicles).set({ ...input, updatedAt: new Date() }).where(eq(vehicles.id, id)).catch((e) => console.error("Supabase updateVehicle error:", e));
    }
    return updated;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const lenBefore = this.data.vehicles.length;
    this.data.vehicles = this.data.vehicles.filter((v) => v.id !== id);
    if (this.data.vehicles.length !== lenBefore) {
      this.saveData();
      if (db) {
        db.delete(vehicles).where(eq(vehicles.id, id)).catch((e) => console.error("Supabase deleteVehicle error:", e));
      }
      return true;
    }
    return false;
  }

  async getInquiries(): Promise<Inquiry[]> {
    return [...this.data.inquiries].reverse();
  }

  async createInquiry(input: any): Promise<Inquiry> {
    const nextId = this.data.inquiries.reduce((max, i) => Math.max(max, i.id), 0) + 1;
    const newInquiry: Inquiry = {
      id: nextId,
      type: input.type || "contact",
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      message: input.message || "",
      vehicleId: input.vehicleId || null,
      status: "new",
      createdAt: new Date(),
    };
    this.data.inquiries.push(newInquiry);
    this.saveData();
    if (db) {
      db.insert(inquiries).values({
        type: newInquiry.type,
        name: newInquiry.name,
        phone: newInquiry.phone,
        email: newInquiry.email,
        message: newInquiry.message,
        vehicleId: newInquiry.vehicleId,
        status: newInquiry.status,
      }).catch((e) => console.error("Supabase createInquiry error:", e));
    }
    return newInquiry;
  }

  async updateInquiryStatus(id: number, status: string): Promise<Inquiry | undefined> {
    const idx = this.data.inquiries.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    const inq = this.data.inquiries[idx];
    if (status === "completed" || status === "closed") {
      this.data.inquiries.splice(idx, 1);
      this.saveData();
      if (db) {
        db.delete(inquiries).where(eq(inquiries.id, id)).catch((e) => console.error("Supabase deleteInquiry error:", e));
      }
      return { ...inq, status: "completed" };
    }
    inq.status = status;
    this.saveData();
    if (db) {
      db.update(inquiries).set({ status }).where(eq(inquiries.id, id)).catch((e) => console.error("Supabase updateInquiryStatus error:", e));
    }
    return inq;
  }

  async deleteInquiry(id: number): Promise<boolean> {
    const lenBefore = this.data.inquiries.length;
    this.data.inquiries = this.data.inquiries.filter((i) => i.id !== id);
    if (this.data.inquiries.length !== lenBefore) {
      this.saveData();
      if (db) {
        db.delete(inquiries).where(eq(inquiries.id, id)).catch((e) => console.error("Supabase deleteInquiry error:", e));
      }
      return true;
    }
    return false;
  }

  async replyToInquiry(id: number, data: {
    reply: string;
    repliedBy?: string;
    status?: string;
    confirmedSlotTime?: string;
    slotConfirmed?: boolean;
  }): Promise<Inquiry | undefined> {
    const idx = this.data.inquiries.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    const inq = this.data.inquiries[idx];
    (inq as any).adminReply = data.reply;
    (inq as any).repliedAt = new Date().toISOString();
    (inq as any).repliedBy = data.repliedBy || "Mohammed Akbar (Owner)";
    (inq as any).readByAdmin = true;
    (inq as any).readAt = (inq as any).readAt || new Date().toISOString();
    if (data.confirmedSlotTime) {
      (inq as any).confirmedSlotTime = data.confirmedSlotTime;
      (inq as any).slotConfirmed = true;
    }
    if (typeof data.slotConfirmed === "boolean") {
      (inq as any).slotConfirmed = data.slotConfirmed;
    }
    if (data.status === "completed" || data.status === "closed") {
      this.data.inquiries.splice(idx, 1);
      this.saveData();
      if (db) {
        db.delete(inquiries).where(eq(inquiries.id, id)).catch((e) => console.error("Supabase deleteInquiry error:", e));
      }
      return { ...inq, status: "completed" };
    }
    if (data.status) inq.status = data.status;
    this.saveData();
    return inq;
  }

  async markInquiryRead(id: number): Promise<Inquiry | undefined> {
    const inq = this.data.inquiries.find((i) => i.id === id);
    if (!inq) return undefined;
    (inq as any).readByAdmin = true;
    if (!(inq as any).readAt) {
      (inq as any).readAt = new Date().toISOString();
    }
    this.saveData();
    return inq;
  }

  async getCarsSold(): Promise<number> {
    return Number(this.data.settings.carsSold) || 200;
  }

  async setCarsSold(count: number): Promise<number> {
    this.data.settings.carsSold = count;
    this.saveData();
    if (db) {
      db.insert(siteSettings).values({ key: "carsSold", value: { val: count } }).onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: { val: count }, updatedAt: new Date() },
      }).catch((e) => console.error("Supabase setCarsSold error:", e));
    }
    return count;
  }

  async getSettings(): Promise<any> {
    this.ensureFreshData();
    return {
      carsSold: Number(this.data.settings.carsSold) || 250,
      phone: this.data.settings.phone || "+91 88858 58380",
      whatsapp: this.data.settings.whatsapp || "+918885858380",
      address:
        this.data.settings.address ||
        "Plot No: 25, 100 Feet Rd, Sri Rama Colony, Kavuri Hills, Madhapur, Hyderabad, Telangana 500081",
      adminPhoto: this.data.settings.adminPhoto || "",
      adminName: this.data.settings.adminName || "Mohammed Akbar",
      adminPhone: this.data.settings.adminPhone || "+91 88858 58380",
      rating: 4.2,
      reviewsCount: 24,
    };
  }

  async updateSettings(update: any): Promise<any> {
    if (update.carsSold !== undefined) this.data.settings.carsSold = Number(update.carsSold);
    if (update.phone !== undefined) this.data.settings.phone = update.phone.trim();
    if (update.whatsapp !== undefined) this.data.settings.whatsapp = update.whatsapp.trim();
    if (update.address !== undefined) this.data.settings.address = update.address.trim();
    if (update.adminPhoto !== undefined) this.data.settings.adminPhoto = update.adminPhoto;
    if (update.adminName !== undefined) this.data.settings.adminName = update.adminName.trim();
    if (update.adminPhone !== undefined) this.data.settings.adminPhone = update.adminPhone.trim();
    this.saveData();
    if (db) {
      for (const [k, v] of Object.entries(update)) {
        db.insert(siteSettings).values({ key: k, value: { val: v } }).onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: { val: v }, updatedAt: new Date() },
        }).catch((e) => console.error("Supabase updateSettings error:", e));
      }
    }
    return this.getSettings();
  }

  async getGallery(category?: string): Promise<GalleryItem[]> {
    this.ensureFreshData();
    let list = [...this.data.gallery];
    if (category && category !== "all") {
      list = list.filter((g) => g.category.toLowerCase() === category.toLowerCase());
    }
    list.sort((a, b) => a.sortOrder - b.sortOrder);
    return list;
  }

  async createGalleryItem(item: any): Promise<GalleryItem> {
    const nextId = this.data.gallery.reduce((max, g) => Math.max(max, g.id), 0) + 1;
    const newItem: GalleryItem = {
      ...item,
      id: nextId,
      createdAt: new Date(),
    };
    this.data.gallery.push(newItem);
    this.saveData();
    if (db) {
      db.insert(showroomGallery).values(item).returning().then(([inserted]) => {
        if (inserted?.id) newItem.id = inserted.id;
      }).catch((e) => console.error("Supabase createGalleryItem error:", e));
    }
    return newItem;
  }

  async updateGalleryItem(id: number, input: any): Promise<GalleryItem | undefined> {
    const idx = this.data.gallery.findIndex((g) => g.id === id);
    if (idx === -1) return undefined;
    const updated: GalleryItem = {
      ...this.data.gallery[idx],
      ...input,
    };
    this.data.gallery[idx] = updated;
    this.saveData();
    if (db) {
      db.update(showroomGallery).set(input).where(eq(showroomGallery.id, id)).catch((e) => console.error("Supabase updateGalleryItem error:", e));
    }
    return updated;
  }

  async deleteGalleryItem(id: number): Promise<boolean> {
    const lenBefore = this.data.gallery.length;
    this.data.gallery = this.data.gallery.filter((g) => g.id !== id);
    if (this.data.gallery.length !== lenBefore) {
      this.saveData();
      if (db) {
        db.delete(showroomGallery).where(eq(showroomGallery.id, id)).catch((e) => console.error("Supabase deleteGalleryItem error:", e));
      }
      return true;
    }
    return false;
  }

  async getCustomers(filters: { type?: string; search?: string } = {}): Promise<Customer[]> {
    this.ensureFreshData();
    let list = [...(this.data.customers || [])];
    if (filters.type && filters.type !== "all") {
      list = list.filter((c) => c.transactionType === filters.type);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.carModel.toLowerCase().includes(q) ||
          (c.regNumber && c.regNumber.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    this.ensureFreshData();
    return (this.data.customers || []).find((c) => c.id === id);
  }

  async createCustomer(input: Omit<Customer, "id" | "createdAt">): Promise<Customer> {
    this.ensureFreshData();
    const nextId = (this.data.customers || []).reduce((max, c) => Math.max(max, c.id), 0) + 1;
    const now = new Date();
    const newCustomer: Customer = {
      ...input,
      id: nextId,
      createdAt: now,
    };
    if (!this.data.customers) this.data.customers = [];
    this.data.customers.unshift(newCustomer);
    this.saveData();
    if (db) {
      db.insert(customers).values(input as any).returning().then(([inserted]) => {
        if (inserted?.id) newCustomer.id = inserted.id;
      }).catch((e) => console.error("Supabase createCustomer error:", e));
    }
    return newCustomer;
  }

  async updateCustomer(id: number, input: Partial<Customer>): Promise<Customer | undefined> {
    this.ensureFreshData();
    const idx = (this.data.customers || []).findIndex((c) => c.id === id);
    if (idx === -1) return undefined;
    const updated: Customer = {
      ...this.data.customers[idx],
      ...input,
    };
    this.data.customers[idx] = updated;
    this.saveData();
    if (db) {
      db.update(customers).set(input as any).where(eq(customers.id, id)).catch((e) => console.error("Supabase updateCustomer error:", e));
    }
    return updated;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    this.ensureFreshData();
    const lenBefore = (this.data.customers || []).length;
    this.data.customers = (this.data.customers || []).filter((c) => c.id !== id);
    if (this.data.customers.length !== lenBefore) {
      this.saveData();
      if (db) {
        db.delete(customers).where(eq(customers.id, id)).catch((e) => console.error("Supabase deleteCustomer error:", e));
      }
      return true;
    }
    return false;
  }

  async getServiceBookings(): Promise<ServiceBooking[]> {
    this.ensureFreshData();
    const list = [...(this.data.serviceBookings || [])];
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }

  async createServiceBooking(input: Omit<ServiceBooking, "id" | "token" | "status" | "createdAt"> & { token?: string }): Promise<ServiceBooking> {
    this.ensureFreshData();
    const nextId = (this.data.serviceBookings || []).reduce((max, s) => Math.max(max, s.id), 0) + 1;
    const rand = Math.floor(1000 + Math.random() * 9000);
    const token = input.token || `PCS-SRV-${rand}`;
    const newBooking: ServiceBooking = {
      id: nextId,
      token,
      customerName: input.customerName,
      phone: input.phone,
      email: input.email || "",
      carDetails: input.carDetails,
      servicePackage: input.servicePackage || "Periodic Maintenance Service",
      date: input.date,
      timeSlot: input.timeSlot,
      status: "confirmed",
      notes: input.notes || "",
      createdAt: new Date(),
    };
    if (!this.data.serviceBookings) this.data.serviceBookings = [];
    this.data.serviceBookings.unshift(newBooking);
    this.saveData();
    if (db) {
      db.insert(serviceBookings).values({ ...newBooking, createdAt: new Date() } as any).returning().then(([inserted]) => {
        if (inserted?.id) newBooking.id = inserted.id;
      }).catch((e) => console.error("Supabase createServiceBooking error:", e));
    }
    return newBooking;
  }

  async updateServiceBookingStatus(id: number, status: string): Promise<ServiceBooking | undefined> {
    this.ensureFreshData();
    const idx = (this.data.serviceBookings || []).findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    const booking = this.data.serviceBookings[idx];
    if (status === "completed" || status === "closed") {
      this.data.serviceBookings.splice(idx, 1);
      this.saveData();
      if (db) {
        db.delete(serviceBookings).where(eq(serviceBookings.id, id)).catch((e) => console.error("Supabase deleteServiceBooking error:", e));
      }
      return { ...booking, status: "completed" };
    }
    this.data.serviceBookings[idx].status = status as any;
    this.saveData();
    if (db) {
      db.update(serviceBookings).set({ status }).where(eq(serviceBookings.id, id)).catch((e) => console.error("Supabase updateServiceBookingStatus error:", e));
    }
    return this.data.serviceBookings[idx];
  }

  async deleteServiceBooking(id: number): Promise<boolean> {
    this.ensureFreshData();
    const lenBefore = (this.data.serviceBookings || []).length;
    this.data.serviceBookings = (this.data.serviceBookings || []).filter((s) => s.id !== id);
    if (this.data.serviceBookings.length !== lenBefore) {
      this.saveData();
      if (db) {
        db.delete(serviceBookings).where(eq(serviceBookings.id, id)).catch((e) => console.error("Supabase deleteServiceBooking error:", e));
      }
      return true;
    }
    return false;
  }

  async getVehicleSuggestions(make: string, model: string, fuelType: string): Promise<any> {
    const mk = make.trim().toLowerCase();
    const md = model.trim().toLowerCase();
    const ft = fuelType.trim().toLowerCase();

    const makeData = AUTOMOTIVE_CATALOG[mk];
    if (makeData) {
      const modelData = makeData[md];
      if (modelData) {
        const variantData = modelData.variants[ft] || Object.values(modelData.variants)[0];
        return {
          source: "catalog",
          confidence: "high",
          make,
          model,
          bodyType: modelData.bodyType,
          lengthMm: modelData.lengthMm,
          widthMm: modelData.widthMm,
          heightMm: modelData.heightMm,
          wheelbaseMm: modelData.wheelbaseMm,
          groundClearanceMm: modelData.groundClearanceMm,
          bootSpaceLitres: modelData.bootSpaceLitres,
          seatingCapacity: modelData.seatingCapacity,
          engineType: variantData.engineType,
          engineCapacityCc: variantData.engineCapacityCc,
          powerBhp: variantData.powerBhp,
          torqueNm: variantData.torqueNm,
          fuelEfficiency: variantData.fuelEfficiency,
          batteryCapacityKwh: variantData.batteryCapacityKwh,
          rangeKm: variantData.rangeKm,
          transmission: variantData.transmission,
          features: modelData.features,
        };
      }
    }

    const genericPowertrains: Record<string, any> = {
      petrol: {
        engineType: "1.2L 4-Cylinder DOHC Petrol Engine",
        engineCapacityCc: 1197,
        powerBhp: 88,
        torqueNm: 115,
        fuelEfficiency: "18.5 kmpl",
        transmission: "Manual",
      },
      diesel: {
        engineType: "1.5L CRDi 4-Cylinder Turbocharged Diesel Engine",
        engineCapacityCc: 1493,
        powerBhp: 115,
        torqueNm: 250,
        fuelEfficiency: "21.0 kmpl",
        transmission: "Manual",
      },
      ev: {
        engineType: "Permanent Magnet Synchronous Motor (PMSM) Electric Drive",
        batteryCapacityKwh: 40,
        rangeKm: 420,
        powerBhp: 130,
        torqueNm: 245,
        fuelEfficiency: "110 Wh/km",
        transmission: "Automatic",
      },
      hybrid: {
        engineType: "1.5L Atkinson Cycle Petrol Engine with Self-Charging Electric Hybrid Motor",
        engineCapacityCc: 1498,
        powerBhp: 120,
        torqueNm: 250,
        fuelEfficiency: "26.5 kmpl",
        transmission: "e-CVT",
      },
      cng: {
        engineType: "1.2L Bi-Fuel Factory-Fitted CNG Internal Combustion Engine",
        engineCapacityCc: 1197,
        powerBhp: 75,
        torqueNm: 95,
        fuelEfficiency: "30.5 km/kg",
        transmission: "Manual",
      },
    };

    const generic = genericPowertrains[ft] || genericPowertrains.petrol;
    return {
      source: "generic",
      confidence: "medium",
      make,
      model,
      bodyType: "Sedan",
      lengthMm: 4200,
      widthMm: 1720,
      heightMm: 1500,
      wheelbaseMm: 2550,
      groundClearanceMm: 170,
      bootSpaceLitres: 380,
      seatingCapacity: 5,
      ...generic,
      features: [
        "Anti-lock Braking System (ABS)",
        "Dual Front Airbags",
        "Power Steering & Power Windows",
        "Touchscreen Infotainment",
        "Reverse Parking Sensors",
        "Air Conditioning",
      ],
    };
  }
}

export const storage = new JsonStorage();
