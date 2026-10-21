import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Car,
  ShieldCheck,
  Gauge,
  Fuel,
  Zap,
  Sparkles,
  SlidersHorizontal,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  Award,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  Key,
  Settings,
  Trash2,
  Edit3,
  Plus,
  Camera,
  RefreshCw,
  X,
  ChevronRight,
  ChevronLeft,
  Calculator,
  TrendingUp,
  Search,
  Filter,
  Check,
  Lock,
  LogOut,
  User,
  ExternalLink,
  MessageSquare,
  Shield,
  FileText,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Bell,
  BellRing,
  BellOff,
  Volume2,
  VolumeX,
  AlertCircle,
  Layers,
  Info,
  Sun,
  Moon,
  Menu,
  Upload,
  UploadCloud,
  Copy,
  Smartphone,
  Globe,
  Image as ImageIcon,
  Images,
  CheckSquare,
  Square,
  Users,
  Ticket,
  Download,
  Share2,
  KeyRound,
  Wrench,
  Database,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import {
  useVehicles,
  useVehicle,
  useSiteSettings,
  useGoogleRating,
  useReviews,
  useSubmitReview,
  useGallery,
  useVehicleSuggestions,
  useCreateInquiry,
  useAdminSession,
  useAdminLogin,
  useSwitchAdminProfile,
  useGoogleLogin,
  useCustomerPinLogin,
  useCustomerGoogleLogin,
  useUpdateCustomerProfile,
  useResetAdminPassword,
  useTwoStepInit,
  useTwoStepVerify,
  useBookServiceSlot,
  useAdminCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useAdminServiceTokens,
  useUpdateServiceTokenStatus,
  useDeleteServiceToken,
  useSendOtp,
  useVerifyOtp,
  useGenerateMagicLink,
  useVerifyMagicLink,
  useAdminLogout,
  useAdminSummary,
  useAdminVehicles,
  useAdminInquiries,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle,
  useCreateGalleryItem,
  useUpdateGalleryItem,
  useDeleteGalleryItem,
  useUpdateSiteSettings,
  useUpdateInquiryStatus,
  useDeleteInquiry,
  useReplyToInquiry,
  useMarkInquiryRead,
  useUploadImage,
  useUploadMultipleImages,
  useCustomerActivity,
} from "@/lib/api";
import type {
  Vehicle,
  VehicleInput,
  VehicleFilters,
  GalleryItem,
  GalleryItemInput,
  Inquiry,
  InquiryInput,
  Customer,
  CustomerInput,
  ServiceBooking,
  ServiceBookingInput,
  SiteSettings,
  CustomerReview,
} from "@/types";

function formatInr(val: number | any): string {
  const num = typeof val === "number" ? val : Number(val);
  if (!isFinite(num)) return "₹0";
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} Lakh`;
  }
  return `₹${num.toLocaleString("en-IN")}`;
}

function formatNumber(val: number | any): string {
  const num = typeof val === "number" ? val : Number(val);
  if (!isFinite(num)) return "0";
  return num.toLocaleString("en-IN");
}

function formatDateTime(dateStr?: string | Date | null): { date: string; time: string; relative: string } {
  if (!dateStr) return { date: "Recent", time: "", relative: "" };
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: String(dateStr), time: "", relative: "" };
    const date = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const now = Date.now();
    const diffSec = Math.floor((now - d.getTime()) / 1000);
    let relative = "";
    if (diffSec < 60) relative = "Just now";
    else if (diffSec < 3600) relative = `${Math.floor(diffSec / 60)}m ago`;
    else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)}h ago`;
    else if (diffSec < 604800) relative = `${Math.floor(diffSec / 86400)}d ago`;
    else relative = date;
    return { date, time, relative };
  } catch {
    return { date: String(dateStr), time: "", relative: "" };
  }
}

function compressImageFile(file: File, maxDimension = 1600, quality = 0.82): Promise<{ image: string; name: string }> {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => resolve({ image: (reader.result as string) || "", name: file?.name || "file" });
      reader.onerror = () => resolve({ image: "", name: file?.name || "file" });
      reader.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => resolve({ image: "", name: file.name });
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve({ image: (reader.result as string) || "", name: file.name });
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve({ image: (reader.result as string) || "", name: file.name });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({ image: dataUrl, name: file.name.replace(/\.[^/.]+$/, "") });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function cleanMobileNumber(val: string): string {
  const digits = (val || "").replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("91")) {
    return digits.slice(2, 12);
  }
  if (digits.length > 10 && digits.startsWith("0")) {
    return digits.slice(1, 11);
  }
  return digits.slice(0, 10);
}

function buildWhatsAppShareUrl(text: string, phone?: string): string {
  const encoded = encodeURIComponent(text);
  if (phone) {
    let clean = phone.replace(/\D/g, "");
    if (clean.length === 10) {
      clean = "91" + clean;
    }
    return `https://api.whatsapp.com/send?phone=${clean}&text=${encoded}`;
  }
  return `https://api.whatsapp.com/send?phone=918885858380&text=${encoded}`;
}

function safeOpenWhatsApp(text: string, phone?: string): void {
  const url = buildWhatsAppShareUrl(text, phone);
  if (typeof window !== "undefined") {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win || win.closed || typeof win.closed === "undefined") {
      window.location.href = url;
    }
  }
}

function InstagramIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" />
    </svg>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: any) {
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center", background: "var(--bg-main)", color: "var(--text-main)" }}>
          <div style={{ maxWidth: 440, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 32 }}>
            <h3 style={{ marginBottom: 12 }}>Unable to display view</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
              An unexpected render issue occurred.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = "";
                window.location.reload();
              }}
              className="btn btn-primary btn-sm"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentView, setCurrentView] = useState<"public" | "admin">(() => {
    if (typeof window === "undefined") return "public";
    const isPathAdmin = window.location.pathname.startsWith("/admin");
    const isHashAdmin = (window.location.hash || "").startsWith("#admin");
    return isPathAdmin || isHashAdmin ? "admin" : "public";
  });

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("passioncar_theme_pref");
      if (saved === "light" || saved === "dark") return saved;
    }
    return "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light");
      document.body.classList.add("light-theme");
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", "#f8fafc");
    } else {
      document.documentElement.classList.remove("light");
      document.body.classList.remove("light-theme");
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", "#07090e");
    }
    localStorage.setItem("passioncar_theme_pref", theme);
    localStorage.setItem("passioncar_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    const handleSync = () => {
      const isPathAdmin = window.location.pathname.startsWith("/admin");
      const isHashAdmin = (window.location.hash || "").startsWith("#admin");
      setCurrentView(isPathAdmin || isHashAdmin ? "admin" : "public");
    };
    window.addEventListener("popstate", handleSync);
    window.addEventListener("hashchange", handleSync);
    return () => {
      window.removeEventListener("popstate", handleSync);
      window.removeEventListener("hashchange", handleSync);
    };
  }, []);

  const navigateTo = (view: "public" | "admin") => {
    setCurrentView(view);
    const path = view === "admin" ? "/admin#admin/overview" : "/#home";
    window.history.pushState({}, "", path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <ErrorBoundary>
      <div className="app-container">
        {currentView === "public" ? (
          <PublicView theme={theme} toggleTheme={toggleTheme} onGoToAdmin={() => navigateTo("admin")} />
        ) : (
          <AdminView theme={theme} toggleTheme={toggleTheme} onBackToSite={() => navigateTo("public")} />
        )}
      </div>
    </ErrorBoundary>
  );
}

function PublicView({
  theme,
  toggleTheme,
  onGoToAdmin,
}: {
  theme: "dark" | "light";
  toggleTheme: () => void;
  onGoToAdmin?: () => void;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filters, setFilters] = useState<VehicleFilters>({ sort: "recommended" });
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const match = window.location.pathname.match(/^\/car\/(\d+)/);
    if (match) return parseInt(match[1], 10);
    const hashMatch = window.location.hash.match(/^#car-(\d+)/);
    if (hashMatch) return parseInt(hashMatch[1], 10);
    return null;
  });

  const handleOpenCar = (id: number) => {
    setSelectedVehicleId(id);
    const targetHash = `#car-${id}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState({ modal: "car", carId: id }, "", targetHash);
    }
  };

  const handleCloseCar = () => {
    setSelectedVehicleId(null);
    if (window.location.hash.startsWith("#car")) {
      if (window.history.state?.modal === "car") {
        window.history.back();
      } else {
        window.history.replaceState({}, "", "/#inventory");
      }
    } else if (window.location.pathname.startsWith("/car/")) {
      if (window.history.state?.modal === "car") {
        window.history.back();
      } else {
        window.history.pushState({}, "", "/#inventory");
      }
    }
  };

  const [inquiryModal, setInquiryModal] = useState<{
    open: boolean;
    type: "buy" | "sell" | "contact" | "exchange" | "test_drive";
    vehicleId?: number;
    vehicleTitle?: string;
  }>(() => {
    if (typeof window === "undefined") return { open: false, type: "contact" };
    const inqMatch = window.location.hash.match(/^#inquiry-(buy|sell|contact|exchange|test_drive)/);
    if (inqMatch) {
      return { open: true, type: inqMatch[1] as any };
    }
    return { open: false, type: "contact" };
  });
  const [serviceModalOpen, setServiceModalOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.hash === "#service-book";
  });
  const [activeGalleryCat, setActiveGalleryCat] = useState("all");
  const [lightboxImg, setLightboxImg] = useState<{ url: string; title: string; caption?: string } | null>(null);
  const [galleryDisplayCount, setGalleryDisplayCount] = useState(12);
  const [customerAuthModal, setCustomerAuthModal] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.hash === "#signin";
  });
  const [customerUser, setCustomerUser] = useState<{ id: string; name: string; phone: string; email: string; photo: string } | null>(() => {
    try {
      const s = localStorage.getItem("passioncar_customer_session");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [customerProfileModal, setCustomerProfileModal] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.hash === "#profile";
  });
  const [activeGuideModal, setActiveGuideModal] = useState<{ title: string; content: string; date: string } | null>(null);
  const [customerBookingsModal, setCustomerBookingsModal] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.hash === "#bookings";
  });
  const [initialBookingPhone, setInitialBookingPhone] = useState<string>("");

  const handleOpenBookings = (phonePrefill?: string) => {
    setMobileMenuOpen(false);
    if (phonePrefill) {
      setInitialBookingPhone(phonePrefill);
    }
    setCustomerBookingsModal(true);
    if (window.location.hash !== "#bookings") {
      window.history.pushState({ modal: "bookings" }, "", "#bookings");
    }
  };

  const handleCloseBookings = () => {
    setCustomerBookingsModal(false);
    if (window.history.state?.modal === "bookings") {
      window.history.back();
    } else if (window.location.hash === "#bookings") {
      window.history.replaceState({}, "", "/");
    }
  };

  const handleOpenMenu = () => {
    setMobileMenuOpen(true);
    window.history.pushState({ modal: "menu" }, "", "#menu");
  };

  const handleCloseMenu = () => {
    setMobileMenuOpen(false);
    if (window.location.hash === "#menu") {
      try {
        window.history.replaceState({}, "", window.location.pathname + window.location.search);
      } catch {}
    }
  };

  const handleMenuNav = (targetId: string) => {
    setMobileMenuOpen(false);
    if (window.location.hash === "#menu") {
      try {
        window.history.replaceState({}, "", window.location.pathname + window.location.search);
      } catch {}
    }
    const cleanId = targetId.replace(/^#/, "");
    setTimeout(() => {
      const el = document.getElementById(cleanId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.hash = `#${cleanId}`;
      }
    }, 50);
  };

  const handleOpenInquiry = (opts: {
    type: "buy" | "sell" | "contact" | "exchange" | "test_drive";
    vehicleId?: number;
    vehicleTitle?: string;
  }) => {
    setMobileMenuOpen(false);
    setInquiryModal({ open: true, ...opts });
    window.history.pushState({ modal: "inquiry", ...opts }, "", `#inquiry-${opts.type}`);
  };

  const handleCloseInquiry = () => {
    setInquiryModal((prev) => ({ ...prev, open: false }));
    if (window.history.state?.modal === "inquiry") {
      window.history.back();
    }
  };

  const handleOpenService = () => {
    setMobileMenuOpen(false);
    setServiceModalOpen(true);
    window.history.pushState({ modal: "service" }, "", "#service-book");
  };

  const handleCloseService = () => {
    setServiceModalOpen(false);
    if (window.history.state?.modal === "service") {
      window.history.back();
    }
  };

  const handleOpenLightbox = (img: { url: string; title: string; caption?: string }) => {
    setLightboxImg(img);
    window.history.pushState({ modal: "lightbox" }, "", "#photo");
  };

  const handleCloseLightbox = () => {
    setLightboxImg(null);
    if (window.history.state?.modal === "lightbox") {
      window.history.back();
    }
  };

  const handleOpenCustomerAuth = () => {
    setMobileMenuOpen(false);
    setCustomerAuthModal(true);
    window.history.pushState({ modal: "auth" }, "", "#signin");
  };

  const handleCloseCustomerAuth = () => {
    setCustomerAuthModal(false);
    if (window.history.state?.modal === "auth") {
      window.history.back();
    }
  };

  const handleOpenCustomerProfile = () => {
    setMobileMenuOpen(false);
    setCustomerProfileModal(true);
    window.history.pushState({ modal: "profile" }, "", "#profile");
  };

  const handleCloseCustomerProfile = () => {
    setCustomerProfileModal(false);
    if (window.history.state?.modal === "profile") {
      window.history.back();
    }
  };

  const handleLogoutCustomer = () => {
    setCustomerUser(null);
    try {
      localStorage.removeItem("passioncar_customer_session");
    } catch (_) {}
  };

  const handleOpenGuide = (guide: { title: string; content: string; date: string }) => {
    setActiveGuideModal(guide);
    window.history.pushState({ modal: "guide" }, "", "#guide");
  };

  const handleCloseGuide = () => {
    setActiveGuideModal(null);
    if (window.history.state?.modal === "guide") {
      window.history.back();
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && !window.history.state) {
      window.history.replaceState({ page: "home" }, "", window.location.href);
    }

    const syncRoute = () => {
      const path = window.location.pathname || "";
      const hash = window.location.hash || "";

      const carPathMatch = path.match(/^\/car\/(\d+)/);
      const carHashMatch = hash.match(/^#car(?:-|\/)(\d+)/);
      if (carPathMatch) {
        setSelectedVehicleId(parseInt(carPathMatch[1], 10));
      } else if (carHashMatch) {
        setSelectedVehicleId(parseInt(carHashMatch[1], 10));
      } else if (window.history.state?.modal === "car" && window.history.state.carId) {
        setSelectedVehicleId(window.history.state.carId);
      } else {
        setSelectedVehicleId(null);
      }

      if (hash === "#bookings" || window.history.state?.modal === "bookings") {
        setCustomerBookingsModal(true);
      } else {
        setCustomerBookingsModal(false);
      }

      if (hash === "#signin" || hash === "#auth" || window.history.state?.modal === "auth") {
        setCustomerAuthModal(true);
      } else {
        setCustomerAuthModal(false);
      }

      if (hash === "#profile" || window.history.state?.modal === "profile") {
        setCustomerProfileModal(true);
      } else {
        setCustomerProfileModal(false);
      }

      if (hash === "#service-book" || hash === "#service-booking" || window.history.state?.modal === "service") {
        setServiceModalOpen(true);
      } else {
        setServiceModalOpen(false);
      }

      const inquiryMatch = hash.match(/^#inquiry-(buy|sell|contact|exchange|test_drive)/);
      if (inquiryMatch || window.history.state?.modal === "inquiry") {
        const type = (inquiryMatch ? inquiryMatch[1] : (window.history.state?.type || "contact")) as any;
        setInquiryModal((prev) => ({
          open: true,
          type,
          vehicleId: window.history.state?.vehicleId ?? prev.vehicleId,
          vehicleTitle: window.history.state?.vehicleTitle ?? prev.vehicleTitle,
        }));
      } else {
        setInquiryModal((prev) => (prev.open ? { ...prev, open: false } : prev));
      }

      if (hash === "#menu" || window.history.state?.modal === "menu") {
        setMobileMenuOpen(true);
      } else {
        setMobileMenuOpen(false);
      }

      if (hash !== "#photo" && (!window.history.state || window.history.state.modal !== "lightbox")) {
        setLightboxImg(null);
      }

      if (hash !== "#guide" && (!window.history.state || window.history.state.modal !== "guide")) {
        setActiveGuideModal(null);
      }
    };

    window.addEventListener("popstate", syncRoute);
    window.addEventListener("hashchange", syncRoute);
    syncRoute();
    return () => {
      window.removeEventListener("popstate", syncRoute);
      window.removeEventListener("hashchange", syncRoute);
    };
  }, []);

  const heroPhotos = useMemo(
    () => [
      "/images/reviews/review-07.webp",
      "/images/reviews/review-08.webp",
      "/images/hero-delivery.webp",
      "/images/reviews/review-01.webp",
      "/images/reviews/review-02.webp",
      "/images/reviews/review-03.webp",
      "/images/reviews/review-04.webp",
      "/images/reviews/review-05.webp",
      "/images/reviews/review-06.webp",
    ],
    []
  );
  const [heroSlideIdx, setHeroSlideIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlideIdx((prev) => (prev + 1) % heroPhotos.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [heroPhotos.length]);

  const { data: vehicles = [], isLoading: loadingVehicles } = useVehicles(filters);
  const { data: settings } = useSiteSettings();
  const { data: googleRating } = useGoogleRating();
  const { data: customerReviews = [] } = useReviews();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const { data: rawGalleryItems = [] } = useGallery(activeGalleryCat);
  const galleryItems = useMemo(() => {
    return rawGalleryItems.filter(
      (item) => item.category !== "Facilities" && item.category !== "Facilities & Inspection"
    );
  }, [rawGalleryItems]);

  const phone = settings?.phone || "+91 88858 58380";
  const rawPhone = phone.replace(/\D/g, "") || "918885858380";
  const whatsapp = settings?.whatsapp || "+918885858380";
  const rawWhatsapp = whatsapp.replace(/\D/g, "") || "918885858380";
  const address = settings?.address || "Plot No: 25, 100 Feet Rd, Sri Rama Colony, Kavuri Hills, Madhapur, Hyderabad, Telangana 500081";
  const carsSold = settings?.carsSold ?? 200;

  const handleBrandFilter = (brand: string) => {
    setFilters((prev) => ({ ...prev, brand: brand === prev.brand ? undefined : brand }));
  };

  const handleBodyTypeFilter = (bodyType: string) => {
    setFilters((prev) => ({ ...prev, bodyType: bodyType === prev.bodyType ? undefined : bodyType }));
  };

  const handleFuelFilter = (fuelType: string) => {
    setFilters((prev) => ({ ...prev, fuelType: fuelType === prev.fuelType ? undefined : fuelType }));
  };

  return (
    <div className="public-page">
      
      <header className="navbar">
        <div className="nav-container">
          <a href="#home" className="brand-logo" title="Passion Car Hyderabad">
            <div className="brand-logo-badge">
              <img
                src="/images/logo.png"
                alt="Passion Car Logo"
                className="brand-logo-img"
              />
            </div>
            <div className="brand-name">
              <span className="brand-title">PASSION CAR</span>
            </div>
          </a>

          <nav>
            <ul className="nav-menu">
              <li><a href="#home" className="nav-link">Home</a></li>
              <li>
                <a
                  href="#inventory"
                  className="nav-link"
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700 }}
                >
                  <Car size={14} className="text-red-500" />
                  <span>Catalog</span>
                </a>
              </li>
              <li><a href="#sell" className="nav-link">Sell Car</a></li>
              <li><a href="#service" className="nav-link">Services</a></li>
              <li><a href="#reviews" className="nav-link">Reviews</a></li>
              <li><a href="#contact" className="nav-link">Contact</a></li>
              <li>
                <button
                  onClick={() => handleOpenBookings()}
                  className="nav-link"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    font: "inherit",
                    fontWeight: 600,
                  }}
                  title="View Your Booked Service Tokens, Test Drives, and Inquiries"
                >
                  <Ticket size={14} className="text-red-500" />
                  <span>My Bookings</span>
                </button>
              </li>
              <li>
                {customerUser ? (
                  <button
                    onClick={handleOpenCustomerProfile}
                    className="nav-link"
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "var(--radius-full)",
                      padding: "4px 12px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      color: "var(--text-main)",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {customerUser.photo ? (
                      <img
                        src={customerUser.photo}
                        alt={customerUser.name}
                        style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: "var(--primary)",
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {customerUser.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span>{customerUser.name.split(" ")[0]}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleOpenCustomerAuth}
                    className="nav-link"
                    style={{
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      borderRadius: "var(--radius-full)",
                      padding: "5px 14px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      font: "inherit",
                      fontWeight: 700,
                      color: "var(--primary)",
                    }}
                  >
                    <User size={14} />
                    <span>Sign In</span>
                  </button>
                )}
              </li>
            </ul>
          </nav>

          <div className="nav-actions">
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              aria-label="Toggle light or dark theme"
            >
              <span className="theme-toggle-icon">
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </span>
              <span className="theme-toggle-text">
                {theme === "dark" ? "Light" : "Dark"}
              </span>
            </button>

            {customerUser ? (
              <button
                type="button"
                onClick={handleOpenCustomerProfile}
                className="mobile-header-user-btn"
                title="Customer Profile & Settings"
              >
                {customerUser.photo ? (
                  <img
                    src={customerUser.photo}
                    alt={customerUser.name}
                    className="mobile-header-user-avatar"
                  />
                ) : (
                  <div className="mobile-header-user-initial">
                    {customerUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="mobile-header-user-name">{customerUser.name.split(" ")[0]}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCustomerAuth}
                className="mobile-header-signin-btn"
                title="Sign In"
              >
                <User size={13} />
                <span>Sign In</span>
              </button>
            )}

            <a
              href="#inventory"
              className="mobile-header-catalog-btn"
              title="Browse Car Catalog"
            >
              <Car size={14} />
              <span>Catalog</span>
            </a>

            <a
              href={`tel:+${rawPhone}`}
              className="btn btn-outline btn-sm nav-btn-desktop"
              title={`Call Passion Car at ${phone}`}
            >
              <Phone size={14} className="text-red-500" />
              <span className="nav-btn-phone-text">{phone}</span>
              <span className="nav-btn-phone-short">Call</span>
            </a>

            <a
              href={`https://wa.me/${rawWhatsapp}?text=Hello%20Passion%20Car,%20I%20am%20interested%20in%20your%20verified%20cars.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm nav-btn-desktop"
            >
              <MessageSquare size={14} />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={handleOpenMenu}
              className="mobile-menu-btn"
              aria-label="Toggle navigation menu"
              title="Menu"
            >
              <Menu size={20} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={handleCloseMenu}>
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="brand-logo">
                <div className="brand-logo-badge">
                  <img src="/images/logo.png" alt="Passion Car Logo" className="brand-logo-img" />
                </div>
                <div className="brand-name">
                  <span style={{ fontSize: 16, fontWeight: 800 }}>PASSION CAR</span>
                </div>
              </div>
              <button
                onClick={handleCloseMenu}
                className="modal-close-btn"
                aria-label="Close navigation menu"
              >
                <X size={20} />
              </button>
            </div>

            {customerUser ? (
              <div
                style={{
                  marginBottom: 16,
                  padding: 14,
                  background: "var(--bg-card)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {customerUser.photo ? (
                    <img
                      src={customerUser.photo}
                      alt={customerUser.name}
                      style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary)" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: "var(--primary)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        fontWeight: 800,
                        border: "2px solid rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      {customerUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {customerUser.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {customerUser.email || customerUser.phone || "Signed in"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setTimeout(() => handleOpenCustomerProfile(), 50);
                    }}
                    className="btn btn-outline btn-sm"
                    style={{ justifyContent: "center", gap: 6, fontSize: 12, fontWeight: 700 }}
                  >
                    <Settings size={14} />
                    <span>Profile & Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogoutCustomer();
                    }}
                    className="btn btn-glass btn-sm"
                    style={{ justifyContent: "center", gap: 6, fontSize: 12, color: "#ef4444" }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  marginBottom: 16,
                  padding: 14,
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, var(--bg-card) 100%)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "rgba(239, 68, 68, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--primary)",
                    }}
                  >
                    <User size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "var(--text-main)" }}>
                      Customer Account
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      Sign in for bookings, test drives & profile
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setTimeout(() => handleOpenCustomerAuth(), 50);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ width: "100%", justifyContent: "center", gap: 8, fontWeight: 700 }}
                >
                  <User size={15} />
                  <span>Sign In / Create Account</span>
                </button>
              </div>
            )}

            <div style={{ marginBottom: 16, padding: 12, background: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                Direct Forms & Booking
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setTimeout(() => handleOpenBookings(), 50);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{
                    justifyContent: "center",
                    fontSize: 13,
                    padding: "9px 12px",
                    gridColumn: "span 2",
                    background: "linear-gradient(135deg, var(--primary) 0%, #b91c1c 100%)",
                    gap: 8,
                  }}
                >
                  <Ticket size={16} />
                  <strong>My Bookings & Service Tokens</strong>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setTimeout(() => handleOpenInquiry({ type: "test_drive" }), 50);
                  }}
                  className="btn btn-glass btn-sm"
                  style={{ justifyContent: "flex-start", fontSize: 12, padding: "8px 10px" }}
                >
                  <Calendar size={14} className="text-red-500" />
                  <span>Test Drive</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setTimeout(() => handleOpenService(), 50);
                  }}
                  className="btn btn-glass btn-sm"
                  style={{ justifyContent: "flex-start", fontSize: 12, padding: "8px 10px" }}
                >
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Book Service</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setTimeout(() => handleOpenInquiry({ type: "sell" }), 50);
                  }}
                  className="btn btn-glass btn-sm"
                  style={{ justifyContent: "flex-start", fontSize: 12, padding: "8px 10px" }}
                >
                  <TrendingUp size={14} className="text-emerald-500" />
                  <span>Sell Car</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setTimeout(() => handleOpenInquiry({ type: "exchange" }), 50);
                  }}
                  className="btn btn-glass btn-sm"
                  style={{ justifyContent: "flex-start", fontSize: 12, padding: "8px 10px" }}
                >
                  <RefreshCw size={14} className="text-sky-500" />
                  <span>Exchange</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setTimeout(() => handleOpenInquiry({ type: "contact" }), 50);
                  }}
                  className="btn btn-glass btn-sm"
                  style={{ justifyContent: "flex-start", fontSize: 12, padding: "8px 10px", gridColumn: "span 2" }}
                >
                  <ShieldCheck size={14} className="text-red-500" />
                  <span>RTI & RTO Legal Assistance</span>
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => handleMenuNav("inventory")}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "13px 18px",
                  fontSize: 14,
                  fontWeight: 800,
                  gap: 10,
                  borderRadius: 12,
                  boxShadow: "0 4px 16px rgba(239, 68, 68, 0.4)",
                  letterSpacing: "0.3px",
                  textTransform: "uppercase",
                }}
              >
                <Car size={18} />
                <span>Browse Car Catalog</span>
              </button>
            </div>

            <div className="mobile-drawer-nav">
              <button
                type="button"
                onClick={() => handleMenuNav("home")}
                className="mobile-nav-item"
                style={{ background: "transparent", border: "none", textAlign: "left", width: "100%", cursor: "pointer", font: "inherit", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}
              >
                <Car size={16} /> <span>Home</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTimeout(() => handleOpenBookings(), 50);
                }}
                className="mobile-nav-item"
                style={{ background: "transparent", border: "none", textAlign: "left", width: "100%", cursor: "pointer", font: "inherit", color: "inherit", display: "flex", alignItems: "center", gap: 12, fontWeight: 700 }}
              >
                <Ticket size={16} className="text-red-500" /> <span>My Bookings & Tokens</span>
              </button>
              <button
                type="button"
                onClick={() => handleMenuNav("inventory")}
                className="mobile-nav-item"
                style={{ background: "transparent", border: "none", textAlign: "left", width: "100%", cursor: "pointer", font: "inherit", color: "inherit", display: "flex", alignItems: "center", gap: 12, fontWeight: 700 }}
              >
                <Car size={18} className="text-red-500" /> <span>Car Catalog</span>
              </button>
              <button
                type="button"
                onClick={() => handleMenuNav("gallery")}
                className="mobile-nav-item"
                style={{ background: "transparent", border: "none", textAlign: "left", width: "100%", cursor: "pointer", font: "inherit", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}
              >
                <ImageIcon size={16} /> <span>Showroom Gallery</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTimeout(() => handleOpenInquiry({ type: "sell" }), 50);
                }}
                className="mobile-nav-item"
                style={{ background: "transparent", border: "none", textAlign: "left", width: "100%", cursor: "pointer", font: "inherit", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}
              >
                <TrendingUp size={16} /> <span>Sell Car Form</span>
              </button>
              <button
                type="button"
                onClick={() => handleMenuNav("services")}
                className="mobile-nav-item"
                style={{ background: "transparent", border: "none", textAlign: "left", width: "100%", cursor: "pointer", font: "inherit", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}
              >
                <Award size={16} /> <span>Services</span>
              </button>
              <button
                type="button"
                onClick={() => handleMenuNav("blog")}
                className="mobile-nav-item"
                style={{ background: "transparent", border: "none", textAlign: "left", width: "100%", cursor: "pointer", font: "inherit", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}
              >
                <FileText size={16} /> <span>Blog</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTimeout(() => handleOpenInquiry({ type: "contact" }), 50);
                }}
                className="mobile-nav-item"
                style={{ background: "transparent", border: "none", textAlign: "left", width: "100%", cursor: "pointer", font: "inherit", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}
              >
                <ShieldCheck size={16} /> <span>RTI / RC Transfer Form</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTimeout(() => handleOpenInquiry({ type: "exchange" }), 50);
                }}
                className="mobile-nav-item"
                style={{ background: "transparent", border: "none", textAlign: "left", width: "100%", cursor: "pointer", font: "inherit", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}
              >
                <RefreshCw size={16} /> <span>Exchange Car Form</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTimeout(() => handleOpenService(), 50);
                }}
                className="mobile-nav-item"
                style={{ background: "transparent", border: "none", textAlign: "left", width: "100%", cursor: "pointer", font: "inherit", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}
              >
                <Sparkles size={16} /> <span>Car Service Booking Form</span>
              </button>
              <button
                type="button"
                onClick={() => handleMenuNav("emi-calculator")}
                className="mobile-nav-item"
                style={{ background: "transparent", border: "none", textAlign: "left", width: "100%", cursor: "pointer", font: "inherit", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}
              >
                <Calculator size={16} /> <span>EMI Calculator</span>
              </button>
              <button
                type="button"
                onClick={() => handleMenuNav("reviews")}
                className="mobile-nav-item"
                style={{ background: "transparent", border: "none", textAlign: "left", width: "100%", cursor: "pointer", font: "inherit", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}
              >
                <Star size={16} /> <span>Customer Reviews</span>
              </button>
              <button
                type="button"
                onClick={() => handleMenuNav("about")}
                className="mobile-nav-item"
                style={{ background: "transparent", border: "none", textAlign: "left", width: "100%", cursor: "pointer", font: "inherit", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}
              >
                <Info size={16} /> <span>About Us</span>
              </button>
              <button
                type="button"
                onClick={() => handleMenuNav("contact")}
                className="mobile-nav-item"
                style={{ background: "transparent", border: "none", textAlign: "left", width: "100%", cursor: "pointer", font: "inherit", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}
              >
                <MapPin size={16} /> <span>Visit Showroom & Map</span>
              </button>
            </div>

            <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={toggleTheme}
                className="btn btn-outline btn-sm"
                style={{ width: "100%", justifyContent: "center" }}
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                <span>{theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
              </button>

              <a
                href={`tel:+${rawPhone}`}
                className="btn btn-outline btn-sm"
                style={{ width: "100%", justifyContent: "center" }}
              >
                <Phone size={14} className="text-red-500" />
                <span>Call {phone}</span>
              </a>

              <a
                href={`https://wa.me/${rawWhatsapp}?text=Hello%20Passion%20Car`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 16px",
                  borderRadius: "var(--radius-sm)",
                  background: "#25D366",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(37, 211, 102, 0.35)",
                }}
              >
                <MessageSquare size={16} fill="#ffffff" color="#ffffff" />
                <span>WhatsApp Us</span>
              </a>

              <a
                href="https://www.instagram.com/passsioncars?igsh=eWUxZzk1Nm43MTNw"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 16px",
                  borderRadius: "var(--radius-sm)",
                  background: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(220, 39, 67, 0.35)",
                }}
              >
                <InstagramIcon size={16} color="#ffffff" />
                <span>Follow on Instagram</span>
              </a>

              <a
                href="https://www.youtube.com/@passioncars_madhapur"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 16px",
                  borderRadius: "var(--radius-sm)",
                  background: "#FF0000",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(255, 0, 0, 0.35)",
                }}
              >
                <YoutubeIcon size={16} color="#ffffff" />
                <span>Watch on YouTube</span>
              </a>
            </div>
          </div>
        </div>
      )}

      
      <section id="home" className="hero-section">
        <div className="hero-slider-wrap">
          <div
            className="hero-slider-track"
            style={{
              transform: `translateX(-${heroSlideIdx * 100}%)`,
            }}
          >
            {heroPhotos.map((img, i) => (
              <div key={img} className="hero-slider-slide">
                <img
                  src={img}
                  alt={`Passion Car Delivery Moment ${i + 1}`}
                  className="hero-slide-img"
                  loading={i <= 2 ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="hero-overlay" />

        
        <div className="hero-slide-nav">
          <button
            onClick={() => setHeroSlideIdx((p) => (p === 0 ? heroPhotos.length - 1 : p - 1))}
            className="hero-slide-btn"
            title="Previous delivery photo"
            aria-label="Previous slide"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="hero-slide-dots">
            {heroPhotos.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroSlideIdx(i)}
                className={`hero-slide-dot ${i === heroSlideIdx ? "active" : ""}`}
                aria-label={`Go to delivery slide ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => setHeroSlideIdx((p) => (p + 1) % heroPhotos.length)}
            className="hero-slide-btn"
            title="Next delivery photo"
            aria-label="Next slide"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <div className="hero-content">
            
            <div className="hero-text-glass">
              <div className="badge badge-red" style={{ marginBottom: 16 }}>
                <ShieldCheck size={14} />
                <span>Hyderabad's Trusted Premium Used Car Dealer</span>
              </div>

              <h1 className="hero-title">
                Passion Car. <br />
                <span className="text-gradient-red">Your Car</span>{" "}
                <span className="text-gradient">Your Passion.</span>
              </h1>

              <p className="hero-desc">
                Discover handpicked premium pre-owned vehicles with certified 150-point
                inspections, transparent pricing, verified ownership history, and unmatched customer service.
              </p>
            </div>

            <div className="hero-ctas">
              <a href="#inventory" className="btn btn-primary btn-lg">
                <Car size={18} />
                <span>Browse Car Catalog ({vehicles.length})</span>
              </a>

              <button
                onClick={() => handleOpenInquiry({ type: "sell" })}
                className="btn btn-outline btn-lg"
              >
                <TrendingUp size={18} />
                <span>Sell Your Car</span>
              </button>

              <button
                onClick={() => handleOpenInquiry({ type: "test_drive" })}
                className="btn btn-glass btn-lg"
              >
                <Calendar size={18} />
                <span>Book Test Drive</span>
              </button>

              <a href="#emi-calculator" className="btn btn-glass btn-lg">
                <Calculator size={18} />
                <span>EMI Calculator</span>
              </a>
            </div>

            
            <div className="hero-stats-bar">
              <div className="stat-item">
                <span className="stat-val text-gradient-red">{carsSold}+</span>
                <span className="stat-lbl">Verified Cars Sold</span>
              </div>

              <div className="stat-item">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="stat-val text-gradient-gold">{googleRating?.rating || settings?.googleRating || 4.9}</span>
                  <div style={{ display: "flex", color: "#f59e0b" }}>
                    <Star size={16} fill="#f59e0b" />
                    <Star size={16} fill="#f59e0b" />
                    <Star size={16} fill="#f59e0b" />
                    <Star size={16} fill="#f59e0b" />
                    <Star size={16} fill="#f59e0b" />
                  </div>
                </div>
                <span className="stat-lbl">Google Rating ({googleRating?.reviewCount || settings?.googleReviewsCount || 148} Reviews)</span>
              </div>

              <div className="stat-item">
                <span className="stat-val">150-Point</span>
                <span className="stat-lbl">Certified Quality Check</span>
              </div>

              <div className="stat-item">
                <span className="stat-val">100%</span>
                <span className="stat-lbl">RC Transfer & Warranty Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      <section style={{ padding: "40px 0 20px", background: "var(--bg-dark)" }}>
        <div className="container">
          <div
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "24px",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
              
              <div style={{ flex: "1 1 280px", position: "relative" }}>
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-dim)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by Brand, Model (Polo, City, Creta...)"
                  value={filters.search || ""}
                  onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
                  className="form-input"
                  style={{ width: "100%", paddingLeft: 42 }}
                />
              </div>

              
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["Petrol", "Diesel", "EV", "Hybrid", "CNG"].map((fuel) => (
                  <button
                    key={fuel}
                    onClick={() => handleFuelFilter(fuel)}
                    className={`btn btn-sm ${filters.fuelType === fuel ? "btn-primary" : "btn-glass"}`}
                  >
                    <Fuel size={14} />
                    <span>{fuel}</span>
                  </button>
                ))}
              </div>

              
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["Hatchback", "Sedan", "SUV"].map((body) => (
                  <button
                    key={body}
                    onClick={() => handleBodyTypeFilter(body)}
                    className={`btn btn-sm ${filters.bodyType === body ? "btn-primary" : "btn-glass"}`}
                  >
                    <span>{body}</span>
                  </button>
                ))}
              </div>

              
              {(filters.search || filters.fuelType || filters.bodyType || filters.brand) && (
                <button
                  onClick={() => setFilters({ sort: "recommended" })}
                  className="btn btn-outline btn-sm"
                  style={{ marginLeft: "auto" }}
                >
                  <RefreshCw size={14} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      
      <section id="inventory" style={{ padding: "80px 0", background: "var(--bg-deep)" }}>
        <div className="container">
          <div style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div className="badge badge-red" style={{ marginBottom: 12 }}>
                <Car size={14} />
                <span>Car Catalog • 150-Point Certified</span>
              </div>
              <h2 style={{ fontSize: "clamp(30px, 4vw, 44px)", color: "var(--text-main)" }}>
                Browse Our Verified Car Catalog
              </h2>
              <p style={{ color: "var(--text-muted)", marginTop: 8 }}>
                Every car undergoes our 150-point inspection and comes with transparent pricing.
              </p>
            </div>

            
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Sort by:</span>
              <select
                value={filters.sort || "recommended"}
                onChange={(e) => setFilters((p) => ({ ...p, sort: e.target.value as any }))}
                className="form-select"
                style={{ padding: "8px 12px", minWidth: 160 }}
              >
                <option value="recommended">Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="year-desc">Year: Newest First</option>
                <option value="km-asc">Kilometers: Lowest</option>
              </select>
            </div>
          </div>

          {loadingVehicles ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
              <RefreshCw className="animate-spin" size={32} style={{ margin: "0 auto 16px" }} />
              <p>Loading verified cars...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
              }}
            >
              <Car size={48} style={{ color: "var(--text-dim)", margin: "0 auto 16px" }} />
              <h3 style={{ marginBottom: 8, color: "var(--text-main)" }}>No matching vehicles found</h3>
              <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
                Try adjusting your search criteria or clear active filters.
              </p>
              <button onClick={() => setFilters({ sort: "recommended" })} className="btn btn-primary">
                View All Cars
              </button>
            </div>
          ) : (
            <div className="inventory-grid">
              {vehicles.map((v) => (
                <CarCard
                  key={v.id}
                  vehicle={v}
                  onViewDetails={() => handleOpenCar(v.id)}
                  onInquire={() =>
                    handleOpenInquiry({
                      type: "buy",
                      vehicleId: v.id,
                      vehicleTitle: `${v.year} ${v.make} ${v.model} ${v.variant}`,
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>

      
      <section id="sell" style={{ padding: "90px 0", background: "var(--bg-dark)" }}>
        <div className="container">
          <div
            style={{
              background: "linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-card) 100%)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              padding: "clamp(24px, 5vw, 60px)",
              boxShadow: "var(--shadow-lg)",
              display: "grid",
              gap: 32,
              alignItems: "center",
            }}
            className="grid-2col-responsive"
          >
            <div>
              <div className="badge badge-gold" style={{ marginBottom: 12 }}>
                <TrendingUp size={14} />
                <span>Instant Valuation</span>
              </div>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", color: "var(--text-main)", marginBottom: 16 }}>
                Sell Your Car at the Best Market Price
              </h2>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 24 }}>
                Get a free doorstep inspection, fair transparent market valuation, instant payment, and hassle-free legal RC title transfer.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 30 }}>
                {[
                  "Free doorstep vehicle inspection across Hyderabad",
                  "Instant payment directly into your bank account",
                  "100% legal RTO RC transfer documentation handled",
                ].map((perk, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={14} color="#10b981" />
                    </div>
                    <span style={{ fontSize: 14, color: "var(--text-main)" }}>{perk}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleOpenInquiry({ type: "sell" })}
                className="btn btn-primary btn-lg"
              >
                <span>Request Free Car Valuation</span>
                <ArrowRight size={18} />
              </button>

              <div className="mobile-only-action" style={{ marginTop: 20 }}>
                <button
                  onClick={() => handleOpenInquiry({ type: "sell" })}
                  className="btn btn-glass btn-sm"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <TrendingUp size={16} className="text-emerald-500" />
                  <span>Open Mobile Valuation Form</span>
                </button>
              </div>
            </div>

            <div
              className="desktop-only-form"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "32px",
                backdropFilter: "blur(12px)",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <h3 style={{ color: "var(--text-main)", marginBottom: 20 }}>Quick Valuation Request</h3>
              <SellCarQuickForm onOpenBookings={handleOpenBookings} />
            </div>
          </div>
        </div>
      </section>

      
      <section id="services" style={{ padding: "90px 0", background: "var(--bg-deep)" }}>
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: 650, margin: "0 auto 50px" }}>
            <div className="badge badge-red" style={{ marginBottom: 12 }}>
              <Award size={14} />
              <span>Full Service Dealership</span>
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "var(--text-main)", marginBottom: 12 }}>
              Our Dealership Services
            </h2>
            <p style={{ color: "var(--text-muted)" }}>
              From customized vehicle financing to car exchange, insurance, and certified after-sales warranty support.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {[
              {
                icon: ShieldCheck,
                title: "150-Point Certified Inspection",
                desc: "Every mechanical, electrical, and structural component inspected before listing.",
              },
              {
                icon: Award,
                title: "Certified Warranty Coverage",
                desc: "Drive with confidence with comprehensive engine and gearbox warranty support.",
              },
              {
                icon: Calculator,
                title: "Low-Interest Car Finance",
                desc: "Partnered with leading national banks for customized EMI plans and quick approvals.",
              },
              {
                icon: FileText,
                title: "Hassle-Free RC Transfer",
                desc: "End-to-end RTO paperwork and legal title transfer completed on your behalf.",
              },
              {
                icon: RefreshCw,
                title: "Car Exchange & Upgrade",
                desc: "Trade in your current vehicle and drive away in your upgraded dream car today.",
              },
              {
                icon: Sparkles,
                title: "Professional Car Detailing",
                desc: "Full interior deep clean, multi-stage paint correction, and sanitization before delivery.",
              },
            ].map((s, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "30px 24px",
                  transition: "transform 0.3s, border-color 0.3s",
                }}
                className="hover:border-red-500/40"
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "12px",
                    background: "rgba(239, 68, 68, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                    color: "var(--primary)",
                  }}
                >
                  <s.icon size={24} />
                </div>
                <h3 style={{ fontSize: 18, color: "var(--text-main)", marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 40,
              padding: "24px 28px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ textAlign: "left", maxWidth: 600 }}>
              <h4 style={{ color: "var(--text-main)", margin: "0 0 6px", fontSize: 18, fontWeight: 700 }}>
                Schedule Workshop Service Appointment
              </h4>
              <p style={{ color: "var(--text-muted)", margin: 0, fontSize: 14 }}>
                Choose your service package, pick your preferred date and time slot, and receive an instant official entry pass.
              </p>
            </div>
            <a href="#service" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Calendar size={16} />
              <span>Book Service · Choose Date & Time</span>
            </a>
          </div>
        </div>
      </section>

      
      <BlogSection onOpenArticle={handleOpenGuide} />

      
      <RtiSection onOpenBookings={handleOpenBookings} />

      
      <ExchangeSection onOpenBookings={handleOpenBookings} />

      
      <ServiceBookingSection onOpenBookings={handleOpenBookings} />

      
      <EmiCalculatorSection />

      
      <section id="reviews" style={{ padding: "90px 0", background: "var(--bg-deep)" }}>
        <div className="container">
          <div className="grid-2col-responsive" style={{ alignItems: "center" }}>
            <div>
              <div className="badge badge-red" style={{ marginBottom: 12 }}>
                <Star size={14} />
                <span>Live Verified Trust</span>
              </div>
              <h2 style={{ fontSize: "clamp(28px, 3.8vw, 42px)", color: "var(--text-main)", marginBottom: 16 }}>
                Real Deliveries. Real Customer Smiles.
              </h2>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 24 }}>
                Over 200+ customers have experienced the peace of mind that comes with buying from Passion Car.
                We believe in complete transparency, genuine paperwork, and verified vehicle history.
              </p>

              
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "24px",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  boxShadow: "var(--shadow-md)",
                }}
              >
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  <span style={{ fontSize: 26, fontWeight: 800, color: "#4285F4" }}>G</span>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 24, fontWeight: 800, color: "var(--text-main)" }}>
                      {googleRating?.rating || settings?.googleRating || 4.9}
                    </span>
                    <div style={{ display: "flex", color: "#f59e0b" }}>
                      <Star size={18} fill="#f59e0b" />
                      <Star size={18} fill="#f59e0b" />
                      <Star size={18} fill="#f59e0b" />
                      <Star size={18} fill="#f59e0b" />
                      <Star size={18} fill="#f59e0b" />
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "4px 0" }}>
                    {googleRating?.reviewCount || settings?.googleReviewsCount || 148} Google Reviews · Car dealer in Kavuri Hills, Madhapur
                  </p>
                  <a
                    href="https://maps.app.goo.gl/7JDT4jXxFwYBKMNF7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-500 font-semibold"
                    style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4 }}
                  >
                    <span>View {googleRating?.reviewCount || settings?.googleReviewsCount || 148} Live Reviews on Google Maps</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>

            <div className="form-grid-2col">
              {[1, 2, 4, 6].map((num) => (
                <div
                  key={num}
                  style={{
                    height: 170,
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    handleOpenLightbox({
                      url: `/images/reviews/review-0${num}.webp`,
                      title: "Passion Car Happy Delivery Moment",
                      caption: "Certified key handover at our Kavuri Hills, Madhapur dealership.",
                    })
                  }
                >
                  <img
                    src={`/images/reviews/review-0${num}.webp`}
                    alt="Customer handover"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>

          {customerReviews.length > 0 && (
            <div style={{ marginTop: 44 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 10px #22c55e" }} />
                  <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-main)" }}>Live Customer Reviews</span>
                  <span style={{ fontSize: 12, background: "rgba(34, 197, 94, 0.12)", color: "#4ade80", padding: "2px 8px", borderRadius: 12, fontWeight: 600 }}>Verified from Google Maps</span>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <a
                    href="https://maps.app.goo.gl/7JDT4jXxFwYBKMNF7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-glass btn-sm"
                    style={{ fontSize: 12 }}
                  >
                    <span>Write a Review on Google</span>
                    <ExternalLink size={12} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(true)}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: 12 }}
                  >
                    <span>Share Your Review</span>
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
                {customerReviews.map((rev) => (
                  <div
                    key={rev.id}
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: 20,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 14,
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              background: "rgba(239, 68, 68, 0.15)",
                              color: "var(--primary)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: 14,
                            }}
                          >
                            {rev.authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-main)" }}>{rev.authorName}</div>
                            <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{rev.relativeTime}</div>
                          </div>
                        </div>

                        <div style={{ display: "flex", color: "#f59e0b" }}>
                          {[...Array(Math.min(5, Math.max(1, rev.rating)))].map((_, idx) => (
                            <Star key={idx} size={14} fill="#f59e0b" />
                          ))}
                        </div>
                      </div>

                      <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                        "{rev.text}"
                      </p>
                    </div>

                    {rev.carModel && (
                      <div style={{ fontSize: 11, color: "var(--text-dim)", display: "flex", alignItems: "center", gap: 5, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        <span>Verified Buyer · {rev.carModel}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section id="gallery" style={{ padding: "90px 0", background: "var(--bg-deep)" }}>
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto 40px" }}>
            <div className="badge badge-red" style={{ marginBottom: 12, display: "inline-flex" }}>
              <Users size={14} />
              <span>Happy Customers</span>
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "var(--text-main)", marginBottom: 16 }}>
              Showroom & Delivery Gallery
            </h2>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
              Experience the luxury and celebration at Passion Car — from pristine inventory displays in Kavuri Hills, Madhapur to joyful ceremonial key handovers.
            </p>

            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
              {[
                { id: "all", label: "All Photos" },
                { id: "Showroom", label: "Showroom & Fleet" },
                { id: "Customer Deliveries", label: "Customer Deliveries" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveGalleryCat(cat.id)}
                  className={`btn btn-sm ${activeGalleryCat === cat.id ? "btn-primary" : "btn-glass"}`}
                  style={{ borderRadius: "var(--radius-full)", padding: "8px 18px", fontSize: 13 }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {galleryItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-dim)" }}>
              <ImageIcon size={48} style={{ opacity: 0.3, margin: "0 auto 16px" }} />
              <p>No gallery photos found in this category.</p>
            </div>
          ) : (
            <>
              <div className="gallery-grid">
                {galleryItems.slice(0, galleryDisplayCount).map((item) => (
                  <div
                    key={item.id}
                    className="gallery-card"
                    onClick={() =>
                      handleOpenLightbox({
                        url: item.imageUrl,
                        title: item.title,
                        caption: item.caption,
                      })
                    }
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="gallery-img"
                      loading="lazy"
                    />
                    <div className="gallery-card-overlay">
                      <span className="gallery-card-category">{item.category}</span>
                      <h3 className="gallery-card-title">{item.title}</h3>
                      {item.caption && (
                        <p
                          style={{
                            fontSize: 12,
                            color: "rgba(255, 255, 255, 0.75)",
                            marginTop: 4,
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {item.caption}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {galleryItems.length > galleryDisplayCount && (
                <div style={{ textAlign: "center", marginTop: 40 }}>
                  <button
                    onClick={() => setGalleryDisplayCount((prev) => prev + 12)}
                    className="btn btn-outline"
                  >
                    <ImageIcon size={16} />
                    <span>View More Photos</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <AboutSection />

      
      <section id="contact" style={{ padding: "90px 0", background: "var(--bg-dark)" }}>
        <div className="container">
          <div className="grid-2col-responsive" style={{ alignItems: "center" }}>
            <div>
              <div className="badge badge-gold" style={{ marginBottom: 12 }}>
                <MapPin size={14} />
                <span>Visit Our Showroom</span>
              </div>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", color: "var(--text-main)", marginBottom: 16 }}>
                Come Visit Passion Car
              </h2>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 30 }}>
                We're located in the heart of Kavuri Hills, Madhapur, Hyderabad. Stop by for freshly brewed coffee,
                inspect our collection, or take any car for a comprehensive test drive.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 36 }}>
                <div style={{ display: "flex", gap: 14 }}>
                  <MapPin size={22} className="text-red-500" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <h4 style={{ color: "var(--text-main)", marginBottom: 4 }}>Showroom Address</h4>
                    <a
                      href="https://maps.app.goo.gl/7JDT4jXxFwYBKMNF7"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, textDecoration: "none" }}
                      className="hover:text-red-500"
                    >
                      {address}
                    </a>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 14 }}>
                  <Phone size={22} className="text-red-500" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <h4 style={{ color: "var(--text-main)", marginBottom: 4 }}>Direct Phone / WhatsApp</h4>
                    <a href={`tel:+${rawPhone}`} style={{ fontSize: 14, color: "#38bdf8", textDecoration: "none" }}>
                      {phone}
                    </a>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 14 }}>
                  <Clock size={22} className="text-red-500" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <h4 style={{ color: "var(--text-main)", marginBottom: 4 }}>Showroom Hours</h4>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
                      {settings?.showroomHoursMonSat || "Open Mon - Sat: 10:00 AM – 8:30 PM"} <br />
                      {settings?.showroomHoursSun || "Sunday: 10:30 AM – 7:00 PM"}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
                <div className="brand-action-row" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <a
                    href={`https://wa.me/${rawWhatsapp}?text=Hello%20Passion%20Car,%20I%20am%20interested%20in%20visiting%20your%20showroom.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brand-action-btn brand-btn-whatsapp"
                  >
                    <MessageSquare size={18} fill="#ffffff" color="#ffffff" />
                    <span>Chat on WhatsApp</span>
                  </a>

                  <a
                    href="https://maps.app.goo.gl/7JDT4jXxFwYBKMNF7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brand-action-btn brand-btn-maps"
                  >
                    <MapPin size={18} />
                    <span>Open in Google Maps</span>
                    <ExternalLink size={14} />
                  </a>
                </div>

                <div className="brand-action-row" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <a
                    href="https://www.instagram.com/passsioncars?igsh=eWUxZzk1Nm43MTNw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brand-action-btn brand-btn-instagram"
                    title="Follow Passion Car on Instagram"
                  >
                    <InstagramIcon size={18} color="#ffffff" />
                    <span>Follow on Instagram</span>
                  </a>

                  <a
                    href="https://www.youtube.com/@passioncars_madhapur"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brand-action-btn brand-btn-youtube"
                    title="Subscribe to Passion Car YouTube Channel"
                  >
                    <YoutubeIcon size={18} color="#ffffff" />
                    <span>Watch on YouTube</span>
                  </a>
                </div>
              </div>
            </div>

            
            <a
              href="https://maps.app.goo.gl/7JDT4jXxFwYBKMNF7"
              target="_blank"
              rel="noopener noreferrer"
              className="map-direct-card"
              title="Click to open Passion Car in Google Maps"
            >
              <iframe
                title="Passion Car Showroom Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.2751333796857!2d78.3847844!3d17.4465492!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9158f201b1ad%3A0xbcfad17f9435a2!2sPassion%20Car!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0, filter: "contrast(1.05) brightness(0.9)" }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="map-direct-overlay">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <MapPin size={22} className="text-red-400" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>Kavuri Hills, Madhapur, Hyderabad</div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>Click anywhere to open Google Maps location</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 13 }}>
                  <span>Open Maps</span>
                  <ExternalLink size={15} />
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      
      <footer style={{ padding: "60px 0 30px", background: "var(--bg-deep)", borderTop: "1px solid var(--border)" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, marginBottom: 40 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="brand-logo">
                <div className="brand-logo-badge">
                  <img
                    src="/images/logo.png"
                    alt="Passion Car Logo"
                    className="brand-logo-img"
                  />
                </div>
                <div className="brand-name">
                  <span className="brand-title">PASSION CAR</span>
                </div>
              </div>
              <div className="footer-social-wrap">
                <a
                  href="https://www.instagram.com/passsioncars?igsh=eWUxZzk1Nm43MTNw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-btn instagram"
                  title="Follow Passion Car on Instagram"
                  aria-label="Instagram"
                >
                  <InstagramIcon size={18} />
                  <span>Instagram</span>
                </a>
                <a
                  href="https://www.youtube.com/@passioncars_madhapur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-btn youtube"
                  title="Subscribe to Passion Car on YouTube"
                  aria-label="YouTube"
                >
                  <YoutubeIcon size={18} />
                  <span>YouTube</span>
                </a>
              </div>
            </div>

            <div className="footer-nav-block">
              <div className="footer-nav-row">
                {[
                  { href: "#home", label: "Home" },
                  { href: "#inventory", label: "Car Catalog" },
                  { href: "#gallery", label: "Gallery" },
                  { href: "#sell", label: "Sell Car" },
                  { href: "#services", label: "Services" },
                  { href: "#reviews", label: "Reviews" },
                  { href: "#blog", label: "Blog" },
                  { href: "#emi-calculator", label: "EMI Calculator" },
                  { href: "#about", label: "About" },
                  { href: "#contact", label: "Contact" },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="footer-nav-link"
                    style={{
                      color: theme === "light" ? "#475569" : "#f1f5f9",
                      textDecoration: "none",
                      fontWeight: 500,
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#ef4444";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = theme === "light" ? "#475569" : "#f1f5f9";
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div
            className="footer-bottom-bar"
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 13,
              flexWrap: "wrap",
              gap: 14,
              color: theme === "light" ? "#64748b" : "#cbd5e1",
            }}
          >
            <span>© {new Date().getFullYear()} Passion Car. All rights reserved.</span>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <a
                href="https://www.instagram.com/passsioncars?igsh=eWUxZzk1Nm43MTNw"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: theme === "light" ? "#64748b" : "#cbd5e1",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme === "light" ? "#64748b" : "#cbd5e1";
                }}
              >
                <InstagramIcon size={16} />
                <span>@passsioncars</span>
              </a>
              <a
                href="https://www.youtube.com/@passioncars_madhapur"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: theme === "light" ? "#64748b" : "#cbd5e1",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  textDecoration: "none",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme === "light" ? "#64748b" : "#cbd5e1";
                }}
              >
                <YoutubeIcon size={16} />
                <span>@passioncars_madhapur</span>
              </a>
              <a
                href="#admin"
                onClick={(e) => {
                  e.preventDefault();
                  if (onGoToAdmin) onGoToAdmin();
                  else window.location.hash = "#admin";
                }}
                style={{
                  color: theme === "light" ? "#64748b" : "#cbd5e1",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 12,
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme === "light" ? "#64748b" : "#cbd5e1";
                }}
                title="Dealership Admin Portal Redirect"
              >
                <Shield size={12} className="text-red-500" />
                <span>Admin Login</span>
              </a>
            </div>
            <span>{address}</span>
          </div>
        </div>
      </footer>

      
      {selectedVehicleId && (
        <VehicleDetailModal
          id={selectedVehicleId}
          customerUser={customerUser}
          onClose={handleCloseCar}
          onOpenBookings={handleOpenBookings}
          onBookThisCar={() => {}}
        />
      )}

      
      {inquiryModal.open && (
        <InquiryModal
          type={inquiryModal.type}
          vehicleId={inquiryModal.vehicleId}
          vehicleTitle={inquiryModal.vehicleTitle}
          customerUser={customerUser}
          onClose={handleCloseInquiry}
          onOpenBookings={handleOpenBookings}
        />
      )}

      
      {lightboxImg && (
        <div className="modal-backdrop" onClick={handleCloseLightbox}>
          <div
            style={{
              maxWidth: 900,
              width: "100%",
              background: "transparent",
              position: "relative",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseLightbox}
              className="modal-close-btn"
              style={{ position: "absolute", top: -40, right: 0, color: "var(--text-main)" }}
            >
              <X size={28} />
            </button>
            <img
              src={lightboxImg.url}
              alt={lightboxImg.title}
              style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "var(--radius-md)", objectFit: "contain" }}
            />
            <div style={{ marginTop: 14 }}>
              <h3 style={{ color: "#ffffff" }}>{lightboxImg.title}</h3>
              {lightboxImg.caption && <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>{lightboxImg.caption}</p>}
            </div>
          </div>
        </div>
      )}

      
      {customerAuthModal && (
        <CustomerSignInModal
          onClose={handleCloseCustomerAuth}
          onGoToAdmin={onGoToAdmin}
          onSuccessLogin={(user) => {
            setCustomerUser(user);
            try {
              localStorage.setItem("passioncar_customer_session", JSON.stringify(user));
            } catch (_) {}
          }}
        />
      )}

      {customerProfileModal && customerUser && (
        <CustomerProfileModal
          user={customerUser}
          onClose={handleCloseCustomerProfile}
          onUpdateUser={(updated) => {
            setCustomerUser(updated);
            try {
              localStorage.setItem("passioncar_customer_session", JSON.stringify(updated));
            } catch (_) {}
          }}
          onLogout={() => {
            setCustomerUser(null);
            try {
              localStorage.removeItem("passioncar_customer_session");
            } catch (_) {}
            handleCloseCustomerProfile();
          }}
        />
      )}

      
      {activeGuideModal && (
        <div className="modal-backdrop" onClick={handleCloseGuide}>
          <div
            className="modal-content"
            style={{ maxWidth: 700 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="badge badge-gold">{activeGuideModal.date}</span>
                <h3 className="modal-title" style={{ marginTop: 6, color: "var(--text-main)" }}>{activeGuideModal.title}</h3>
              </div>
              <button onClick={handleCloseGuide} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: "28px", lineHeight: 1.7, color: "var(--text-main)", whiteSpace: "pre-line" }}>
              {activeGuideModal.content}
            </div>
          </div>
        </div>
      )}

      
      {serviceModalOpen && (
        <ServiceBookingModal onClose={handleCloseService} onOpenBookings={handleOpenBookings} />
      )}

      {customerBookingsModal && (
        <CustomerBookingsModal
          initialPhone={initialBookingPhone || customerUser?.phone || ""}
          customerUser={customerUser}
          onClose={handleCloseBookings}
        />
      )}

      <div className="desktop-floating-stack">
        <a
          href={`https://wa.me/${rawWhatsapp}?text=Hello%20Passion%20Car,%20I%20am%20interested%20in%20your%20verified%20cars.`}
          target="_blank"
          rel="noopener noreferrer"
          className="desktop-floating-whatsapp"
          title="Chat with Passion Car on WhatsApp"
        >
          <MessageSquare size={18} fill="#ffffff" color="#ffffff" />
          <span>Chat on WhatsApp</span>
        </a>

        <a
          href="https://www.instagram.com/passsioncars?igsh=eWUxZzk1Nm43MTNw"
          target="_blank"
          rel="noopener noreferrer"
          className="desktop-floating-instagram"
          title="Follow Passion Car on Instagram"
        >
          <InstagramIcon size={18} color="#ffffff" />
          <span>Follow on Instagram</span>
        </a>

        <a
          href="https://www.youtube.com/@passioncars_madhapur"
          target="_blank"
          rel="noopener noreferrer"
          className="desktop-floating-youtube"
          title="Watch Passion Car on YouTube"
        >
          <YoutubeIcon size={18} color="#ffffff" />
          <span>Watch on YouTube</span>
        </a>
      </div>

      {reviewModalOpen && (
        <SubmitReviewModal
          customerUser={customerUser}
          onClose={() => setReviewModalOpen(false)}
        />
      )}

      <MobileBottomBar
        onBookTestDrive={() => handleOpenInquiry({ type: "test_drive" })}
        phone={phone}
        whatsapp={whatsapp}
      />
    </div>
  );
}

function SubmitReviewModal({
  customerUser,
  onClose,
}: {
  customerUser: { name: string; phone: string; email: string } | null;
  onClose: () => void;
}) {
  const [authorName, setAuthorName] = useState(customerUser?.name || "");
  const [rating, setRating] = useState(5);
  const [carModel, setCarModel] = useState("");
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const submitMutation = useSubmitReview();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !text.trim()) {
      setErrorMsg("Please enter your name and review message.");
      return;
    }
    setErrorMsg("");
    submitMutation.mutate(
      {
        authorName: authorName.trim(),
        rating,
        text: text.trim(),
        carModel: carModel.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          setTimeout(() => {
            onClose();
          }, 2500);
        },
        onError: (err: any) => {
          setErrorMsg(err.message || "Failed to submit review.");
        },
      }
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="badge badge-gold">Customer Feedback</span>
            <h3 className="modal-title" style={{ marginTop: 6, color: "var(--text-main)" }}>
              Share Your Passion Car Experience
            </h3>
          </div>
          <button onClick={onClose} className="modal-close-btn" type="button">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "24px 28px" }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "24px 10px" }}>
              <CheckCircle2 size={42} className="text-emerald-500" style={{ margin: "0 auto 14px" }} />
              <h4 style={{ color: "var(--text-main)", marginBottom: 8, fontSize: 18 }}>Thank You for Your Review!</h4>
              <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6 }}>
                Your review has been published live to our customer wall. We appreciate your trust in Passion Car!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {errorMsg && (
                <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 6, padding: "10px 14px", color: "#fca5a5", fontSize: 13 }}>
                  {errorMsg}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Your Name *</label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Purchased or Inspected (Optional)</label>
                <input
                  type="text"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  placeholder="e.g. 2021 Hyundai Creta SX"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rating *</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                    >
                      <Star
                        size={28}
                        fill={star <= rating ? "#f59e0b" : "none"}
                        color={star <= rating ? "#f59e0b" : "var(--text-dim)"}
                      />
                    </button>
                  ))}
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)", marginLeft: 8 }}>
                    {rating}.0 / 5.0
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Review / Feedback *</label>
                <textarea
                  required
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Share details of your showroom visit, car delivery, transparency, paperwork experience..."
                  className="form-textarea"
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {submitMutation.isPending ? "Submitting..." : "Publish Live Review"}
                </button>
                <button type="button" onClick={onClose} className="btn btn-glass">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileBottomBar({
  onBookTestDrive,
  phone,
  whatsapp,
}: {
  onBookTestDrive: () => void;
  phone: string;
  whatsapp: string;
}) {
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const cleanWa = whatsapp.replace(/\D/g, "");

  return (
    <nav className="mobile-bottom-bar" aria-label="Quick mobile contact actions">
      <a href="#inventory" className="mobile-bar-btn" title="View Cars Catalog">
        <Car size={18} color="var(--primary)" />
        <span>Catalog</span>
      </a>

      <a href={`tel:${cleanPhone}`} className="mobile-bar-btn" title="Call Showroom">
        <Phone size={18} className="text-red-500" />
        <span>Call</span>
      </a>

      <a
        href={`https://wa.me/${cleanWa}?text=Hello%20Passion%20Car,%20I%20am%20interested%20in%20visiting%20the%20showroom.`}
        target="_blank"
        rel="noopener noreferrer"
        className="mobile-bar-btn"
        title="WhatsApp Chat"
      >
        <MessageSquare size={18} color="#22c55e" />
        <span>WhatsApp</span>
      </a>

      <button
        onClick={onBookTestDrive}
        className="mobile-bar-btn mobile-bar-btn-primary"
        title="Book Test Drive"
      >
        <Calendar size={18} />
        <span>Test Drive</span>
      </button>

      <a
        href="https://maps.app.goo.gl/7JDT4jXxFwYBKMNF7"
        target="_blank"
        rel="noopener noreferrer"
        className="mobile-bar-btn"
        title="Showroom Location in Kavuri Hills"
      >
        <MapPin size={18} color="var(--accent-gold)" />
        <span>Location</span>
      </a>
    </nav>
  );
}

function BlogSection({
  onOpenArticle,
}: {
  onOpenArticle: (article: { title: string; content: string; date: string }) => void;
}) {
  const articles = [
    {
      id: 1,
      title: "Comprehensive Guide to Buying Pre-Owned Luxury Cars in Hyderabad",
      date: "March 2026",
      readTime: "5 min read",
      category: "Buying Guide",
      image: "/images/reviews/review-01.webp",
      snippet:
        "Master the checklist: Telangana RTO hypothecation, digital odometer verification, German gearbox diagnostics, and why 150-point inspection matters.",
      content: `BUYING A PRE-OWNED LUXURY CAR IN HYDERABAD: THE COMPLETE 2026 GUIDE

Hyderabad's luxury automobile market has grown exponentially across HITEC City, Gachibowli, and Jubilee Hills. When investing in a pre-owned Mercedes-Benz, BMW, Audi, or Porsche, diligence ensures peace of mind.

1. Telangana RTO Title & Hypothecation Check
Always verify the Parivahan RTO registration for outstanding bank hypothecation (HP endorsement). Ensure Form 35 loan clearance has been certified by the financing bank.

2. Authorized Brand Service History
Examine digital service logs directly from certified authorized workshops in Hyderabad (e.g. Mahavir Mercedes, KUN BMW, Olympus Audi). Authentic service records guarantee genuine mileage and timely fluid changes.

3. Computer OBD-II Diagnostics & Gearbox Health
Modern luxury vehicles feature dual-clutch transmissions (DSG/PDK) and multi-link air suspension. Our certified technicians perform full OBD-II computer scans to detect hidden fault codes, sensor flags, and catalytic converter performance.

4. The Passion Car 150-Point Standard
At Passion Car Kavuri Hills, every single car is screened for:
• Zero structural frame damage / non-accidental guarantee
• Non-tampered electronic odometer reading
• Complete suspension, brake rotor, and tire life audit
• Clean RTO title with instant name transfer guarantee

Visit our Kavuri Hills showroom to test-drive certified luxury models with complete peace of mind.`,
    },
    {
      id: 2,
      title: "RTI & RC Transfer in Telangana: Complete Step-by-Step Procedure",
      date: "February 2026",
      readTime: "4 min read",
      category: "RTO & Legal",
      image: "/images/reviews/review-04.webp",
      snippet:
        "Everything about Form 29, Form 30, NOC from Hyderabad RTO zones (Khairatabad, Kondapur, Secunderabad) and getting your Smart Card RC in 7 days.",
      content: `TELANGANA RTO RC TRANSFER & RTI INVOICE ADD-ON: EXPLAINED

Transferring vehicle ownership legally in Telangana is mandatory within 30 days of purchase under the Motor Vehicles Act.

1. Essential Documents Required:
• Original Registration Certificate (Smart Card RC)
• Valid Comprehensive Insurance Certificate
• Valid Pollution Under Control (PUC) Certificate
• Form 29 (Notice of Transfer of Ownership) signed in duplicate
• Form 30 (Application for Intimation and Transfer) signed with chassis pencil print
• Identity & Address Proof of Buyer (Aadhaar / Voter ID)

2. Hyderabad RTO Jurisdictions:
Depending on your residence, documents must be processed at:
• TS-09: Khairatabad Central RTO
• TS-07: Kondapur & Serilingampally (Cyberabad)
• TS-10: Secunderabad RTO
• TS-08: Medchal & Uppal RTO

3. What is Return to Invoice (RTI)?
RTI is an insurance add-on cover that bridges the gap between the car's Insured Declared Value (IDV) and its original invoice price (including road tax and registration charges) in case of theft or total constructive loss. For luxury car owners, RTI provides immense financial security.

At Passion Car, our in-house RTO concierge team manages all paperwork, slot bookings, biometric coordination, and doorstep Smart Card delivery.`,
    },
    {
      id: 3,
      title: "Top Luxury SUVs for Hyderabad Roads: Mercedes GLC vs BMW X3 vs Audi Q5",
      date: "January 2026",
      readTime: "6 min read",
      category: "Comparison",
      image: "/images/reviews/review-08.webp",
      snippet:
        "Ground clearance, suspension comfort on ORR, mileage, and long-term ownership costs compared across Hyderabad's top 3 luxury midsize SUVs.",
      content: `MERCEDES-BENZ GLC vs BMW X3 vs AUDI Q5: HYDERABAD BUYER'S GUIDE

The luxury midsize SUV segment is Hyderabad's most competitive category. Whether commuting through HITEC City traffic or cruising on the 158 km Nehru Outer Ring Road (ORR), here is how the top three compare:

1. Mercedes-Benz GLC:
• Strengths: Unmatched cabin luxury, supple ride quality, MBUX intuitive infotainment, superior brand prestige.
• Best For: Executives and families prioritizing rear-seat comfort and timeless elegance.
• Ground Clearance: 201 mm — effortlessly glides over suburban speed-breakers.

2. BMW X3:
• Strengths: 50:50 weight distribution, razor-sharp steering dynamics, punchy TwinPower Turbo diesel/petrol engines, legendary 8-speed ZF gearbox.
• Best For: Driving enthusiasts who love highway cruising and dynamic road feedback.

3. Audi Q5:
• Strengths: Quattro permanent all-wheel drive, refined 2.0L TFSI engine, ultra-quiet cabin acoustics, Virtual Cockpit.
• Best For: Technology enthusiasts seeking all-weather stability and understated luxury.

Explore certified pre-owned GLC, X3, and Q5 SUVs in our Kavuri Hills showroom today with flexible financing options.`,
    },
    {
      id: 4,
      title: "Car Detailing & Maintenance: How to Protect Luxury Paint in Hyderabad Heat",
      date: "January 2026",
      readTime: "4 min read",
      category: "Maintenance",
      image: "/images/reviews/review-12.webp",
      snippet:
        "Ceramic coating, PPF, and cooling system care to keep your German luxury car running in showroom condition during Telangana summers.",
      content: `PRESERVING YOUR LUXURY CAR IN TELANGANA'S CLIMATE

Hyderabad's intense summer sun, hard groundwater, and construction dust can take a toll on luxury automotive paint and mechanical cooling systems.

1. Paint Protection Film (PPF) vs Ceramic Coating:
• PPF (TPU self-healing): Recommended for high-impact zones (front bumper, bonnet, wing mirrors) to protect against gravel chips on the ORR and highway routes.
• 9H Ceramic Shield: Imparts deep hydrophobic gloss, prevents UV oxidation, and makes daily washing effortless.

2. Radiator & Intercooler Hygiene:
German turbocharged engines rely on optimum air-to-water cooling. Ensure radiator fins are cleared of debris and coolant concentration is maintained with OEM-approved ethylene glycol mixtures.

3. Cabin Air Filtration & AC Sanitization:
Hyderabad's dry heat demands fresh PM2.5 activated carbon cabin filters to ensure odorless, rapid climate cooling.

Book a premium detailing or periodic maintenance session with Passion Car's certified service team.`,
    },
  ];

  return (
    <section id="blog" style={{ padding: "90px 0", background: "var(--bg-dark)" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
          <div className="badge badge-gold" style={{ marginBottom: 12 }}>
            <FileText size={14} />
            <span>Automotive Guides & Journal</span>
          </div>
          <h2 style={{ fontSize: 34, color: "var(--text-main)", marginBottom: 12 }}>
            Hyderabad Luxury Car Journal
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Expert buying tips, Telangana RTO regulations, luxury SUV comparisons, and maintenance insights by Passion Car specialists.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 24 }}>
          {articles.map((art) => (
            <article
              key={art.id}
              className="car-card"
              style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}
            >
              <div style={{ height: 190, overflow: "hidden", position: "relative" }}>
                <img
                  src={art.image}
                  alt={art.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                />
                <div style={{ position: "absolute", top: 12, left: 12 }}>
                  <span className="badge badge-red">{art.category}</span>
                </div>
              </div>
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={13} /> {art.date}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Clock size={13} /> {art.readTime}
                  </span>
                </div>
                <h3 style={{ fontSize: 17, color: "var(--text-main)", lineHeight: 1.4, marginBottom: 10 }}>
                  {art.title}
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, flex: 1, marginBottom: 16 }}>
                  {art.snippet}
                </p>
                <button
                  type="button"
                  onClick={() => onOpenArticle({ title: art.title, content: art.content, date: art.date })}
                  className="btn btn-outline btn-sm"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <span>Read Full Guide</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function RtiSection({
  onOpenBookings,
}: {
  onOpenBookings?: (phone: string) => void;
} = {}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehicleNo: "",
    serviceType: "RC Ownership Transfer",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const createInquiry = useCreateInquiry();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    if (form.phone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    createInquiry.mutate(
      {
        type: "contact",
        name: form.name,
        phone: form.phone,
        message: `RTO Desk Inquiry: [${form.serviceType}] - Vehicle: ${form.vehicleNo || "N/A"}. Note: ${form.notes || "None"}`,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          try {
            localStorage.setItem("passioncar_last_phone", form.phone);
          } catch {}
          const msg = `*PASSION CAR RTO DESK INQUIRY*\nService: ${form.serviceType}\nCustomer: ${form.name}\nPhone: ${form.phone}\nVehicle Reg: ${form.vehicleNo || "N/A"}`;
          safeOpenWhatsApp(msg);
        },
      }
    );
  };

  const services = [
    {
      title: "RC Ownership Transfer",
      desc: "Form 29 & 30 filing, biometrics assistance, and doorstep Smart Card RC delivery across all Hyderabad RTOs.",
      icon: ShieldCheck,
    },
    {
      title: "Bank HP Loan Termination",
      desc: "Form 35 processing, bank NOC verification, and removal of hypothecation from state Parivahan database.",
      icon: Award,
    },
    {
      title: "Interstate NOC Clearance",
      desc: "Hassle-free NOC generation and re-registration support for out-of-state luxury vehicles into Telangana (TS).",
      icon: Globe,
    },
    {
      title: "Return to Invoice (RTI) Advisory",
      desc: "100% invoice price replacement insurance coverage guidance for high-end luxury sedans and SUVs.",
      icon: FileText,
    },
  ];

  return (
    <section id="rti" style={{ padding: "90px 0", background: "var(--bg-card)" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
          <div className="badge badge-red" style={{ marginBottom: 12 }}>
            <ShieldCheck size={14} />
            <span>Telangana RTO & Legal Desk</span>
          </div>
          <h2 style={{ fontSize: 34, color: "var(--text-main)", marginBottom: 12 }}>
            Hassle-Free RC Transfer & RTI Protection
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Dedicated document liaison covering all Hyderabad RTO jurisdictions: Khairatabad (TS-09), Kondapur (TS-07), Secunderabad (TS-10), and Medchal (TS-08).
          </p>
        </div>

        <div className="service-main-grid">
          <div className="grid-2col-responsive" style={{ display: "grid", gap: 16 }}>
            {services.map((s, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--bg-dark)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "rgba(239, 68, 68, 0.12)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <s.icon size={22} />
                </div>
                <h3 style={{ fontSize: 17, color: "var(--text-main)" }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div
            className="mobile-only-action"
            style={{
              background: "var(--bg-dark)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 24,
              textAlign: "center",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <h3 style={{ fontSize: 18, color: "var(--text-main)" }}>Request RTO / RC Assistance</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Ownership transfer, HP removal, NOC, and RTI insurance advisory.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <FileText size={16} />
              <span>Open RTO Assistance Form</span>
            </button>
          </div>

          <div
            className="desktop-only-form"
            style={{
              background: "var(--bg-dark)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 32,
            }}
          >
            <h3 style={{ fontSize: 20, color: "var(--text-main)", marginBottom: 6 }}>
              Request RTO / RC Assistance
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
              Leave your vehicle details and our RTO concierge will contact you within 30 minutes.
            </p>

            {submitted ? (
              <div
                style={{
                  background: "rgba(34, 197, 94, 0.12)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  borderRadius: "var(--radius-sm)",
                  padding: 20,
                  textAlign: "center",
                }}
              >
                <CheckCircle2 size={32} className="text-emerald-500" style={{ margin: "0 auto 8px" }} />
                <h4 style={{ color: "var(--text-main)", fontSize: 16 }}>Request Received</h4>
                <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4, marginBottom: 16 }}>
                  Our RTO documentation specialist will call you shortly on +91 {form.phone}.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenBookings) onOpenBookings(form.phone);
                      else window.location.hash = "#bookings";
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, minWidth: 140 }}
                  >
                    <Ticket size={14} />
                    <span>View in My Bookings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const msg = `*PASSION CAR RTO DESK INQUIRY*\nService: ${form.serviceType}\nCustomer: ${form.name}\nPhone: ${form.phone}\nVehicle Reg: ${form.vehicleNo || "N/A"}\nStatus: Submitted to Dealership`;
                      safeOpenWhatsApp(msg);
                    }}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, minWidth: 140 }}
                  >
                    <Share2 size={14} />
                    <span>Share on WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="btn btn-glass btn-sm"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Service Type *</label>
                  <select
                    className="form-select"
                    value={form.serviceType}
                    onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                  >
                    <option value="RC Ownership Transfer">RC Ownership Transfer</option>
                    <option value="Bank Hypothecation (HP) Removal">Bank Hypothecation (HP) Removal</option>
                    <option value="Interstate NOC & Re-registration">Interstate NOC & Re-registration</option>
                    <option value="RTI (Return to Invoice) Advisory">RTI (Return to Invoice) Advisory</option>
                    <option value="Duplicate RC & Fitness Certificate">Duplicate RC & Fitness Certificate</option>
                  </select>
                </div>

                <div className="form-grid-2col">
                  <div className="form-group">
                    <label className="form-label">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      className="form-input"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mobile Number (10 Digits) *</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      required
                      placeholder="10-digit mobile number (e.g. 9849012345)"
                      className="form-input"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: cleanMobileNumber(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Vehicle Registration Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. TS 09 EA 1234"
                    className="form-input"
                    value={form.vehicleNo}
                    onChange={(e) => setForm({ ...form, vehicleNo: e.target.value.toUpperCase() })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={createInquiry.isPending}
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: 6 }}
                >
                  {createInquiry.isPending ? "Connecting..." : "Request RTO Support"}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ShieldCheck size={20} className="text-red-500" />
                <h3 style={{ color: "var(--text-main)", margin: 0 }}>RTO & RC Legal Assistance</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="modal-close-btn" aria-label="Close modal">
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              {submitted ? (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <CheckCircle2 size={36} className="text-emerald-500" style={{ margin: "0 auto 12px" }} />
                  <h4 style={{ color: "var(--text-main)", fontSize: 18 }}>Request Received</h4>
                  <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6, marginBottom: 20 }}>
                    Our RTO documentation specialist will call you shortly on +91 {form.phone}.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setModalOpen(false);
                        if (onOpenBookings) onOpenBookings(form.phone);
                        else window.location.hash = "#bookings";
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, minWidth: 140 }}
                    >
                      <Ticket size={14} />
                      <span>View in My Bookings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const msg = `*PASSION CAR RTO DESK INQUIRY*\nService: ${form.serviceType}\nCustomer: ${form.name}\nPhone: ${form.phone}\nVehicle Reg: ${form.vehicleNo || "N/A"}\nStatus: Submitted to Dealership`;
                        safeOpenWhatsApp(msg);
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, minWidth: 140 }}
                    >
                      <Share2 size={14} />
                      <span>Share on WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setModalOpen(false);
                      }}
                      className="btn btn-glass btn-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Service Type *</label>
                    <select
                      className="form-select"
                      value={form.serviceType}
                      onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                    >
                      <option value="RC Ownership Transfer">RC Ownership Transfer</option>
                      <option value="Bank Hypothecation (HP) Removal">Bank Hypothecation (HP) Removal</option>
                      <option value="Interstate NOC & Re-registration">Interstate NOC & Re-registration</option>
                      <option value="RTI (Return to Invoice) Advisory">RTI (Return to Invoice) Advisory</option>
                      <option value="Duplicate RC & Fitness Certificate">Duplicate RC & Fitness Certificate</option>
                    </select>
                  </div>

                  <div className="form-grid-2col">
                    <div className="form-group">
                      <label className="form-label">Your Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        className="form-input"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Mobile Number (10 Digits) *</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        required
                        placeholder="10-digit mobile number"
                        className="form-input"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: cleanMobileNumber(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vehicle Registration Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. TS 09 EA 1234"
                      className="form-input"
                      value={form.vehicleNo}
                      onChange={(e) => setForm({ ...form, vehicleNo: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={createInquiry.isPending}
                    className="btn btn-primary btn-lg"
                    style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
                  >
                    {createInquiry.isPending ? "Connecting..." : "Request RTO Support"}
                    <ArrowRight size={18} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ExchangeSection({
  onOpenBookings,
  customerUser,
}: {
  onOpenBookings?: (phone: string) => void;
  customerUser?: { id: string; name: string; phone: string; email: string; photo: string } | null;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(() => ({
    currBrand: "",
    currModel: "",
    currYear: "2020",
    currKm: "",
    upgradeChoice: "",
    name: customerUser?.name || "",
    phone: customerUser?.phone || (typeof window !== "undefined" ? localStorage.getItem("passioncar_last_phone") || "" : ""),
  }));
  const [submitted, setSubmitted] = useState(false);
  const createInquiry = useCreateInquiry();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.currBrand) return;
    if (form.phone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    createInquiry.mutate(
      {
        type: "exchange",
        name: form.name,
        phone: form.phone,
        message: `Exchange Request: Current Car: ${form.currYear} ${form.currBrand} ${form.currModel} (${form.currKm || "N/A"} km). Upgrade Target: ${form.upgradeChoice || "Any luxury certified car"}.`,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          try {
            localStorage.setItem("passioncar_last_phone", form.phone);
          } catch {}
          const msg = `*PASSION CAR EXCHANGE REQUEST*\nCurrent: ${form.currYear} ${form.currBrand} ${form.currModel} (${form.currKm || ""} km)\nTarget Upgrade: ${form.upgradeChoice || "Certified Luxury"}\nName: ${form.name}\nPhone: ${form.phone}`;
          safeOpenWhatsApp(msg);
        },
      }
    );
  };

  return (
    <section id="exchange" style={{ padding: "90px 0", background: "var(--bg-dark)" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
          <div className="badge badge-gold" style={{ marginBottom: 12 }}>
            <RefreshCw size={14} />
            <span>Instant Value Adjustment</span>
          </div>
          <h2 style={{ fontSize: 34, color: "var(--text-main)", marginBottom: 12 }}>
            Luxury Car Exchange & Trade-In Desk
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Trade in your existing car of any brand for a certified pre-owned luxury vehicle with 30-minute spot evaluation and direct settlement.
          </p>
        </div>

        <div className="grid-2col-responsive" style={{ alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "rgba(239, 68, 68, 0.15)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  1
                </div>
                <div>
                  <h3 style={{ fontSize: 18, color: "var(--text-main)", marginBottom: 4 }}>
                    Free 30-Minute Spot Evaluation
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
                    Drive into our Kavuri Hills showroom for a swift 150-point physical and diagnostic inspection with live Hyderabad market pricing.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "rgba(239, 68, 68, 0.15)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  2
                </div>
                <div>
                  <h3 style={{ fontSize: 18, color: "var(--text-main)", marginBottom: 4 }}>
                    Best Market Value Commitment
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
                    Guaranteed top exchange bonus above ordinary scrap/aggregator valuations. No middleman deductions.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "rgba(239, 68, 68, 0.15)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  3
                </div>
                <div>
                  <h3 style={{ fontSize: 18, color: "var(--text-main)", marginBottom: 4 }}>
                    Drive Home the Upgrade Same-Day
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
                    Directly offset your old car value against any certified luxury car in stock. Instant finance loan conversion for the balance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="mobile-only-action"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 24,
              textAlign: "center",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <h3 style={{ fontSize: 18, color: "var(--text-main)" }}>Exchange & Upgrade Your Car</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Get instant trade-in value adjustment and upgrade bonus for your current car.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <RefreshCw size={16} />
              <span>Open Car Exchange Form</span>
            </button>
          </div>

          <div
            className="desktop-only-form"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 32,
            }}
          >
            <h3 style={{ fontSize: 20, color: "var(--text-main)", marginBottom: 6 }}>
              Calculate Your Exchange Estimate
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
              Enter your existing car details for an instant trade-in quote.
            </p>

            {submitted ? (
              <div
                style={{
                  background: "rgba(34, 197, 94, 0.12)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  borderRadius: "var(--radius-sm)",
                  padding: 20,
                  textAlign: "center",
                }}
              >
                <CheckCircle2 size={32} className="text-emerald-500" style={{ margin: "0 auto 8px" }} />
                <h4 style={{ color: "var(--text-main)", fontSize: 16 }}>Exchange Inquiry Submitted</h4>
                <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4, marginBottom: 16 }}>
                  Our valuation team will contact you on +91 {form.phone} with the best trade-in quote.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenBookings) onOpenBookings(form.phone);
                      else window.location.hash = "#bookings";
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, minWidth: 140 }}
                  >
                    <Ticket size={14} />
                    <span>View in My Bookings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const msg = `*PASSION CAR EXCHANGE REQUEST*\nCurrent: ${form.currYear} ${form.currBrand} ${form.currModel} (${form.currKm || ""} km)\nTarget Upgrade: ${form.upgradeChoice || "Certified Luxury"}\nName: ${form.name}\nPhone: ${form.phone}\nStatus: Submitted to Dealership`;
                      safeOpenWhatsApp(msg);
                    }}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, minWidth: 140 }}
                  >
                    <Share2 size={14} />
                    <span>Share on WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="btn btn-glass btn-sm"
                  >
                    Calculate Another
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-grid-2col">
                  <div className="form-group">
                    <label className="form-label">Current Car Brand *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Honda, Hyundai, BMW"
                      className="form-input"
                      value={form.currBrand}
                      onChange={(e) => setForm({ ...form, currBrand: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Model *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. City, Creta, 3 Series"
                      className="form-input"
                      value={form.currModel}
                      onChange={(e) => setForm({ ...form, currModel: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2col">
                  <div className="form-group">
                    <label className="form-label">Year of Registration</label>
                    <input
                      type="number"
                      placeholder="2020"
                      className="form-input"
                      value={form.currYear}
                      onChange={(e) => setForm({ ...form, currYear: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kilometers Driven</label>
                    <input
                      type="number"
                      placeholder="e.g. 45000"
                      className="form-input"
                      value={form.currKm}
                      onChange={(e) => setForm({ ...form, currKm: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Desired Upgrade Vehicle (From Passion Car)</label>
                  <input
                    type="text"
                    placeholder="e.g. Mercedes-Benz C-Class, BMW X1, Audi A4"
                    className="form-input"
                    value={form.upgradeChoice}
                    onChange={(e) => setForm({ ...form, upgradeChoice: e.target.value })}
                  />
                </div>

                <div className="form-grid-2col">
                  <div className="form-group">
                    <label className="form-label">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Full Name"
                      className="form-input"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number (10 Digits) *</label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      required
                      placeholder="10-digit mobile number (e.g. 9849012345)"
                      className="form-input"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: cleanMobileNumber(e.target.value) })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={createInquiry.isPending}
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center", marginTop: 6 }}
                >
                  {createInquiry.isPending ? "Calculating..." : "Get Instant Exchange Quote"}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <RefreshCw size={20} className="text-red-500" />
                <h3 style={{ color: "var(--text-main)", margin: 0 }}>Car Exchange & Trade-In</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="modal-close-btn" aria-label="Close modal">
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: 24 }}>
              {submitted ? (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <CheckCircle2 size={36} className="text-emerald-500" style={{ margin: "0 auto 12px" }} />
                  <h4 style={{ color: "var(--text-main)", fontSize: 18 }}>Exchange Request Received</h4>
                  <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6, marginBottom: 20 }}>
                    Our valuation specialist will call you shortly on +91 {form.phone}.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setModalOpen(false);
                        if (onOpenBookings) onOpenBookings(form.phone);
                        else window.location.hash = "#bookings";
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, minWidth: 140 }}
                    >
                      <Ticket size={14} />
                      <span>View in My Bookings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const msg = `*PASSION CAR EXCHANGE REQUEST*\nCurrent: ${form.currYear} ${form.currBrand} ${form.currModel} (${form.currKm || ""} km)\nTarget Upgrade: ${form.upgradeChoice || "Certified Luxury"}\nName: ${form.name}\nPhone: ${form.phone}\nStatus: Submitted to Dealership`;
                        safeOpenWhatsApp(msg);
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, minWidth: 140 }}
                    >
                      <Share2 size={14} />
                      <span>Share on WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setModalOpen(false);
                      }}
                      className="btn btn-glass btn-sm"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="form-grid-2col">
                    <div className="form-group">
                      <label className="form-label">Current Car Brand *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Honda, Hyundai, BMW"
                        className="form-input"
                        value={form.currBrand}
                        onChange={(e) => setForm({ ...form, currBrand: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Model & Variant *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. City VX, Creta SX"
                        className="form-input"
                        value={form.currModel}
                        onChange={(e) => setForm({ ...form, currModel: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2col">
                    <div className="form-group">
                      <label className="form-label">Manufacturing Year *</label>
                      <select
                        className="form-select"
                        value={form.currYear}
                        onChange={(e) => setForm({ ...form, currYear: e.target.value })}
                      >
                        {["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "Older"].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Kilometers Driven</label>
                      <input
                        type="text"
                        placeholder="e.g. 45,000 km"
                        className="form-input"
                        value={form.currKm}
                        onChange={(e) => setForm({ ...form, currKm: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Upgrade Car</label>
                    <input
                      type="text"
                      placeholder="e.g. Mercedes C-Class, BMW 3 Series"
                      className="form-input"
                      value={form.upgradeChoice}
                      onChange={(e) => setForm({ ...form, upgradeChoice: e.target.value })}
                    />
                  </div>

                  <div className="form-grid-2col">
                    <div className="form-group">
                      <label className="form-label">Your Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        className="form-input"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mobile Number (10 Digits) *</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        required
                        placeholder="10-digit mobile number"
                        className="form-input"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: cleanMobileNumber(e.target.value) })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={createInquiry.isPending}
                    className="btn btn-primary btn-lg"
                    style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
                  >
                    {createInquiry.isPending ? "Calculating..." : "Get Instant Exchange Quote"}
                    <ArrowRight size={18} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ServiceBookingSection({
  onOpenBookings,
  customerUser,
}: {
  onOpenBookings?: (phone: string) => void;
  customerUser?: { id: string; name: string; phone: string; email: string; photo: string } | null;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const quickDates = useMemo(() => {
    const list: Array<{ label: string; date: string }> = [];
    const d0 = new Date();
    list.push({ label: "Today", date: d0.toISOString().split("T")[0] });
    const d1 = new Date();
    d1.setDate(d1.getDate() + 1);
    list.push({ label: "Tomorrow", date: d1.toISOString().split("T")[0] });
    const d2 = new Date();
    d2.setDate(d2.getDate() + 2);
    list.push({ label: "+2 Days", date: d2.toISOString().split("T")[0] });
    const d3 = new Date();
    d3.setDate(d3.getDate() + 3);
    list.push({ label: "+3 Days", date: d3.toISOString().split("T")[0] });
    return list;
  }, []);
  const timeSlots = [
    "09:30 AM - 11:00 AM (Morning Slot)",
    "11:00 AM - 12:30 PM (Mid-Day Slot)",
    "02:00 PM - 03:30 PM (Afternoon Slot)",
    "03:30 PM - 05:00 PM (Late Afternoon Slot)",
    "05:00 PM - 06:30 PM (Evening Slot)",
  ];
  const [form, setForm] = useState(() => ({
    name: customerUser?.name || "",
    phone: customerUser?.phone || (typeof window !== "undefined" ? localStorage.getItem("passioncar_last_phone") || "" : ""),
    email: customerUser?.email || "",
    carDetails: "",
    servicePackage: "Periodic Comprehensive Service",
    date: todayStr,
    timeSlot: "09:30 AM - 11:00 AM (Morning Slot)",
    notes: "",
  }));

  useEffect(() => {
    if (customerUser) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || customerUser.name || "",
        phone: prev.phone || customerUser.phone || "",
        email: prev.email || customerUser.email || "",
      }));
    }
  }, [customerUser]);

  const [bookingPass, setBookingPass] = useState<{
    token: string;
    booking: ServiceBooking;
  } | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const bookServiceSlot = useBookServiceSlot();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.carDetails.trim() || !form.date || !form.timeSlot) {
      setBookingError("Please provide your name, contact number, vehicle details, date, and preferred time slot.");
      return;
    }
    if (form.phone.trim().length < 10) {
      setBookingError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setBookingError(null);

    bookServiceSlot.mutate(
      {
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        carDetails: form.carDetails.trim(),
        servicePackage: form.servicePackage,
        date: form.date,
        timeSlot: form.timeSlot,
        notes: form.notes.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setBookingError(null);
          setBookingPass({
            token: data.token,
            booking: data.booking,
          });
          try {
            localStorage.setItem("passioncar_last_phone", data.booking.phone);
          } catch {}
        },
        onError: (err: any) => {
          setBookingError(err?.message || "Could not book service slot. Please verify your phone number and details.");
        },
      }
    );
  };

  const passMsg = bookingPass
    ? `*PASSION CAR OFFICIAL SERVICE PASS*\n` +
      `🎫 *Token ID:* ${bookingPass.token}\n` +
      `👤 *Customer:* ${bookingPass.booking.customerName}\n` +
      `📞 *Phone:* ${bookingPass.booking.phone}\n` +
      `🚗 *Vehicle:* ${bookingPass.booking.carDetails}\n` +
      `🔧 *Service:* ${bookingPass.booking.servicePackage}\n` +
      `📅 *Date:* ${bookingPass.booking.date}\n` +
      `⏰ *Time Slot:* ${bookingPass.booking.timeSlot}\n` +
      `📍 *Location:* Passion Car, Plot No 25, 100 Feet Rd, Kavuri Hills, Madhapur, Hyderabad\n` +
      `Status: Confirmed Slot`
    : "";

  const handleShareWhatsApp = () => {
    if (!passMsg) return;
    safeOpenWhatsApp(passMsg);
  };

  const services = [
    { title: "Periodic Maintenance Service", desc: "Engine oil change, oil/air filter replacement, fluid top-ups, 60-point checkup.", price: "From ₹4,999" },
    { title: "Brakes & Suspension Overhaul", desc: "Brake pad replacement, disc skimming, caliper overhaul, bushing inspection.", price: "From ₹6,500" },
    { title: "AC & Climate System Service", desc: "Evaporator foam cleaning, cabin filter replacement, refrigerant gas refill.", price: "From ₹2,499" },
    { title: "Computer OBD-II Diagnostics", desc: "Full digital scanner diagnostics, sensor check, clearing spurious error codes.", price: "From ₹1,499" },
    { title: "150-Point Pre-Purchase Inspection", desc: "Exhaustive physical, paint depth, chassis and mechanical evaluation.", price: "From ₹3,999" },
    { title: "Ceramic Coating & Detailing", desc: "3-stage paint correction, 9H ceramic glass protection, deep interior steam.", price: "From ₹12,999" },
  ];

  return (
    <section id="service" style={{ padding: "90px 0", background: "var(--bg-card)" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
          <div className="badge badge-red" style={{ marginBottom: 12 }}>
            <Award size={14} />
            <span>Certified Service Center · Official Token System</span>
          </div>
          <h2 style={{ fontSize: 34, color: "var(--text-main)", marginBottom: 12 }}>
            Book Your Service Slot & Get Official Service Token
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Select your preferred date and time slot. Receive an instant verified Passion Car Service Token pass for priority bay entry and zero wait time.
          </p>
        </div>

        <div className="service-main-grid">
          
          <div className="service-cards-grid">
            {services.map((s, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--bg-dark)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h4 style={{ fontSize: 16, color: "var(--text-main)", marginBottom: 6 }}>{s.title}</h4>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 12 }}>{s.desc}</p>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)" }}>{s.price}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, servicePackage: s.title }));
                      if (window.innerWidth <= 768) {
                        setModalOpen(true);
                      } else {
                        const formEl = document.getElementById("service-booking-form");
                        formEl?.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                  >
                    Select Package
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div
            className="mobile-only-action"
            style={{
              background: "var(--bg-dark)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 24,
              textAlign: "center",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <h3 style={{ fontSize: 18, color: "var(--text-main)" }}>Book Certified Car Service Slot</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Receive an official digital entry pass for priority bay entry and zero wait time.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <Ticket size={16} />
              <span>Open Service Booking Form</span>
            </button>
          </div>

          <div
            id="service-booking-form"
            className="desktop-only-form"
            style={{
              background: "var(--bg-dark)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 32,
            }}
          >
            {bookingPass ? (
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  borderRadius: "var(--radius-lg)",
                  padding: 28,
                  position: "relative",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <span className="badge badge-gold" style={{ marginBottom: 6, display: "inline-flex" }}>
                      <Ticket size={12} />
                      <span>PASSION CAR OFFICIAL PASS</span>
                    </span>
                    <h3 style={{ fontSize: 22, color: "var(--text-main)", marginTop: 4 }}>Service Slot Confirmed</h3>
                  </div>
                  <div
                    style={{
                      background: "rgba(16, 185, 129, 0.2)",
                      border: "1px solid #10b981",
                      borderRadius: 8,
                      padding: "8px 14px",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#a7f3d0", display: "block", textTransform: "uppercase", letterSpacing: 1 }}>Token ID</span>
                    <strong style={{ fontSize: 18, color: "#34d399", fontFamily: "var(--font-mono)" }}>
                      #{bookingPass.token}
                    </strong>
                  </div>
                </div>

                <div
                  className="form-grid-2col"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 20,
                    fontSize: 13,
                  }}
                >
                  <div>
                    <span style={{ color: "var(--text-dim)", display: "block", fontSize: 11 }}>Customer Name</span>
                    <strong style={{ color: "var(--text-main)" }}>{bookingPass.booking.customerName}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-dim)", display: "block", fontSize: 11 }}>Mobile Contact</span>
                    <strong style={{ color: "#38bdf8" }}>{bookingPass.booking.phone}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-dim)", display: "block", fontSize: 11 }}>Vehicle</span>
                    <strong style={{ color: "var(--text-main)" }}>{bookingPass.booking.carDetails}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-dim)", display: "block", fontSize: 11 }}>Package</span>
                    <strong style={{ color: "var(--accent-gold)" }}>{bookingPass.booking.servicePackage}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-dim)", display: "block", fontSize: 11 }}>Appointment Date</span>
                    <strong style={{ color: "var(--text-main)" }}>{bookingPass.booking.date}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-dim)", display: "block", fontSize: 11 }}>Confirmed Time Slot</span>
                    <strong style={{ color: "#10b981" }}>{bookingPass.booking.timeSlot}</strong>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.5 }}>
                  📍 <strong>Service Center:</strong> Plot No: 25, 100 Feet Rd, Kavuri Hills, Madhapur, Hyderabad.<br />
                  Please present this digital token upon arrival for fast-track bay entry.
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenBookings) {
                        onOpenBookings(bookingPass.booking.phone);
                      } else {
                        window.location.hash = "#bookings";
                      }
                    }}
                    className="btn btn-primary"
                    style={{ flex: 1, minWidth: 160 }}
                  >
                    <Ticket size={15} />
                    <span>View in My Bookings</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="btn btn-outline"
                    style={{ flex: 1, minWidth: 160 }}
                  >
                    <Share2 size={15} />
                    <span>Share on WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingPass(null)}
                    className="btn btn-glass"
                    style={{ flex: 1, minWidth: 140 }}
                  >
                    <Plus size={15} />
                    <span>Book Another Slot</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 style={{ fontSize: 20, color: "var(--text-main)", marginBottom: 6 }}>
                  Select Time & Date for Service
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                  Kavuri Hills Workshop · Mon to Sun (9:00 AM - 8:00 PM) · Instant Token Issuance
                </p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Service Package *</label>
                    <select
                      className="form-select"
                      value={form.servicePackage}
                      onChange={(e) => setForm({ ...form, servicePackage: e.target.value })}
                    >
                      <option value="Periodic Comprehensive Service">Periodic Comprehensive Service</option>
                      <option value="Brakes & Suspension Overhaul">Brakes & Suspension Overhaul</option>
                      <option value="AC & Climate System Service">AC & Climate System Service</option>
                      <option value="Computer OBD-II Diagnostics">Computer OBD-II Diagnostics</option>
                      <option value="150-Point Pre-Purchase Inspection">150-Point Pre-Purchase Inspection</option>
                      <option value="Ceramic Coating & Detailing">Ceramic Coating & Detailing</option>
                      <option value="General Checkup & Oil Topup">General Checkup & Oil Topup</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Car Make, Model & Reg. Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2021 BMW 320d (TS 09 FL 7821)"
                      className="form-input"
                      value={form.carDetails}
                      onChange={(e) => setForm({ ...form, carDetails: e.target.value })}
                    />
                  </div>

                  <div className="form-grid-2col">
                    <div className="form-group">
                      <label className="form-label">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        className="form-input"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mobile Number (10 Digits) *</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        required
                        placeholder="10-digit mobile number (e.g. 9849012345)"
                        className="form-input"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: cleanMobileNumber(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label className="form-label" style={{ margin: 0 }}>Preferred Service Date *</label>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Pick a date or use shortcut</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      {quickDates.map((qd) => {
                        const isSelected = form.date === qd.date;
                        return (
                          <button
                            key={qd.date}
                            type="button"
                            onClick={() => setForm({ ...form, date: qd.date })}
                            className="btn btn-sm"
                            style={{
                              padding: "4px 10px",
                              fontSize: 12,
                              background: isSelected ? "var(--primary)" : "var(--bg-deep)",
                              color: isSelected ? "#ffffff" : "var(--text-main)",
                              border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border)",
                              borderRadius: "var(--radius-sm)",
                            }}
                          >
                            {qd.label} ({qd.date.slice(5)})
                          </button>
                        );
                      })}
                    </div>
                    <input
                      type="date"
                      required
                      min={todayStr}
                      className="form-input"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <label className="form-label" style={{ margin: 0 }}>Select Workshop Time Slot *</label>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>5 Daily Workshop Batches</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginBottom: 8 }}>
                      {timeSlots.map((slot) => {
                        const isSelected = form.timeSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setForm({ ...form, timeSlot: slot })}
                            style={{
                              padding: "8px 12px",
                              fontSize: 12,
                              fontWeight: isSelected ? 700 : 500,
                              textAlign: "left",
                              background: isSelected ? "rgba(239, 68, 68, 0.15)" : "var(--bg-deep)",
                              color: isSelected ? "var(--primary)" : "var(--text-main)",
                              border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border)",
                              borderRadius: "var(--radius-sm)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <span>{slot}</span>
                            {isSelected && <Check size={13} color="var(--primary)" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(56, 189, 248, 0.08)",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                      borderRadius: "var(--radius-sm)",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      color: "var(--text-main)",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <CalendarClock size={16} color="#38bdf8" />
                    <span>
                      Confirmed Appointment Slot: <strong style={{ color: "#38bdf8" }}>{form.date}</strong> at <strong style={{ color: "#38bdf8" }}>{form.timeSlot}</strong>
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Special Requests / Complaints (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. AC noise, brake pad check"
                      className="form-input"
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>

                  {bookingError && (
                    <div
                      style={{
                        background: "rgba(239, 68, 68, 0.12)",
                        border: "1px solid #ef4444",
                        color: "#ef4444",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: 13,
                        marginBottom: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Info size={15} />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={bookServiceSlot.isPending}
                    className="btn btn-primary"
                    style={{ width: "100%", justifyContent: "center", marginTop: 6 }}
                  >
                    <Ticket size={16} />
                    <span>{bookServiceSlot.isPending ? "Generating Service Token..." : "Book Slot & Get Service Token"}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <ServiceBookingModal
          onClose={() => setModalOpen(false)}
          initialPackage={form.servicePackage}
          customerUser={customerUser}
          onOpenBookings={onOpenBookings}
        />
      )}
    </section>
  );
}

function EmiCalculatorSection() {
  const [loanAmount, setLoanAmount] = useState(2500000);
  const [interestRate, setInterestRate] = useState(9.5);
  const [tenureMonths, setTenureMonths] = useState(60);

  const monthlyRate = interestRate / 1200;
  const emi = useMemo(() => {
    if (monthlyRate === 0) return Math.round(loanAmount / tenureMonths);
    const pow = Math.pow(1 + monthlyRate, tenureMonths);
    return Math.round((loanAmount * monthlyRate * pow) / (pow - 1));
  }, [loanAmount, monthlyRate, tenureMonths]);

  const totalPayment = emi * tenureMonths;
  const totalInterest = Math.max(0, totalPayment - loanAmount);
  const principalPercent = totalPayment > 0 ? Math.round((loanAmount / totalPayment) * 100) : 100;
  const interestPercent = 100 - principalPercent;

  const handleApplyFinance = () => {
    const text = encodeURIComponent(
      `Hi Passion Car Team, I am looking for luxury car finance.\nLoan Amount: ${formatInr(loanAmount)}\nTenure: ${tenureMonths} Months (${(tenureMonths / 12).toFixed(1)} Years)\nCalculated EMI: ${formatInr(emi)}/mo`
    );
    window.open(`https://wa.me/918885858380?text=${text}`, "_blank");
  };

  return (
    <section id="emi-calculator" style={{ padding: "90px 0", background: "var(--bg-dark)" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
          <div className="badge badge-gold" style={{ marginBottom: 12 }}>
            <Calculator size={14} />
            <span>Finance & EMI Calculator</span>
          </div>
          <h2 style={{ fontSize: 34, color: "var(--text-main)", marginBottom: 12 }}>
            Interactive Luxury Car EMI Converter
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Customize your loan amount, interest rate, and tenure to discover tailored monthly payments with top banking partners (HDFC, ICICI, Axis, Kotak).
          </p>
        </div>

        <div className="emi-layout-grid">
          
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 32,
              display: "flex",
              flexDirection: "column",
              gap: 28,
            }}
          >
            
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Loan Amount</label>
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>
                  {formatInr(loanAmount)}
                </span>
              </div>
              <input
                type="range"
                min={300000}
                max={15000000}
                step={50000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                <span>₹3 Lakhs</span>
                <span>₹75 Lakhs</span>
                <span>₹1.5 Crores</span>
              </div>
            </div>

            
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Interest Rate (% p.a.)</label>
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>
                  {interestRate.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min={7.5}
                max={16.0}
                step={0.1}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                <span>7.5%</span>
                <span>11.5%</span>
                <span>16.0%</span>
              </div>
            </div>

            
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Loan Duration</label>
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}>
                  {tenureMonths} Months ({tenureMonths / 12} Years)
                </span>
              </div>
              <input
                type="range"
                min={12}
                max={84}
                step={6}
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                <span>1 Year (12m)</span>
                <span>4 Years (48m)</span>
                <span>7 Years (84m)</span>
              </div>
            </div>
          </div>

          
          <div
            style={{
              background: "linear-gradient(145deg, var(--bg-card) 0%, rgba(239, 68, 68, 0.08) 100%)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: 32,
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 600 }}>
              Estimated Monthly Installment
            </span>
            <div style={{ fontSize: 40, fontWeight: 900, color: "var(--primary)", margin: "10px 0 20px" }}>
              {formatInr(emi)}
              <span style={{ fontSize: 16, fontWeight: 500, color: "var(--text-muted)" }}> / mo</span>
            </div>

            
            <div style={{ height: 10, borderRadius: 5, background: "rgba(239, 68, 68, 0.3)", display: "flex", overflow: "hidden", marginBottom: 16 }}>
              <div style={{ width: `${principalPercent}%`, background: "var(--primary)", height: "100%" }} />
              <div style={{ width: `${interestPercent}%`, background: "#f59e0b", height: "100%" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 24 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-main)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--primary)" }} />
                Principal: {principalPercent}%
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-main)" }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "#f59e0b" }} />
                Interest: {interestPercent}%
              </span>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 18, marginBottom: 24, textAlign: "left", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "var(--text-muted)" }}>Principal Amount:</span>
                <strong style={{ color: "var(--text-main)" }}>{formatInr(loanAmount)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "var(--text-muted)" }}>Total Interest:</span>
                <strong style={{ color: "#f59e0b" }}>{formatInr(totalInterest)}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: "var(--text-muted)" }}>Total Repayment:</span>
                <strong style={{ color: "var(--text-main)" }}>{formatInr(totalPayment)}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyFinance}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <span>Apply for Instant Pre-Approval</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  const pillars = [
    {
      icon: ShieldCheck,
      title: "100% Non-Accidental Guarantee",
      desc: "Every vehicle undergoes thorough chassis, structural weld, and panel verification. Zero accidental compromise.",
    },
    {
      icon: Gauge,
      title: "Verified Original Odometers",
      desc: "Digital service history cross-referenced directly with authorized manufacturer databases to ensure honest mileage.",
    },
    {
      icon: FileText,
      title: "Complete Telangana RTO Assurance",
      desc: "Clear legal titles, zero pending challans, and swift RC transfer delivered straight to your doorstep.",
    },
    {
      icon: Award,
      title: "7-Day Buyback / Warranty",
      desc: "Comprehensive engine and transmission warranty backing to guarantee complete confidence on every journey.",
    },
  ];

  return (
    <section id="about" style={{ padding: "90px 0", background: "var(--bg-card)" }}>
      <div className="container">
        <div className="grid-2col-responsive" style={{ alignItems: "center" }}>
          <div>
            <div className="badge badge-gold" style={{ marginBottom: 12 }}>
              <Award size={14} />
              <span>Madhapur, Hyderabad</span>
            </div>
            <h2 style={{ fontSize: 36, color: "var(--text-main)", marginBottom: 16 }}>
              Driven by Trust. Powered by Passion.
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 16 }}>
              Established in the heart of Hyderabad's IT corridor at Kavuri Hills, Passion Car has built a decade of uncompromising integrity in the pre-owned luxury automotive space.
            </p>
            <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 28 }}>
              We curate only top-tier vehicles from renowned marques including Mercedes-Benz, BMW, Audi, Land Rover, Volvo, and Volkswagen. Our rigorous 150-point diagnostic inspection ensures that every car delivered feels and drives like a brand-new showroom machine.
            </p>

            <div className="grid-3col-responsive" style={{ borderTop: "1px solid var(--border)", paddingTop: 24 }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "var(--primary)" }}>2,500+</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Happy Deliveries</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "#f59e0b" }}>4.9 ★</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Google & JD Rating</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text-main)" }}>150+</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Inspection Points</div>
              </div>
            </div>
          </div>

          <div className="grid-2col-cards">
            {pillars.map((p, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--bg-dark)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: 24,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "rgba(239, 68, 68, 0.12)",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 14,
                  }}
                >
                  <p.icon size={22} />
                </div>
                <h3 style={{ fontSize: 17, color: "var(--text-main)", marginBottom: 8 }}>{p.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.19 0 10.04 0 12s.45 3.81 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function CustomerSignInModal({
  onClose,
  onGoToAdmin,
  onSuccessLogin,
}: {
  onClose: () => void;
  onGoToAdmin?: () => void;
  onSuccessLogin: (user: { id: string; name: string; phone: string; email: string; photo: string }) => void;
}) {
  const [authTab, setAuthTab] = useState<"google" | "password" | "reset">("google");
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetNewPass, setResetNewPass] = useState("");
  const [resetConfirmPass, setResetConfirmPass] = useState("");
  const [showResetPass, setShowResetPass] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState("");

  const googleLogin = useCustomerGoogleLogin();
  const [gsiReady, setGsiReady] = useState(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "236049845526-6pall4lrjfqbs0ga6t3j9ns4sjg9t9iv.apps.googleusercontent.com";

    const initGsi = () => {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        try {
          google.accounts.id.initialize({
            client_id: clientId,
            callback: (res: any) => {
              if (res.credential) {
                try {
                  const parts = String(res.credential || "").split(".");
                  if (parts.length >= 2) {
                    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
                    while (base64.length % 4 !== 0) {
                      base64 += "=";
                    }
                    const jsonPayload = decodeURIComponent(
                      Array.prototype.map
                        .call(atob(base64), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                        .join("")
                    );
                    const payload = JSON.parse(jsonPayload);
                    if (payload.email) {
                      googleLogin.mutate(
                        {
                          email: payload.email,
                          name: payload.name || payload.email.split("@")[0],
                          photo: payload.picture || "",
                        },
                        {
                          onSuccess: (data) => {
                            setSuccess(true);
                            onSuccessLogin(data.customer);
                            setTimeout(() => onClose(), 1200);
                          },
                          onError: (err) => {
                            setErrorMsg(err.message || "Google OAuth sign-in failed.");
                          },
                        }
                      );
                    }
                  }
                } catch (decodeErr) {
                  setErrorMsg("Could not process Google account details. Please enter your email below.");
                }
              }
            },
          });

          const btnContainer = document.getElementById("google-gsi-btn-container");
          if (btnContainer) {
            btnContainer.innerHTML = "";
            const containerWidth = btnContainer.getBoundingClientRect().width;
            const targetWidth = Math.floor(
              containerWidth > 200
                ? Math.min(containerWidth, 388)
                : Math.min(388, Math.max(220, (typeof window !== "undefined" ? window.innerWidth - 64 : 320)))
            );
            google.accounts.id.renderButton(btnContainer, {
              theme: "filled_blue",
              size: "large",
              text: "continue_with",
              shape: "rectangular",
              width: targetWidth,
              logo_alignment: "left",
            });
            setGsiReady(true);
          }
        } catch (e) {
          console.warn("GSI init warning", e);
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGsi();
    } else {
      const timer = setTimeout(initGsi, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const emailToUse = googleEmail.trim();
    if (!emailToUse) {
      setErrorMsg("Please enter your Google account email address.");
      return;
    }
    if (!emailToUse.includes("@")) {
      setErrorMsg("Please enter a valid Google email address (e.g. user@gmail.com).");
      return;
    }

    googleLogin.mutate(
      { email: emailToUse, name: googleName.trim() || emailToUse.split("@")[0] },
      {
        onSuccess: (data) => {
          setSuccess(true);
          onSuccessLogin(data.customer);
          setTimeout(() => {
            onClose();
          }, 1200);
        },
        onError: (err) => {
          setErrorMsg(err.message || "Google OAuth sign-in failed.");
        },
      }
    );
  };

  const handleQuickGoogleSignIn = (email = "customer.passioncar@gmail.com", name = "Google Verified User") => {
    setErrorMsg("");
    googleLogin.mutate(
      { email, name },
      {
        onSuccess: (data) => {
          setSuccess(true);
          onSuccessLogin(data.customer);
          setTimeout(() => {
            onClose();
          }, 1000);
        },
        onError: (err) => {
          setErrorMsg(err.message || "Google OAuth sign-in failed.");
        },
      }
    );
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMsg("Please enter both your email/mobile and password.");
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch("/api/customer/login-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
      }
      setSuccess(true);
      onSuccessLogin(data.customer);
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setResetSuccessMsg("");
    if (!resetIdentifier.trim()) {
      setErrorMsg("Please enter your registered email or mobile number.");
      return;
    }
    if (!resetNewPass || resetNewPass.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }
    if (resetNewPass !== resetConfirmPass) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch("/api/customer/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: resetIdentifier.trim(),
          newPassword: resetNewPass,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Password reset failed.");
      }
      setResetSuccessMsg("Password reset successfully! You can now log in with your new password.");
      setResetNewPass("");
      setResetConfirmPass("");
      setTimeout(() => {
        setAuthTab("password");
        setLoginIdentifier(resetIdentifier);
      }, 1800);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Password reset failed.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {authTab === "google" ? <GoogleLogo size={20} /> : <User size={18} className="text-red-500" />}
            </div>
            <div>
              <h3 style={{ color: "var(--text-main)", margin: 0, fontSize: 18 }}>
                {authTab === "google" ? "Sign in with Google" : authTab === "password" ? "Customer Password Login" : "Reset Account Password"}
              </h3>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Passion Car Customer Portal
              </span>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: "14px 20px 0" }}>
          <button
            type="button"
            onClick={() => {
              setAuthTab("google");
              setErrorMsg("");
            }}
            className={`auth-tab-btn ${authTab === "google" ? "active" : ""}`}
            style={{ padding: "8px 6px", fontSize: 11, justifyContent: "center" }}
          >
            <span>Google Login</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab("password");
              setErrorMsg("");
            }}
            className={`auth-tab-btn ${authTab === "password" ? "active" : ""}`}
            style={{ padding: "8px 6px", fontSize: 11, justifyContent: "center" }}
          >
            <span>Password Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthTab("reset");
              setErrorMsg("");
            }}
            className={`auth-tab-btn ${authTab === "reset" ? "active" : ""}`}
            style={{ padding: "8px 6px", fontSize: 11, justifyContent: "center" }}
          >
            <span>Reset Password</span>
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {success ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <CheckCircle2 size={48} className="text-emerald-500" style={{ margin: "0 auto 12px" }} />
              <h4 style={{ color: "var(--text-main)", fontSize: 18 }}>Welcome to Passion Car!</h4>
              <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 4 }}>Signed in successfully.</p>
            </div>
          ) : (
            <div>
              {errorMsg && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#fca5a5",
                    borderRadius: 6,
                    padding: "8px 12px",
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  {errorMsg}
                </div>
              )}

              {resetSuccessMsg && (
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid #10b981",
                    color: "#10b981",
                    borderRadius: 6,
                    padding: "8px 12px",
                    fontSize: 13,
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{resetSuccessMsg}</span>
                </div>
              )}

              {authTab === "google" && (
                <div>
                  <div id="google-gsi-btn-container" style={{ display: "flex", justifyContent: "center", minHeight: 44, marginBottom: 14 }} />

                  {!gsiReady && (
                    <button
                      type="button"
                      onClick={() => {
                        if (googleEmail.trim()) {
                          handleGoogleSubmit({ preventDefault: () => {} } as any);
                        } else {
                          handleQuickGoogleSignIn();
                        }
                      }}
                      disabled={googleLogin.isPending}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        padding: "13px 18px",
                        borderRadius: 8,
                        background: "#ffffff",
                        color: "#3c4043",
                        border: "1px solid #dadce0",
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: "pointer",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                        marginBottom: 18,
                      }}
                    >
                      <GoogleLogo size={20} />
                      <span>{googleLogin.isPending ? "Connecting with Google..." : "Continue with Google"}</span>
                    </button>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      margin: "18px 0",
                      color: "var(--text-muted)",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 0.5,
                    }}
                  >
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                    <span style={{ padding: "0 10px", textTransform: "uppercase" }}>Or Enter Google Account Email</span>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  </div>

                  <form onSubmit={handleGoogleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Google Account Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="yourname@gmail.com"
                        className="form-input"
                        value={googleEmail}
                        onChange={(e) => setGoogleEmail(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Display Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="Your Name"
                        className="form-input"
                        value={googleName}
                        onChange={(e) => setGoogleName(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={googleLogin.isPending}
                      className="btn btn-primary"
                      style={{ width: "100%", justifyContent: "center", gap: 8 }}
                    >
                      <GoogleLogo size={16} />
                      <span>{googleLogin.isPending ? "Connecting..." : "Sign In with Google"}</span>
                    </button>
                  </form>
                </div>
              )}

              {authTab === "password" && (
                <form onSubmit={handlePasswordLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Mobile Number or Email Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9849012345 or user@example.com"
                      className="form-input"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        required
                        placeholder="Enter your account password"
                        className="form-input"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        style={{ paddingRight: 40 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          padding: 0,
                        }}
                      >
                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="btn btn-primary"
                    style={{ width: "100%", justifyContent: "center", gap: 8, marginTop: 4 }}
                  >
                    <User size={16} />
                    <span>{loginLoading ? "Signing in..." : "Sign In with Password"}</span>
                  </button>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab("reset");
                        setResetIdentifier(loginIdentifier);
                        setErrorMsg("");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--primary)",
                        cursor: "pointer",
                        fontSize: 12,
                        padding: 0,
                        fontWeight: 600,
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </form>
              )}

              {authTab === "reset" && (
                <form onSubmit={handleResetSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Registered Mobile Number or Email *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9849012345 or user@example.com"
                      className="form-input"
                      value={resetIdentifier}
                      onChange={(e) => setResetIdentifier(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password (Min 6 Characters) *</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showResetPass ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="Enter new password"
                        className="form-input"
                        value={resetNewPass}
                        onChange={(e) => setResetNewPass(e.target.value)}
                        style={{ paddingRight: 40 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPass(!showResetPass)}
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          padding: 0,
                        }}
                      >
                        {showResetPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password *</label>
                    <input
                      type={showResetPass ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Confirm new password"
                      className="form-input"
                      value={resetConfirmPass}
                      onChange={(e) => setResetConfirmPass(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="btn btn-primary"
                    style={{ width: "100%", justifyContent: "center", gap: 8, marginTop: 4 }}
                  >
                    <Key size={16} />
                    <span>{resetLoading ? "Updating Password..." : "Reset & Save Password"}</span>
                  </button>
                </form>
              )}

              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                <ShieldCheck size={14} color="#10b981" />
                <span>Encrypted Customer Identity & Security</span>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerProfileModal({
  user,
  onClose,
  onUpdateUser,
  onLogout,
}: {
  user: { id: string; name: string; phone: string; email: string; photo: string };
  onClose: () => void;
  onUpdateUser: (u: { id: string; name: string; phone: string; email: string; photo: string }) => void;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"profile" | "password" | "activity">("profile");
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email || "");
  const [photo, setPhoto] = useState(user.photo || "");
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [whatsappAlerts, setWhatsappAlerts] = useState(() => {
    try {
      return localStorage.getItem("passioncar_pref_wa") !== "false";
    } catch {
      return true;
    }
  });

  const [newCarsAlerts, setNewCarsAlerts] = useState(() => {
    try {
      return localStorage.getItem("passioncar_pref_cars") !== "false";
    } catch {
      return true;
    }
  });

  const updateProfile = useUpdateCustomerProfile();

  const [searchActivity, setSearchActivity] = useState("");
  const [activityFilter, setActivityFilter] = useState<"all" | "test_drive" | "service" | "inquiry">("all");

  const { data: activityData, isLoading: activityLoading } = useCustomerActivity({
    phone: user.phone,
    email: user.email,
  });

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }
    const compressed = await compressImageFile(file, 400, 0.85);
    if (compressed.image) {
      setPhoto(compressed.image);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/customer/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: email || phone || user.email || user.phone,
          newPassword,
          userId: user.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Password update failed.");
      }
      setPasswordMsg("Account password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Password update failed.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("passioncar_pref_wa", String(whatsappAlerts));
      localStorage.setItem("passioncar_pref_cars", String(newCarsAlerts));
    } catch (_) {}

    updateProfile.mutate(
      { id: user.id, name, phone, email, photo },
      {
        onSuccess: (data) => {
          onUpdateUser(data.customer);
          setSaved(true);
          setTimeout(() => setSaved(false), 2500);
        },
      }
    );
  };

  const combinedActivities = useMemo(() => {
    const list: Array<{
      id: string;
      kind: "test_drive" | "service" | "inquiry";
      title: string;
      details: string;
      status: string;
      dateStr: string | Date;
      token?: string;
      readByAdmin?: boolean;
      readAt?: string | Date | null;
      adminReply?: string | null;
      confirmedSlotTime?: string | null;
      slotConfirmed?: boolean;
    }> = [];

    (activityData?.serviceBookings || []).forEach((b) => {
      list.push({
        id: `srv_${b.id}`,
        kind: "service",
        title: `Service Token: #${b.token}`,
        details: `${b.servicePackage} · ${b.carDetails} (${b.timeSlot || ""})`,
        status: b.status,
        dateStr: b.date || b.createdAt,
        token: b.token,
      });
    });

    (activityData?.inquiries || []).forEach((i) => {
      const isTd = i.type === "test_drive";
      list.push({
        id: `inq_${i.id}`,
        kind: isTd ? "test_drive" : "inquiry",
        title: isTd ? "🚗 Test Drive Booking" : `${i.type.toUpperCase()} Inquiry`,
        details: i.message || "Customer request submitted to showroom team",
        status: i.status,
        dateStr: i.createdAt,
        readByAdmin: i.readByAdmin,
        readAt: i.readAt,
        adminReply: i.adminReply,
        confirmedSlotTime: i.confirmedSlotTime,
        slotConfirmed: i.slotConfirmed,
      });
    });

    return list.filter((item) => {
      if (activityFilter !== "all" && item.kind !== activityFilter) return false;
      if (searchActivity.trim()) {
        const q = searchActivity.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.details.toLowerCase().includes(q) ||
          (item.token && item.token.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [activityData, activityFilter, searchActivity]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ color: "var(--text-main)" }}>Customer Account Settings</h3>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {user.name} · {user.email || user.phone || "Google User"}
            </span>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: "14px 20px 0" }}>
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`auth-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            style={{ padding: "8px 8px", fontSize: 11, justifyContent: "center" }}
          >
            <span>Profile & Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("password")}
            className={`auth-tab-btn ${activeTab === "password" ? "active" : ""}`}
            style={{ padding: "8px 8px", fontSize: 11, justifyContent: "center" }}
          >
            <span>Password Reset</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("activity")}
            className={`auth-tab-btn ${activeTab === "activity" ? "active" : ""}`}
            style={{ padding: "8px 8px", fontSize: 11, justifyContent: "center" }}
          >
            <span>My Bookings</span>
          </button>
        </div>

        {activeTab === "profile" ? (
          <form onSubmit={handleSave} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            {saved && (
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid #10b981",
                  color: "#10b981",
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircle2 size={16} />
                <span>User settings and profile photo saved successfully!</span>
              </div>
            )}

            
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 18,
                flexWrap: "wrap",
              }}
            >
              <div style={{ position: "relative" }}>
                {photo ? (
                  <img
                    src={photo}
                    alt={name}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid var(--primary)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: "var(--primary)",
                      color: "#ffffff",
                      fontSize: 26,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {name ? name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", display: "block" }}>
                  Profile Photo
                </span>
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10, display: "block" }}>
                  Select an image directly from your photo gallery
                </span>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryUpload}
                  style={{ display: "none" }}
                />

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn btn-outline btn-sm"
                    style={{ gap: 6, fontSize: 12 }}
                  >
                    <Camera size={14} />
                    <span>Upload from Gallery</span>
                  </button>

                  {photo && (
                    <button
                      type="button"
                      onClick={() => setPhoto("")}
                      className="btn btn-glass btn-sm"
                      style={{ color: "#ef4444", fontSize: 12 }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                required
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Prasanth Kongara"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number (10 Digits - For WhatsApp Updates)</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                className="form-input"
                value={phone}
                onChange={(e) => setPhone(cleanMobileNumber(e.target.value))}
                placeholder="10-digit mobile number (e.g. 9849012345)"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Google Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gmail.com"
              />
            </div>

            
            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Notification Settings
              </span>

              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "var(--text-main)" }}>
                <input
                  type="checkbox"
                  checked={whatsappAlerts}
                  onChange={(e) => setWhatsappAlerts(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#10b981", cursor: "pointer" }}
                />
                <span>WhatsApp alerts for test drive confirmations & service slots</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "var(--text-main)" }}>
                <input
                  type="checkbox"
                  checked={newCarsAlerts}
                  onChange={(e) => setNewCarsAlerts(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#10b981", cursor: "pointer" }}
                />
                <span>Email alerts when new luxury cars arrive at the showroom</span>
              </label>
            </div>

            
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                background: "var(--bg-card)",
                borderRadius: 6,
                border: "1px solid var(--border)",
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={14} color="#10b981" />
                <span>Connected via Google OAuth</span>
              </div>
              <span>ID: {user.id}</span>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="btn btn-primary"
                style={{ flex: 1, justifyContent: "center" }}
              >
                <span>{updateProfile.isPending ? "Saving..." : "Save Settings"}</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="btn btn-outline"
                style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.3)" }}
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </form>
        ) : activeTab === "password" ? (
          <form onSubmit={handleResetPassword} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            {passwordMsg && (
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid #10b981",
                  color: "#10b981",
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircle2 size={16} />
                <span>{passwordMsg}</span>
              </div>
            )}

            {passwordError && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#fca5a5",
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {passwordError}
              </div>
            )}

            <div
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: 14,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.15)",
                  color: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Key size={18} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>
                  Account Password & Security
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Account Identifier: {email || phone || user.email || user.phone}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">New Password (Min 6 Characters) *</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter strong new password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password *</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center", gap: 8, marginTop: 4 }}
            >
              <Key size={15} />
              <span>{passwordLoading ? "Updating Password..." : "Update Password"}</span>
            </button>
          </form>
        ) : (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ position: "relative" }}>
              <Search
                size={15}
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
              />
              <input
                type="text"
                placeholder="Search my bookings by car, token, or service..."
                value={searchActivity}
                onChange={(e) => setSearchActivity(e.target.value)}
                className="form-input"
                style={{ width: "100%", paddingLeft: 36, fontSize: 13 }}
              />
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(
                [
                  { id: "all", label: "All" },
                  { id: "test_drive", label: "🚗 Test Drives" },
                  { id: "service", label: "🔧 Service Passes" },
                  { id: "inquiry", label: "Quotes & Inquiries" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivityFilter(tab.id)}
                  className={`btn btn-sm ${activityFilter === tab.id ? "btn-primary" : "btn-glass"}`}
                  style={{ fontSize: 11, padding: "4px 8px" }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activityLoading ? (
              <div style={{ textAlign: "center", padding: 30 }}><RefreshCw className="animate-spin" size={20} /></div>
            ) : combinedActivities.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid var(--border)" }}>
                <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
                  No bookings or inquiries found under your contact details yet.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 340, overflowY: "auto" }}>
                {combinedActivities.map((item) => {
                  const formatted = formatDateTime(item.dateStr);
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: 12,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)" }}>
                          {item.title}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {item.kind !== "service" && (
                            item.readByAdmin || item.readAt ? (
                              <span style={{ fontSize: 10, color: "var(--accent-green)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                                <CheckCircle2 size={11} color="var(--accent-green)" />
                                <span>Opened & Read</span>
                              </span>
                            ) : (
                              <span style={{ fontSize: 10, color: "var(--text-dim)" }}>
                                <span>Review Pending</span>
                              </span>
                            )
                          )}
                          <span className="badge badge-glass" style={{ fontSize: 10 }}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 8px", lineHeight: 1.4 }}>
                        {item.details}
                      </p>

                      
                      {item.adminReply && (
                        <div
                          style={{
                            background: "rgba(56, 189, 248, 0.08)",
                            border: "1px solid rgba(56, 189, 248, 0.25)",
                            borderRadius: 6,
                            padding: "8px 10px",
                            marginBottom: 10,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                            <strong style={{ fontSize: 11, color: "#38bdf8", display: "flex", alignItems: "center", gap: 4 }}>
                              <MessageSquare size={11} />
                              <span>Showroom Response</span>
                            </strong>
                            {item.slotConfirmed && item.confirmedSlotTime && (
                              <span className="badge badge-gold" style={{ fontSize: 10, padding: "1px 6px" }}>
                                Slot Confirmed: {item.confirmedSlotTime}
                              </span>
                            )}
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: "var(--text-main)", lineHeight: 1.4 }}>
                            {item.adminReply}
                          </p>
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderTop: "1px solid var(--border)",
                          paddingTop: 8,
                          fontSize: 11,
                          color: "var(--text-dim)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-main)", fontWeight: 600 }}>
                          <span>📅 {formatted.date}</span>
                          <span>⏰ {formatted.time}</span>
                        </div>
                        <a
                          href="https://wa.me/918885858380"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#34d399", textDecoration: "none", fontWeight: 700 }}
                        >
                          Showroom Chat →
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CustomerBookingsModal({
  initialPhone,
  customerUser,
  onClose,
}: {
  initialPhone?: string;
  customerUser?: { id: string; name: string; phone: string; email: string; photo: string } | null;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"all" | "service" | "test_drive" | "exchange_sell" | "inquiry">("all");
  const [phone, setPhone] = useState<string>(() => {
    if (initialPhone && initialPhone.trim()) return initialPhone.trim();
    if (customerUser?.phone && customerUser.phone.trim()) return customerUser.phone.trim();
    try {
      return localStorage.getItem("passioncar_last_phone") || "";
    } catch {
      return "";
    }
  });
  const [inputPhone, setInputPhone] = useState(phone);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: activityData, isLoading, refetch } = useCustomerActivity(
    { phone, email: customerUser?.email },
    Boolean(phone || customerUser?.email)
  );

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanMobileNumber(inputPhone);
    if (clean.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setPhone(clean);
    try {
      localStorage.setItem("passioncar_last_phone", clean);
    } catch {}
  };

  const combinedBookings = useMemo(() => {
    const list: Array<{
      id: string;
      kind: "service" | "test_drive" | "exchange_sell" | "inquiry";
      title: string;
      details: string;
      status: string;
      dateStr: string;
      token?: string;
      customerName: string;
      phone: string;
      adminReply?: string | null;
      confirmedSlotTime?: string | null;
      slotConfirmed?: boolean;
    }> = [];

    (activityData?.serviceBookings || []).forEach((b) => {
      list.push({
        id: `srv_${b.id}`,
        kind: "service",
        title: `🔧 Service Slot: #${b.token}`,
        details: `${b.servicePackage} · ${b.carDetails} (${b.timeSlot || ""})`,
        status: b.status || "confirmed",
        dateStr: b.date || (b as any).createdAt || "",
        token: b.token,
        customerName: b.customerName,
        phone: b.phone,
      });
    });

    ((activityData as any)?.customers || []).forEach((c: any) => {
      const isBought = c.transactionType === "bought_from_dealership";
      const isSold = c.transactionType === "sold_to_dealership";
      const title = isBought
        ? `🤝 Car Purchased: ${c.carModel}`
        : isSold
        ? `🚗 Car Sold to Us: ${c.carModel}`
        : `🏷️ Current Buyer: ${c.carModel}`;
      list.push({
        id: `cust_${c.id}`,
        kind: "exchange_sell",
        title,
        details: `${c.regNumber ? `Reg: ${c.regNumber} · ` : ""}${c.amountInr ? `Amount: ₹${c.amountInr.toLocaleString("en-IN")} · ` : ""}${c.notes || "Transaction recorded by dealership"}`,
        status: c.status || "completed",
        dateStr: c.date || "",
        customerName: c.name,
        phone: c.phone,
        token: c.serviceToken || undefined,
      });
    });

    (activityData?.inquiries || []).forEach((i) => {
      const isTd = i.type === "test_drive";
      const isEx = i.type === "exchange";
      const isSell = i.type === "sell";
      const isBuy = i.type === "buy";

      let kind: "service" | "test_drive" | "exchange_sell" | "inquiry" = "inquiry";
      let title = "📝 Showroom Inquiry";
      if (isTd) {
        kind = "test_drive";
        title = "🚗 Test Drive Slot Booking";
      } else if (isEx) {
        kind = "exchange_sell";
        title = "🔄 Car Exchange Slot";
      } else if (isSell) {
        kind = "exchange_sell";
        title = "💰 Sell Car Valuation Slot";
      } else if (isBuy) {
        kind = "inquiry";
        title = "🏷️ Purchase Quote Request";
      }

      list.push({
        id: `inq_${i.id}`,
        kind,
        title,
        details: i.message || "Customer request submitted to Passion Car team",
        status: i.status || "new",
        dateStr: (i.createdAt as any) || "",
        customerName: i.name,
        phone: i.phone,
        adminReply: i.adminReply,
        confirmedSlotTime: i.confirmedSlotTime,
        slotConfirmed: i.slotConfirmed,
      });
    });

    return list.filter((item) => {
      if (activeTab === "all") return true;
      return item.kind === activeTab;
    });
  }, [activityData, activeTab]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(239, 68, 68, 0.15)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Ticket size={20} />
            </div>
            <div>
              <h3 style={{ color: "var(--text-main)", margin: 0, fontSize: 18 }}>My Bookings & Tokens</h3>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Track service passes, test drives, exchange & sell slots
              </span>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {customerUser && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(30, 41, 59, 0.7) 100%)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderRadius: "var(--radius-md)",
                padding: "12px 16px",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {customerUser.photo ? (
                  <img
                    src={customerUser.photo}
                    alt={customerUser.name}
                    style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", border: "1px solid #10b981" }}
                  />
                ) : (
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#10b981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                    {customerUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{customerUser.name}</span>
                    <span className="badge badge-green" style={{ fontSize: 10, padding: "2px 6px" }}>Signed In</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    Account: {customerUser.email || customerUser.phone || "Active"}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="btn btn-glass btn-sm"
                  style={{ fontSize: 11, padding: "4px 8px" }}
                >
                  <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          )}

          {!phone && !customerUser ? (
            <form onSubmit={handleLookup} style={{ textAlign: "center", padding: "16px 8px" }}>
              <div style={{ width: 50, height: 50, borderRadius: "50%", background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: "var(--primary)" }}>
                <Phone size={24} />
              </div>
              <h4 style={{ color: "var(--text-main)", marginBottom: 6, fontSize: 16 }}>Lookup Your Booked Slots</h4>
              <p style={{ color: "var(--text-muted)", fontSize: 13, maxWidth: 420, margin: "0 auto 20px" }}>
                Enter your 10-digit mobile number used when booking service, test drive, exchange, or selling a car.
              </p>
              <div style={{ display: "flex", gap: 8, maxWidth: 360, margin: "0 auto" }}>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile number"
                  value={inputPhone}
                  onChange={(e) => setInputPhone(cleanMobileNumber(e.target.value))}
                  className="form-input"
                  style={{ flex: 1, textAlign: "center", fontSize: 15, letterSpacing: 1 }}
                  required
                />
                <button type="submit" className="btn btn-primary">
                  <span>Find Bookings</span>
                </button>
              </div>
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    window.location.hash = "#signin";
                  }}
                  className="btn btn-glass btn-sm"
                  style={{ fontSize: 12, gap: 6 }}
                >
                  <GoogleLogo size={14} />
                  <span>Sign in with Google to view account bookings</span>
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 14px", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Phone size={14} className="text-red-500" />
                  <span style={{ fontSize: 13, color: "var(--text-main)", fontWeight: 600 }}>
                    {phone ? `Bookings for: +91 ${phone}` : `Bookings for: ${customerUser?.email || "Connected Account"}`}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="btn btn-glass btn-sm"
                    title="Refresh Bookings"
                    style={{ fontSize: 11, padding: "4px 8px" }}
                  >
                    <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
                    <span>Refresh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhone("");
                      setInputPhone("");
                    }}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: 11, padding: "4px 8px" }}
                  >
                    Change Number
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {(
                  [
                    { id: "all", label: "All Bookings" },
                    { id: "service", label: "🔧 Service Passes" },
                    { id: "test_drive", label: "🚗 Test Drives" },
                    { id: "exchange_sell", label: "🔄 Exchange & Sell" },
                    { id: "inquiry", label: "🏷️ Quotes & Inquiries" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`btn btn-sm ${activeTab === tab.id ? "btn-primary" : "btn-glass"}`}
                    style={{ fontSize: 11, padding: "5px 10px" }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div style={{ textAlign: "center", padding: 36 }}>
                  <RefreshCw className="animate-spin" size={24} style={{ margin: "0 auto 8px" }} />
                  <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>Checking active tokens and slots...</p>
                </div>
              ) : combinedBookings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px 16px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                  <Ticket size={32} style={{ color: "var(--text-dim)", margin: "0 auto 10px" }} />
                  <h4 style={{ color: "var(--text-main)", marginBottom: 4, fontSize: 15 }}>No Bookings Found</h4>
                  <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
                    We could not find any active bookings under +91 {phone}.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "55vh", overflowY: "auto", paddingRight: 4 }}>
                  {combinedBookings.map((item) => {
                    const formatted = formatDateTime(item.dateStr);
                    const shareMsg = `*PASSION CAR OFFICIAL PASS*\n` +
                      `📌 *Booking:* ${item.title}\n` +
                      `👤 *Customer:* ${item.customerName}\n` +
                      `📞 *Phone:* ${item.phone}\n` +
                      `📝 *Details:* ${item.details}\n` +
                      `📅 *Date:* ${formatted.date || item.dateStr}\n` +
                      (item.confirmedSlotTime ? `⏰ *Confirmed Slot:* ${item.confirmedSlotTime}\n` : "") +
                      (item.adminReply ? `💬 *Advisor Note:* ${item.adminReply}\n` : "") +
                      `📍 Passion Car, Plot No 25, 100 Feet Rd, Kavuri Hills, Madhapur, Hyderabad\n` +
                      `Status: ${item.status.toUpperCase()}`;

                    const isConfirmed = item.status === "confirmed" || item.status === "completed";
                    const isService = item.kind === "service";

                    return (
                      <div
                        key={item.id}
                        style={{
                          background: "var(--bg-card)",
                          border: isService ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          padding: 16,
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                          <div>
                            <strong style={{ color: "var(--text-main)", fontSize: 15, display: "block" }}>
                              {item.title}
                            </strong>
                            <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                              {formatted.date} {formatted.time ? `· ${formatted.time}` : ""}
                            </span>
                          </div>
                          <span
                            className={`badge ${item.status === "postponed" ? "" : isConfirmed ? "badge-green" : item.status === "in_progress" ? "badge-gold" : "badge-red"}`}
                            style={{
                              textTransform: "capitalize",
                              fontSize: 11,
                              background: item.status === "postponed" ? "rgba(168, 85, 247, 0.15)" : undefined,
                              color: item.status === "postponed" ? "#c084fc" : undefined,
                              border: item.status === "postponed" ? "1px solid #a855f7" : undefined,
                            }}
                          >
                            {item.status === "postponed" ? "Postponed / Rescheduled" : item.status.replace("_", " ")}
                          </span>
                        </div>

                        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                          {item.details}
                        </p>

                        {item.adminReply && (
                          <div style={{ background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.25)", borderRadius: 6, padding: "8px 12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                              <strong style={{ fontSize: 11, color: "#38bdf8", display: "flex", alignItems: "center", gap: 4 }}>
                                <MessageSquare size={12} />
                                <span>Showroom Response</span>
                              </strong>
                              {item.slotConfirmed && item.confirmedSlotTime && (
                                <span className="badge badge-gold" style={{ fontSize: 10 }}>
                                  Slot Confirmed: {item.confirmedSlotTime}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 12, color: "var(--text-main)", margin: 0, lineHeight: 1.4 }}>
                              {item.adminReply}
                            </p>
                          </div>
                        )}

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 4 }}>
                          <a
                            href={buildWhatsAppShareUrl(shareMsg)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: 11, padding: "6px 12px" }}
                          >
                            <Share2 size={13} />
                            <span>Share on WhatsApp</span>
                          </a>
                          <a
                            href={buildWhatsAppShareUrl(shareMsg, "918885858380")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-glass btn-sm"
                            style={{ fontSize: 11, padding: "6px 12px" }}
                          >
                            <MessageSquare size={13} />
                            <span>Showroom WhatsApp</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.id, shareMsg)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: 11, padding: "6px 10px" }}
                          >
                            <Copy size={13} />
                            <span>{copiedId === item.id ? "Copied!" : "Copy"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CarCard({
  vehicle,
  onViewDetails,
  onInquire,
}: {
  vehicle: Vehicle;
  onViewDetails: () => void;
  onInquire: () => void;
}) {
  const isCity = /city/i.test(vehicle.model);
  const isJazz = /jazz/i.test(vehicle.model);

  const fallbackCarPhotos = isCity
    ? [
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
      ]
    : isJazz
    ? [
        "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
      ]
    : [
        "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
      ];

  const deliveryRegex = /\/images\/(reviews\/|hero-delivery)/i;
  const filtered = (vehicle.imageUrls || []).filter((u) => !deliveryRegex.test(u));
  const images = filtered.length > 0 ? filtered : fallbackCarPhotos;

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered || images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImgIdx((prev) => (prev + 1) % images.length);
    }, 1250);
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const principal = vehicle.priceInr * 0.8;
  const rateMonthly = 9.5 / 1200;
  const months = 60;
  const estEmi = Math.round(
    (principal * rateMonthly * Math.pow(1 + rateMonthly, months)) /
      (Math.pow(1 + rateMonthly, months) - 1)
  );

  return (
    <div
      className="car-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveImgIdx(0);
      }}
    >
      <div className="car-card-img-wrap" onClick={onViewDetails} style={{ cursor: "pointer" }}>
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`${vehicle.make} ${vehicle.model} - photo ${i + 1}`}
            className={`car-card-img-slide ${i === activeImgIdx ? "active" : ""}`}
            loading="lazy"
          />
        ))}

        {images.length > 1 && (
          <div className="car-card-img-counter">
            <Camera size={11} />
            <span>{activeImgIdx + 1} / {images.length}</span>
          </div>
        )}

        <div className="car-badges">
          <span className="car-badge-certified">
            <ShieldCheck size={12} />
            <span>150-Pt Inspected</span>
          </span>
          <span className="badge badge-red">{vehicle.year}</span>
        </div>
      </div>

      <div className="car-card-body">
        <h3 className="car-brand-model" onClick={onViewDetails} style={{ cursor: "pointer" }}>
          {vehicle.make} {vehicle.model}
        </h3>
        <p className="car-variant">{vehicle.variant || vehicle.bodyType}</p>

        <div className="car-specs-row">
          <div className="car-spec-pill" title="Fuel Type">
            <Fuel size={14} className="text-red-400" />
            <span>{vehicle.fuelType}</span>
          </div>

          <div className="car-spec-pill" title="Transmission">
            <Gauge size={14} className="text-blue-400" />
            <span>{vehicle.transmission}</span>
          </div>

          <div className="car-spec-pill" title="Kilometers Driven">
            <Clock size={14} className="text-amber-400" />
            <span>{formatNumber(vehicle.kilometers)} km</span>
          </div>
        </div>

        <div className="car-price-row">
          <div>
            <span className="car-price-inr">{formatInr(vehicle.priceInr)}</span>
            <div className="car-emi-est">EMI from ₹{formatNumber(estEmi)}/mo</div>
          </div>

          <span style={{ fontSize: 12, color: "var(--text-dim)" }}>{vehicle.city}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: "auto" }}>
          <button onClick={onViewDetails} className="btn btn-outline btn-sm">
            <Eye size={14} />
            <span>View Full Specs</span>
          </button>

          <button onClick={onInquire} className="btn btn-primary btn-sm">
            <MessageSquare size={14} />
            <span>Inquire</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function VehicleDetailModal({
  id,
  customerUser,
  onClose,
  onOpenBookings,
  onBookThisCar,
}: {
  id: number;
  customerUser?: { id: string; name: string; phone: string; email: string; photo: string } | null;
  onClose: () => void;
  onOpenBookings?: (phone: string) => void;
  onBookThisCar?: (title: string) => void;
}) {
  const { data: vehicle, isLoading } = useVehicle(id);
  const { data: settings } = useSiteSettings();
  const createInquiry = useCreateInquiry();
  const [activeTab, setActiveTab] = useState<"specs" | "emi" | "features">("specs");

  const [bookingActive, setBookingActive] = useState(false);
  const [bookingName, setBookingName] = useState(() => customerUser?.name || "");
  const [bookingPhone, setBookingPhone] = useState(() => customerUser?.phone || (typeof window !== "undefined" ? localStorage.getItem("passioncar_last_phone") || "" : ""));
  const [bookingEmail, setBookingEmail] = useState(() => customerUser?.email || "");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingAlertData, setBookingAlertData] = useState<{
    token: string;
    name: string;
    phone: string;
    email?: string;
    notes?: string;
    time: string;
  } | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  useEffect(() => {
    if (customerUser) {
      if (customerUser.name && !bookingName) setBookingName(customerUser.name);
      if (customerUser.phone && !bookingPhone) setBookingPhone(customerUser.phone);
      if (customerUser.email && !bookingEmail) setBookingEmail(customerUser.email);
    }
  }, [customerUser]);

  const [downPercent, setDownPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(9.5);
  const [tenureMonths, setTenureMonths] = useState(60);
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const touchStartX = useRef<number | null>(null);
  const zoomTouchStartX = useRef<number | null>(null);

  useEffect(() => {
    setSelectedImgIdx(0);
  }, [id]);

  useEffect(() => {
    setZoomScale(1);
  }, [selectedImgIdx]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && zoomModalOpen) {
        setZoomModalOpen(false);
        setZoomScale(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomModalOpen]);

  if (isLoading) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content" style={{ padding: 40, textAlign: "center", position: "relative", maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="modal-close-btn" type="button" style={{ position: "absolute", top: 14, right: 14 }}><X size={20} /></button>
          <RefreshCw className="animate-spin" size={32} style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-main)", fontWeight: 600 }}>Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content" style={{ padding: 40, textAlign: "center", position: "relative", maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="modal-close-btn" type="button" style={{ position: "absolute", top: 14, right: 14 }}><X size={20} /></button>
          <Info size={36} color="var(--primary)" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ color: "var(--text-main)", marginBottom: 8 }}>Vehicle Not Found</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
            This vehicle may have been sold or removed from the inventory.
          </p>
          <button onClick={onClose} className="btn btn-primary btn-sm">Close</button>
        </div>
      </div>
    );
  }

  const features = Array.isArray(vehicle.features) ? vehicle.features : [];
  const price = vehicle.priceInr || 0;
  const downPaymentAmt = Math.round(price * (downPercent / 100));
  const loanAmount = price - downPaymentAmt;
  const r = interestRate / 1200;
  const emi =
    r > 0 && tenureMonths > 0
      ? Math.round((loanAmount * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1))
      : Math.round(loanAmount / Math.max(tenureMonths, 1));
  const totalPayable = emi * tenureMonths;
  const totalInterest = Math.max(0, totalPayable - loanAmount);

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.variant}`;

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = cleanMobileNumber(bookingPhone);
    if (!bookingName.trim()) {
      alert("Please enter your name.");
      return;
    }
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    const token = `PCB-BOOK-${vehicle.id}-${Date.now().toString().slice(-4)}`;
    const fullMsg = `[OFFICIAL VEHICLE BOOKING] Vehicle: ${title} | Price: ${formatInr(price)} | Booking ID: ${token}${bookingNotes.trim() ? ` | Notes: ${bookingNotes.trim()}` : ""}`;

    createInquiry.mutate(
      {
        type: "buy",
        name: bookingName.trim(),
        phone: cleanPhone,
        email: bookingEmail.trim() || undefined,
        message: fullMsg,
        vehicleId: vehicle.id,
      },
      {
        onSuccess: () => {
          try {
            localStorage.setItem("passioncar_last_phone", cleanPhone);
          } catch {}

          setBookingAlertData({
            token,
            name: bookingName.trim(),
            phone: cleanPhone,
            email: bookingEmail.trim() || undefined,
            notes: bookingNotes.trim(),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });
        },
        onError: (err: any) => {
          alert(err?.message || "Failed to submit booking. Please try again or WhatsApp us at +91 88858 58380.");
        },
      }
    );
  };

  const isCity = /city/i.test(vehicle.model);
  const isJazz = /jazz/i.test(vehicle.model);

  const fallbackCarPhotos = isCity
    ? [
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
      ]
    : isJazz
    ? [
        "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
      ]
    : [
        "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80",
      ];

  const deliveryRegex = /\/images\/(reviews\/|hero-delivery)/i;
  const filteredCarImages = (vehicle.imageUrls || []).filter((u) => !deliveryRegex.test(u));
  const carImages = filteredCarImages.length > 0 ? filteredCarImages : fallbackCarPhotos;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="badge badge-red" style={{ marginBottom: 4 }}>
              <span>{vehicle.year} · {vehicle.fuelType} · {vehicle.transmission}</span>
            </div>
            <h2 style={{ fontSize: 22, color: "var(--text-main)" }}>{title}</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: "clamp(16px, 4vw, 28px)" }}>
          
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                height: "clamp(260px, 46vw, 420px)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                background: "#05070a",
                position: "relative",
                cursor: "zoom-in",
                border: "1px solid var(--border)",
                userSelect: "none",
              }}
              onClick={() => setZoomModalOpen(true)}
              onTouchStart={(e) => {
                touchStartX.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const diff = touchStartX.current - e.changedTouches[0].clientX;
                touchStartX.current = null;
                if (diff > 40) {
                  setSelectedImgIdx((prev) => (prev + 1) % carImages.length);
                } else if (diff < -40) {
                  setSelectedImgIdx((prev) => (prev - 1 + carImages.length) % carImages.length);
                }
              }}
            >
              <img
                src={carImages[selectedImgIdx] || carImages[0]}
                alt={title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />

              {carImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImgIdx((prev) => (prev - 1 + carImages.length) % carImages.length);
                    }}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "rgba(0, 0, 0, 0.65)",
                      color: "#ffffff",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      zIndex: 3,
                      backdropFilter: "blur(4px)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                    aria-label="Previous car photo"
                  >
                    <ChevronLeft size={22} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImgIdx((prev) => (prev + 1) % carImages.length);
                    }}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "rgba(0, 0, 0, 0.65)",
                      color: "#ffffff",
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      zIndex: 3,
                      backdropFilter: "blur(4px)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                    aria-label="Next car photo"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}

              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  background: "rgba(0, 0, 0, 0.72)",
                  color: "#ffffff",
                  padding: "5px 12px",
                  borderRadius: "var(--radius-full)",
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                  zIndex: 2,
                }}
              >
                <Maximize2 size={13} />
                <span>Click photo to zoom</span>
              </div>

              {carImages.length > 1 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 12,
                    right: 12,
                    background: "rgba(0, 0, 0, 0.72)",
                    color: "#ffffff",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-full)",
                    fontSize: 11,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    backdropFilter: "blur(6px)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    zIndex: 2,
                  }}
                >
                  <Camera size={12} />
                  <span>{selectedImgIdx + 1} / {carImages.length}</span>
                </div>
              )}
            </div>

            {carImages.length > 1 && (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  overflowX: "auto",
                  padding: "10px 2px",
                  marginTop: 8,
                  scrollbarWidth: "none",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {carImages.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImgIdx(i)}
                    style={{
                      flexShrink: 0,
                      width: 88,
                      height: 60,
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                      cursor: "pointer",
                      border: selectedImgIdx === i ? "2px solid var(--primary)" : "1px solid var(--border)",
                      padding: 0,
                      background: "#000",
                      opacity: selectedImgIdx === i ? 1 : 0.65,
                      transition: "all 0.15s ease",
                      transform: selectedImgIdx === i ? "scale(1.03)" : "none",
                    }}
                    title={`View angle ${i + 1}`}
                  >
                    <img
                      src={url}
                      alt={`${title} thumbnail ${i + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          
          <div
            className="car-detail-price-bar"
            style={{
              background: "var(--bg-card)",
              borderRadius: "var(--radius-sm)",
              padding: "18px 24px",
              marginBottom: 24,
              border: "1px solid var(--border)",
            }}
          >
            <div>
              <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase" }}>Price (Fixed)</span>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-main)" }}>{formatInr(price)}</div>
            </div>

            <div className="car-detail-ctas" style={{ display: "flex", gap: 12 }}>
              <a
                href={`https://wa.me/${(settings?.whatsapp || "+918885858380").replace(/\D/g, "")}?text=Hello%20Passion%20Car,%20I%20am%20interested%20in%20the%20${encodeURIComponent(title)}%20priced%20at%20${formatInr(price)}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
              >
                <MessageSquare size={16} />
                <span>WhatsApp Query</span>
              </a>

              <button
                onClick={() => {
                  setBookingActive(true);
                  if (onBookThisCar) onBookThisCar(title);
                }}
                className="btn btn-primary"
              >
                <span>Book This Vehicle</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          
          <div
            className="scrollable-touch"
            style={{
              display: "flex",
              gap: 10,
              borderBottom: "1px solid var(--border)",
              paddingBottom: 12,
              marginBottom: 24,
              whiteSpace: "nowrap",
            }}
          >
            <button
              onClick={() => setActiveTab("specs")}
              className={`btn btn-sm ${activeTab === "specs" ? "btn-primary" : "btn-glass"}`}
            >
              <Info size={14} />
              <span>Technical Specs</span>
            </button>

            <button
              onClick={() => setActiveTab("emi")}
              className={`btn btn-sm ${activeTab === "emi" ? "btn-primary" : "btn-glass"}`}
            >
              <Calculator size={14} />
              <span>Interactive EMI Calculator</span>
            </button>

            <button
              onClick={() => setActiveTab("features")}
              className={`btn btn-sm ${activeTab === "features" ? "btn-primary" : "btn-glass"}`}
            >
              <ShieldCheck size={14} />
              <span>Certified Features ({features.length})</span>
            </button>
          </div>

          
          {activeTab === "specs" && (
            <div>
              <p style={{ color: "var(--text-muted)", marginBottom: 20, lineHeight: 1.6 }}>
                {vehicle.description}
              </p>

              <div className="grid-3col-responsive">
                <SpecItem label="Engine Type" value={vehicle.engineType || "Naturally Aspirated / Turbocharged"} />
                <SpecItem label="Engine Capacity" value={vehicle.engineCapacityCc ? `${vehicle.engineCapacityCc} cc` : "N/A"} />
                <SpecItem label="Power & Torque" value={vehicle.powerBhp ? `${vehicle.powerBhp} BHP / ${vehicle.torqueNm || 0} Nm` : "Factory Tuned"} />

                <SpecItem label="Length × Width × Height" value={vehicle.lengthMm ? `${vehicle.lengthMm} × ${vehicle.widthMm || "-"} × ${vehicle.heightMm || "-"} mm` : "Standard Dimensions"} />
                <SpecItem label="Wheelbase" value={vehicle.wheelbaseMm ? `${vehicle.wheelbaseMm} mm` : "N/A"} />
                <SpecItem label="Ground Clearance" value={vehicle.groundClearanceMm ? `${vehicle.groundClearanceMm} mm` : "Standard Clearance"} />

                <SpecItem label="Boot Space" value={vehicle.bootSpaceLitres ? `${vehicle.bootSpaceLitres} Litres` : "Ample Space"} />
                <SpecItem label="Seating Capacity" value={`${vehicle.seatingCapacity || 5} Seater`} />
                <SpecItem label="Fuel Efficiency" value={vehicle.fuelEfficiency || "Standard Mileage"} />

                <SpecItem label="Kilometers Driven" value={`${formatNumber(vehicle.kilometers)} km`} />
                <SpecItem label="Ownership" value={vehicle.owners ? `${vehicle.owners} Owner(s)` : "Verified Single"} />
                <SpecItem label="RTO & Registration" value={`Hyderabad (${vehicle.city})`} />
              </div>
            </div>
          )}

          
          {activeTab === "emi" && (
            <div className="grid-2col-responsive">
              <div>
                <h4 style={{ color: "var(--text-main)", marginBottom: 20 }}>Customize Loan Parameters</h4>

                
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span className="form-label">Down Payment</span>
                    <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                      {downPercent}% ({formatInr(downPaymentAmt)})
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    step={5}
                    value={downPercent}
                    onChange={(e) => setDownPercent(Number(e.target.value))}
                  />
                </div>

                
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span className="form-label">Interest Rate (p.a.)</span>
                    <span style={{ color: "var(--accent-gold)", fontWeight: 700 }}>{interestRate}%</span>
                  </div>
                  <input
                    type="range"
                    min={7}
                    max={16}
                    step={0.25}
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                  />
                </div>

                
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span className="form-label">Loan Tenure</span>
                    <span style={{ color: "var(--accent-blue)", fontWeight: 700 }}>
                      {tenureMonths} Months ({tenureMonths / 12} Years)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={12}
                    max={84}
                    step={12}
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(Number(e.target.value))}
                  />
                </div>
              </div>

              
              <div
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase" }}>Estimated Monthly EMI</span>
                <div style={{ fontSize: 36, fontWeight: 800, color: "var(--primary)", margin: "8px 0 20px" }}>
                  ₹{formatNumber(emi)}
                  <span style={{ fontSize: 16, color: "var(--text-dim)", fontWeight: 500 }}> / month</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)" }}>Loan Principal:</span>
                    <strong style={{ color: "var(--text-main)" }}>{formatInr(loanAmount)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)" }}>Total Interest Payable:</span>
                    <strong style={{ color: "var(--accent-gold)" }}>{formatInr(totalInterest)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text-muted)" }}>Total Amount Payable:</span>
                    <strong style={{ color: "var(--text-main)" }}>{formatInr(totalPayable)}</strong>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setBookingActive(true);
                    if (onBookThisCar) onBookThisCar(title);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 20 }}
                >
                  <span>Apply for Finance with Passion Car</span>
                </button>
              </div>
            </div>
          )}

          
          {activeTab === "features" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {features.map((feat, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span style={{ fontSize: 13, color: "var(--text-main)" }}>{feat}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {zoomModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100000,
            background: "rgba(0, 0, 0, 0.96)",
            display: "flex",
            flexDirection: "column",
            backdropFilter: "blur(8px)",
            userSelect: "none",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setZoomModalOpen(false);
              setZoomScale(1);
            }
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              background: "rgba(15, 23, 42, 0.85)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#ffffff",
              gap: 12,
              flexWrap: "wrap",
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{title}</span>
              <span
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  padding: "3px 8px",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {selectedImgIdx + 1} / {carImages.length}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.max(1, +(s - 0.5).toFixed(1)))}
                className="btn btn-glass btn-sm"
                style={{ color: "#ffffff", borderColor: "rgba(255, 255, 255, 0.25)" }}
                title="Zoom Out"
                disabled={zoomScale <= 1}
              >
                <ZoomOut size={16} />
              </button>

              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="btn btn-glass btn-sm"
                style={{ color: "#ffffff", borderColor: "rgba(255, 255, 255, 0.25)", minWidth: 62 }}
                title="Reset Zoom (100%)"
              >
                {Math.round(zoomScale * 100)}%
              </button>

              <button
                type="button"
                onClick={() => setZoomScale((s) => Math.min(4, +(s + 0.5).toFixed(1)))}
                className="btn btn-glass btn-sm"
                style={{ color: "#ffffff", borderColor: "rgba(255, 255, 255, 0.25)" }}
                title="Zoom In"
                disabled={zoomScale >= 4}
              >
                <ZoomIn size={16} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setZoomModalOpen(false);
                  setZoomScale(1);
                }}
                className="btn btn-primary btn-sm"
                style={{ marginLeft: 8 }}
                title="Close Zoom Viewer (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              padding: "16px",
            }}
            onTouchStart={(e) => {
              zoomTouchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (zoomTouchStartX.current === null || zoomScale > 1) return;
              const diff = zoomTouchStartX.current - e.changedTouches[0].clientX;
              zoomTouchStartX.current = null;
              if (diff > 40) {
                setSelectedImgIdx((prev) => (prev + 1) % carImages.length);
              } else if (diff < -40) {
                setSelectedImgIdx((prev) => (prev - 1 + carImages.length) % carImages.length);
              }
            }}
          >
            {carImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedImgIdx((prev) => (prev - 1 + carImages.length) % carImages.length)}
                  style={{
                    position: "absolute",
                    left: 18,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(0, 0, 0, 0.7)",
                    color: "#ffffff",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 10,
                    backdropFilter: "blur(6px)",
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={28} />
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedImgIdx((prev) => (prev + 1) % carImages.length)}
                  style={{
                    position: "absolute",
                    right: 18,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "rgba(0, 0, 0, 0.7)",
                    color: "#ffffff",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 10,
                    backdropFilter: "blur(6px)",
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: zoomScale > 1 ? "auto" : "hidden",
              }}
            >
              <img
                src={carImages[selectedImgIdx] || carImages[0]}
                alt={title}
                onClick={() => setZoomScale((s) => (s > 1 ? 1 : 2))}
                style={{
                  maxWidth: zoomScale > 1 ? "none" : "94vw",
                  maxHeight: zoomScale > 1 ? "none" : "80vh",
                  transform: `scale(${zoomScale})`,
                  transformOrigin: "center center",
                  transition: "transform 0.2s ease-out",
                  cursor: zoomScale > 1 ? "zoom-out" : "zoom-in",
                  objectFit: "contain",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                }}
                title="Click photo to toggle 100% / 200% zoom"
              />
            </div>
          </div>

          {carImages.length > 1 && (
            <div
              style={{
                padding: "12px 20px",
                background: "rgba(10, 15, 25, 0.85)",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                display: "flex",
                justifyContent: "center",
                gap: 10,
                overflowX: "auto",
                scrollbarWidth: "none",
                WebkitOverflowScrolling: "touch",
                zIndex: 10,
              }}
            >
              {carImages.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImgIdx(i)}
                  style={{
                    flexShrink: 0,
                    width: 64,
                    height: 48,
                    borderRadius: 4,
                    overflow: "hidden",
                    border: selectedImgIdx === i ? "2px solid var(--primary)" : "1px solid rgba(255,255,255,0.2)",
                    padding: 0,
                    background: "#000",
                    cursor: "pointer",
                    opacity: selectedImgIdx === i ? 1 : 0.5,
                    transition: "opacity 0.2s",
                  }}
                >
                  <img
                    src={url}
                    alt={`Thumb ${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {bookingActive && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(6px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(12px, 3vw, 24px)",
          }}
          onClick={() => {
            if (!createInquiry.isPending) {
              setBookingActive(false);
              setBookingAlertData(null);
            }
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: 540,
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              position: "relative",
              border: "1px solid var(--border)",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <div className="badge badge-red" style={{ marginBottom: 4 }}>
                  <span>Verified Dealership Booking</span>
                </div>
                <h3 style={{ fontSize: 20, color: "var(--text-main)", margin: 0 }}>
                  {bookingAlertData ? "Booking Confirmed" : "Book This Vehicle"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setBookingActive(false);
                  setBookingAlertData(null);
                }}
                className="modal-close-btn"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "clamp(16px, 4vw, 28px)" }}>
              {bookingAlertData ? (
                <div>
                  <div
                    style={{
                      background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)",
                      border: "1px solid rgba(16, 185, 129, 0.4)",
                      borderRadius: "var(--radius-md)",
                      padding: "20px",
                      marginBottom: 20,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "#10b981",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 14px",
                        boxShadow: "0 8px 20px rgba(16, 185, 129, 0.4)",
                      }}
                    >
                      <Check size={32} />
                    </div>
                    <h3 style={{ color: "var(--text-main)", fontSize: 20, marginBottom: 6 }}>
                      Vehicle Booking Registered!
                    </h3>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        background: "rgba(16, 185, 129, 0.2)",
                        color: "#10b981",
                        padding: "6px 14px",
                        borderRadius: "var(--radius-full)",
                        fontSize: 13,
                        fontWeight: 700,
                        marginBottom: 10,
                      }}
                    >
                      <Smartphone size={15} />
                      <span>Alert Submitted to Dealership Mobile: +91 88858 58380</span>
                    </div>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                      Thank you, <strong style={{ color: "var(--text-main)" }}>{bookingAlertData.name}</strong>. All details have been submitted to mobile number <strong style={{ color: "var(--text-main)" }}>+91 {bookingAlertData.phone}</strong> and Dealership Alert Desk at <strong style={{ color: "var(--text-main)" }}>+91 88858 58380</strong>.
                    </p>
                  </div>

                  <div
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      padding: 16,
                      marginBottom: 22,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Booking Reference ID</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <code style={{ color: "var(--primary)", fontWeight: 700, fontSize: 13, background: "rgba(239, 68, 68, 0.1)", padding: "2px 8px", borderRadius: 4 }}>
                          {bookingAlertData.token}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== "undefined" && navigator.clipboard) {
                              navigator.clipboard.writeText(bookingAlertData.token);
                              setTokenCopied(true);
                              setTimeout(() => setTokenCopied(false), 2000);
                            }
                          }}
                          className="btn btn-glass btn-sm"
                          style={{ padding: "3px 8px", fontSize: 11 }}
                          title="Copy Booking ID"
                        >
                          {tokenCopied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                          <span>{tokenCopied ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "var(--text-muted)" }}>Vehicle</span>
                      <strong style={{ color: "var(--text-main)" }}>{title}</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "var(--text-muted)" }}>Fixed Price</span>
                      <strong style={{ color: "var(--text-main)" }}>{formatInr(price)}</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "var(--text-muted)" }}>Customer Mobile</span>
                      <strong style={{ color: "var(--text-main)" }}>+91 {bookingAlertData.phone}</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "var(--text-muted)" }}>Showroom Alert Mobile</span>
                      <strong style={{ color: "#10b981" }}>+91 88858 58380</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const waText = `*PASSION CAR OFFICIAL BOOKING ALERT*\n` +
                          `🎫 *Booking ID:* ${bookingAlertData.token}\n` +
                          `🚗 *Vehicle:* ${title}\n` +
                          `💰 *Price:* ${formatInr(price)}\n` +
                          `👤 *Customer Name:* ${bookingAlertData.name}\n` +
                          `📞 *Customer Mobile:* +91 ${bookingAlertData.phone}\n` +
                          (bookingAlertData.notes ? `📝 *Notes:* ${bookingAlertData.notes}\n` : "") +
                          `📍 *Showroom:* Passion Car, Madhapur, Hyderabad\n` +
                          `📞 *Dealership Mobile:* +91 88858 58380\n` +
                          `✅ *Status:* Vehicle Booking Alert Submitted!`;
                        safeOpenWhatsApp(waText, "918885858380");
                      }}
                      className="btn"
                      style={{
                        background: "#25d366",
                        color: "#ffffff",
                        fontWeight: 700,
                        justifyContent: "center",
                        padding: "12px 20px",
                        boxShadow: "0 6px 18px rgba(37, 211, 102, 0.4)",
                      }}
                    >
                      <MessageSquare size={18} fill="#ffffff" color="#ffffff" />
                      <span>Send Booking Alert on WhatsApp to +91 88858 58380</span>
                    </button>

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setBookingActive(false);
                          setBookingAlertData(null);
                          onClose();
                          if (onOpenBookings) {
                            onOpenBookings(bookingAlertData.phone);
                          } else {
                            window.location.hash = "#bookings";
                          }
                        }}
                        className="btn btn-primary"
                        style={{ flex: 1, minWidth: 150, justifyContent: "center" }}
                      >
                        <Ticket size={16} />
                        <span>View in My Bookings</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBookingActive(false);
                          setBookingAlertData(null);
                        }}
                        className="btn btn-glass"
                        style={{ flex: 1, minWidth: 100, justifyContent: "center" }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      padding: 12,
                      marginBottom: 18,
                    }}
                  >
                    <div
                      style={{
                        width: 72,
                        height: 52,
                        borderRadius: 6,
                        overflow: "hidden",
                        background: "#0b0f17",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={carImages[0]}
                        alt={title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {title}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--primary)", fontWeight: 700 }}>
                        {formatInr(price)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: "var(--radius-sm)",
                      padding: "10px 14px",
                      marginBottom: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Smartphone size={18} className="text-red-500" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
                      Booking alert will be registered in your account and submitted directly to Dealership Mobile <strong style={{ color: "var(--text-main)" }}>+91 88858 58380</strong>.
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label" style={{ fontSize: 13 }}>Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter your full name"
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label" style={{ fontSize: 13 }}>Mobile Number (10 Digits) *</label>
                    <div style={{ position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--text-muted)",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        +91
                      </span>
                      <input
                        type="tel"
                        className="form-input"
                        style={{ paddingLeft: 48 }}
                        placeholder="88858 58380"
                        maxLength={10}
                        value={bookingPhone}
                        onChange={(e) => setBookingPhone(cleanMobileNumber(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label" style={{ fontSize: 13 }}>Email Address (Optional)</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="you@example.com"
                      value={bookingEmail}
                      onChange={(e) => setBookingEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 20 }}>
                    <label className="form-label" style={{ fontSize: 13 }}>Preferred Visit Time / Booking Notes (Optional)</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="e.g. Schedule test drive on Saturday, request doorstep delivery, or apply for finance"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={createInquiry.isPending}
                    className="btn btn-primary"
                    style={{ width: "100%", justifyContent: "center", padding: "12px 20px" }}
                  >
                    {createInquiry.isPending ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Submitting Booking Alert...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Submit Booking to Dealership (+91 88858 58380)</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        padding: "12px 14px",
      }}
    >
      <span style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase" }}>{label}</span>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-main)", marginTop: 4 }}>{value}</div>
    </div>
  );
}

function SellCarQuickForm({
  onSuccess,
  onOpenBookings,
}: {
  onSuccess?: () => void;
  onOpenBookings?: (phone: string) => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    brand: "",
    model: "",
    year: "2020",
    fuel: "Petrol",
    km: "",
    expectedPrice: "",
    name: "",
    phone: "",
  });
  const createInquiry = useCreateInquiry();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.brand) {
      alert("Please enter car brand, your name, and phone number.");
      return;
    }
    if (form.phone.length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    const message = `Sell Inquiry: ${form.year} ${form.brand} ${form.model} (${form.fuel}), Driven: ${form.km || "N/A"} km, Expected: ₹${form.expectedPrice || "Negotiable"}`;
    createInquiry.mutate(
      {
        type: "sell",
        name: form.name,
        phone: form.phone,
        message,
      },
      {
        onSuccess: () => {
          try {
            localStorage.setItem("passioncar_last_phone", form.phone);
          } catch {}
          setSubmitted(true);
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  if (submitted) {
    return (
      <div
        style={{
          background: "rgba(34, 197, 94, 0.08)",
          border: "1px solid rgba(34, 197, 94, 0.3)",
          borderRadius: "var(--radius-md)",
          padding: 24,
          textAlign: "center",
        }}
      >
        <CheckCircle2 size={36} className="text-emerald-500" style={{ margin: "0 auto 10px" }} />
        <h4 style={{ color: "var(--text-main)", fontSize: 18, marginBottom: 6 }}>Valuation Request Registered!</h4>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 20 }}>
          Your car valuation slot for {form.year} {form.brand} {form.model} is saved under your account for +91 {form.phone}.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => {
              if (onOpenBookings) onOpenBookings(form.phone);
              else window.location.hash = "#bookings";
            }}
            className="btn btn-primary"
            style={{ flex: 1, minWidth: 150, justifyContent: "center" }}
          >
            <Ticket size={15} />
            <span>View in My Bookings</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const text = `*PASSION CAR SELL CAR VALUATION REQUEST*\n👤 *Name:* ${form.name}\n📞 *Phone:* ${form.phone}\n🚗 *Car:* ${form.year} ${form.brand} ${form.model} (${form.fuel})\n🛣️ *KM Driven:* ${form.km || "N/A"}\n💰 *Expected Price:* ₹${form.expectedPrice || "Negotiable"}\nStatus: Submitted to Dealership`;
              safeOpenWhatsApp(text);
            }}
            className="btn btn-outline"
            style={{ flex: 1, minWidth: 150, justifyContent: "center" }}
          >
            <Share2 size={15} />
            <span>Share on WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setForm({ brand: "", model: "", year: "2020", fuel: "Petrol", km: "", expectedPrice: "", name: "", phone: "" });
            }}
            className="btn btn-glass"
            style={{ flex: 1, minWidth: 100, justifyContent: "center" }}
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="form-grid-2col" style={{ gap: 12 }}>
      <div className="form-group">
        <label className="form-label">Car Brand (Make) *</label>
        <input
          type="text"
          placeholder="e.g. Volkswagen, Honda, Hyundai"
          className="form-input"
          value={form.brand}
          onChange={(e) => setForm({ ...form, brand: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Model *</label>
        <input
          type="text"
          placeholder="e.g. Polo, City, Creta"
          className="form-input"
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Year</label>
        <input
          type="number"
          placeholder="2020"
          className="form-input"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Fuel Type</label>
        <select
          className="form-select"
          value={form.fuel}
          onChange={(e) => setForm({ ...form, fuel: e.target.value })}
        >
          <option value="Petrol">Petrol</option>
          <option value="Diesel">Diesel</option>
          <option value="EV">EV (Electric)</option>
          <option value="CNG">CNG</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Your Full Name *</label>
        <input
          type="text"
          placeholder="Full Name"
          className="form-input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Mobile Number (10 Digits) *</label>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          pattern="[0-9]{10}"
          placeholder="10-digit mobile number (e.g. 9849012345)"
          className="form-input"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: cleanMobileNumber(e.target.value) })}
          required
        />
      </div>

      <div style={{ gridColumn: "span 2", marginTop: 8 }}>
        <button
          type="submit"
          disabled={createInquiry.isPending}
          className="btn btn-primary"
          style={{ width: "100%" }}
        >
          {createInquiry.isPending ? "Submitting..." : "Get Instant Quote & Valuation"}
        </button>
      </div>
    </form>
  );
}

function ServiceBookingModal({
  onClose,
  initialPackage,
  customerUser,
  onOpenBookings,
}: {
  onClose: () => void;
  initialPackage?: string;
  customerUser?: { id: string; name: string; phone: string; email: string; photo: string } | null;
  onOpenBookings?: (phone: string) => void;
}) {
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const quickDates = useMemo(() => {
    const list: Array<{ label: string; date: string }> = [];
    const d0 = new Date();
    list.push({ label: "Today", date: d0.toISOString().split("T")[0] });
    const d1 = new Date();
    d1.setDate(d1.getDate() + 1);
    list.push({ label: "Tomorrow", date: d1.toISOString().split("T")[0] });
    const d2 = new Date();
    d2.setDate(d2.getDate() + 2);
    list.push({ label: "+2 Days", date: d2.toISOString().split("T")[0] });
    const d3 = new Date();
    d3.setDate(d3.getDate() + 3);
    list.push({ label: "+3 Days", date: d3.toISOString().split("T")[0] });
    return list;
  }, []);
  const timeSlots = [
    "09:30 AM - 11:00 AM (Morning Slot)",
    "11:00 AM - 12:30 PM (Mid-Day Slot)",
    "02:00 PM - 03:30 PM (Afternoon Slot)",
    "03:30 PM - 05:00 PM (Late Afternoon Slot)",
    "05:00 PM - 06:30 PM (Evening Slot)",
  ];
  const [form, setForm] = useState(() => ({
    name: customerUser?.name || "",
    phone: customerUser?.phone || (typeof window !== "undefined" ? localStorage.getItem("passioncar_last_phone") || "" : ""),
    email: customerUser?.email || "",
    carDetails: "",
    servicePackage: initialPackage || "Periodic Comprehensive Service",
    date: todayStr,
    timeSlot: "09:30 AM - 11:00 AM (Morning Slot)",
    notes: "",
  }));

  useEffect(() => {
    if (customerUser) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || customerUser.name || "",
        phone: prev.phone || customerUser.phone || "",
        email: prev.email || customerUser.email || "",
      }));
    }
  }, [customerUser]);

  const [bookingPass, setBookingPass] = useState<{
    token: string;
    booking: ServiceBooking;
  } | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const bookServiceSlot = useBookServiceSlot();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.carDetails.trim() || !form.date || !form.timeSlot) {
      setBookingError("Please provide your name, contact number, vehicle details, date, and preferred time slot.");
      return;
    }
    if (form.phone.trim().length < 10) {
      setBookingError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setBookingError(null);

    bookServiceSlot.mutate(
      {
        customerName: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        carDetails: form.carDetails.trim(),
        servicePackage: form.servicePackage,
        date: form.date,
        timeSlot: form.timeSlot,
        notes: form.notes.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setBookingError(null);
          setBookingPass({
            token: data.token,
            booking: data.booking,
          });
          try {
            localStorage.setItem("passioncar_last_phone", data.booking.phone);
          } catch {}
        },
        onError: (err: any) => {
          setBookingError(err?.message || "Could not book service slot. Please verify your phone number and details.");
        },
      }
    );
  };

  const handleShareWhatsApp = () => {
    if (!bookingPass) return;
    const msg =
      `*PASSION CAR OFFICIAL SERVICE PASS*\n` +
      `🎫 *Token ID:* ${bookingPass.token}\n` +
      `👤 *Customer:* ${bookingPass.booking.customerName}\n` +
      `📞 *Phone:* ${bookingPass.booking.phone}\n` +
      `🚗 *Vehicle:* ${bookingPass.booking.carDetails}\n` +
      `🔧 *Service:* ${bookingPass.booking.servicePackage}\n` +
      `📅 *Date:* ${bookingPass.booking.date}\n` +
      `⏰ *Time Slot:* ${bookingPass.booking.timeSlot}\n` +
      `📍 *Location:* Passion Car, Plot No 25, 100 Feet Rd, Kavuri Hills, Madhapur, Hyderabad\n` +
      `Status: Confirmed Slot`;
    safeOpenWhatsApp(msg);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Award size={20} className="text-red-500" />
            <h3 style={{ color: "var(--text-main)", margin: 0 }}>Book Certified Service Slot</h3>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {bookingPass ? (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderRadius: "var(--radius-lg)",
                padding: 24,
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <span className="badge badge-gold" style={{ marginBottom: 6, display: "inline-flex" }}>
                    <Ticket size={12} />
                    <span>PASSION CAR OFFICIAL PASS</span>
                  </span>
                  <h3 style={{ fontSize: 20, color: "var(--text-main)", marginTop: 4 }}>Service Slot Confirmed</h3>
                </div>
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.2)",
                    border: "1px solid #10b981",
                    borderRadius: 8,
                    padding: "6px 12px",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: 10, color: "#a7f3d0", display: "block", textTransform: "uppercase" }}>Token ID</span>
                  <strong style={{ fontSize: 16, color: "#34d399", fontFamily: "var(--font-mono)" }}>
                    #{bookingPass.token}
                  </strong>
                </div>
              </div>

              <div
                className="form-grid-2col"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: 14,
                  marginBottom: 16,
                  fontSize: 12,
                }}
              >
                <div>
                  <span style={{ color: "var(--text-dim)", display: "block" }}>Customer Name</span>
                  <strong style={{ color: "var(--text-main)" }}>{bookingPass.booking.customerName}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-dim)", display: "block" }}>Mobile Contact</span>
                  <strong style={{ color: "#38bdf8" }}>{bookingPass.booking.phone}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-dim)", display: "block" }}>Vehicle</span>
                  <strong style={{ color: "var(--text-main)" }}>{bookingPass.booking.carDetails}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-dim)", display: "block" }}>Package</span>
                  <strong style={{ color: "var(--accent-gold)" }}>{bookingPass.booking.servicePackage}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-dim)", display: "block" }}>Appointment Date</span>
                  <strong style={{ color: "var(--text-main)" }}>{bookingPass.booking.date}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-dim)", display: "block" }}>Time Slot</span>
                  <strong style={{ color: "#10b981" }}>{bookingPass.booking.timeSlot}</strong>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenBookings) {
                      onOpenBookings(bookingPass.booking.phone);
                    } else {
                      window.location.hash = "#bookings";
                    }
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1, minWidth: 140, justifyContent: "center" }}
                >
                  <Ticket size={15} />
                  <span>View in My Bookings</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="btn btn-outline"
                  style={{ flex: 1, minWidth: 140, justifyContent: "center" }}
                >
                  <Share2 size={15} />
                  <span>Share on WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-glass"
                  style={{ flex: 1, minWidth: 100, justifyContent: "center" }}
                >
                  <span>Done</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Service Package *</label>
                <select
                  className="form-select"
                  value={form.servicePackage}
                  onChange={(e) => setForm({ ...form, servicePackage: e.target.value })}
                >
                  <option value="Periodic Comprehensive Service">Periodic Comprehensive Service</option>
                  <option value="Brakes & Suspension Overhaul">Brakes & Suspension Overhaul</option>
                  <option value="AC & Climate System Service">AC & Climate System Service</option>
                  <option value="Computer OBD-II Diagnostics">Computer OBD-II Diagnostics</option>
                  <option value="150-Point Pre-Purchase Inspection">150-Point Pre-Purchase Inspection</option>
                  <option value="Ceramic Coating & Detailing">Ceramic Coating & Detailing</option>
                  <option value="General Checkup & Oil Topup">General Checkup & Oil Topup</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Car Make, Model & Reg. Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2021 BMW 320d (TS 09 FL 7821)"
                  className="form-input"
                  value={form.carDetails}
                  onChange={(e) => setForm({ ...form, carDetails: e.target.value })}
                />
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    className="form-input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number (10 Digits) *</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    required
                    placeholder="10-digit mobile number"
                    className="form-input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: cleanMobileNumber(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>Preferred Service Date *</label>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Pick a date or use shortcut</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  {quickDates.map((qd) => {
                    const isSelected = form.date === qd.date;
                    return (
                      <button
                        key={qd.date}
                        type="button"
                        onClick={() => setForm({ ...form, date: qd.date })}
                        className="btn btn-sm"
                        style={{
                          padding: "4px 10px",
                          fontSize: 12,
                          background: isSelected ? "var(--primary)" : "var(--bg-deep)",
                          color: isSelected ? "#ffffff" : "var(--text-main)",
                          border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        {qd.label} ({qd.date.slice(5)})
                      </button>
                    );
                  })}
                </div>
                <input
                  type="date"
                  required
                  min={todayStr}
                  className="form-input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>Select Workshop Time Slot *</label>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>5 Daily Workshop Batches</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginBottom: 8 }}>
                  {timeSlots.map((slot) => {
                    const isSelected = form.timeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setForm({ ...form, timeSlot: slot })}
                        style={{
                          padding: "8px 12px",
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 500,
                          textAlign: "left",
                          background: isSelected ? "rgba(239, 68, 68, 0.15)" : "var(--bg-deep)",
                          color: isSelected ? "var(--primary)" : "var(--text-main)",
                          border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span>{slot}</span>
                        {isSelected && <Check size={13} color="var(--primary)" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  background: "rgba(56, 189, 248, 0.08)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: "var(--text-main)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <CalendarClock size={16} color="#38bdf8" />
                <span>
                  Confirmed Appointment Slot: <strong style={{ color: "#38bdf8" }}>{form.date}</strong> at <strong style={{ color: "#38bdf8" }}>{form.timeSlot}</strong>
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Special Requests / Complaints (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. AC noise, brake pad check"
                  className="form-input"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {bookingError && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid #ef4444",
                    color: "#ef4444",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Info size={15} />
                  <span>{bookingError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={bookServiceSlot.isPending}
                className="btn btn-primary btn-lg"
                style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
              >
                {bookServiceSlot.isPending ? "Confirming Slot..." : "Confirm Booking & Generate Official Pass"}
                <ArrowRight size={18} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function InquiryModal({
  type,
  vehicleId,
  vehicleTitle,
  customerUser,
  onOpenBookings,
  onClose,
}: {
  type: "buy" | "sell" | "contact" | "exchange" | "test_drive";
  vehicleId?: number;
  vehicleTitle?: string;
  customerUser?: { id: string; name: string; phone: string; email: string; photo: string } | null;
  onOpenBookings?: (phone: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(() => customerUser?.name || "");
  const [phone, setPhone] = useState(() => customerUser?.phone || (typeof window !== "undefined" ? localStorage.getItem("passioncar_last_phone") || "" : ""));
  const [email, setEmail] = useState(() => customerUser?.email || "");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (customerUser) {
      if (customerUser.name && !name) setName(customerUser.name);
      if (customerUser.phone && !phone) setPhone(customerUser.phone);
      if (customerUser.email && !email) setEmail(customerUser.email);
    }
  }, [customerUser]);

  const create = useCreateInquiry();

  const titles: Record<string, string> = {
    buy: vehicleTitle ? `Inquire about ${vehicleTitle}` : "Vehicle Purchase Inquiry",
    sell: "Sell Your Car to Passion Car",
    exchange: "Exchange & Upgrade Your Car",
    test_drive: "Book a Doorstep / Showroom Test Drive",
    contact: "Contact Passion Car Hyderabad",
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (phone.trim().length < 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    create.mutate(
      {
        type,
        name,
        phone,
        email: email || undefined,
        message: vehicleTitle ? `Regarding: ${vehicleTitle}. ${message}` : message,
        vehicleId,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
          try {
            localStorage.setItem("passioncar_last_phone", phone);
          } catch {}
        },
      }
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ color: "var(--text-main)" }}>{titles[type]}</h3>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 28 }}>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Check size={28} />
              </div>
              <h3 style={{ color: "var(--text-main)", marginBottom: 8 }}>Inquiry Registered!</h3>
              <p style={{ color: "var(--text-muted)", marginBottom: 20, fontSize: 14 }}>
                Thank you, {name}. Your booking is logged under your account for +91 {phone}. Our advisor will reach out shortly.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenBookings) onOpenBookings(phone);
                    else window.location.hash = "#bookings";
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1, minWidth: 150, justifyContent: "center" }}
                >
                  <Ticket size={15} />
                  <span>View in My Bookings</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = `*PASSION CAR OFFICIAL ENQUIRY*\n👤 *Name:* ${name}\n📞 *Phone:* ${phone}\n📌 *Category:* ${titles[type]}\n${vehicleTitle ? `🚗 *Vehicle:* ${vehicleTitle}\n` : ""}${message ? `📝 *Message:* ${message}\n` : ""}Status: Submitted to Dealership`;
                    safeOpenWhatsApp(text);
                  }}
                  className="btn btn-outline"
                  style={{ flex: 1, minWidth: 150, justifyContent: "center" }}
                >
                  <Share2 size={15} />
                  <span>Share on WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-glass"
                  style={{ flex: 1, minWidth: 90, justifyContent: "center" }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number (10 Digits) *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile number (e.g. 9849012345)"
                  value={phone}
                  onChange={(e) => setPhone(cleanMobileNumber(e.target.value))}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message or Preferred Time</label>
                <textarea
                  rows={3}
                  placeholder="Any questions or requested date/time for visit or test drive..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <button type="button" onClick={onClose} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={create.isPending} className="btn btn-primary" style={{ flex: 1 }}>
                  {create.isPending ? "Submitting..." : "Submit Inquiry"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.18);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35);
    gain2.gain.setValueAtTime(0.18, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.65);
  } catch (_) {}
}

function AdminView({
  onBackToSite,
  theme,
  toggleTheme,
}: {
  onBackToSite: () => void;
  theme?: "dark" | "light";
  toggleTheme?: () => void;
}) {
  const { data: sessionData, isLoading: loadingSession } = useAdminSession();
  const { data: summary } = useAdminSummary();
  const { data: inquiries = [] } = useAdminInquiries();
  const { data: serviceBookings = [] } = useAdminServiceTokens();
  const switchProfileMutation = useSwitchAdminProfile();

  const isDeveloper = Boolean(
    sessionData?.user?.email?.toLowerCase() === "kongaraprasanth25niat@gmail.com" ||
    sessionData?.user?.name?.toLowerCase().includes("developer")
  );
  const isHirlumeAdmin = Boolean(sessionData?.user?.email?.toLowerCase() === "hirlume.info@gmail.com");

  const [tab, setTab] = useState<"overview" | "appointments" | "cars" | "customers" | "inquiries" | "services" | "gallery" | "settings">(() => {
    if (typeof window === "undefined") return "overview";
    const h = (window.location.hash || "").toLowerCase();
    if (h.includes("appointment")) return "appointments";
    if (h.includes("cars")) return "cars";
    if (h.includes("customers")) return "customers";
    if (h.includes("inquiries")) return "inquiries";
    if (h.includes("services")) return "services";
    if (h.includes("gallery")) return "gallery";
    if (h.includes("settings")) return "settings";
    return "overview";
  });

  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });

  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [adminNotifications, setAdminNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    time: string;
    type: "appointment" | "inquiry";
    targetTab: "appointments" | "inquiries" | "services";
    read: boolean;
  }>>([]);
  const [floatingToast, setFloatingToast] = useState<{
    id: string;
    title: string;
    message: string;
    type: "appointment" | "inquiry";
  } | null>(null);

  const knownInquiryIdsRef = useRef<Set<number>>(new Set());
  const knownBookingIdsRef = useRef<Set<number>>(new Set());
  const isInitialLoadRef = useRef(true);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const allAppointments = useMemo(() => {
    const list: any[] = [];
    (serviceBookings || []).forEach((b) => {
      list.push({
        id: `srv-${b.id}`,
        sourceId: b.id,
        sourceType: "service",
        typeLabel: "Service Bay",
        customerName: b.customerName,
        phone: b.phone,
        email: b.email || "",
        carDetails: b.carDetails,
        servicePackage: b.servicePackage || "Periodic Maintenance",
        date: b.date,
        timeSlot: b.timeSlot,
        token: b.token,
        status: b.status || "confirmed",
        notes: b.notes || "",
        createdAt: b.createdAt,
      });
    });

    (inquiries || []).forEach((inq) => {
      if (inq.type === "test_drive" || inq.type === "service" || inq.confirmedSlotTime) {
        const isTestDrive = inq.type === "test_drive";
        const typeLabel = isTestDrive ? "Test Drive" : (inq.type === "service" ? "Service Bay" : "Consultation");
        let derivedDate = todayStr;
        if (inq.confirmedSlotTime && inq.confirmedSlotTime.match(/\d{4}-\d{2}-\d{2}/)) {
          derivedDate = inq.confirmedSlotTime.match(/\d{4}-\d{2}-\d{2}/)![0];
        } else if (inq.createdAt) {
          derivedDate = new Date(inq.createdAt).toISOString().split("T")[0];
        }

        list.push({
          id: `inq-${inq.id}`,
          sourceId: inq.id,
          sourceType: "inquiry",
          typeLabel,
          customerName: inq.name,
          phone: inq.phone,
          email: inq.email || "",
          carDetails: inq.vehicleId ? `Vehicle #${inq.vehicleId}` : inq.message ? inq.message.slice(0, 45) : "Showroom Appointment",
          servicePackage: isTestDrive ? "Certified Vehicle Test Drive" : typeLabel,
          date: derivedDate,
          timeSlot: inq.confirmedSlotTime || "Slot Scheduled",
          token: null,
          status: inq.slotConfirmed ? "confirmed" : (inq.status === "completed" ? "completed" : inq.status === "closed" ? "cancelled" : "pending"),
          notes: inq.message || "",
          createdAt: inq.createdAt,
        });
      }
    });

    return list.sort((a, b) => {
      if (a.date === b.date) {
        return (b.sourceId || 0) - (a.sourceId || 0);
      }
      return b.date.localeCompare(a.date);
    });
  }, [serviceBookings, inquiries, todayStr]);

  const todayAppointmentsCount = useMemo(() => {
    return allAppointments.filter((a) => a.date === todayStr).length;
  }, [allAppointments, todayStr]);

  const handleRequestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Desktop notifications are not supported on this browser.");
      return;
    }
    try {
      const res = await Notification.requestPermission();
      setNotificationPermission(res);
      if (res === "granted") {
        if (soundEnabled) playNotificationChime();
        new Notification("Passion Car Admin Alerts Active", {
          body: "Desktop notifications enabled! You will be alerted for incoming customer appointments and leads.",
          icon: "/images/logo.png",
        });
        setFloatingToast({
          id: "perm-granted",
          title: "Notifications Enabled!",
          message: "You will now receive desktop popups and audio chimes for new appointments.",
          type: "appointment",
        });
        setTimeout(() => setFloatingToast(null), 5000);
      }
    } catch (_) {}
  };

  const handleSendTestAlert = () => {
    if (soundEnabled) playNotificationChime();
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("Test Alert: Passion Car Admin", {
        body: "Desktop notifications are working! Incoming appointments will alert you here.",
        icon: "/images/logo.png",
      });
    }
    setFloatingToast({
      id: `test-${Date.now()}`,
      title: "Test Alert Dispatched",
      message: "Desktop alert & audio chime triggered successfully.",
      type: "appointment",
    });
    setTimeout(() => setFloatingToast(null), 4000);
  };

  useEffect(() => {
    if (!inquiries && !serviceBookings) return;

    const currentInqIds = new Set((inquiries || []).map((i) => i.id));
    const currentBookingIds = new Set((serviceBookings || []).map((b) => b.id));

    if (isInitialLoadRef.current) {
      knownInquiryIdsRef.current = currentInqIds;
      knownBookingIdsRef.current = currentBookingIds;
      isInitialLoadRef.current = false;
      return;
    }

    const newInquiries = (inquiries || []).filter((i) => !knownInquiryIdsRef.current.has(i.id));
    const newBookings = (serviceBookings || []).filter((b) => !knownBookingIdsRef.current.has(b.id));

    if (newInquiries.length > 0 || newBookings.length > 0) {
      if (soundEnabled) playNotificationChime();

      const newNotifs: any[] = [];

      newBookings.forEach((b) => {
        knownBookingIdsRef.current.add(b.id);
        const item = {
          id: `srv-${b.id}-${Date.now()}`,
          title: `New Service Appointment (${b.token})`,
          message: `${b.customerName} booked ${b.servicePackage} on ${b.date} (${b.timeSlot})`,
          time: "Just now",
          type: "appointment" as const,
          targetTab: "appointments" as const,
          read: false,
        };
        newNotifs.push(item);

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(`New Service Bay Appointment: ${b.token}`, {
            body: `${b.customerName} booked ${b.servicePackage} on ${b.date} (${b.timeSlot}). Phone: ${b.phone}`,
            icon: "/images/logo.png",
          });
        }
      });

      newInquiries.forEach((i) => {
        knownInquiryIdsRef.current.add(i.id);
        const isTestDrive = i.type === "test_drive";
        const item = {
          id: `inq-${i.id}-${Date.now()}`,
          title: isTestDrive ? "New Test Drive Booked!" : `New Customer Lead (${i.type.toUpperCase()})`,
          message: `${i.name} (${i.phone}) - ${i.message || i.type}`,
          time: "Just now",
          type: isTestDrive ? ("appointment" as const) : ("inquiry" as const),
          targetTab: isTestDrive ? ("appointments" as const) : ("inquiries" as const),
          read: false,
        };
        newNotifs.push(item);

        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(isTestDrive ? "🚗 New Test Drive Appointment!" : `🔔 New Customer Lead: ${i.name}`, {
            body: `${i.type.toUpperCase()}: ${i.phone} - ${i.message || "Customer inquiry received."}`,
            icon: "/images/logo.png",
          });
        }
      });

      if (newNotifs.length > 0) {
        setAdminNotifications((prev) => [...newNotifs, ...prev].slice(0, 30));
        setFloatingToast({
          id: newNotifs[0].id,
          title: newNotifs[0].title,
          message: newNotifs[0].message,
          type: newNotifs[0].type,
        });
        setTimeout(() => setFloatingToast(null), 6000);
      }
    }
  }, [inquiries, serviceBookings, soundEnabled]);

  const handleSelectTab = (newTab: "overview" | "appointments" | "cars" | "customers" | "inquiries" | "services" | "gallery" | "settings") => {
    setTab(newTab);
    const targetHash = `#admin/${newTab}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState({ adminTab: newTab }, "", targetHash);
    }
  };

  useEffect(() => {
    const handleAdminSync = () => {
      if (window.history.state?.adminTab) {
        setTab(window.history.state.adminTab);
      } else {
        const h = (window.location.hash || "").toLowerCase();
        if (h.includes("appointment")) setTab("appointments");
        else if (h.includes("cars")) setTab("cars");
        else if (h.includes("customers")) setTab("customers");
        else if (h.includes("inquiries")) setTab("inquiries");
        else if (h.includes("services")) setTab("services");
        else if (h.includes("gallery")) setTab("gallery");
        else if (h.includes("settings")) setTab("settings");
        else setTab("overview");
      }
    };
    window.addEventListener("popstate", handleAdminSync);
    window.addEventListener("hashchange", handleAdminSync);
    return () => {
      window.removeEventListener("popstate", handleAdminSync);
      window.removeEventListener("hashchange", handleAdminSync);
    };
  }, []);

  if (loadingSession) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <RefreshCw className="animate-spin" size={32} />
      </div>
    );
  }

  if (!sessionData?.authenticated) {
    return <AdminLoginView onBackToSite={onBackToSite} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-deep)", color: "var(--text-main)" }}>
      <header
        style={{
          background: "var(--bg-dark)",
          borderBottom: "1px solid var(--border)",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="brand-logo-badge" style={{ padding: "3px 6px" }}>
            <img
              src="/images/logo.png"
              alt="Passion Car"
              style={{ height: 36, width: "auto", objectFit: "contain" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {sessionData.user?.photo ? (
              <img
                src={sessionData.user.photo}
                alt={sessionData.user.name || "Admin"}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid var(--primary)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.4) 100%)",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 16,
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                }}
              >
                {(sessionData.user?.name || "A").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h3 style={{ fontSize: 15, color: "#ffffff", fontWeight: 700, margin: 0 }}>
                  {sessionData.user?.name || "Passion Car Admin"}
                </h3>
                <span className="badge badge-gold" style={{ fontSize: 10, padding: "2px 6px" }}>
                  {sessionData.user?.role || "admin"}
                </span>
              </div>
              <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                {sessionData.user?.email || "passioncar877@gmail.com"}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                minWidth: 76,
                height: 36,
                padding: "0 16px",
                borderRadius: 9999,
                lineHeight: 1,
                boxSizing: "border-box",
                overflow: "visible",
              }}
              title="Toggle Theme"
            >
              <span style={{ display: "inline-block", width: "100%", textAlign: "center", lineHeight: 1 }}>
                {theme === "dark" ? "Light" : "Dark"}
              </span>
            </button>
          )}

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setNotificationPanelOpen((v) => !v)}
              className="btn btn-outline btn-sm"
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 6,
                borderColor: notificationPermission === "granted" ? "rgba(16, 185, 129, 0.5)" : "var(--border)",
              }}
              title="Notifications & Alerts Center"
            >
              {notificationPermission === "granted" ? (
                <BellRing size={15} color="#10b981" />
              ) : notificationPermission === "denied" ? (
                <BellOff size={15} color="#ef4444" />
              ) : (
                <Bell size={15} color="#f59e0b" />
              )}
              <span className="hidden-mobile">Alerts</span>
              {adminNotifications.filter((n) => !n.read).length > 0 && (
                <span
                  style={{
                    background: "#ef4444",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "1px 5px",
                    borderRadius: 999,
                    lineHeight: 1.2,
                  }}
                >
                  {adminNotifications.filter((n) => !n.read).length}
                </span>
              )}
            </button>

            {notificationPanelOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: 8,
                  width: 340,
                  maxWidth: "90vw",
                  background: "var(--bg-dark)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                  zIndex: 9999,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-main)", display: "flex", alignItems: "center", gap: 6 }}>
                    <BellRing size={16} color="var(--primary)" />
                    <span>Notification Center</span>
                  </div>
                  <button
                    onClick={() => setNotificationPanelOpen(false)}
                    style={{ background: "transparent", border: 0, color: "var(--text-muted)", cursor: "pointer", padding: 2 }}
                  >
                    <X size={14} />
                  </button>
                </div>

                <div
                  style={{
                    background: "var(--bg-deep)",
                    padding: 12,
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    marginBottom: 14,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)" }}>Desktop Notifications</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background:
                          notificationPermission === "granted"
                            ? "rgba(16, 185, 129, 0.15)"
                            : notificationPermission === "denied"
                            ? "rgba(239, 68, 68, 0.15)"
                            : "rgba(245, 158, 11, 0.15)",
                        color:
                          notificationPermission === "granted"
                            ? "#10b981"
                            : notificationPermission === "denied"
                            ? "#ef4444"
                            : "#f59e0b",
                      }}
                    >
                      {notificationPermission === "granted" ? "ACTIVE" : notificationPermission === "denied" ? "BLOCKED" : "ACTION REQUIRED"}
                    </span>
                  </div>

                  <p style={{ fontSize: 11, color: "var(--text-dim)", margin: "0 0 8px", lineHeight: 1.4 }}>
                    {notificationPermission === "granted"
                      ? "Push alerts active for new test drives, bookings, and inquiries."
                      : notificationPermission === "denied"
                      ? "Notifications blocked in your browser. Click the lock icon in the browser address bar to allow."
                      : "Allow permissions to get desktop alerts even when working in another tab."}
                  </p>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {notificationPermission !== "granted" ? (
                      <button onClick={handleRequestPermission} className="btn btn-primary btn-sm" style={{ fontSize: 11, padding: "5px 10px" }}>
                        Allow Desktop Alerts
                      </button>
                    ) : (
                      <button onClick={handleSendTestAlert} className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: "5px 10px" }}>
                        Send Test Alert
                      </button>
                    )}

                    <button
                      onClick={() => setSoundEnabled((v) => !v)}
                      className="btn btn-glass btn-sm"
                      style={{ fontSize: 11, padding: "5px 10px", display: "flex", alignItems: "center", gap: 4 }}
                      title="Toggle sound chime"
                    >
                      {soundEnabled ? <Volume2 size={12} color="#10b981" /> : <VolumeX size={12} color="#ef4444" />}
                      <span>{soundEnabled ? "Sound On" : "Sound Muted"}</span>
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>Recent Alerts ({adminNotifications.length})</span>
                  {adminNotifications.length > 0 && (
                    <button
                      onClick={() => setAdminNotifications([])}
                      style={{ background: "transparent", border: 0, color: "var(--primary)", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  {adminNotifications.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "18px 8px", color: "var(--text-dim)", fontSize: 12 }}>
                      No incoming alerts yet. Live listening active...
                    </div>
                  ) : (
                    adminNotifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          handleSelectTab(notif.targetTab);
                          setNotificationPanelOpen(false);
                        }}
                        style={{
                          background: "var(--bg-deep)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          padding: "8px 10px",
                          cursor: "pointer",
                          transition: "border-color 0.2s",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)" }}>{notif.title}</span>
                          <span style={{ fontSize: 10, color: "var(--text-dim)" }}>{notif.time}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{notif.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {isDeveloper ? (
            <button
              type="button"
              onClick={() => switchProfileMutation.mutate("hirlume.info@gmail.com")}
              className="btn btn-primary btn-sm"
              disabled={switchProfileMutation.isPending}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 700,
                background: "var(--primary)",
                color: "#ffffff",
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)",
              }}
              title="Access Admin Page as Administrator (hirlume.info@gmail.com)"
            >
              <ShieldCheck size={14} />
              <span>{switchProfileMutation.isPending ? "Switching..." : "Admin Page"}</span>
            </button>
          ) : isHirlumeAdmin ? (
            <button
              type="button"
              onClick={() => switchProfileMutation.mutate("kongaraprasanth25niat@gmail.com")}
              className="btn btn-outline btn-sm"
              disabled={switchProfileMutation.isPending}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 700,
                borderColor: "var(--primary)",
                color: "var(--primary)",
              }}
              title="Switch to Developer Mode (kongaraprasanth25niat@gmail.com)"
            >
              <Key size={14} />
              <span>{switchProfileMutation.isPending ? "Switching..." : "Developer Mode"}</span>
            </button>
          ) : null}

          <button onClick={onBackToSite} className="btn btn-outline btn-sm">
            <Eye size={14} />
            <span>Public Site</span>
          </button>
          <AdminLogoutBtn />
        </div>
      </header>

      {notificationPermission === "default" && (
        <div
          style={{
            background: "linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, rgba(239, 68, 68, 0.15) 100%)",
            borderBottom: "1px solid rgba(245, 158, 11, 0.3)",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BellRing size={18} color="#f59e0b" />
            <span style={{ fontSize: 13, color: "var(--text-main)", fontWeight: 600 }}>
              Enable desktop notifications to receive instant sound alerts and popups on your screen whenever new appointments or inquiries arrive.
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={handleRequestPermission} className="btn btn-primary btn-sm">
              Allow Notifications
            </button>
            <button onClick={() => setNotificationPermission("dismissed")} className="btn btn-glass btn-sm" style={{ padding: "4px 8px" }}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {floatingToast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: "var(--bg-dark)",
            border: "1px solid var(--primary)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            borderRadius: "var(--radius-md)",
            padding: "14px 18px",
            maxWidth: 380,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              background: "rgba(239, 68, 68, 0.2)",
              color: "var(--primary)",
              padding: 8,
              borderRadius: "var(--radius-sm)",
            }}
          >
            <BellRing size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-main)", marginBottom: 2 }}>
              {floatingToast.title}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
              {floatingToast.message}
            </div>
          </div>
          <button
            onClick={() => setFloatingToast(null)}
            style={{ background: "transparent", border: 0, color: "var(--text-muted)", cursor: "pointer", padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div
        style={{
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
          padding: "0 16px",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div style={{ display: "flex", gap: 14, minWidth: "max-content" }}>
          {[
            { id: "overview", label: "Dashboard", icon: Layers },
            {
              id: "appointments",
              label: `Appointments${allAppointments.length > 0 ? ` (${todayAppointmentsCount > 0 ? `${todayAppointmentsCount} Today` : allAppointments.length})` : ""}`,
              icon: CalendarCheck,
            },
            { id: "cars", label: "Cars Inventory", icon: Car },
            {
              id: "customers",
              label: `Customers${summary?.totalCustomers ? ` (${summary.totalCustomers})` : ""}`,
              icon: Users,
            },
            {
              id: "inquiries",
              label: `Customer Leads${summary?.pendingInquiries ? ` (${summary.pendingInquiries} New)` : ""}`,
              icon: MessageSquare,
            },
            {
              id: "services",
              label: `Service Bay${summary?.pendingServiceBookings ? ` (${summary.pendingServiceBookings} New)` : summary?.totalServiceBookings ? ` (${summary.totalServiceBookings})` : ""}`,
              icon: Wrench,
            },
            { id: "gallery", label: "Showroom Gallery", icon: ImageIcon },
            { id: "settings", label: "Profile & Settings", icon: SlidersHorizontal },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectTab(t.id as any)}
              style={{
                background: "transparent",
                border: 0,
                borderBottom: tab === t.id ? "2px solid var(--primary)" : "2px solid transparent",
                color: tab === t.id ? "var(--text-main)" : "var(--text-muted)",
                padding: "14px 10px",
                fontSize: 14,
                fontWeight: tab === t.id ? 700 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
              }}
            >
              <t.icon size={16} color={tab === t.id ? "var(--primary)" : "currentColor"} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px" }}>
        {tab === "overview" && (
          <AdminOverviewTab
            onGoToAppointments={() => handleSelectTab("appointments")}
            onGoToCars={() => handleSelectTab("cars")}
            onGoToCustomers={() => handleSelectTab("customers")}
            onGoToInquiries={() => handleSelectTab("inquiries")}
            onGoToServices={() => handleSelectTab("services")}
            onGoToGallery={() => handleSelectTab("gallery")}
            isDeveloper={isDeveloper}
          />
        )}
        {tab === "appointments" && <AdminAppointmentsTab />}
        {tab === "cars" && <AdminCarsTab />}
        {tab === "customers" && <AdminCustomersTab />}
        {tab === "inquiries" && <AdminInquiriesTab />}
        {tab === "services" && <AdminServicesTab />}
        {tab === "gallery" && <AdminGalleryTab />}
        {tab === "settings" && <AdminSettingsTab isDeveloper={isDeveloper} />}
      </div>
    </div>
  );
}

function AdminLogoutBtn() {
  const logout = useAdminLogout();
  return (
    <button onClick={() => logout.mutate()} className="btn btn-glass btn-sm" title="Sign Out">
      <LogOut size={14} />
      <span>Sign Out</span>
    </button>
  );
}

function AdminLoginView({ onBackToSite }: { onBackToSite: () => void }) {
  const [selectedAdminId, setSelectedAdminId] = useState<"owner_akbar" | "owner_prasanth">("owner_akbar");
  const [prasanthEmailChoice, setPrasanthEmailChoice] = useState<"kongara" | "hirlume">("kongara");
  const [authMethod, setAuthMethod] = useState<"google" | "password">("google");
  const [password, setPassword] = useState("");

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const ADMINS = [
    {
      id: "owner_akbar" as const,
      email: "passioncar877@gmail.com",
      name: "Mohammed Akbar",
      role: "Dealership Owner",
      title: "Owner / Director",
      badgeClass: "badge-red",
      icon: ShieldCheck,
      desc: "Full dealership operations, car listings & customer records",
    },
    {
      id: "owner_prasanth" as const,
      email: prasanthEmailChoice === "hirlume" ? "hirlume.info@gmail.com" : "kongaraprasanth25niat@gmail.com",
      name: "Prasanth Kongara",
      role: "Dealership Owner",
      title: "Co-Owner / Director",
      badgeClass: "badge-red",
      icon: ShieldCheck,
      desc: "Dealership operations, car listings & client records",
    },
  ];

  const currentAdmin = ADMINS.find((a) => a.id === selectedAdminId) || ADMINS[0];

  const loginMutation = useAdminLogin();
  const googleLoginMutation = useGoogleLogin();
  const resetPasswordMutation = useResetAdminPassword();
  const verifyMagic = useVerifyMagicLink();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("magic");
    if (token) {
      verifyMagic.mutate(token, {
        onSuccess: () => {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, "", cleanUrl);
        },
        onError: (err) => {
          setErrorMsg(err.message || "Magic Link expired or invalid.");
        },
      });
    }
  }, []);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "236049845526-6pall4lrjfqbs0ga6t3j9ns4sjg9t9iv.apps.googleusercontent.com";
    const google = (window as any).google;
    if (google?.accounts?.id && authMethod === "google") {
      try {
        google.accounts.id.initialize({
          client_id: clientId,
          callback: (res: any) => {
            if (res.credential) {
              try {
                const parts = String(res.credential || "").split(".");
                if (parts.length >= 2) {
                  let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
                  while (base64.length % 4 !== 0) base64 += "=";
                  const jsonPayload = decodeURIComponent(
                    Array.prototype.map
                      .call(atob(base64), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                      .join("")
                  );
                  const payload = JSON.parse(jsonPayload);
                  if (payload.email) {
                    googleLoginMutation.mutate(
                      {
                        email: payload.email,
                        credential: res.credential,
                        name: payload.name || payload.email.split("@")[0],
                        photo: payload.picture || "",
                      },
                      {
                        onSuccess: () => {
                          setSuccessMsg(`Welcome, ${payload.name || payload.email}! Accessing Admin Portal...`);
                        },
                        onError: (err) => {
                          setErrorMsg(err.message || "Google OAuth sign-in failed. Account not authorized.");
                        },
                      }
                    );
                  }
                }
              } catch (decodeErr) {
                console.error("Failed to parse Google credential", decodeErr);
                setErrorMsg("Could not process Google account token.");
              }
            }
          },
        });

        const btnContainer = document.getElementById("admin-google-gsi-btn");
        if (btnContainer) {
          btnContainer.innerHTML = "";
          const containerWidth = btnContainer.getBoundingClientRect().width;
          const targetWidth = Math.floor(
            containerWidth > 200
              ? Math.min(containerWidth, 388)
              : Math.min(388, Math.max(220, (typeof window !== "undefined" ? window.innerWidth - 64 : 320)))
          );
          google.accounts.id.renderButton(btnContainer, {
            theme: "filled_blue",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            width: targetWidth,
            logo_alignment: "left",
          });
        }
      } catch (e) {
        console.warn("GSI init warning", e);
      }
    }
  }, [authMethod, selectedAdminId, prasanthEmailChoice]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!password.trim()) {
      setErrorMsg("Please enter the administrator password.");
      return;
    }
    loginMutation.mutate(
      { email: currentAdmin.email, password: password.trim() },
      {
        onSuccess: () => {
          setSuccessMsg(`Welcome, ${currentAdmin.name}! Accessing Admin Portal...`);
        },
        onError: (err) => {
          setErrorMsg(err.message || "Incorrect password. Default: passioncar2026.");
        },
      }
    );
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setResetSuccess("");
    if (!resetOtp.trim()) {
      setErrorMsg("Please enter the 6-digit OTP code sent to administrator.");
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    resetPasswordMutation.mutate(
      {
        email: currentAdmin.email,
        otp: resetOtp.trim(),
        newPassword: newPassword.trim(),
      },
      {
        onSuccess: (data) => {
          setResetSuccess(data.message || "Password updated successfully! Sign in with your new password.");
          setShowResetPassword(false);
          setPassword(newPassword.trim());
          setResetOtp("");
          setNewPassword("");
        },
        onError: (err) => {
          setErrorMsg(err.message || "Password reset failed. Please verify the OTP code.");
        },
      }
    );
  };

  const isPending =
    loginMutation.isPending || googleLoginMutation.isPending || verifyMagic.isPending || resetPasswordMutation.isPending;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at center, #131b2e 0%, #07090e 100%)",
        padding: 20,
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-light)",
          borderRadius: "var(--radius-lg)",
          padding: "36px 32px",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            className="brand-logo-badge"
            style={{
              display: "inline-flex",
              padding: "6px 14px",
              marginBottom: 14,
              borderRadius: 14,
              background: "#ffffff",
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            }}
          >
            <img
              src="/images/logo.png"
              alt="Passion Car"
              style={{ height: 48, width: "auto", objectFit: "contain", borderRadius: 10 }}
            />
          </div>
          <h2 style={{ color: "var(--text-main)", fontSize: 24, marginBottom: 4, fontWeight: 800 }}>
            Administrator Sign-In
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
            Authorized portal access for Passion Car Hyderabad leadership
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#fca5a5",
              borderRadius: 6,
              padding: "10px 14px",
              fontSize: 13,
              marginBottom: 18,
            }}
          >
            {errorMsg}
          </div>
        )}

        {resetSuccess && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid #10b981",
              color: "var(--text-main)",
              borderRadius: 6,
              padding: "10px 14px",
              fontSize: 13,
              marginBottom: 18,
              fontWeight: 600,
            }}
          >
            {resetSuccess}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid #10b981",
              color: "#10b981",
              borderRadius: 6,
              padding: "10px 14px",
              fontSize: 13,
              marginBottom: 18,
              fontWeight: 600,
            }}
          >
            {successMsg}
          </div>
        )}

        {showResetPassword ? (
          <form onSubmit={handleResetPassword}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: "var(--text-main)", fontWeight: 700 }}>
                Reset Admin Password
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowResetPassword(false);
                  setErrorMsg("");
                }}
                className="btn btn-glass btn-sm"
                style={{ fontSize: 11 }}
              >
                Back to Sign In
              </button>
            </div>

            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.5 }}>
              Enter the 6-digit verification OTP dispatched to administrator email.
            </p>

            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Admin Email</label>
              <input
                type="email"
                value={currentAdmin.email}
                readOnly
                className="form-input"
                style={{ background: "rgba(255, 255, 255, 0.04)", opacity: 0.85 }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Enter 6-Digit OTP *</label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="Enter security OTP code"
                value={resetOtp}
                onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="form-input"
                style={{ fontSize: 18, letterSpacing: 4, textAlign: "center", fontWeight: 700 }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label">New Admin Password *</label>
              <input
                type="password"
                required
                placeholder="Enter new password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              <Lock size={15} />
              <span>{resetPasswordMutation.isPending ? "Updating Password..." : "Verify OTP & Update Password"}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit}>
            <label className="form-label" style={{ marginBottom: 10 }}>
              Select Authorized Administrator (2 Admins)
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {ADMINS.map((adm) => {
                const isSelected = selectedAdminId === adm.id;
                const isPrasanthCard = adm.id === "owner_prasanth";
                return (
                  <div
                    key={adm.id}
                    onClick={() => {
                      setSelectedAdminId(adm.id);
                      setErrorMsg("");
                    }}
                    style={{
                      border: isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
                      background: isSelected ? "rgba(239, 68, 68, 0.08)" : "var(--bg-card)",
                      borderRadius: "var(--radius-md)",
                      padding: 14,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span className={`badge ${adm.badgeClass}`} style={{ fontSize: 10, padding: "2px 6px" }}>
                        {adm.role}
                      </span>
                      {isSelected && <CheckCircle2 size={16} color="var(--primary)" />}
                    </div>

                    <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: 14 }}>{adm.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, wordBreak: "break-all" }}>
                      {adm.email}
                    </div>

                    {isPrasanthCard && isSelected && (
                      <div
                        style={{
                          marginTop: 10,
                          paddingTop: 8,
                          borderTop: "1px dashed var(--border)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 6,
                        }}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrasanthEmailChoice(prasanthEmailChoice === "kongara" ? "hirlume" : "kongara");
                            setErrorMsg("");
                          }}
                          style={{
                            background: prasanthEmailChoice === "hirlume" ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.06)",
                            border: prasanthEmailChoice === "hirlume" ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid var(--border)",
                            color: prasanthEmailChoice === "hirlume" ? "var(--primary)" : "var(--text-muted)",
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "4px 8px",
                            borderRadius: 6,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            width: "100%",
                            justifyContent: "center",
                          }}
                        >
                          <Shield size={11} />
                          <span>{prasanthEmailChoice === "hirlume" ? "Using: hirlume.info@gmail.com" : "Switch: hirlume.info@gmail.com"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="auth-tabs" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 18 }}>
              <button
                type="button"
                onClick={() => { setAuthMethod("google"); setErrorMsg(""); }}
                className={`auth-tab-btn ${authMethod === "google" ? "active" : ""}`}
                style={{ padding: "9px 12px" }}
              >
                <Globe size={14} />
                <span>Google OAuth</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod("password"); setErrorMsg(""); }}
                className={`auth-tab-btn ${authMethod === "password" ? "active" : ""}`}
                style={{ padding: "9px 12px" }}
              >
                <Lock size={14} />
                <span>Password</span>
              </button>
            </div>

            {authMethod === "google" ? (
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: 16,
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                    Sign in with Google OAuth using authorized email:
                  </p>
                  <strong style={{ fontSize: 14, color: "#38bdf8", display: "block", marginTop: 4 }}>
                    {currentAdmin.email}
                  </strong>
                  <span style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2, display: "block" }}>
                    Verified administrative account ({currentAdmin.role})
                  </span>
                </div>

                <div
                  id="admin-google-gsi-btn"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: 46,
                    width: "100%",
                  }}
                />
              </div>
            ) : (
              <div style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label">Admin Email</label>
                  <input
                    type="email"
                    value={currentAdmin.email}
                    readOnly
                    className="form-input"
                    style={{ background: "rgba(255, 255, 255, 0.04)", opacity: 0.85 }}
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0 }}>Password</label>
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(true)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--primary)",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      Forgot / Reset Password?
                    </button>
                  </div>
                  <input
                    type="password"
                    placeholder="Enter your admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <Lock size={15} />
                  <span>{loginMutation.isPending ? "Signing In..." : "Sign In to Admin Dashboard"}</span>
                </button>
              </div>
            )}
          </form>
        )}

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <button onClick={onBackToSite} className="btn btn-outline btn-sm">
            <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
            <span>Return to Public Website</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminOverviewTab({
  onGoToAppointments,
  onGoToCars,
  onGoToCustomers,
  onGoToInquiries,
  onGoToServices,
  onGoToGallery,
  isDeveloper,
}: {
  onGoToAppointments?: () => void;
  onGoToCars: () => void;
  onGoToCustomers?: () => void;
  onGoToInquiries?: () => void;
  onGoToServices?: () => void;
  onGoToGallery?: () => void;
  isDeveloper?: boolean;
}) {
  const { data: summary, isLoading } = useAdminSummary();
  const { data: inquiries = [] } = useAdminInquiries();

  if (isLoading || !summary) {
    return <div style={{ padding: 40, textAlign: "center" }}><RefreshCw className="animate-spin" size={24} /></div>;
  }

  const confirmedAppointmentsCount = (summary.totalServiceBookings ?? 0) + inquiries.filter((i) => i.type === "test_drive" || i.slotConfirmed).length;

  return (
    <div>
      <h2 style={{ color: "var(--text-main)", marginBottom: 24 }}>Dealership Performance Overview</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 36 }}>
        <div style={{ background: "var(--bg-surface)", padding: 24, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Active Cars in Stock</span>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#38bdf8", marginTop: 6 }}>{summary.availableVehicles}</div>
        </div>

        <div
          onClick={onGoToAppointments}
          style={{ background: "var(--bg-surface)", padding: 24, borderRadius: "var(--radius-md)", border: "1px solid var(--border)", cursor: onGoToAppointments ? "pointer" : "default" }}
        >
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Confirmed Appointments</span>
          <div style={{ fontSize: 32, fontWeight: 800, color: "var(--primary)", marginTop: 6 }}>{confirmedAppointmentsCount}</div>
        </div>

        <div style={{ background: "var(--bg-surface)", padding: 24, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Cars Sold (Site Counter)</span>
          <div style={{ fontSize: 32, fontWeight: 800, color: "var(--accent-gold)", marginTop: 6 }}>{summary.carsSoldCounter}+</div>
        </div>

        <div style={{ background: "var(--bg-surface)", padding: 24, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Tracked Clients</span>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#a855f7", marginTop: 6 }}>{summary.totalCustomers ?? 0}</div>
        </div>

        <div
          onClick={onGoToServices}
          style={{ background: "var(--bg-surface)", padding: 24, borderRadius: "var(--radius-md)", border: "1px solid var(--border)", cursor: onGoToServices ? "pointer" : "default" }}
        >
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Active Service Tokens</span>
          <div style={{ fontSize: 32, fontWeight: 800, color: "var(--accent-green)", marginTop: 6 }}>{summary.totalServiceBookings ?? 0}</div>
        </div>
      </div>

      <div style={{ background: "var(--bg-surface)", padding: 28, borderRadius: "var(--radius-md)", border: "1px solid var(--border)", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h3 style={{ color: "var(--text-main)", marginBottom: 8 }}>Quick Dealer Management Actions</h3>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: 14 }}>
            Add or edit inventory vehicles, view all customer appointments, list clients, or manage booked service slot tokens.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {onGoToAppointments && (
            <button onClick={onGoToAppointments} className="btn btn-primary">
              <CalendarCheck size={16} />
              <span>All Appointments ({confirmedAppointmentsCount})</span>
            </button>
          )}
          {onGoToCars && (
            <button onClick={onGoToCars} className="btn btn-outline">
              <Car size={16} />
              <span>Cars Inventory ({summary.totalVehicles ?? 0})</span>
            </button>
          )}
          {onGoToServices && (
            <button onClick={onGoToServices} className="btn btn-outline">
              <Wrench size={16} />
              <span>Service Bookings ({summary.totalServiceBookings ?? 0})</span>
            </button>
          )}
          {onGoToCustomers && (
            <button onClick={onGoToCustomers} className="btn btn-outline">
              <Users size={16} />
              <span>Customers & Clients</span>
            </button>
          )}
          {onGoToInquiries && (
            <button onClick={onGoToInquiries} className="btn btn-glass">
              <MessageSquare size={16} />
              <span>Customer Leads ({inquiries.length})</span>
            </button>
          )}
          {onGoToGallery && (
            <button onClick={onGoToGallery} className="btn btn-glass">
              <ImageIcon size={16} />
              <span>Showroom Gallery</span>
            </button>
          )}
        </div>
      </div>

      {isDeveloper && (
        <div style={{ background: "var(--bg-surface)", padding: 28, borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Database size={20} color="var(--primary)" />
              <h3 style={{ color: "var(--text-main)", margin: 0, fontSize: 17, fontWeight: 700 }}>Database & Storage Infrastructure</h3>
            </div>
            <span style={{ fontSize: 12, background: "rgba(16, 185, 129, 0.15)", color: "#34d399", padding: "4px 12px", borderRadius: 999, fontWeight: 700, border: "1px solid rgba(16, 185, 129, 0.3)" }}>
              ● Active & Synchronized
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
            <div style={{ background: "var(--bg-deep)", padding: 18, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Cloud Database Storage Name</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-main)" }}>Supabase PostgreSQL (AWS AP-Northeast-2)</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>Local Resilient JSON Store Active</div>
            </div>

            <div style={{ background: "var(--bg-deep)", padding: 18, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Database Quota & Data Used</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#38bdf8" }}>~25 KB / 500 MB Free Tier</div>
              <div style={{ fontSize: 12, color: "var(--accent-green)", marginTop: 4 }}>&lt; 0.01% utilized (99.99% free space available)</div>
            </div>

            <div style={{ background: "var(--bg-deep)", padding: 18, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Inbuilt Auto-Compressor</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--accent-green)" }}>Active &amp; Silent (1600px / 82%)</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>Desktop &amp; Mobile Web (Zero Popups)</div>
            </div>

            <div style={{ background: "var(--bg-deep)", padding: 18, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Managed Live Inventory Records</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--accent-gold)" }}>{summary.totalVehicles ?? 0} Vehicles · {summary.totalCustomers ?? 0} Clients</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>{summary.totalServiceBookings ?? 0} Service Bookings · {inquiries.length} Inquiries</div>
            </div>
          </div>
        </div>
      )}

      {inquiries.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ color: "var(--text-main)", margin: 0, fontSize: 18, fontWeight: 700 }}>
              Recent Incoming Notifications & Test Drive Bookings
            </h3>
            {onGoToInquiries && (
              <button onClick={onGoToInquiries} className="btn btn-outline btn-sm">
                <span>View All Leads & Search →</span>
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            {inquiries.slice(0, 3).map((inq) => {
              const formatted = formatDateTime(inq.createdAt);
              const isTestDrive = inq.type === "test_drive";
              return (
                <div
                  key={inq.id}
                  style={{
                    background: isTestDrive ? "rgba(16, 185, 129, 0.05)" : "var(--bg-surface)",
                    border: isTestDrive ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span className={`badge ${isTestDrive ? "badge-green" : "badge-gold"}`} style={{ fontSize: 11 }}>
                        {isTestDrive ? "🚗 Test Drive Booked" : inq.type.toUpperCase()}
                      </span>
                      <span className="badge badge-glass" style={{ fontSize: 11 }}>
                        {inq.status}
                      </span>
                    </div>

                    <strong style={{ color: "var(--text-main)", fontSize: 15, display: "block" }}>{inq.name}</strong>
                    <div style={{ fontSize: 13, color: "#38bdf8", marginTop: 2 }}>{inq.phone}</div>
                    {inq.message && (
                      <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 }}>
                        {inq.message}
                      </p>
                    )}
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid var(--border)",
                      paddingTop: 10,
                      marginTop: 12,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: 12,
                      color: "var(--text-main)",
                      fontWeight: 600,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>📅 {formatted.date}</span>
                      <span>⏰ {formatted.time} IST</span>
                    </div>
                    <span className="badge badge-glass" style={{ fontSize: 10 }}>{formatted.relative}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminAppointmentsTab() {
  const { data: serviceBookings = [], isLoading: loadingBookings } = useAdminServiceTokens();
  const { data: inquiries = [], isLoading: loadingInquiries } = useAdminInquiries();
  const updateTokenStatus = useUpdateServiceTokenStatus();
  const updateInquiryStatus = useUpdateInquiryStatus();
  const deleteToken = useDeleteServiceToken();
  const deleteInquiry = useDeleteInquiry();
  const bookService = useBookServiceSlot();

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "tomorrow" | "upcoming" | "past">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "service" | "test_drive" | "consultation">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "in_bay" | "completed" | "pending" | "cancelled" | "postponed">("all");
  const [postponeApt, setPostponeApt] = useState<typeof allAppointments[0] | null>(null);
  const [postponeDate, setPostponeDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [postponeSlot, setPostponeSlot] = useState("09:30 AM - 11:00 AM (Morning Slot)");

  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    carDetails: "",
    servicePackage: "Periodic Maintenance & 50-Pt Inspection",
    date: new Date().toISOString().split("T")[0],
    timeSlot: "10:30 AM",
    notes: "",
  });
  const [actionSuccess, setActionSuccess] = useState("");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  }, []);

  const allAppointments = useMemo(() => {
    const list: Array<{
      id: string;
      sourceId: number;
      sourceType: "service" | "inquiry";
      typeLabel: string;
      customerName: string;
      phone: string;
      email: string;
      carDetails: string;
      servicePackage: string;
      date: string;
      timeSlot: string;
      token: string | null;
      status: string;
      notes: string;
      createdAt: string | Date | null | undefined;
    }> = [];

    (serviceBookings || []).forEach((b) => {
      list.push({
        id: `srv-${b.id}`,
        sourceId: b.id,
        sourceType: "service",
        typeLabel: "Service Bay",
        customerName: b.customerName,
        phone: b.phone,
        email: b.email || "",
        carDetails: b.carDetails,
        servicePackage: b.servicePackage || "Periodic Maintenance",
        date: b.date,
        timeSlot: b.timeSlot,
        token: b.token,
        status: b.status || "confirmed",
        notes: b.notes || "",
        createdAt: b.createdAt,
      });
    });

    (inquiries || []).forEach((inq) => {
      if (inq.type === "test_drive" || inq.type === "service" || inq.confirmedSlotTime) {
        const isTestDrive = inq.type === "test_drive";
        const typeLabel = isTestDrive ? "Test Drive" : (inq.type === "service" ? "Service Bay" : "Consultation");
        let derivedDate = todayStr;
        if (inq.confirmedSlotTime && inq.confirmedSlotTime.match(/\d{4}-\d{2}-\d{2}/)) {
          derivedDate = inq.confirmedSlotTime.match(/\d{4}-\d{2}-\d{2}/)![0];
        } else if (inq.createdAt) {
          derivedDate = new Date(inq.createdAt).toISOString().split("T")[0];
        }

        list.push({
          id: `inq-${inq.id}`,
          sourceId: inq.id,
          sourceType: "inquiry",
          typeLabel,
          customerName: inq.name,
          phone: inq.phone,
          email: inq.email || "",
          carDetails: inq.vehicleId ? `Vehicle #${inq.vehicleId}` : inq.message ? inq.message.slice(0, 45) : "Showroom Appointment",
          servicePackage: isTestDrive ? "Certified Vehicle Test Drive" : typeLabel,
          date: derivedDate,
          timeSlot: inq.confirmedSlotTime || "Slot Scheduled",
          token: null,
          status: inq.slotConfirmed ? "confirmed" : (inq.status === "completed" ? "completed" : inq.status === "closed" ? "cancelled" : "pending"),
          notes: inq.message || "",
          createdAt: inq.createdAt,
        });
      }
    });

    return list.sort((a, b) => {
      if (a.date === b.date) {
        return (b.sourceId || 0) - (a.sourceId || 0);
      }
      return b.date.localeCompare(a.date);
    });
  }, [serviceBookings, inquiries, todayStr]);

  const stats = useMemo(() => {
    const todayCount = allAppointments.filter((a) => a.date === todayStr).length;
    const confirmedCount = allAppointments.filter((a) => a.status === "confirmed" || a.status === "in_bay").length;
    const pendingCount = allAppointments.filter((a) => a.status === "pending").length;
    return {
      total: allAppointments.length,
      today: todayCount,
      confirmed: confirmedCount,
      pending: pendingCount,
    };
  }, [allAppointments, todayStr]);

  const filteredAppointments = useMemo(() => {
    return allAppointments.filter((a) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          a.customerName.toLowerCase().includes(q) ||
          a.phone.toLowerCase().includes(q) ||
          a.carDetails.toLowerCase().includes(q) ||
          a.servicePackage.toLowerCase().includes(q) ||
          (a.token && a.token.toLowerCase().includes(q)) ||
          a.notes.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (dateFilter === "today" && a.date !== todayStr) return false;
      if (dateFilter === "tomorrow" && a.date !== tomorrowStr) return false;
      if (dateFilter === "upcoming" && a.date < todayStr) return false;
      if (dateFilter === "past" && a.date >= todayStr) return false;

      if (typeFilter === "service" && a.sourceType !== "service") return false;
      if (typeFilter === "test_drive" && (a.sourceType !== "inquiry" || a.typeLabel !== "Test Drive")) return false;
      if (typeFilter === "consultation" && (a.sourceType !== "inquiry" || a.typeLabel !== "Consultation")) return false;

      if (statusFilter !== "all" && a.status !== statusFilter) return false;

      return true;
    });
  }, [allAppointments, searchTerm, dateFilter, typeFilter, statusFilter, todayStr, tomorrowStr]);

  const handleUpdateStatus = (apt: typeof allAppointments[0], newStatus: string) => {
    if (newStatus === "postponed") {
      setPostponeApt(apt);
      setPostponeDate(apt.date || todayStr);
      setPostponeSlot(apt.timeSlot || "09:30 AM - 11:00 AM (Morning Slot)");
      return;
    }
    if (apt.sourceType === "service") {
      updateTokenStatus.mutate(
        { id: apt.sourceId, status: newStatus },
        {
          onSuccess: () => {
            setActionSuccess(`Service appointment #${apt.token || apt.sourceId} updated to ${newStatus}`);
            setTimeout(() => setActionSuccess(""), 4000);
          },
        }
      );
    } else {
      const mappedStatus: "new" | "contacted" | "completed" | "closed" =
        newStatus === "completed"
          ? "completed"
          : newStatus === "cancelled"
          ? "closed"
          : newStatus === "in_bay"
          ? "contacted"
          : "new";
      updateInquiryStatus.mutate(
        { id: apt.sourceId, status: mappedStatus },
        {
          onSuccess: () => {
            setActionSuccess(`Appointment #${apt.sourceId} updated to ${newStatus}`);
            setTimeout(() => setActionSuccess(""), 4000);
          },
        }
      );
    }
  };

  const handleSavePostpone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postponeApt) return;
    if (postponeApt.sourceType === "service") {
      updateTokenStatus.mutate(
        { id: postponeApt.sourceId, status: "postponed", date: postponeDate, timeSlot: postponeSlot },
        {
          onSuccess: () => {
            setActionSuccess(`Service appointment #${postponeApt.token || postponeApt.sourceId} rescheduled to ${postponeDate} (${postponeSlot})`);
            setPostponeApt(null);
            setTimeout(() => setActionSuccess(""), 4000);
          },
        }
      );
    } else {
      updateInquiryStatus.mutate(
        { id: postponeApt.sourceId, status: "contacted", confirmedSlotTime: `${postponeDate} ${postponeSlot}`, slotConfirmed: true },
        {
          onSuccess: () => {
            setActionSuccess(`Appointment #${postponeApt.sourceId} rescheduled to ${postponeDate} (${postponeSlot})`);
            setPostponeApt(null);
            setTimeout(() => setActionSuccess(""), 4000);
          },
        }
      );
    }
  };

  const handleDelete = (apt: typeof allAppointments[0]) => {
    if (!window.confirm(`Are you sure you want to delete this appointment for ${apt.customerName}?`)) return;
    if (apt.sourceType === "service") {
      deleteToken.mutate(apt.sourceId, {
        onSuccess: () => {
          setActionSuccess(`Appointment record removed.`);
          setTimeout(() => setActionSuccess(""), 4000);
        },
      });
    } else {
      deleteInquiry.mutate(apt.sourceId, {
        onSuccess: () => {
          setActionSuccess(`Inquiry record removed.`);
          setTimeout(() => setActionSuccess(""), 4000);
        },
      });
    }
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bookService.mutate(
      {
        customerName: bookingForm.customerName.trim(),
        phone: bookingForm.phone.trim(),
        email: bookingForm.email.trim(),
        carDetails: bookingForm.carDetails.trim(),
        servicePackage: bookingForm.servicePackage,
        date: bookingForm.date,
        timeSlot: bookingForm.timeSlot,
        notes: bookingForm.notes.trim(),
      },
      {
        onSuccess: (data) => {
          setBookModalOpen(false);
          setActionSuccess(`New Appointment Booked Successfully! Token: ${data.token}`);
          setBookingForm({
            customerName: "",
            phone: "",
            email: "",
            carDetails: "",
            servicePackage: "Periodic Maintenance & 50-Pt Inspection",
            date: todayStr,
            timeSlot: "10:30 AM",
            notes: "",
          });
          setTimeout(() => setActionSuccess(""), 5000);
        },
      }
    );
  };

  const isLoading = loadingBookings || loadingInquiries;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ color: "var(--text-main)", margin: 0, fontSize: 24, fontWeight: 800 }}>Dealership Appointment Schedule</h2>
          <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: 14 }}>
            All customer test drives, showroom consultations, and service bay reservations in one live schedule.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setBookModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={14} />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            color: "#34d399",
            padding: "10px 16px",
            borderRadius: "var(--radius-sm)",
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "var(--bg-surface)", padding: 20, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Total All Appointments</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#38bdf8", marginTop: 4 }}>{stats.total}</div>
        </div>

        <div style={{ background: "var(--bg-surface)", padding: 20, borderRadius: "var(--radius-md)", border: stats.today > 0 ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Scheduled Today</span>
            {stats.today > 0 && <span className="badge badge-red" style={{ fontSize: 10 }}>TODAY</span>}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--primary)", marginTop: 4 }}>{stats.today}</div>
        </div>

        <div style={{ background: "var(--bg-surface)", padding: 20, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Confirmed & Active</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent-green)", marginTop: 4 }}>{stats.confirmed}</div>
        </div>

        <div style={{ background: "var(--bg-surface)", padding: 20, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Pending Action</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent-gold)", marginTop: 4 }}>{stats.pending}</div>
        </div>
      </div>

      <div
        style={{
          background: "var(--bg-surface)",
          padding: 16,
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          marginBottom: 24,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
          <input
            type="text"
            placeholder="Search by customer name, phone, car, token..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: 36, width: "100%", fontSize: 13 }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="form-select"
            style={{ fontSize: 13, minWidth: 140 }}
          >
            <option value="all">All Dates</option>
            <option value="today">Scheduled Today</option>
            <option value="tomorrow">Scheduled Tomorrow</option>
            <option value="upcoming">Upcoming Future</option>
            <option value="past">Past Records</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="form-select"
            style={{ fontSize: 13, minWidth: 140 }}
          >
            <option value="all">All Types</option>
            <option value="service">Service Bay</option>
            <option value="test_drive">Test Drives</option>
            <option value="consultation">Showroom Consultations</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="form-select"
            style={{ fontSize: 13, minWidth: 130 }}
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_bay">In Bay / Active</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="postponed">Postponed / Rescheduled</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {(searchTerm || dateFilter !== "all" || typeFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setDateFilter("all");
                setTypeFilter("all");
                setStatusFilter("all");
              }}
              className="btn btn-glass btn-sm"
              style={{ fontSize: 12 }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: 48, textAlign: "center" }}>
          <RefreshCw className="animate-spin" size={24} style={{ color: "var(--primary)" }} />
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div
          style={{
            background: "var(--bg-surface)",
            padding: 48,
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--border)",
            textAlign: "center",
          }}
        >
          <CalendarClock size={36} color="var(--text-dim)" style={{ margin: "0 auto 12px" }} />
          <h4 style={{ color: "var(--text-main)", fontSize: 16, margin: "0 0 6px" }}>No Appointments Found</h4>
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "0 0 16px" }}>
            No records matched your search filters.
          </p>
          <button onClick={() => setBookModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={14} />
            <span>Book New Appointment</span>
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
          {filteredAppointments.map((apt) => {
            const isToday = apt.date === todayStr;
            const isTomorrow = apt.date === tomorrowStr;
            const cleanPhone = apt.phone.replace(/[^0-9]/g, "");

            return (
              <div
                key={apt.id}
                style={{
                  background: isToday ? "rgba(239, 68, 68, 0.04)" : "var(--bg-surface)",
                  border: isToday ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: isToday ? "0 4px 18px rgba(239, 68, 68, 0.1)" : "none",
                  transition: "all 0.2s",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        className={`badge ${
                          apt.typeLabel === "Service Bay"
                            ? "badge-green"
                            : apt.typeLabel === "Test Drive"
                            ? "badge-gold"
                            : "badge-blue"
                        }`}
                        style={{ fontSize: 11 }}
                      >
                        {apt.typeLabel}
                      </span>
                      {apt.token && (
                        <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--primary)", fontWeight: 700 }}>
                          {apt.token}
                        </span>
                      )}
                    </div>

                    <div>
                      {apt.status === "postponed" ? (
                        <span className="badge" style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc", border: "1px solid #a855f7", fontSize: 10, fontWeight: 700 }}>
                          POSTPONED
                        </span>
                      ) : isToday ? (
                        <span className="badge badge-red" style={{ fontSize: 10, fontWeight: 800 }}>
                          TODAY
                        </span>
                      ) : isTomorrow ? (
                        <span className="badge badge-gold" style={{ fontSize: 10, fontWeight: 700 }}>
                          TOMORROW
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600 }}>{apt.date}</span>
                      )}
                    </div>
                  </div>

                  <h3 style={{ color: "var(--text-main)", margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>
                    {apt.customerName}
                  </h3>

                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={13} color="var(--primary)" />
                    <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{apt.timeSlot}</span>
                    <span>·</span>
                    <span style={{ color: apt.status === "postponed" ? "#c084fc" : "inherit", fontWeight: apt.status === "postponed" ? 700 : 400 }}>
                      {apt.status === "postponed" ? `Confirmed: ${apt.date}` : apt.date}
                    </span>
                  </div>

                  <div
                    style={{
                      background: "var(--bg-deep)",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-main)" }}>
                      {apt.carDetails}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                      {apt.servicePackage}
                    </div>
                    {apt.notes && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, fontStyle: "italic", borderTop: "1px dashed var(--border)", paddingTop: 4 }}>
                        "{apt.notes}"
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600 }}>Status:</span>
                    <select
                      value={apt.status}
                      onChange={(e) => handleUpdateStatus(apt, e.target.value)}
                      className="form-select"
                      style={{
                        fontSize: 11,
                        padding: "3px 8px",
                        width: "auto",
                        background: apt.status === "postponed" ? "rgba(168, 85, 247, 0.15)" : "inherit",
                        borderColor: apt.status === "postponed" ? "#a855f7" : "inherit",
                        color: "var(--text-main)",
                        fontWeight: 600,
                      }}
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="in_bay">In Bay / Active</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="postponed">Postponed / Rescheduled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 12, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPostponeApt(apt);
                        setPostponeDate(apt.date || todayStr);
                        setPostponeSlot(apt.timeSlot || "09:30 AM - 11:00 AM (Morning Slot)");
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, justifyContent: "center", fontSize: 11, padding: "5px 8px", borderColor: "rgba(168, 85, 247, 0.4)", color: "#c084fc" }}
                      title="Postpone and Confirm New Date"
                    >
                      <CalendarClock size={12} />
                      <span>Postpone</span>
                    </button>

                    <a
                      href={`tel:${cleanPhone}`}
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, justifyContent: "center", fontSize: 11, padding: "5px 8px" }}
                    >
                      <Phone size={12} color="var(--primary)" />
                      <span>Call</span>
                    </a>

                    <a
                      href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(apt.customerName)},%20regarding%20your%20Passion%20Car%20appointment...`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-glass btn-sm"
                      style={{ flex: 1, justifyContent: "center", fontSize: 11, padding: "5px 8px", color: "#34d399" }}
                    >
                      <MessageSquare size={12} />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      onClick={() => handleDelete(apt)}
                      className="btn btn-glass btn-sm"
                      style={{ padding: "5px 8px", color: "var(--text-dim)" }}
                      title="Delete appointment"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {bookModalOpen && (
        <div className="modal-backdrop" onClick={() => setBookModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520, width: "100%", background: "var(--bg-surface)" }}
          >
            <div className="modal-header">
              <h3 style={{ margin: 0, color: "var(--text-main)", fontSize: 18, fontWeight: 700 }}>
                Book Dealership Appointment
              </h3>
              <button
                type="button"
                onClick={() => setBookModalOpen(false)}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBookSubmit} style={{ padding: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="form-label">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.customerName}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, customerName: e.target.value }))}
                    placeholder="e.g. Rahul Sharma"
                    className="form-input"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="client@gmail.com"
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Vehicle Make / Model *</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.carDetails}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, carDetails: e.target.value }))}
                    placeholder="e.g. 2021 BMW 530d M-Sport (TS09...)"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Appointment / Package Type</label>
                  <select
                    value={bookingForm.servicePackage}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, servicePackage: e.target.value }))}
                    className="form-select"
                  >
                    <option value="Periodic Maintenance & 50-Pt Inspection">Periodic Maintenance & 50-Pt Inspection</option>
                    <option value="Certified Vehicle Test Drive">Certified Vehicle Test Drive</option>
                    <option value="Comprehensive Diagnostic Bay Pass">Comprehensive Diagnostic Bay Pass</option>
                    <option value="Brake & Suspension Overhaul">Brake & Suspension Overhaul</option>
                    <option value="AC & Climate Control Servicing">AC & Climate Control Servicing</option>
                    <option value="Pre-Purchase 140-Point Inspection">Pre-Purchase 140-Point Inspection</option>
                    <option value="Ceramic Coating & Detailing Bay">Ceramic Coating & Detailing Bay</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      required
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, date: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Preferred Time Slot *</label>
                    <select
                      value={bookingForm.timeSlot}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, timeSlot: e.target.value }))}
                      className="form-select"
                    >
                      <option value="09:30 AM">09:30 AM</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="01:30 PM">01:30 PM</option>
                      <option value="02:30 PM">02:30 PM</option>
                      <option value="03:30 PM">03:30 PM</option>
                      <option value="04:30 PM">04:30 PM</option>
                      <option value="05:30 PM">05:30 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Special Notes / Instructions</label>
                  <textarea
                    rows={2}
                    value={bookingForm.notes}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Customer requests engine oil check, wheel balancing..."
                    className="form-textarea"
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setBookModalOpen(false)}
                    className="btn btn-glass"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bookService.isPending}
                    className="btn btn-primary"
                  >
                    {bookService.isPending ? "Generating Token..." : "Confirm & Issue Token"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {postponeApt && (
        <div className="modal-backdrop" onClick={() => setPostponeApt(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520, width: "100%", background: "var(--bg-surface)" }}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CalendarClock size={20} color="#a855f7" />
                <h3 style={{ margin: 0, color: "var(--text-main)", fontSize: 18, fontWeight: 700 }}>
                  Postpone Appointment & Confirm New Date
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPostponeApt(null)}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ background: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.25)", borderRadius: "var(--radius-sm)", padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)" }}>{postponeApt.customerName} · {postponeApt.phone}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{postponeApt.carDetails} ({postponeApt.servicePackage})</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>Current Scheduled Date: {postponeApt.date} · {postponeApt.timeSlot}</div>
              </div>

              <form onSubmit={handleSavePostpone} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">New Confirmed Date *</label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={postponeDate}
                    onChange={(e) => setPostponeDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirmed Time Slot *</label>
                  <select
                    value={postponeSlot}
                    onChange={(e) => setPostponeSlot(e.target.value)}
                    className="form-select"
                  >
                    <option value="09:30 AM - 11:00 AM (Morning Slot)">09:30 AM - 11:00 AM (Morning Slot)</option>
                    <option value="11:00 AM - 12:30 PM (Mid-Day Slot)">11:00 AM - 12:30 PM (Mid-Day Slot)</option>
                    <option value="02:00 PM - 03:30 PM (Afternoon Slot)">02:00 PM - 03:30 PM (Afternoon Slot)</option>
                    <option value="03:30 PM - 05:00 PM (Late Afternoon Slot)">03:30 PM - 05:00 PM (Late Afternoon Slot)</option>
                    <option value="05:00 PM - 06:30 PM (Evening Slot)">05:00 PM - 06:30 PM (Evening Slot)</option>
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => setPostponeApt(null)} className="btn btn-glass">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ background: "#a855f7", borderColor: "#a855f7" }}>
                    Confirm & Save New Date
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminCarsTab() {
  const { data: vehicles = [], isLoading } = useAdminVehicles();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [viewingVehicleId, setViewingVehicleId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const hashMatch = window.location.hash.match(/^#admin\/cars-view-(\d+)/);
    return hashMatch ? parseInt(hashMatch[1], 10) : null;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fuelFilter, setFuelFilter] = useState<string>("all");
  const [bodyFilter, setBodyFilter] = useState<string>("all");
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recommended");

  const deleteCar = useDeleteVehicle();
  const updateVehicle = useUpdateVehicle();

  const handleAddNew = () => {
    setEditingVehicle(null);
    setEditorOpen(true);
    window.history.pushState({ modal: "admin-car-editor" }, "", "#admin/cars-new");
  };

  const handleEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setEditorOpen(true);
    window.history.pushState({ modal: "admin-car-editor", carId: v.id }, "", `#admin/cars-edit-${v.id}`);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    if (window.location.hash.includes("cars-new") || window.location.hash.includes("cars-edit")) {
      window.history.back();
    }
  };

  const handleViewCar = (v: Vehicle) => {
    setViewingVehicleId(v.id);
    window.history.pushState({ modal: "admin-car-view", carId: v.id }, "", `#admin/cars-view-${v.id}`);
  };

  const handleCloseViewCar = () => {
    setViewingVehicleId(null);
    if (window.location.hash.includes("cars-view")) {
      window.history.back();
    }
  };

  useEffect(() => {
    const syncAdminCarsRoute = () => {
      const h = window.location.hash || "";
      if (h.includes("cars-new")) {
        setEditingVehicle(null);
        setEditorOpen(true);
      } else {
        const editMatch = h.match(/^#admin\/cars-edit-(\d+)/);
        if (editMatch) {
          const editId = parseInt(editMatch[1], 10);
          const found = vehicles.find((v) => v.id === editId);
          if (found) {
            setEditingVehicle(found);
            setEditorOpen(true);
          }
        } else if (!window.history.state || window.history.state.modal !== "admin-car-editor") {
          setEditorOpen(false);
        }
      }

      const viewMatch = h.match(/^#admin\/cars-view-(\d+)/);
      if (viewMatch) {
        setViewingVehicleId(parseInt(viewMatch[1], 10));
      } else if (!window.history.state || window.history.state.modal !== "admin-car-view") {
        setViewingVehicleId(null);
      }
    };

    window.addEventListener("popstate", syncAdminCarsRoute);
    window.addEventListener("hashchange", syncAdminCarsRoute);
    syncAdminCarsRoute();
    return () => {
      window.removeEventListener("popstate", syncAdminCarsRoute);
      window.removeEventListener("hashchange", syncAdminCarsRoute);
    };
  }, [vehicles]);

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteCar.mutate(id);
    }
  };

  const availableCars = vehicles.filter((v) => v.status === "available");
  const totalInventoryPrice = availableCars.reduce((sum, v) => sum + (v.priceInr || 0), 0);
  const avgPrice = availableCars.length > 0 ? Math.round(totalInventoryPrice / availableCars.length) : 0;

  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter((v) => {
        if (statusFilter !== "all" && v.status !== statusFilter) return false;
        if (fuelFilter !== "all" && v.fuelType.toLowerCase() !== fuelFilter.toLowerCase()) return false;
        if (bodyFilter !== "all" && v.bodyType.toLowerCase() !== bodyFilter.toLowerCase()) return false;

        if (priceRangeFilter !== "all") {
          const price = v.priceInr || 0;
          if (priceRangeFilter === "under10" && price >= 1000000) return false;
          if (priceRangeFilter === "10to25" && (price < 1000000 || price > 2500000)) return false;
          if (priceRangeFilter === "25to50" && (price < 2500000 || price > 5000000)) return false;
          if (priceRangeFilter === "50plus" && price < 5000000) return false;
        }

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchMake = (v.make || "").toLowerCase().includes(q);
          const matchModel = (v.model || "").toLowerCase().includes(q);
          const matchVariant = (v.variant || "").toLowerCase().includes(q);
          const matchYear = String(v.year || "").includes(q);
          const matchFuel = (v.fuelType || "").toLowerCase().includes(q);
          const matchTrans = (v.transmission || "").toLowerCase().includes(q);
          const matchCity = (v.city || "").toLowerCase().includes(q);
          return matchMake || matchModel || matchVariant || matchYear || matchFuel || matchTrans || matchCity;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return (a.priceInr || 0) - (b.priceInr || 0);
        if (sortBy === "price-desc") return (b.priceInr || 0) - (a.priceInr || 0);
        if (sortBy === "year-desc") return (b.year || 0) - (a.year || 0);
        if (sortBy === "km-asc") return (a.kilometers || 0) - (b.kilometers || 0);
        return 0;
      });
  }, [vehicles, searchTerm, statusFilter, fuelFilter, bodyFilter, priceRangeFilter, sortBy]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ color: "var(--text-main)", margin: 0, fontSize: 24, fontWeight: 800 }}>Cars Inventory Management</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            Manage cars, search models, filter inventory pricing, and view stock valuation.
          </p>
        </div>

        <button onClick={handleAddNew} className="btn btn-primary">
          <Plus size={16} />
          <span>Add New Car</span>
        </button>
      </div>

      <div className="admin-kpi-grid">
        <div
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, var(--bg-surface) 100%)",
            border: "1px solid #10b981",
            borderRadius: "var(--radius-md)",
            padding: "16px 20px",
          }}
        >
          <span style={{ fontSize: 12, color: "#a7f3d0", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Total Stock Value (Price)
          </span>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#10b981", marginTop: 4 }}>
            {formatInr(totalInventoryPrice)}
          </div>
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, display: "block" }}>
            Across {availableCars.length} available vehicles
          </span>
        </div>

        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "16px 20px",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>
            Average Car Price
          </span>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#38bdf8", marginTop: 4 }}>
            {formatInr(avgPrice)}
          </div>
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, display: "block" }}>
            Dealership fleet average
          </span>
        </div>

        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "16px 20px",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>
            Total Cars in Fleet
          </span>
          <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text-main)", marginTop: 4 }}>
            {vehicles.length}
          </div>
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, display: "block" }}>
            {availableCars.length} available · {vehicles.length - availableCars.length} sold
          </span>
        </div>
      </div>

      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: 16,
          marginBottom: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 260px", position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Search car by brand, model (Polo, Creta, 3 Series), variant, or year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ width: "100%", paddingLeft: 38, fontSize: 13 }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={14} color="var(--text-muted)" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select"
                style={{ fontSize: 12, padding: "6px 10px" }}
              >
                <option value="all">All Status ({vehicles.length})</option>
                <option value="available">Available Only ({availableCars.length})</option>
                <option value="sold">Sold Cars ({vehicles.length - availableCars.length})</option>
              </select>
            </div>

            <select
              value={fuelFilter}
              onChange={(e) => setFuelFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: 12, padding: "6px 10px" }}
            >
              <option value="all">All Fuel Types</option>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="ev">Electric (EV)</option>
              <option value="hybrid">Hybrid</option>
              <option value="cng">CNG</option>
            </select>

            <select
              value={priceRangeFilter}
              onChange={(e) => setPriceRangeFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: 12, padding: "6px 10px" }}
            >
              <option value="all">All Prices</option>
              <option value="under10">Under ₹10 Lakh</option>
              <option value="10to25">₹10L - ₹25 Lakh</option>
              <option value="25to50">₹25L - ₹50 Lakh</option>
              <option value="50plus">Above ₹50 Lakh</option>
            </select>

            <select
              value={bodyFilter}
              onChange={(e) => setBodyFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: 12, padding: "6px 10px" }}
            >
              <option value="all">All Body Types</option>
              <option value="hatchback">Hatchback</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select"
              style={{ fontSize: 12, padding: "6px 10px" }}
            >
              <option value="recommended">Sort: Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="year-desc">Year: Newest First</option>
              <option value="km-asc">Kilometers: Lowest</option>
            </select>

            {(searchTerm || statusFilter !== "all" || fuelFilter !== "all" || bodyFilter !== "all" || priceRangeFilter !== "all" || sortBy !== "recommended") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setFuelFilter("all");
                  setBodyFilter("all");
                  setPriceRangeFilter("all");
                  setSortBy("recommended");
                }}
                className="btn btn-outline btn-sm"
                style={{ fontSize: 11 }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          <span>Showing <strong>{filteredVehicles.length}</strong> of {vehicles.length} cars</span>
          <span>Filtered Stock Value: <strong style={{ color: "#10b981" }}>{formatInr(filteredVehicles.reduce((s, c) => s + (c.priceInr || 0), 0))}</strong></span>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40 }}><RefreshCw className="animate-spin" size={24} /></div>
      ) : filteredVehicles.length === 0 ? (
        <div style={{ padding: 40, background: "var(--bg-surface)", borderRadius: "var(--radius-md)", textAlign: "center", border: "1px solid var(--border)" }}>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>No vehicles match your search and filter criteria.</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <div className="admin-scroll-hint">↔ Swipe horizontally to view full cars inventory</div>
          <table className="admin-table-responsive" style={{ minWidth: 780 }}>
            <thead>
              <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <th style={{ padding: "14px 18px" }}>Vehicle & Price</th>
                <th style={{ padding: "14px 18px" }}>Fuel & Trans</th>
                <th style={{ padding: "14px 18px" }}>Kilometers</th>
                <th style={{ padding: "14px 18px", background: "rgba(16, 185, 129, 0.08)", color: "#10b981", fontWeight: 800 }}>
                  Price (₹ INR)
                </th>
                <th style={{ padding: "14px 18px" }}>Status</th>
                <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((v) => (
                <tr key={v.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "14px 18px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                      onClick={() => handleViewCar(v)}
                      title="Click to preview car details"
                    >
                      <img
                        src={v.imageUrls[0] || "/images/hero-delivery.webp"}
                        alt={v.model}
                        style={{ width: 56, height: 42, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }}
                      />
                      <div>
                        <strong style={{ color: "var(--text-main)", fontSize: 15 }}>{v.year} {v.make} {v.model}</strong>
                        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{v.variant}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#10b981", marginTop: 3 }}>
                          Price: {formatInr(v.priceInr)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px" }}>{v.fuelType} · {v.transmission}</td>
                  <td style={{ padding: "14px 18px" }}>{formatNumber(v.kilometers)} km</td>
                  <td style={{ padding: "14px 18px", whiteSpace: "nowrap", background: "rgba(16, 185, 129, 0.04)" }}>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 900,
                        color: "#10b981",
                        background: "rgba(16, 185, 129, 0.15)",
                        border: "1px solid #10b981",
                        padding: "5px 12px",
                        borderRadius: 6,
                        display: "inline-block",
                      }}
                    >
                      {formatInr(v.priceInr)}
                    </span>
                  </td>
                  <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                    <select
                      value={v.status}
                      onChange={(e) => updateVehicle.mutate({ id: v.id, input: { status: e.target.value as "available" | "sold" } })}
                      disabled={updateVehicle.isPending}
                      className="form-select"
                      style={{
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        borderRadius: 6,
                        cursor: "pointer",
                        background: v.status === "available" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                        border: v.status === "available" ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(239, 68, 68, 0.4)",
                        color: v.status === "available" ? "#10b981" : "#ef4444",
                      }}
                      title="Change vehicle status"
                    >
                      <option value="available" style={{ background: "var(--bg-card)", color: "var(--text-main)" }}>Available</option>
                      <option value="sold" style={{ background: "var(--bg-card)", color: "var(--text-main)" }}>Sold</option>
                    </select>
                  </td>
                  <td style={{ padding: "14px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <button onClick={() => handleViewCar(v)} className="btn btn-outline btn-sm" style={{ marginRight: 8 }} title="View details">
                      <Eye size={14} />
                      <span>View</span>
                    </button>
                    <button onClick={() => handleEdit(v)} className="btn btn-glass btn-sm" style={{ marginRight: 8 }}>
                      <Edit3 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(v.id, `${v.make} ${v.model}`)}
                      className="btn btn-outline btn-sm text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editorOpen && (
        <CarEditorModal
          vehicle={editingVehicle}
          onClose={handleCloseEditor}
        />
      )}

      {viewingVehicleId && (
        <VehicleDetailModal
          id={viewingVehicleId}
          onClose={handleCloseViewCar}
          onBookThisCar={() => {}}
        />
      )}
    </div>
  );
}

function GalleryPickerModal({
  currentCount,
  maxAllowed = 13,
  onSelect,
  onClose,
}: {
  currentCount: number;
  maxAllowed?: number;
  onSelect: (selectedUrls: string[]) => void;
  onClose: () => void;
}) {
  const { data: gallery = [], isLoading } = useGallery("all");
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const remainingSlots = Math.max(0, maxAllowed - currentCount);

  const toggleSelect = (url: string) => {
    if (selectedUrls.includes(url)) {
      setSelectedUrls((prev) => prev.filter((u) => u !== url));
    } else {
      if (selectedUrls.length >= remainingSlots) {
        alert(`You can only select up to ${remainingSlots} more photo(s) to stay within the 13 photos limit.`);
        return;
      }
      setSelectedUrls((prev) => [...prev, url]);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedUrls);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10001 }}>
      <div className="modal-content" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ color: "#ffffff", fontSize: 18 }}>Select Photos from Showroom Gallery</h3>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>
              Choose existing showroom, facility, or delivery photos ({selectedUrls.length} selected · {remainingSlots} slots available)
            </p>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: 36 }}>
              <RefreshCw className="animate-spin" size={24} style={{ margin: "0 auto 10px" }} />
              <p style={{ color: "var(--text-muted)" }}>Loading showroom photos...</p>
            </div>
          ) : gallery.length === 0 ? (
            <div style={{ textAlign: "center", padding: 36, color: "var(--text-muted)" }}>
              No showroom photos available in gallery yet.
            </div>
          ) : (
            <div className="gallery-picker-grid">
              {gallery.map((item) => {
                const isSelected = selectedUrls.includes(item.imageUrl);
                return (
                  <div
                    key={item.id}
                    className={`gallery-picker-card ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleSelect(item.imageUrl)}
                    title={item.title}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {isSelected && (
                      <div className="gallery-picker-check">
                        <Check size={14} />
                      </div>
                    )}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "rgba(0,0,0,0.75)",
                        padding: "4px 8px",
                        fontSize: 11,
                        color: "#fff",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.title}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              {selectedUrls.length} photos chosen (Max 13 total per car listing)
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={selectedUrls.length === 0}
                className="btn btn-primary btn-sm"
              >
                Add {selectedUrls.length > 0 ? `${selectedUrls.length} Selected Photos` : "Photos"} to Car
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CarEditorModal({
  vehicle,
  onClose,
}: {
  vehicle: Vehicle | null;
  onClose: () => void;
}) {
  const MAX_IMAGES = 13;

  const [form, setForm] = useState<VehicleInput>(() => {
    if (vehicle) {
      return {
        make: vehicle.make,
        model: vehicle.model,
        variant: vehicle.variant,
        year: vehicle.year,
        priceInr: vehicle.priceInr,
        bodyType: vehicle.bodyType,
        fuelType: vehicle.fuelType as any,
        transmission: vehicle.transmission,
        kilometers: vehicle.kilometers,
        owners: vehicle.owners || 1,
        color: vehicle.color || "",
        city: vehicle.city || "Hyderabad",
        engineType: vehicle.engineType || "",
        engineCapacityCc: vehicle.engineCapacityCc || null,
        engineLengthMm: vehicle.engineLengthMm || null,
        powerBhp: vehicle.powerBhp || null,
        torqueNm: vehicle.torqueNm || null,
        lengthMm: vehicle.lengthMm || null,
        widthMm: vehicle.widthMm || null,
        heightMm: vehicle.heightMm || null,
        wheelbaseMm: vehicle.wheelbaseMm || null,
        groundClearanceMm: vehicle.groundClearanceMm || null,
        bootSpaceLitres: vehicle.bootSpaceLitres || null,
        seatingCapacity: vehicle.seatingCapacity || 5,
        fuelEfficiency: vehicle.fuelEfficiency || "",
        batteryCapacityKwh: vehicle.batteryCapacityKwh || null,
        rangeKm: vehicle.rangeKm || null,
        description: vehicle.description || "",
        features: vehicle.features || [],
        imageUrls: (vehicle.imageUrls || []).slice(0, MAX_IMAGES),
        status: vehicle.status || "available",
      };
    }
    return {
      make: "Volkswagen",
      model: "Polo",
      variant: "TSI MT BSIV",
      year: 2021,
      priceInr: 650000,
      bodyType: "Hatchback",
      fuelType: "Petrol",
      transmission: "Manual",
      kilometers: 30000,
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
      description: "Certified pre-owned vehicle inspected by Passion Car.",
      features: ["Power Steering", "ABS", "Airbags", "Touchscreen Infotainment", "Rear Camera"],
      imageUrls: ["https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80"],
      status: "available",
    };
  });

  const [imageUrlInput, setImageUrlInput] = useState("");
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const uploadMultiple = useUploadMultipleImages();

  const { data: suggestion, isFetching: loadingSuggestion } = useVehicleSuggestions({
    make: form.make,
    model: form.model,
    fuelType: form.fuelType,
  });

  const applyAutoSuggestions = () => {
    if (!suggestion) return;
    setForm((prev) => ({
      ...prev,
      bodyType: (suggestion as any).bodyType || prev.bodyType,
      engineType: suggestion.engineType || prev.engineType,
      engineCapacityCc: suggestion.engineCapacityCc ?? prev.engineCapacityCc,
      powerBhp: suggestion.powerBhp ?? prev.powerBhp,
      torqueNm: suggestion.torqueNm ?? prev.torqueNm,
      lengthMm: suggestion.lengthMm ?? prev.lengthMm,
      widthMm: suggestion.widthMm ?? prev.widthMm,
      heightMm: suggestion.heightMm ?? prev.heightMm,
      wheelbaseMm: suggestion.wheelbaseMm ?? prev.wheelbaseMm,
      groundClearanceMm: suggestion.groundClearanceMm ?? prev.groundClearanceMm,
      bootSpaceLitres: suggestion.bootSpaceLitres ?? prev.bootSpaceLitres,
      seatingCapacity: suggestion.seatingCapacity ?? prev.seatingCapacity,
      fuelEfficiency: suggestion.fuelEfficiency ?? prev.fuelEfficiency,
      batteryCapacityKwh: suggestion.batteryCapacityKwh ?? prev.batteryCapacityKwh,
      rangeKm: suggestion.rangeKm ?? prev.rangeKm,
      features: (suggestion as any).features?.length ? (suggestion as any).features : prev.features,
    }));
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    if (form.imageUrls.length >= MAX_IMAGES) {
      alert(`Maximum limit of ${MAX_IMAGES} photos reached for this car listing.`);
      return;
    }
    setForm((p) => ({ ...p, imageUrls: [...p.imageUrls, imageUrlInput.trim()].slice(0, MAX_IMAGES) }));
    setImageUrlInput("");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - form.imageUrls.length;
    if (remainingSlots <= 0) {
      alert(`Maximum limit of ${MAX_IMAGES} photos reached for this car.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploading(true);

    try {
      const readPromises = filesToUpload.map((file) => compressImageFile(file, 1600, 0.82));
      const base64List = await Promise.all(readPromises);
      const res = await uploadMultiple.mutateAsync({ images: base64List });

      if (res?.urls && res.urls.length > 0) {
        setForm((prev) => ({
          ...prev,
          imageUrls: [...prev.imageUrls, ...res.urls].slice(0, MAX_IMAGES),
        }));
      }
    } catch (err) {
      console.error("File upload failed:", err);
      alert("Failed to upload selected photos. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGallerySelect = (selectedUrls: string[]) => {
    setForm((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, ...selectedUrls].slice(0, MAX_IMAGES),
    }));
  };

  const handleMakeCover = (index: number) => {
    if (index === 0) return;
    setForm((prev) => {
      const copy = [...prev.imageUrls];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return { ...prev, imageUrls: copy };
    });
  };

  const handleMovePhoto = (from: number, to: number) => {
    if (to < 0 || to >= form.imageUrls.length) return;
    setForm((prev) => {
      const copy = [...prev.imageUrls];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return { ...prev, imageUrls: copy };
    });
  };

  const handleRemoveImage = (idx: number) => {
    setForm((p) => ({ ...p, imageUrls: p.imageUrls.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vehicle) {
      updateVehicle.mutate(
        { id: vehicle.id, input: form },
        {
          onSuccess: onClose,
          onError: (err: any) => {
            alert(`Could not update vehicle: ${err?.message || "Please check details and try again."}`);
          },
        }
      );
    } else {
      createVehicle.mutate(form, {
        onSuccess: onClose,
        onError: (err: any) => {
          alert(`Could not save vehicle: ${err?.message || "Please check details and try again."}`);
        },
      });
    }
  };

  const isAtMaxImages = form.imageUrls.length >= MAX_IMAGES;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content car-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ color: "#ffffff", fontSize: "clamp(16px, 4vw, 20px)" }}>
              {vehicle ? `Edit Vehicle: ${vehicle.make} ${vehicle.model}` : "Add New Vehicle with Auto-Suggestions"}
            </h3>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Upload up to 13 photos per car, pick from Showroom Gallery, or use smart auto-fill.
            </span>
          </div>
          <button onClick={onClose} className="modal-close-btn" type="button"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="car-editor-form">
          <div className="car-editor-form-body">
          
          <div
            style={{
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(56, 189, 248, 0.1) 100%)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "var(--radius-sm)",
              padding: "16px 20px",
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <strong style={{ color: "#ffffff", display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={16} className="text-amber-400" />
                <span>Automotive Intelligence Auto-Suggest</span>
              </strong>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                Enter Make, Model, and Fuel Type below, then click to auto-fill displacement, boot space, power, and torque.
              </p>
            </div>

            <button
              type="button"
              onClick={applyAutoSuggestions}
              disabled={loadingSuggestion}
              className="btn btn-primary btn-sm"
            >
              <Zap size={14} />
              <span>Apply Auto-Suggestions</span>
            </button>
          </div>

          <div className="car-editor-grid">
            <div className="form-group">
              <label className="form-label">Make (Brand) *</label>
              <input
                type="text"
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
                className="form-input"
                placeholder="Volkswagen, Honda, Hyundai..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Model *</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="form-input"
                placeholder="Polo, City, Creta..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Variant</label>
              <input
                type="text"
                value={form.variant}
                onChange={(e) => setForm({ ...form, variant: e.target.value })}
                className="form-input"
                placeholder="TSI MT BSIV"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Year *</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Vehicle Price (INR) *</label>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#10b981",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid #10b981",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  Formatted: {formatInr(form.priceInr || 0)}
                </span>
              </div>
              <input
                type="number"
                value={form.priceInr}
                onChange={(e) => setForm({ ...form, priceInr: Number(e.target.value) })}
                className="form-input"
                style={{ fontSize: 16, fontWeight: 700, color: "#10b981" }}
                placeholder="e.g. 650000"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Kilometers *</label>
              <input
                type="number"
                value={form.kilometers}
                onChange={(e) => setForm({ ...form, kilometers: Number(e.target.value) })}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fuel Type *</label>
              <select
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value as any })}
                className="form-select"
              >
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="EV">EV</option>
                <option value="Hybrid">Hybrid</option>
                <option value="CNG">CNG</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Transmission</label>
              <select
                value={form.transmission}
                onChange={(e) => setForm({ ...form, transmission: e.target.value })}
                className="form-select"
              >
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
                <option value="Automatic DSG">Automatic DSG</option>
                <option value="CVT Automatic">CVT Automatic</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Body Type</label>
              <select
                value={form.bodyType}
                onChange={(e) => setForm({ ...form, bodyType: e.target.value })}
                className="form-select"
              >
                <option value="Hatchback">Hatchback</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: "span 3" }}>
              <label className="form-label">Engine Type / Powertrain</label>
              <input
                type="text"
                value={form.engineType}
                onChange={(e) => setForm({ ...form, engineType: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Displacement (cc)</label>
              <input
                type="number"
                value={form.engineCapacityCc || ""}
                onChange={(e) => setForm({ ...form, engineCapacityCc: Number(e.target.value) || null })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Power (BHP)</label>
              <input
                type="number"
                value={form.powerBhp || ""}
                onChange={(e) => setForm({ ...form, powerBhp: Number(e.target.value) || null })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Torque (Nm)</label>
              <input
                type="number"
                value={form.torqueNm || ""}
                onChange={(e) => setForm({ ...form, torqueNm: Number(e.target.value) || null })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Length (mm)</label>
              <input
                type="number"
                value={form.lengthMm || ""}
                onChange={(e) => setForm({ ...form, lengthMm: Number(e.target.value) || null })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Width (mm)</label>
              <input
                type="number"
                value={form.widthMm || ""}
                onChange={(e) => setForm({ ...form, widthMm: Number(e.target.value) || null })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Height (mm)</label>
              <input
                type="number"
                value={form.heightMm || ""}
                onChange={(e) => setForm({ ...form, heightMm: Number(e.target.value) || null })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Boot Space (Litres)</label>
              <input
                type="number"
                value={form.bootSpaceLitres || ""}
                onChange={(e) => setForm({ ...form, bootSpaceLitres: Number(e.target.value) || null })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fuel Efficiency</label>
              <input
                type="text"
                value={form.fuelEfficiency || ""}
                onChange={(e) => setForm({ ...form, fuelEfficiency: e.target.value })}
                className="form-input"
                placeholder="e.g. 18.2 kmpl"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Listing Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="form-select"
              >
                <option value="available">Available (For Sale)</option>
                <option value="sold">Sold</option>
              </select>
            </div>
          </div>

          
          
          
          <div
            style={{
              marginTop: 26,
              background: "var(--bg-card)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
              padding: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
              <div>
                <h4 style={{ color: "#ffffff", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <Camera size={18} className="text-red-500" />
                  <span>Car Photos Management</span>
                  <span
                    className={`badge ${isAtMaxImages ? "badge-red" : "badge-green"}`}
                    style={{ marginLeft: 6 }}
                  >
                    {form.imageUrls.length} / {MAX_IMAGES} Photos
                  </span>
                </h4>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                  Upload photos from your computer or choose from Showroom Gallery (Max 13 photos per car).
                </p>
              </div>

              
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAtMaxImages || isUploading}
                  className="btn btn-outline btn-sm"
                  title="Upload photos from computer / phone"
                >
                  <UploadCloud size={14} className="text-red-400" />
                  <span>{isUploading ? "Uploading..." : "Upload from Computer"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowGalleryPicker(true)}
                  disabled={isAtMaxImages}
                  className="btn btn-outline btn-sm"
                  title="Select from Showroom Gallery"
                >
                  <Images size={14} className="text-blue-400" />
                  <span>Choose from Showroom Gallery</span>
                </button>
              </div>
            </div>

            
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Or paste image URL (https://images.unsplash.com/... or /images/...)"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                disabled={isAtMaxImages}
                className="form-input"
                style={{ flex: 1, fontSize: 13 }}
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                disabled={isAtMaxImages || !imageUrlInput.trim()}
                className="btn btn-glass btn-sm"
              >
                <Plus size={14} />
                <span>Add URL</span>
              </button>
            </div>

            {isAtMaxImages && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.12)",
                  color: "#fca5a5",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  borderRadius: 6,
                  padding: "8px 12px",
                  fontSize: 12,
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Info size={14} />
                <span>Maximum limit of {MAX_IMAGES} photos reached for this car. Remove a photo to add a new one.</span>
              </div>
            )}

            {isUploading && (
              <div style={{ textAlign: "center", padding: "16px 0", color: "#38bdf8" }}>
                <RefreshCw className="animate-spin" size={18} style={{ display: "inline-block", marginRight: 8 }} />
                <span>Uploading and compressing photos to dealer storage...</span>
              </div>
            )}

            
            {form.imageUrls.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="image-upload-dropzone"
              >
                <UploadCloud size={32} style={{ margin: "0 auto 8px", color: "var(--text-muted)" }} />
                <strong style={{ color: "#ffffff", display: "block", fontSize: 14 }}>
                  No photos added yet
                </strong>
                <span style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  Click to upload from computer or select from Showroom Gallery above.
                </span>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(135px, 1fr))",
                  gap: 12,
                }}
              >
                {form.imageUrls.map((url, i) => (
                  <div
                    key={i}
                    style={{
                      position: "relative",
                      aspectRatio: "4/3",
                      borderRadius: "var(--radius-sm)",
                      overflow: "hidden",
                      border: i === 0 ? "2px solid var(--primary)" : "1px solid var(--border)",
                      background: "#000",
                    }}
                  >
                    <img
                      src={url}
                      alt={`Car photo ${i + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />

                    
                    {i === 0 ? (
                      <span className="photo-badge-cover">Cover Photo</span>
                    ) : (
                      <span className="photo-badge-num">#{i + 1}</span>
                    )}

                    
                    <div
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        display: "flex",
                        gap: 4,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        title="Delete photo"
                        style={{
                          background: "rgba(239, 68, 68, 0.85)",
                          border: 0,
                          color: "#fff",
                          cursor: "pointer",
                          borderRadius: 4,
                          padding: "3px 5px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    
                    <div
                      style={{
                        position: "absolute",
                        bottom: 4,
                        right: 4,
                        display: "flex",
                        gap: 4,
                      }}
                    >
                      {i !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleMakeCover(i)}
                          title="Set as Cover Photo"
                          style={{
                            background: "rgba(0,0,0,0.75)",
                            border: "1px solid rgba(255,255,255,0.3)",
                            color: "#fff",
                            fontSize: 10,
                            cursor: "pointer",
                            borderRadius: 4,
                            padding: "2px 6px",
                          }}
                        >
                          ★ Cover
                        </button>
                      )}
                      {i > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMovePhoto(i, i - 1)}
                          title="Move Left"
                          style={{
                            background: "rgba(0,0,0,0.75)",
                            border: 0,
                            color: "#fff",
                            cursor: "pointer",
                            borderRadius: 4,
                            padding: "2px 4px",
                          }}
                        >
                          <ChevronLeft size={12} />
                        </button>
                      )}
                      {i < form.imageUrls.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMovePhoto(i, i + 1)}
                          title="Move Right"
                          style={{
                            background: "rgba(0,0,0,0.75)",
                            border: 0,
                            color: "#fff",
                            cursor: "pointer",
                            borderRadius: 4,
                            padding: "2px 4px",
                          }}
                        >
                          <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>

          <div className="car-editor-footer">
            <button type="button" onClick={onClose} className="btn btn-outline">Cancel</button>
            <button
              type="submit"
              disabled={createVehicle.isPending || updateVehicle.isPending}
              className="btn btn-primary"
            >
              {createVehicle.isPending || updateVehicle.isPending
                ? "Saving Vehicle..."
                : vehicle
                ? "Save Changes"
                : "Create Vehicle Listing"}
            </button>
          </div>
        </form>
      </div>

      
      {showGalleryPicker && (
        <GalleryPickerModal
          currentCount={form.imageUrls.length}
          maxAllowed={MAX_IMAGES}
          onSelect={handleGallerySelect}
          onClose={() => setShowGalleryPicker(false)}
        />
      )}
    </div>
  );
}

function AdminCustomersTab() {
  const [subTab, setSubTab] = useState<"all" | "bought_from_dealership" | "sold_to_dealership" | "current_buyer" | "service_slots">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [createdTokenAlert, setCreatedTokenAlert] = useState<{ token: string; name: string; phone: string; car: string; date: string; time: string } | null>(null);

  const { data: customers = [], isLoading: customersLoading } = useAdminCustomers();
  const { data: serviceBookings = [], isLoading: tokensLoading } = useAdminServiceTokens();
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const updateTokenStatus = useUpdateServiceTokenStatus();
  const bookServiceSlot = useBookServiceSlot();

  const [clientForm, setClientForm] = useState<{
    name: string;
    phone: string;
    email: string;
    transactionType: "sold_to_dealership" | "bought_from_dealership" | "current_buyer";
    carModel: string;
    regNumber: string;
    amountInr: number;
    date: string;
    status: "completed" | "in_progress" | "pending_rc" | "delivered";
    notes: string;
  }>({
    name: "",
    phone: "",
    email: "",
    transactionType: "bought_from_dealership",
    carModel: "",
    regNumber: "",
    amountInr: 2500000,
    date: new Date().toISOString().split("T")[0],
    status: "completed",
    notes: "",
  });

  const [tokenForm, setTokenForm] = useState<{
    customerName: string;
    phone: string;
    email: string;
    carDetails: string;
    servicePackage: string;
    date: string;
    timeSlot: string;
    notes: string;
  }>({
    customerName: "",
    phone: "",
    email: "",
    carDetails: "",
    servicePackage: "Periodic Maintenance Service",
    date: new Date().toISOString().split("T")[0],
    timeSlot: "10:00 AM - 11:30 AM",
    notes: "",
  });

  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, Customer>();
    const withoutPhone: Customer[] = [];
    for (const c of customers) {
      const digits = (c.phone || "").replace(/\D/g, "");
      const key = digits.length >= 10 ? digits.slice(-10) : digits;
      if (!key) {
        withoutPhone.push(c);
        continue;
      }
      const existing = map.get(key);
      if (!existing) {
        map.set(key, c);
      } else {
        const isCurrentNewer = (c.date || "") >= (existing.date || "");
        const bestName = c.name && c.name.length > existing.name.length ? c.name : existing.name;
        const bestEmail = c.email || existing.email;
        const bestCar = c.carModel && c.carModel !== "Customer Account" && c.carModel !== "Google Account User" ? c.carModel : existing.carModel;
        const bestType = existing.transactionType !== "current_buyer" ? existing.transactionType : c.transactionType;
        const bestReg = existing.regNumber || c.regNumber;
        const bestAmount = existing.amountInr || c.amountInr;
        const bestStatus = existing.status === "completed" || existing.status === "delivered" ? existing.status : c.status;
        const mergedNotes = [existing.notes, c.notes].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(" | ");
        map.set(key, {
          ...(isCurrentNewer ? c : existing),
          id: existing.id,
          name: bestName,
          email: bestEmail,
          carModel: bestCar,
          transactionType: bestType,
          regNumber: bestReg,
          amountInr: bestAmount,
          status: bestStatus,
          notes: mergedNotes,
        });
      }
    }
    return [...map.values(), ...withoutPhone];
  }, [customers]);

  const totalClients = uniqueCustomers.length;
  const boughtCount = uniqueCustomers.filter((c) => c.transactionType === "bought_from_dealership").length;
  const soldCount = uniqueCustomers.filter((c) => c.transactionType === "sold_to_dealership").length;
  const currentBuyersCount = uniqueCustomers.filter((c) => c.transactionType === "current_buyer").length;
  const totalTokens = serviceBookings.length;

  const filteredCustomers = useMemo(() => {
    return uniqueCustomers.filter((c) => {
      if (subTab !== "all" && subTab !== "service_slots" && c.transactionType !== subTab) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPhone = c.phone.toLowerCase().includes(q);
        const matchesCar = c.carModel.toLowerCase().includes(q);
        const matchesReg = (c.regNumber || "").toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesCar || matchesReg;
      }
      return true;
    });
  }, [uniqueCustomers, subTab, searchTerm]);

  const openEditClient = (client: Customer) => {
    setEditingCustomer(client);
    setClientForm({
      name: client.name,
      phone: client.phone,
      email: client.email || "",
      transactionType: client.transactionType,
      carModel: client.carModel,
      regNumber: client.regNumber || "",
      amountInr: client.amountInr || 0,
      date: client.date || new Date().toISOString().split("T")[0],
      status: client.status || "completed",
      notes: client.notes || "",
    });
    setShowAddModal(true);
  };

  const openNewClient = () => {
    setEditingCustomer(null);
    setClientForm({
      name: "",
      phone: "",
      email: "",
      transactionType: subTab === "sold_to_dealership" ? "sold_to_dealership" : subTab === "current_buyer" ? "current_buyer" : "bought_from_dealership",
      carModel: "",
      regNumber: "",
      amountInr: 2500000,
      date: new Date().toISOString().split("T")[0],
      status: "completed",
      notes: "",
    });
    setShowAddModal(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name.trim() || !clientForm.phone.trim() || !clientForm.carModel.trim()) {
      alert("Please provide customer name, phone, and car model.");
      return;
    }

    if (editingCustomer) {
      updateCustomer.mutate(
        {
          id: editingCustomer.id,
          ...clientForm,
        },
        {
          onSuccess: () => {
            setShowAddModal(false);
            setEditingCustomer(null);
          },
        }
      );
    } else {
      createCustomer.mutate(clientForm, {
        onSuccess: () => {
          setShowAddModal(false);
        },
      });
    }
  };

  const handleDeleteClient = (id: number, name: string) => {
    if (confirm(`Are you sure you want to remove customer record for ${name}?`)) {
      deleteCustomer.mutate(id);
    }
  };

  const handleIssueToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenForm.customerName.trim() || !tokenForm.phone.trim() || !tokenForm.carDetails.trim()) {
      alert("Please enter customer name, phone, and vehicle details.");
      return;
    }

    bookServiceSlot.mutate(tokenForm, {
      onSuccess: (res) => {
        setCreatedTokenAlert({
          token: res.token,
          name: tokenForm.customerName,
          phone: tokenForm.phone,
          car: tokenForm.carDetails,
          date: tokenForm.date,
          time: tokenForm.timeSlot,
        });
        setShowTokenModal(false);
        setSubTab("service_slots");
      },
    });
  };

  const getBadgeForType = (type: string) => {
    switch (type) {
      case "bought_from_dealership":
        return <span className="badge badge-green" style={{ fontSize: 11 }}>Bought From Us</span>;
      case "sold_to_dealership":
        return <span className="badge badge-gold" style={{ fontSize: 11 }}>Sold To Dealership</span>;
      case "current_buyer":
        return <span className="badge badge-blue" style={{ fontSize: 11 }}>Current Buyer</span>;
      default:
        return <span className="badge badge-glass" style={{ fontSize: 11 }}>{type}</span>;
    }
  };

  const getBadgeForStatus = (status: string) => {
    switch (status) {
      case "completed":
        return <span style={{ color: "#34d399", fontWeight: 600, fontSize: 12 }}>Completed</span>;
      case "delivered":
        return <span style={{ color: "#38bdf8", fontWeight: 600, fontSize: 12 }}>Delivered</span>;
      case "in_progress":
        return <span style={{ color: "#fbbf24", fontWeight: 600, fontSize: 12 }}>In Progress</span>;
      case "pending_rc":
        return <span style={{ color: "#f87171", fontWeight: 600, fontSize: 12 }}>RC Transfer Pending</span>;
      default:
        return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{status}</span>;
    }
  };

  return (
    <div>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
        <div>
          <h2 style={{ color: "var(--text-main)", margin: 0, fontSize: 24, display: "flex", alignItems: "center", gap: 10 }}>
            <Users size={24} style={{ color: "var(--primary)" }} />
            <span>Customer & Client Management</span>
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            Track client vehicle transactions (who sold & who bought), current buyers, and service slot tokens.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={openNewClient} className="btn btn-primary btn-sm">
            <Plus size={15} />
            <span>Record Client Transaction</span>
          </button>
          <button onClick={() => setShowTokenModal(true)} className="btn btn-outline btn-sm">
            <Ticket size={15} />
            <span>Issue Service Token</span>
          </button>
        </div>
      </div>

      
      {createdTokenAlert && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)",
            border: "1px solid var(--accent-gold)",
            borderRadius: "var(--radius-md)",
            padding: "16px 20px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={18} color="#34d399" />
              <strong style={{ color: "var(--text-main)", fontSize: 15 }}>Service Slot Token Generated:</strong>
              <span className="badge badge-gold" style={{ fontSize: 13, letterSpacing: 1 }}>{createdTokenAlert.token}</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
              Booked for <strong>{createdTokenAlert.name}</strong> ({createdTokenAlert.car}) on <strong>{createdTokenAlert.date}</strong> at <strong>{createdTokenAlert.time}</strong>.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                const text = encodeURIComponent(
                  `Hi ${createdTokenAlert.name}, your Passion Car Luxury Service Slot is booked!
Token: ${createdTokenAlert.token}
Vehicle: ${createdTokenAlert.car}
Date: ${createdTokenAlert.date}
Time: ${createdTokenAlert.time}
Location: Plot No: 25, 100 Feet Rd, Kavuri Hills, Madhapur, Hyderabad.`
                );
                window.open(`https://wa.me/91${createdTokenAlert.phone.replace(/[^0-9]/g, "")}?text=${text}`, "_blank");
              }}
              className="btn btn-primary btn-sm"
            >
              <Share2 size={14} />
              <span>Send WhatsApp Pass</span>
            </button>
            <button onClick={() => setCreatedTokenAlert(null)} className="btn btn-glass btn-sm">
              Dismiss
            </button>
          </div>
        </div>
      )}

      
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Total Tracked Clients</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-main)", marginTop: 4 }}>{totalClients}</div>
        </div>

        <div className="admin-kpi-card">
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Sold Cars To Dealership</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--accent-gold)", marginTop: 4 }}>{soldCount}</div>
        </div>

        <div className="admin-kpi-card">
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Bought From Dealership</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#34d399", marginTop: 4 }}>{boughtCount}</div>
        </div>

        <div className="admin-kpi-card">
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Current Prospective Buyers</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#38bdf8", marginTop: 4 }}>{currentBuyersCount}</div>
        </div>

        <div className="admin-kpi-card">
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Service Tokens Active</span>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--primary)", marginTop: 4 }}>{totalTokens}</div>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-chips-scroll">
          {[
            { id: "all", label: `All Clients (${totalClients})` },
            { id: "bought_from_dealership", label: `Bought from Us (${boughtCount})` },
            { id: "sold_to_dealership", label: `Sold to Us (${soldCount})` },
            { id: "current_buyer", label: `Current Buyers (${currentBuyersCount})` },
            { id: "service_slots", label: `Service Slots & Tokens (${totalTokens})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`admin-chip-btn ${subTab === tab.id ? "btn btn-primary btn-sm" : "btn btn-glass btn-sm"}`}
              style={{ padding: "6px 14px", fontSize: 12 }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {subTab !== "service_slots" && (
          <div className="admin-search-wrap">
            <Search size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by name, phone, car..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ padding: "6px 12px", fontSize: 13, width: "100%" }}
            />
          </div>
        )}
      </div>

      
      {subTab !== "service_slots" && (
        <>
          {customersLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}><RefreshCw className="animate-spin" size={24} /></div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 48, textAlign: "center" }}>
              <p style={{ color: "var(--text-muted)", fontSize: 15 }}>No clients found matching the selected filter.</p>
              <button onClick={openNewClient} className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                <Plus size={14} />
                <span>Record New Client Transaction</span>
              </button>
            </div>
          ) : (
            <div className="admin-table-container">
              <div className="admin-scroll-hint">↔ Swipe horizontally to view full customer details</div>
              <table className="admin-table-responsive">
                <thead>
                  <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "12px 16px" }}>Client Name & Contact</th>
                    <th style={{ padding: "12px 16px" }}>Transaction Category</th>
                    <th style={{ padding: "12px 16px" }}>Vehicle & Reg No.</th>
                    <th style={{ padding: "12px 16px" }}>Amount (₹)</th>
                    <th style={{ padding: "12px 16px" }}>Date</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: 14 }}>{c.name}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                          <a
                            href={`https://wa.me/91${c.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: "#34d399", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}
                          >
                            <Phone size={11} />
                            <span>{c.phone}</span>
                          </a>
                          {c.email && <span style={{ color: "var(--text-dim)", fontSize: 11 }}>{c.email}</span>}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {getBadgeForType(c.transactionType)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "var(--text-main)", fontWeight: 600 }}>{c.carModel}</div>
                        {c.regNumber && (
                          <span style={{ fontSize: 11, background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, color: "var(--text-muted)", marginTop: 2, display: "inline-block" }}>
                            {c.regNumber}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--primary)" }}>
                        {c.amountInr ? formatInr(c.amountInr) : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 12 }}>
                        {c.date}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {getBadgeForStatus(c.status)}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button
                            onClick={() => openEditClient(c)}
                            className="btn btn-glass btn-sm"
                            title="Edit Client"
                            style={{ padding: "5px 8px" }}
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteClient(c.id, c.name)}
                            className="btn btn-outline btn-sm"
                            title="Delete Client"
                            style={{ padding: "5px 8px", borderColor: "rgba(239, 68, 68, 0.4)", color: "#fca5a5" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      
      {subTab === "service_slots" && (
        <div>
          {tokensLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}><RefreshCw className="animate-spin" size={24} /></div>
          ) : serviceBookings.length === 0 ? (
            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 48, textAlign: "center" }}>
              <Ticket size={36} color="var(--primary)" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ color: "var(--text-main)", marginBottom: 6 }}>No Service Slot Bookings Found</h3>
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                Generate walk-in service tokens or wait for customers to book slots online.
              </p>
              <button onClick={() => setShowTokenModal(true)} className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                <Plus size={14} />
                <span>Issue First Service Token</span>
              </button>
            </div>
          ) : (
            <div className="admin-table-container">
              <div className="admin-scroll-hint">↔ Swipe horizontally to view service tokens</div>
              <table className="admin-table-responsive">
                <thead>
                  <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)", color: "var(--text-muted)" }}>
                    <th style={{ padding: "12px 16px" }}>Service Token ID</th>
                    <th style={{ padding: "12px 16px" }}>Customer Name & Mobile</th>
                    <th style={{ padding: "12px 16px" }}>Vehicle & Package</th>
                    <th style={{ padding: "12px 16px" }}>Scheduled Slot</th>
                    <th style={{ padding: "12px 16px" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceBookings.map((b) => (
                    <tr key={b.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <span className="badge badge-gold" style={{ fontSize: 12, letterSpacing: 0.5, fontWeight: 800 }}>
                          {b.token}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-main)", fontSize: 14 }}>{b.customerName}</div>
                        <a
                          href={`https://wa.me/91${b.phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#34d399", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none", marginTop: 2 }}
                        >
                          <Phone size={11} />
                          <span>{b.phone}</span>
                        </a>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "var(--text-main)", fontWeight: 600 }}>{b.carDetails}</div>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{b.servicePackage}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ color: "var(--text-main)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                          <Calendar size={12} color="var(--primary)" />
                          <span>{b.date}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <Clock size={11} />
                          <span>{b.timeSlot}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <select
                          value={b.status}
                          onChange={(e) => updateTokenStatus.mutate({ id: b.id, status: e.target.value })}
                          className="form-input"
                          style={{
                            padding: "4px 8px",
                            fontSize: 12,
                            width: "auto",
                            background: b.status === "completed" ? "rgba(16, 185, 129, 0.2)" : b.status === "in_progress" ? "rgba(245, 158, 11, 0.2)" : "rgba(56, 189, 248, 0.2)",
                            borderColor: b.status === "completed" ? "#10b981" : b.status === "in_progress" ? "#f59e0b" : "#38bdf8",
                            color: "#ffffff",
                          }}
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => {
                            const text = encodeURIComponent(
                              `Hi ${b.customerName}, your Passion Car Luxury Service Token is: ${b.token}.
Car: ${b.carDetails}
Date: ${b.date}
Slot: ${b.timeSlot}
Status: ${b.status.toUpperCase()}
Dealership: Plot No: 25, 100 Feet Rd, Kavuri Hills, Madhapur, Hyderabad (+91 88858 58380).`
                            );
                            window.open(`https://wa.me/91${b.phone.replace(/[^0-9]/g, "")}?text=${text}`, "_blank");
                          }}
                          className="btn btn-glass btn-sm"
                          style={{ padding: "5px 10px", fontSize: 11 }}
                        >
                          <Share2 size={12} />
                          <span>WhatsApp Pass</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      
      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ color: "#ffffff", margin: 0, fontSize: 18 }}>
                {editingCustomer ? "Edit Client Transaction Record" : "Record New Client Transaction"}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="btn btn-glass btn-sm" style={{ padding: 6 }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveClient}>
              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    value={clientForm.name}
                    onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                    className="form-input"
                    placeholder="e.g. Ramesh Varma"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number (10 Digits) *</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    required
                    value={clientForm.phone}
                    onChange={(e) => setClientForm({ ...clientForm, phone: cleanMobileNumber(e.target.value) })}
                    className="form-input"
                    placeholder="10-digit mobile number (e.g. 9849012345)"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Transaction Category *</label>
                <select
                  value={clientForm.transactionType}
                  onChange={(e) => setClientForm({ ...clientForm, transactionType: e.target.value as any })}
                  className="form-input"
                  required
                >
                  <option value="bought_from_dealership">Bought Car from Dealership (Past Client)</option>
                  <option value="sold_to_dealership">Sold Car to Dealership (Past Client)</option>
                  <option value="current_buyer">Current Prospective Buyer (Active Lead)</option>
                </select>
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Vehicle Make & Model *</label>
                  <input
                    type="text"
                    required
                    value={clientForm.carModel}
                    onChange={(e) => setClientForm({ ...clientForm, carModel: e.target.value })}
                    className="form-input"
                    placeholder="e.g. BMW 5 Series 530d M Sport"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Registration Plate</label>
                  <input
                    type="text"
                    value={clientForm.regNumber}
                    onChange={(e) => setClientForm({ ...clientForm, regNumber: e.target.value.toUpperCase() })}
                    className="form-input"
                    placeholder="TS 09 EA 4455"
                  />
                </div>
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Transaction Amount (₹)</label>
                  <input
                    type="number"
                    value={clientForm.amountInr}
                    onChange={(e) => setClientForm({ ...clientForm, amountInr: Number(e.target.value) })}
                    className="form-input"
                    placeholder="2500000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Deal</label>
                  <input
                    type="date"
                    value={clientForm.date}
                    onChange={(e) => setClientForm({ ...clientForm, date: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  value={clientForm.status}
                  onChange={(e) => setClientForm({ ...clientForm, status: e.target.value as any })}
                  className="form-input"
                >
                  <option value="completed">Completed & Verified</option>
                  <option value="delivered">Delivered to Customer</option>
                  <option value="pending_rc">Pending RC Ownership Transfer</option>
                  <option value="in_progress">In Discussion / Negotiation</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Special Notes / Comments</label>
                <textarea
                  rows={2}
                  value={clientForm.notes}
                  onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                  className="form-textarea"
                  placeholder="e.g. VIP client, preferred service package, RC transfer receipt submitted"
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={createCustomer.isPending || updateCustomer.isPending} className="btn btn-primary" style={{ flex: 1 }}>
                  {createCustomer.isPending || updateCustomer.isPending ? "Saving..." : editingCustomer ? "Update Record" : "Save Client Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {showTokenModal && (
        <div className="modal-backdrop" onClick={() => setShowTokenModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Ticket size={20} color="var(--primary)" />
                <h3 style={{ color: "#ffffff", margin: 0, fontSize: 18 }}>Issue Walk-in Service Token</h3>
              </div>
              <button onClick={() => setShowTokenModal(false)} className="btn btn-glass btn-sm" style={{ padding: 6 }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleIssueToken}>
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={tokenForm.customerName}
                  onChange={(e) => setTokenForm({ ...tokenForm, customerName: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Dr. Rajesh Kumar"
                />
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Phone Number (10 Digits) *</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    required
                    value={tokenForm.phone}
                    onChange={(e) => setTokenForm({ ...tokenForm, phone: cleanMobileNumber(e.target.value) })}
                    className="form-input"
                    placeholder="10-digit mobile number (e.g. 9849012345)"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    value={tokenForm.email}
                    onChange={(e) => setTokenForm({ ...tokenForm, email: e.target.value })}
                    className="form-input"
                    placeholder="client@gmail.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Car Model & Details *</label>
                <input
                  type="text"
                  required
                  value={tokenForm.carDetails}
                  onChange={(e) => setTokenForm({ ...tokenForm, carDetails: e.target.value })}
                  className="form-input"
                  placeholder="e.g. Mercedes-Benz E-Class 220d (TS 09 FH 1234)"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Service Package *</label>
                <select
                  value={tokenForm.servicePackage}
                  onChange={(e) => setTokenForm({ ...tokenForm, servicePackage: e.target.value })}
                  className="form-input"
                >
                  <option value="Periodic Maintenance Service">Periodic Maintenance Service</option>
                  <option value="Ceramic Coating & Paint Correction">Ceramic Coating & Paint Correction</option>
                  <option value="Wheel Alignment & Road-Force Balancing">Wheel Alignment & Road-Force Balancing</option>
                  <option value="Brake Overhaul & Fluid Flush">Brake Overhaul & Fluid Flush</option>
                  <option value="Pre-Delivery Inspection (150+ Points)">Pre-Delivery Inspection (150+ Points)</option>
                  <option value="Full Exterior & Interior Detailing">Full Exterior & Interior Detailing</option>
                </select>
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Booking Date *</label>
                  <input
                    type="date"
                    required
                    value={tokenForm.date}
                    onChange={(e) => setTokenForm({ ...tokenForm, date: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time Slot *</label>
                  <select
                    value={tokenForm.timeSlot}
                    onChange={(e) => setTokenForm({ ...tokenForm, timeSlot: e.target.value })}
                    className="form-input"
                  >
                    <option value="09:30 AM - 11:00 AM">09:30 AM - 11:00 AM</option>
                    <option value="11:30 AM - 01:00 PM">11:30 AM - 01:00 PM</option>
                    <option value="02:00 PM - 03:30 PM">02:00 PM - 03:30 PM</option>
                    <option value="04:00 PM - 05:30 PM">04:00 PM - 05:30 PM</option>
                    <option value="05:30 PM - 07:00 PM">05:30 PM - 07:00 PM</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
                <button type="button" onClick={() => setShowTokenModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={bookServiceSlot.isPending} className="btn btn-primary" style={{ flex: 1 }}>
                  {bookServiceSlot.isPending ? "Generating Token..." : "Issue Service Token Pass"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminSettingsTab({ isDeveloper }: { isDeveloper?: boolean }) {
  const { data: settings } = useSiteSettings();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [adminName, setAdminName] = useState("Passion Car Administrator");
  const [adminPhone, setAdminPhone] = useState("+91 88858 58380");
  const [adminPhoto, setAdminPhoto] = useState("");

  const [carsSoldCount, setCarsSoldCount] = useState(250);
  const [phone, setPhone] = useState("+91 88858 58380");
  const [whatsapp, setWhatsapp] = useState("+918885858380");
  const [address, setAddress] = useState(
    "Plot No: 25, 100 Feet Rd, Sri Rama Colony, Kavuri Hills, Madhapur, Hyderabad, Telangana 500081"
  );
  const [showroomHoursMonSat, setShowroomHoursMonSat] = useState("Open Mon - Sat: 10:00 AM – 8:30 PM");
  const [showroomHoursSun, setShowroomHoursSun] = useState("Sunday: 10:30 AM – 7:00 PM");
  const [googleRatingVal, setGoogleRatingVal] = useState(4.9);
  const [googleReviewsCountVal, setGoogleReviewsCountVal] = useState(148);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateSettings = useUpdateSiteSettings();

  useEffect(() => {
    if (settings) {
      if (settings.carsSold !== undefined) setCarsSoldCount(settings.carsSold);
      if (settings.phone) setPhone(settings.phone);
      if (settings.whatsapp) setWhatsapp(settings.whatsapp);
      if (settings.address) setAddress(settings.address);
      if (settings.adminName) setAdminName(settings.adminName);
      if (settings.adminPhone) setAdminPhone(settings.adminPhone);
      if (settings.adminPhoto) setAdminPhoto(settings.adminPhoto);
      if (settings.showroomHoursMonSat) setShowroomHoursMonSat(settings.showroomHoursMonSat);
      if (settings.showroomHoursSun) setShowroomHoursSun(settings.showroomHoursSun);
      if (settings.googleRating !== undefined) setGoogleRatingVal(settings.googleRating);
      if (settings.googleReviewsCount !== undefined) setGoogleReviewsCountVal(settings.googleReviewsCount);
    }
  }, [settings]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImageFile(file, 400, 0.85);
    if (compressed.image) {
      setAdminPhoto(compressed.image);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(
      {
        adminName: adminName.trim(),
        adminPhone: adminPhone.trim(),
        adminPhoto: adminPhoto.trim(),
        carsSold: Number(carsSoldCount),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        address: address.trim(),
        showroomHoursMonSat: showroomHoursMonSat.trim(),
        showroomHoursSun: showroomHoursSun.trim(),
        googleRating: Number(googleRatingVal),
        googleReviewsCount: Number(googleReviewsCountVal),
      },
      {
        onSuccess: () => {
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 4000);
        },
      }
    );
  };

  return (
    <div style={{ maxWidth: 740 }}>
      <h2 style={{ color: "var(--text-main)", marginBottom: 6 }}>Admin Profile & Dealership Settings</h2>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
        Update your administrator profile photo, display name, and mobile number.
      </p>

      {savedSuccess && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.15)",
            color: "#a7f3d0",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            padding: "12px 16px",
            borderRadius: 6,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <CheckCircle2 size={16} />
          <span>Profile photo, name, mobile, and dealership settings saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        
        <div style={{ background: "var(--bg-surface)", padding: 28, borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: 24 }}>
          <h3 style={{ color: "var(--text-main)", fontSize: 17, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <User size={18} color="var(--primary)" />
            <span>Administrator Identity & Profile</span>
          </h3>

          
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20, flexWrap: "wrap" }}>
            {adminPhoto ? (
              <img
                src={adminPhoto}
                alt="Admin Avatar"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid var(--primary)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.6) 100%)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 26,
                  border: "2px solid rgba(239, 68, 68, 0.5)",
                }}
              >
                {(adminName || "A").charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-outline btn-sm"
                >
                  <Upload size={14} />
                  <span>Upload Profile Photo</span>
                </button>
                {adminPhoto && (
                  <button
                    type="button"
                    onClick={() => setAdminPhoto("")}
                    className="btn btn-glass btn-sm"
                    style={{ color: "#fca5a5" }}
                  >
                    Remove
                  </button>
                )}
              </div>
              <span style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 6, display: "block" }}>
                JPG, PNG, or WEBP. Shown in top navigation bar and session header.
              </span>
            </div>
          </div>

          <div className="form-grid-2col">
            <div className="form-group">
              <label className="form-label">Admin Name *</label>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="form-input"
                placeholder="e.g. Prasanth Kongara"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Admin Mobile Number (10 Digits) *</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                required
                value={adminPhone}
                onChange={(e) => setAdminPhone(cleanMobileNumber(e.target.value))}
                className="form-input"
                placeholder="10-digit mobile number (e.g. 9849012345)"
              />
            </div>
          </div>

          </div>

        
        <div style={{ background: "var(--bg-surface)", padding: 28, borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: 24 }}>
          <h3 style={{ color: "var(--text-main)", fontSize: 17, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <MapPin size={18} color="var(--primary)" />
            <span>Public Website & Contact Info</span>
          </h3>

          <div className="form-grid-2col">
            <div className="form-group">
              <label className="form-label">Dealership Business Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
                placeholder="+91 88858 58380"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp Number</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="form-input"
                placeholder="+918885858380"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Showroom Address</label>
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="form-textarea"
              required
            />
          </div>

          <div className="form-grid-2col">
            <div className="form-group">
              <label className="form-label">Showroom Timings (Mon - Sat)</label>
              <input
                type="text"
                value={showroomHoursMonSat}
                onChange={(e) => setShowroomHoursMonSat(e.target.value)}
                className="form-input"
                placeholder="Open Mon - Sat: 10:00 AM – 8:30 PM"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Showroom Timings (Sunday)</label>
              <input
                type="text"
                value={showroomHoursSun}
                onChange={(e) => setShowroomHoursSun(e.target.value)}
                className="form-input"
                placeholder="Sunday: 10:30 AM – 7:00 PM"
                required
              />
            </div>
          </div>

          <div className="form-grid-2col">
            <div className="form-group">
              <label className="form-label">Google Rating (e.g. 4.9)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={googleRatingVal}
                onChange={(e) => setGoogleRatingVal(Number(e.target.value))}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Total Google Reviews Count</label>
              <input
                type="number"
                min="1"
                value={googleReviewsCountVal}
                onChange={(e) => setGoogleReviewsCountVal(Number(e.target.value))}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Live "Cars Sold" Hero Counter</label>
            <input
              type="number"
              value={carsSoldCount}
              onChange={(e) => setCarsSoldCount(Number(e.target.value))}
              className="form-input"
              style={{ fontSize: 18, fontWeight: 700 }}
              min={1}
            />
          </div>
        </div>



        {isDeveloper && (
          <div style={{ background: "var(--bg-surface)", padding: 24, borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: 24 }}>
            <h3 style={{ color: "var(--text-main)", fontSize: 17, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <Database size={18} color="var(--primary)" />
              <span>Database Storage & Compression Status</span>
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              <div style={{ background: "var(--bg-deep)", padding: 14, borderRadius: 6, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Storage Engine</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)", marginTop: 2 }}>Supabase PostgreSQL (AWS)</div>
              </div>
              <div style={{ background: "var(--bg-deep)", padding: 14, borderRadius: 6, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Data Used / Limit</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8", marginTop: 2 }}>~25 KB / 500 MB (&lt; 0.01%)</div>
              </div>
              <div style={{ background: "var(--bg-deep)", padding: 14, borderRadius: 6, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Inbuilt Auto-Compressor</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-green)", marginTop: 2 }}>Active &amp; Silent (1600px / 82%)</div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={updateSettings.isPending}
          className="btn btn-primary"
          style={{ width: "100%", justifyContent: "center", padding: "14px 20px" }}
        >
          {updateSettings.isPending ? "Saving Settings..." : "Save & Publish All Profile & Site Settings"}
        </button>
      </form>
    </div>
  );
}

function AdminInquiriesTab() {
  const { data: inquiries = [], isLoading } = useAdminInquiries();
  const updateStatus = useUpdateInquiryStatus();
  const deleteInquiryMutation = useDeleteInquiry();
  const createCustomer = useCreateCustomer();
  const replyMutation = useReplyToInquiry();
  const markReadMutation = useMarkInquiryRead();
  const [convertedMap, setConvertedMap] = useState<Record<number, boolean>>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const [replyModalInquiry, setReplyModalInquiry] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [confirmedSlotTime, setConfirmedSlotTime] = useState("");
  const [slotConfirmed, setSlotConfirmed] = useState(false);

  const handleOpenReplyModal = (inq: any) => {
    setReplyModalInquiry(inq);
    if (!inq.readByAdmin) {
      markReadMutation.mutate(inq.id);
    }
    setReplyText(inq.adminReply || "");
    setConfirmedSlotTime(inq.confirmedSlotTime || "");
    setSlotConfirmed(inq.slotConfirmed ?? (inq.type === "test_drive"));
  };

  const handleConvertToCustomer = (inq: any) => {
    createCustomer.mutate(
      {
        name: inq.name,
        phone: inq.phone,
        email: inq.email || "",
        transactionType: "current_buyer",
        carModel: inq.vehicleId ? `Vehicle #${inq.vehicleId}` : `Inquiry (${inq.type})`,
        regNumber: "",
        amountInr: 0,
        date: new Date().toISOString().split("T")[0],
        status: "in_progress",
        notes: `[Website Inquiry] ${inq.message || ""}`,
      },
      {
        onSuccess: () => {
          setConvertedMap((prev) => ({ ...prev, [inq.id]: true }));
        },
      }
    );
  };

  const counts = useMemo(() => {
    return {
      all: inquiries.length,
      test_drive: inquiries.filter((i) => i.type === "test_drive").length,
      buy: inquiries.filter((i) => i.type === "buy").length,
      sell: inquiries.filter((i) => i.type === "sell").length,
      exchange: inquiries.filter((i) => i.type === "exchange").length,
      service: inquiries.filter((i) => i.type === "service").length,
      newCount: inquiries.filter((i) => i.status === "new").length,
    };
  }, [inquiries]);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      if (typeFilter !== "all" && inq.type !== typeFilter) return false;
      if (statusFilter !== "all" && inq.status !== statusFilter) return false;

      if (dateFilter !== "all" && inq.createdAt) {
        const itemDate = new Date(inq.createdAt).getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (dateFilter === "today" && now - itemDate > oneDay) return false;
        if (dateFilter === "week" && now - itemDate > 7 * oneDay) return false;
        if (dateFilter === "month" && now - itemDate > 30 * oneDay) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const nameMatch = (inq.name || "").toLowerCase().includes(q);
        const phoneMatch = (inq.phone || "").toLowerCase().includes(q);
        const emailMatch = (inq.email || "").toLowerCase().includes(q);
        const msgMatch = (inq.message || "").toLowerCase().includes(q);
        const typeMatch = (inq.type || "").toLowerCase().includes(q);
        return nameMatch || phoneMatch || emailMatch || msgMatch || typeMatch;
      }

      return true;
    });
  }, [inquiries, searchTerm, typeFilter, statusFilter, dateFilter]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "test_drive":
        return { label: "🚗 Test Drive Booked", bg: "rgba(16, 185, 129, 0.2)", border: "#10b981", color: "#34d399" };
      case "buy":
        return { label: "💰 Vehicle Purchase", bg: "rgba(56, 189, 248, 0.15)", border: "#38bdf8", color: "#38bdf8" };
      case "exchange":
        return { label: "🔄 Car Exchange Quote", bg: "rgba(245, 158, 11, 0.15)", border: "#f59e0b", color: "#fbbf24" };
      case "sell":
        return { label: "🏷️ Sell Car Valuation", bg: "rgba(239, 68, 68, 0.15)", border: "#ef4444", color: "#f87171" };
      case "service":
        return { label: "🔧 Service Booking", bg: "rgba(168, 85, 247, 0.15)", border: "#a855f7", color: "#c084fc" };
      default:
        return { label: "✉️ Customer Inquiry", bg: "rgba(255, 255, 255, 0.08)", border: "var(--border)", color: "var(--text-main)" };
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ color: "var(--text-main)", margin: 0, fontSize: 24, fontWeight: 800 }}>
            Incoming Notifications & Customer Leads
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            Monitor real-time incoming test drive bookings, buying inquiries, exchange requests, and service submissions with exact date & time stamps.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <div className="badge badge-red" style={{ fontSize: 12, padding: "6px 12px" }}>
            <span>{counts.newCount} New Unread</span>
          </div>
          <div className="badge badge-gold" style={{ fontSize: 12, padding: "6px 12px" }}>
            <span>{counts.test_drive} Test Drives</span>
          </div>
        </div>
      </div>

      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: 16,
          marginBottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 280px", position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Search incoming leads by customer name, mobile number, keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ width: "100%", paddingLeft: 38, fontSize: 13 }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={14} color="var(--text-muted)" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="form-select"
                style={{ fontSize: 12, padding: "6px 10px", minWidth: 140 }}
              >
                <option value="all">All Notification Types ({counts.all})</option>
                <option value="test_drive">🚗 Test Drives ({counts.test_drive})</option>
                <option value="buy">💰 Purchase Inquiries ({counts.buy})</option>
                <option value="exchange">🔄 Exchange Quotes ({counts.exchange})</option>
                <option value="sell">🏷️ Sell Car Inquiries ({counts.sell})</option>
                <option value="service">🔧 Service Bookings ({counts.service})</option>
                <option value="contact">✉️ General Contact</option>
              </select>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: 12, padding: "6px 10px", minWidth: 120 }}
            >
              <option value="all">All Statuses</option>
              <option value="new">New / Unread</option>
              <option value="contacted">Contacted</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: 12, padding: "6px 10px", minWidth: 120 }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>

            {(searchTerm || typeFilter !== "all" || statusFilter !== "all" || dateFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setTypeFilter("all");
                  setStatusFilter("all");
                  setDateFilter("all");
                }}
                className="btn btn-outline btn-sm"
                style={{ fontSize: 11 }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={`btn btn-sm ${typeFilter === "all" ? "btn-primary" : "btn-glass"}`}
            style={{ fontSize: 11, padding: "4px 10px" }}
          >
            All Leads ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("test_drive")}
            className={`btn btn-sm ${typeFilter === "test_drive" ? "btn-primary" : "btn-glass"}`}
            style={{ fontSize: 11, padding: "4px 10px" }}
          >
            🚗 Test Drives ({counts.test_drive})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("buy")}
            className={`btn btn-sm ${typeFilter === "buy" ? "btn-primary" : "btn-glass"}`}
            style={{ fontSize: 11, padding: "4px 10px" }}
          >
            💰 Purchase ({counts.buy})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("exchange")}
            className={`btn btn-sm ${typeFilter === "exchange" ? "btn-primary" : "btn-glass"}`}
            style={{ fontSize: 11, padding: "4px 10px" }}
          >
            🔄 Exchange ({counts.exchange})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("new")}
            className={`btn btn-sm ${statusFilter === "new" ? "btn-primary" : "btn-glass"}`}
            style={{ fontSize: 11, padding: "4px 10px", marginLeft: "auto" }}
          >
            New Only ({counts.newCount})
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40 }}><RefreshCw className="animate-spin" size={24} /></div>
      ) : filteredInquiries.length === 0 ? (
        <div style={{ padding: 40, background: "var(--bg-surface)", borderRadius: "var(--radius-md)", textAlign: "center", border: "1px solid var(--border)" }}>
          <p style={{ color: "var(--text-muted)", margin: 0 }}>
            {inquiries.length === 0
              ? "No customer inquiries or test drive bookings recorded yet."
              : "No inquiries match your active search and filter criteria."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredInquiries.map((inq) => {
            const isTestDrive = inq.type === "test_drive";
            const badge = getTypeBadge(inq.type);
            const formatted = formatDateTime(inq.createdAt);

            return (
              <div
                key={inq.id}
                style={{
                  background: isTestDrive ? "rgba(16, 185, 129, 0.04)" : "var(--bg-surface)",
                  border: isTestDrive ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "18px 20px",
                  boxShadow: "var(--shadow-sm)",
                  transition: "all 0.2s ease",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        background: badge.bg,
                        border: `1px solid ${badge.border}`,
                        color: badge.color,
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {badge.label}
                    </span>

                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      Lead #{inq.id}
                    </span>

                    {inq.vehicleId && (
                      <span className="badge badge-blue" style={{ fontSize: 11 }}>
                        Car #{inq.vehicleId}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    {inq.readByAdmin || inq.readAt ? (
                      <span style={{ fontSize: 11, color: "var(--accent-green)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <CheckCircle2 size={12} color="var(--accent-green)" />
                        <span>Opened & Read</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <span>Unread Lead</span>
                      </span>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Status:</span>
                      <select
                        value={inq.status}
                        onChange={(e) => updateStatus.mutate({ id: inq.id, status: e.target.value as any })}
                        className="form-select"
                        style={{
                          padding: "3px 8px",
                          fontSize: 12,
                          fontWeight: 600,
                          background: inq.status === "new" ? "rgba(239, 68, 68, 0.15)" : inq.status === "contacted" ? "rgba(56, 189, 248, 0.15)" : "rgba(16, 185, 129, 0.15)",
                          borderColor: inq.status === "new" ? "#ef4444" : inq.status === "contacted" ? "#38bdf8" : "#10b981",
                          color: "var(--text-main)",
                        }}
                      >
                        <option value="new">New / Unread</option>
                        <option value="contacted">Contacted</option>
                        <option value="completed">Completed (Auto-Delete)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 14 }}>
                  <div>
                    <span style={{ fontSize: 11, color: "var(--text-dim)", display: "block" }}>Customer Name</span>
                    <strong style={{ fontSize: 15, color: "var(--text-main)" }}>{inq.name}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, color: "var(--text-dim)", display: "block" }}>Mobile Contact</span>
                    <a href={`tel:${inq.phone}`} style={{ color: "#38bdf8", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
                      {inq.phone}
                    </a>
                  </div>

                  {inq.email && (
                    <div>
                      <span style={{ fontSize: 11, color: "var(--text-dim)", display: "block" }}>Email</span>
                      <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{inq.email}</span>
                    </div>
                  )}
                </div>

                {inq.message && (
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "10px 14px",
                      marginBottom: 14,
                      fontSize: 13,
                      color: "var(--text-main)",
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ fontSize: 11, color: "var(--text-dim)", display: "block", marginBottom: 2 }}>
                      {isTestDrive ? "Test Drive Preferences / Schedule:" : "Customer Message / Notes:"}
                    </span>
                    {inq.message}
                  </div>
                )}

                
                {inq.adminReply && (
                  <div
                    style={{
                      background: "rgba(56, 189, 248, 0.08)",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                      borderRadius: 6,
                      padding: "10px 14px",
                      marginBottom: 14,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
                      <strong style={{ fontSize: 12, color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <MessageSquare size={13} />
                        <span>Official Showroom Reply</span>
                        {inq.slotConfirmed && inq.confirmedSlotTime && (
                          <span className="badge badge-gold" style={{ fontSize: 11, marginLeft: 4 }}>
                            Slot Confirmed: {inq.confirmedSlotTime}
                          </span>
                        )}
                      </strong>
                      {inq.repliedAt && (
                        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
                          {formatDateTime(inq.repliedAt).date} · {formatDateTime(inq.repliedAt).time}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text-main)", lineHeight: 1.5 }}>
                      {inq.adminReply}
                    </p>
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: 12,
                    borderTop: "1px solid var(--border)",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-main)", fontSize: 12, fontWeight: 700 }}>
                      <Calendar size={14} color="var(--primary)" />
                      <span>Date: {formatted.date}</span>
                    </div>

                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#38bdf8", fontSize: 12, fontWeight: 700 }}>
                      <Clock size={14} color="#38bdf8" />
                      <span>Time: {formatted.time} IST</span>
                    </div>

                    <span className="badge badge-glass" style={{ fontSize: 11, padding: "2px 8px" }}>
                      {formatted.relative}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => handleOpenReplyModal(inq)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: 11, padding: "5px 10px" }}
                    >
                      <MessageSquare size={12} />
                      <span>{inq.adminReply ? "Edit Reply / Slot" : "Reply / Confirm Slot"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConvertToCustomer(inq)}
                      disabled={convertedMap[inq.id] || createCustomer.isPending}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 11, padding: "5px 10px" }}
                    >
                      <Plus size={12} />
                      <span>{convertedMap[inq.id] ? "Saved in Clients ✓" : "Add to Clients"}</span>
                    </button>

                    <a
                      href={`https://wa.me/${inq.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-glass btn-sm"
                      style={{ fontSize: 11, padding: "5px 10px", color: "#34d399" }}
                    >
                      <Share2 size={12} />
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={`tel:${inq.phone}`}
                      className="btn btn-glass btn-sm"
                      style={{ fontSize: 11, padding: "5px 10px" }}
                    >
                      <Phone size={12} />
                      <span>Call</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete Lead #${inq.id} (${inq.name})?`)) {
                          deleteInquiryMutation.mutate(inq.id);
                        }
                      }}
                      disabled={deleteInquiryMutation.isPending}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 11, padding: "5px 10px", borderColor: "rgba(239, 68, 68, 0.4)", color: "#ef4444" }}
                      title="Delete Lead"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      
      {replyModalInquiry && (
        <div className="modal-backdrop" onClick={() => setReplyModalInquiry(null)}>
          <div className="modal-content" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ color: "var(--text-main)", margin: 0 }}>
                  Reply & Slot Confirmation
                </h3>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Lead from {replyModalInquiry.name} ({replyModalInquiry.phone})
                </span>
              </div>
              <button onClick={() => setReplyModalInquiry(null)} className="modal-close-btn"><X size={18} /></button>
            </div>

            <div style={{ padding: 22 }}>
              
              <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <strong style={{ fontSize: 14, color: "var(--text-main)" }}>{replyModalInquiry.name}</strong>
                  <span style={{ fontSize: 12, color: "#38bdf8", fontWeight: 700 }}>{replyModalInquiry.phone}</span>
                </div>
                {replyModalInquiry.message && (
                  <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>
                    "{replyModalInquiry.message}"
                  </p>
                )}
              </div>

              
              <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, color: "var(--text-main)", marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={slotConfirmed}
                    onChange={(e) => {
                      setSlotConfirmed(e.target.checked);
                      if (e.target.checked && !confirmedSlotTime) {
                        setConfirmedSlotTime("Tomorrow, 11:30 AM");
                      }
                    }}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                  <span>Confirm Appointment / Test Drive Slot</span>
                </label>

                {slotConfirmed && (
                  <div style={{ marginTop: 8 }}>
                    <label className="form-label" style={{ fontSize: 12 }}>Confirmed Date & Time Slot *</label>
                    <input
                      type="text"
                      value={confirmedSlotTime}
                      onChange={(e) => setConfirmedSlotTime(e.target.value)}
                      placeholder="e.g. 12 Oct 2026, 11:30 AM"
                      className="form-input"
                      style={{ fontSize: 13 }}
                    />
                  </div>
                )}
              </div>

              
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
                  Quick Fill Response Template:
                </span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSlotConfirmed(true);
                      const time = confirmedSlotTime || "Tomorrow at 11:30 AM";
                      setConfirmedSlotTime(time);
                      setReplyText(`Hi ${replyModalInquiry.name}, your visit & test drive slot has been confirmed for ${time} at Passion Car Luxury Showroom, Kavuri Hills, Madhapur. See you then!`);
                    }}
                    className="btn btn-glass btn-sm"
                    style={{ fontSize: 11, padding: "4px 8px" }}
                  >
                    Slot Confirmed
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyText(`Hi ${replyModalInquiry.name}, thank you for contacting Passion Car! Our showroom manager reviewed your request and we are preparing the best deal for you.`);
                    }}
                    className="btn btn-glass btn-sm"
                    style={{ fontSize: 11, padding: "4px 8px" }}
                  >
                    Deal Preparation
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyText(`Hi ${replyModalInquiry.name}, regarding your schedule request, could you please confirm if 4:30 PM works for you?`);
                    }}
                    className="btn btn-glass btn-sm"
                    style={{ fontSize: 11, padding: "4px 8px" }}
                  >
                    Reschedule Suggestion
                  </button>
                </div>
              </div>

              
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label">Official Showroom Response *</label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your official response to the customer..."
                  className="form-textarea"
                  style={{ fontSize: 13 }}
                  required
                />
              </div>

              
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setReplyModalInquiry(null)}
                  className="btn btn-glass btn-sm"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!replyText.trim()) {
                      alert("Please type a response before sending.");
                      return;
                    }
                    const text = encodeURIComponent(replyText.trim());
                    window.open(`https://wa.me/${replyModalInquiry.phone.replace(/\D/g, "")}?text=${text}`, "_blank");
                    replyMutation.mutate(
                      {
                        id: replyModalInquiry.id,
                        reply: replyText.trim(),
                        status: "contacted",
                        confirmedSlotTime: slotConfirmed ? confirmedSlotTime.trim() : undefined,
                        slotConfirmed,
                      },
                      {
                        onSuccess: () => setReplyModalInquiry(null),
                      }
                    );
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: "#10b981", color: "#34d399" }}
                >
                  <Share2 size={13} />
                  <span>Send WhatsApp & Save</span>
                </button>

                <button
                  type="button"
                  disabled={replyMutation.isPending || !replyText.trim()}
                  onClick={() => {
                    replyMutation.mutate(
                      {
                        id: replyModalInquiry.id,
                        reply: replyText.trim(),
                        status: "contacted",
                        confirmedSlotTime: slotConfirmed ? confirmedSlotTime.trim() : undefined,
                        slotConfirmed,
                      },
                      {
                        onSuccess: () => setReplyModalInquiry(null),
                      }
                    );
                  }}
                  className="btn btn-primary btn-sm"
                >
                  {replyMutation.isPending ? "Saving..." : "Save Reply to Ticket"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminServicesTab() {
  const { data: serviceBookings = [], isLoading } = useAdminServiceTokens();
  const updateStatus = useUpdateServiceTokenStatus();
  const deleteTokenMutation = useDeleteServiceToken();
  const bookServiceSlot = useBookServiceSlot();
  const createCustomer = useCreateCustomer();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [postponeBooking, setPostponeBooking] = useState<ServiceBooking | null>(null);
  const [postponeDate, setPostponeDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [postponeSlot, setPostponeSlot] = useState("09:30 AM - 11:00 AM (Morning Slot)");
  const [modalForm, setModalForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    carDetails: "",
    servicePackage: "Periodic Comprehensive Service",
    date: new Date().toISOString().split("T")[0],
    timeSlot: "09:30 AM - 11:00 AM (Morning Slot)",
    notes: "",
  });

  const total = serviceBookings.length;
  const confirmedCount = serviceBookings.filter((b) => b.status === "confirmed" || !b.status).length;
  const inProgressCount = serviceBookings.filter((b) => b.status === "in_progress").length;
  const completedCount = serviceBookings.filter((b) => b.status === "completed").length;
  const postponedCount = serviceBookings.filter((b) => b.status === "postponed").length;

  const filtered = useMemo(() => {
    return serviceBookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mToken = b.token.toLowerCase().includes(q);
        const mName = b.customerName.toLowerCase().includes(q);
        const mPhone = b.phone.toLowerCase().includes(q);
        const mCar = b.carDetails.toLowerCase().includes(q);
        const mPkg = b.servicePackage.toLowerCase().includes(q);
        if (!mToken && !mName && !mPhone && !mCar && !mPkg) return false;
      }
      return true;
    });
  }, [serviceBookings, statusFilter, searchTerm]);

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.customerName.trim() || !modalForm.phone.trim() || !modalForm.carDetails.trim()) return;
    bookServiceSlot.mutate(
      {
        customerName: modalForm.customerName.trim(),
        phone: modalForm.phone.trim(),
        email: modalForm.email.trim() || undefined,
        carDetails: modalForm.carDetails.trim(),
        servicePackage: modalForm.servicePackage,
        date: modalForm.date,
        timeSlot: modalForm.timeSlot,
        notes: modalForm.notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setShowIssueModal(false);
          setModalForm({
            customerName: "",
            phone: "",
            email: "",
            carDetails: "",
            servicePackage: "Periodic Comprehensive Service",
            date: new Date().toISOString().split("T")[0],
            timeSlot: "09:30 AM - 11:00 AM (Morning Slot)",
            notes: "",
          });
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === "postponed") {
      return { bg: "rgba(168, 85, 247, 0.15)", border: "#a855f7", color: "#c084fc", label: "Postponed / Rescheduled" };
    }
    if (status === "in_progress") {
      return { bg: "rgba(245, 158, 11, 0.15)", border: "#f59e0b", color: "#f59e0b", label: "In Service Bay" };
    }
    if (status === "completed") {
      return { bg: "rgba(16, 185, 129, 0.15)", border: "#10b981", color: "#10b981", label: "Completed" };
    }
    if (status === "cancelled") {
      return { bg: "rgba(239, 68, 68, 0.15)", border: "#ef4444", color: "#ef4444", label: "Cancelled" };
    }
    return { bg: "rgba(56, 189, 248, 0.15)", border: "#38bdf8", color: "#38bdf8", label: "Confirmed / Scheduled" };
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ color: "var(--text-main)", margin: 0, fontSize: 24, fontWeight: 800 }}>
            Service Bay Bookings & Digital Passes
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
            Monitor real-time workshop service appointments, official token passes, vehicle diagnostic bookings, and fast-track bay access.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div className="badge badge-gold" style={{ fontSize: 12, padding: "6px 12px" }}>
            <span>{confirmedCount} New / Scheduled</span>
          </div>
          <button onClick={() => setShowIssueModal(true)} className="btn btn-primary btn-sm">
            <Plus size={14} />
            <span>Issue Service Token</span>
          </button>
        </div>
      </div>

      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Total Service Bookings</span>
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-main)", marginTop: 4 }}>{total}</div>
        </div>
        <div className="admin-kpi-card">
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Confirmed / Scheduled</span>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#38bdf8", marginTop: 4 }}>{confirmedCount}</div>
        </div>
        <div className="admin-kpi-card">
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>In Service Bay</span>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#f59e0b", marginTop: 4 }}>{inProgressCount}</div>
        </div>
        <div className="admin-kpi-card">
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Postponed</span>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#c084fc", marginTop: 4 }}>{postponedCount}</div>
        </div>
        <div className="admin-kpi-card">
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Completed</span>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#10b981", marginTop: 4 }}>{completedCount}</div>
        </div>
      </div>

      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 280px", position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by Token ID, customer name, mobile number, car model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ width: "100%", paddingLeft: 38, fontSize: 13 }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: 12, padding: "6px 10px", minWidth: 140 }}
            >
              <option value="all">All Statuses ({total})</option>
              <option value="confirmed">Confirmed ({confirmedCount})</option>
              <option value="in_progress">In Bay ({inProgressCount})</option>
              <option value="postponed">Postponed ({postponedCount})</option>
              <option value="completed">Completed ({completedCount})</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40 }}><RefreshCw className="animate-spin" size={24} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 48, background: "var(--bg-surface)", borderRadius: "var(--radius-md)", textAlign: "center", border: "1px solid var(--border)" }}>
          <Ticket size={40} color="var(--primary)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ color: "var(--text-main)", marginBottom: 6 }}>No Service Bookings Found</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
            No workshop service bookings match your active search and filter criteria.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filtered.map((b) => {
            const badge = getStatusBadge(b.status);
            return (
              <div
                key={b.id}
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  padding: "18px 20px",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="badge badge-gold" style={{ fontSize: 13, letterSpacing: 0.5, fontWeight: 800 }}>
                      #{b.token}
                    </span>
                    <span
                      style={{
                        background: badge.bg,
                        border: `1px solid ${badge.border}`,
                        color: badge.color,
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Status:</span>
                    <select
                      value={b.status}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "postponed") {
                          setPostponeBooking(b);
                          setPostponeDate(b.date || new Date().toISOString().split("T")[0]);
                          setPostponeSlot(b.timeSlot || "09:30 AM - 11:00 AM (Morning Slot)");
                        } else {
                          updateStatus.mutate({ id: b.id, status: val });
                        }
                      }}
                      className="form-select"
                      style={{
                        padding: "3px 8px",
                        fontSize: 12,
                        fontWeight: 600,
                        background: b.status === "postponed" ? "rgba(168, 85, 247, 0.15)" : b.status === "completed" ? "rgba(16, 185, 129, 0.15)" : b.status === "in_progress" ? "rgba(245, 158, 11, 0.15)" : "rgba(56, 189, 248, 0.15)",
                        borderColor: b.status === "postponed" ? "#a855f7" : b.status === "completed" ? "#10b981" : b.status === "in_progress" ? "#f59e0b" : "#38bdf8",
                        color: "var(--text-main)",
                      }}
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Bay / Servicing</option>
                      <option value="completed">Completed (Auto-Delete)</option>
                      <option value="postponed">Postponed / Rescheduled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, color: "var(--text-dim)", display: "block" }}>Customer Name</span>
                    <strong style={{ fontSize: 15, color: "var(--text-main)" }}>{b.customerName}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, color: "var(--text-dim)", display: "block" }}>Mobile Contact</span>
                    <a href={`tel:${b.phone}`} style={{ color: "#38bdf8", fontWeight: 700, textDecoration: "none", fontSize: 14 }}>
                      {b.phone}
                    </a>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, color: "var(--text-dim)", display: "block" }}>Vehicle & Registration</span>
                    <strong style={{ fontSize: 14, color: "var(--text-main)" }}>{b.carDetails}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, color: "var(--text-dim)", display: "block" }}>Service Package</span>
                    <span style={{ color: "var(--accent-gold)", fontWeight: 700, fontSize: 13 }}>{b.servicePackage}</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--border)", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: b.status === "postponed" ? "#c084fc" : "var(--text-main)", fontSize: 12, fontWeight: 700 }}>
                      <Calendar size={14} color={b.status === "postponed" ? "#a855f7" : "var(--primary)"} />
                      <span>{b.status === "postponed" ? `Confirmed Date: ${b.date}` : `Date: ${b.date}`}</span>
                    </div>

                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#38bdf8", fontSize: 12, fontWeight: 700 }}>
                      <Clock size={14} color="#38bdf8" />
                      <span>Slot: {b.timeSlot}</span>
                    </div>

                    {b.notes && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                        Note: {b.notes}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPostponeBooking(b);
                        setPostponeDate(b.date || new Date().toISOString().split("T")[0]);
                        setPostponeSlot(b.timeSlot || "09:30 AM - 11:00 AM (Morning Slot)");
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 11, padding: "5px 10px", borderColor: "rgba(168, 85, 247, 0.4)", color: "#c084fc" }}
                      title="Postpone Date"
                    >
                      <CalendarClock size={12} />
                      <span>Postpone Date</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        createCustomer.mutate({
                          name: b.customerName,
                          phone: b.phone,
                          email: b.email || "",
                          transactionType: "current_buyer",
                          carModel: b.carDetails,
                          regNumber: "",
                          amountInr: 0,
                          date: b.date,
                          status: "in_progress",
                          serviceToken: b.token,
                          notes: `[Service Booking: ${b.token}] ${b.servicePackage}`,
                        });
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 11, padding: "5px 10px" }}
                    >
                      <Plus size={12} />
                      <span>Add to Clients</span>
                    </button>

                    <a
                      href={`https://wa.me/${b.phone.replace(/\\D/g, "")}?text=${encodeURIComponent(
                        `*PASSION CAR OFFICIAL SERVICE PASS*\\n🎫 *Token:* ${b.token}\\n👤 *Customer:* ${b.customerName}\\n🚗 *Vehicle:* ${b.carDetails}\\n🔧 *Package:* ${b.servicePackage}\\n📅 *Date:* ${b.date}\\n⏰ *Time Slot:* ${b.timeSlot}\\n📍 *Location:* Passion Car, Plot 25, 100 Feet Rd, Kavuri Hills, Madhapur, Hyderabad`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-glass btn-sm"
                      style={{ fontSize: 11, padding: "5px 10px", color: "#34d399" }}
                    >
                      <Share2 size={12} />
                      <span>WhatsApp Pass</span>
                    </a>

                    <a
                      href={`tel:${b.phone}`}
                      className="btn btn-glass btn-sm"
                      style={{ fontSize: 11, padding: "5px 10px" }}
                    >
                      <Phone size={12} />
                      <span>Call</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete Service Token #${b.token} (${b.customerName})?`)) {
                          deleteTokenMutation.mutate(b.id);
                        }
                      }}
                      disabled={deleteTokenMutation.isPending}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 11, padding: "5px 10px", borderColor: "rgba(239, 68, 68, 0.4)", color: "#ef4444" }}
                      title="Delete Booking"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showIssueModal && (
        <div className="modal-backdrop" onClick={() => setShowIssueModal(false)}>
          <div className="modal-content" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0, color: "var(--text-main)" }}>Issue Official Workshop Service Token</h3>
              <button onClick={() => setShowIssueModal(false)} className="modal-close-btn"><X size={18} /></button>
            </div>

            <form onSubmit={handleIssueSubmit} style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={modalForm.customerName}
                  onChange={(e) => setModalForm({ ...modalForm, customerName: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="form-input"
                />
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Mobile Number (10 Digits) *</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    required
                    value={modalForm.phone}
                    onChange={(e) => setModalForm({ ...modalForm, phone: cleanMobileNumber(e.target.value) })}
                    placeholder="10-digit mobile number (e.g. 9849012345)"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    value={modalForm.email}
                    onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                    placeholder="customer@gmail.com"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Make, Model & Reg. Number *</label>
                <input
                  type="text"
                  required
                  value={modalForm.carDetails}
                  onChange={(e) => setModalForm({ ...modalForm, carDetails: e.target.value })}
                  placeholder="e.g. 2021 BMW 320d (TS 09 FL 7821)"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Service Package *</label>
                <select
                  value={modalForm.servicePackage}
                  onChange={(e) => setModalForm({ ...modalForm, servicePackage: e.target.value })}
                  className="form-select"
                >
                  <option value="Periodic Comprehensive Service">Periodic Comprehensive Service</option>
                  <option value="Brakes & Suspension Overhaul">Brakes & Suspension Overhaul</option>
                  <option value="AC & Climate System Service">AC & Climate System Service</option>
                  <option value="Computer OBD-II Diagnostics">Computer OBD-II Diagnostics</option>
                  <option value="150-Point Pre-Purchase Inspection">150-Point Pre-Purchase Inspection</option>
                  <option value="Ceramic Coating & Detailing">Ceramic Coating & Detailing</option>
                  <option value="General Checkup & Oil Topup">General Checkup & Oil Topup</option>
                </select>
              </div>

              <div className="form-grid-2col">
                <div className="form-group">
                  <label className="form-label">Scheduled Date *</label>
                  <input
                    type="date"
                    required
                    value={modalForm.date}
                    onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time Slot *</label>
                  <select
                    value={modalForm.timeSlot}
                    onChange={(e) => setModalForm({ ...modalForm, timeSlot: e.target.value })}
                    className="form-select"
                  >
                    <option value="09:30 AM - 11:00 AM (Morning Slot)">09:30 AM - 11:00 AM (Morning Slot)</option>
                    <option value="11:00 AM - 12:30 PM (Mid-Day Slot)">11:00 AM - 12:30 PM (Mid-Day Slot)</option>
                    <option value="02:00 PM - 03:30 PM (Afternoon Slot)">02:00 PM - 03:30 PM (Afternoon Slot)</option>
                    <option value="03:30 PM - 05:00 PM (Late Afternoon Slot)">03:30 PM - 05:00 PM (Late Afternoon Slot)</option>
                    <option value="05:00 PM - 06:30 PM (Evening Slot)">05:00 PM - 06:30 PM (Evening Slot)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Special Notes / Inspection Instructions</label>
                <input
                  type="text"
                  value={modalForm.notes}
                  onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                  placeholder="e.g. Front disc noise, oil change requested"
                  className="form-input"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowIssueModal(false)} className="btn btn-glass">
                  Cancel
                </button>
                <button type="submit" disabled={bookServiceSlot.isPending} className="btn btn-primary">
                  {bookServiceSlot.isPending ? "Generating Token..." : "Issue Digital Token Pass"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {postponeBooking && (
        <div className="modal-backdrop" onClick={() => setPostponeBooking(null)}>
          <div className="modal-content" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CalendarClock size={20} color="#a855f7" />
                <h3 style={{ margin: 0, color: "var(--text-main)", fontSize: 18, fontWeight: 700 }}>
                  Postpone Service & Confirm New Date
                </h3>
              </div>
              <button onClick={() => setPostponeBooking(null)} className="modal-close-btn"><X size={18} /></button>
            </div>

            <div style={{ padding: 22 }}>
              <div style={{ background: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.25)", borderRadius: "var(--radius-sm)", padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-main)" }}>#{postponeBooking.token} · {postponeBooking.customerName}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{postponeBooking.carDetails} ({postponeBooking.servicePackage})</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>Current Scheduled Date: {postponeBooking.date} · {postponeBooking.timeSlot}</div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  updateStatus.mutate(
                    {
                      id: postponeBooking.id,
                      status: "postponed",
                      date: postponeDate,
                      timeSlot: postponeSlot,
                    },
                    {
                      onSuccess: () => {
                        setPostponeBooking(null);
                      },
                    }
                  );
                }}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div className="form-group">
                  <label className="form-label">New Confirmed Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={postponeDate}
                    onChange={(e) => setPostponeDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirmed Time Slot *</label>
                  <select
                    value={postponeSlot}
                    onChange={(e) => setPostponeSlot(e.target.value)}
                    className="form-select"
                  >
                    <option value="09:30 AM - 11:00 AM (Morning Slot)">09:30 AM - 11:00 AM (Morning Slot)</option>
                    <option value="11:00 AM - 12:30 PM (Mid-Day Slot)">11:00 AM - 12:30 PM (Mid-Day Slot)</option>
                    <option value="02:00 PM - 03:30 PM (Afternoon Slot)">02:00 PM - 03:30 PM (Afternoon Slot)</option>
                    <option value="03:30 PM - 05:00 PM (Late Afternoon Slot)">03:30 PM - 05:00 PM (Late Afternoon Slot)</option>
                    <option value="05:00 PM - 06:30 PM (Evening Slot)">05:00 PM - 06:30 PM (Evening Slot)</option>
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => setPostponeBooking(null)} className="btn btn-glass">
                    Cancel
                  </button>
                  <button type="submit" disabled={updateStatus.isPending} className="btn btn-primary" style={{ background: "#a855f7", borderColor: "#a855f7" }}>
                    {updateStatus.isPending ? "Saving..." : "Save Confirmed Date"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminGalleryTab() {
  const { data: gallery = [], isLoading } = useGallery("all");
  const createItem = useCreateGalleryItem();
  const updateItem = useUpdateGalleryItem();
  const deleteItem = useDeleteGalleryItem();
  const uploadImage = useUploadImage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState<{
    title: string;
    category: string;
    imageUrl: string;
    caption: string;
    sortOrder: number;
  }>({
    title: "",
    category: "Customer Deliveries",
    imageUrl: "",
    caption: "",
    sortOrder: 0,
  });

  const categories = ["all", "Showroom", "Customer Deliveries", "Facilities", "Events"];

  const filteredItems = useMemo(() => {
    return gallery.filter((item) => {
      const matchCat =
        activeCategory === "all" ||
        item.category.toLowerCase() === activeCategory.toLowerCase();
      const matchSearch =
        !searchTerm.trim() ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.caption.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [gallery, activeCategory, searchTerm]);

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const compressed = await compressImageFile(file, 1600, 0.82);
      if (!compressed.image) throw new Error("Could not process photo file.");
      try {
        const res = await uploadImage.mutateAsync({
          image: compressed.image,
          name: file.name.replace(/\.[^/.]+$/, ""),
        });
        setForm((prev) => ({
          ...prev,
          imageUrl: res?.url || compressed.image,
          title: prev.title || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        }));
      } catch {
        setForm((prev) => ({
          ...prev,
          imageUrl: compressed.image,
          title: prev.title || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload photo from device.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setForm({
      title: "",
      category: "Customer Deliveries",
      imageUrl: "",
      caption: "",
      sortOrder: (gallery.length || 0) + 1,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setForm({
      title: item.title,
      category: item.category,
      imageUrl: item.imageUrl,
      caption: item.caption,
      sortOrder: item.sortOrder,
    });
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert("Please provide a title for the gallery item.");
      return;
    }
    if (!form.imageUrl.trim()) {
      alert("Please choose a photo from your device.");
      return;
    }

    if (editingItem) {
      updateItem.mutate(
        { id: editingItem.id, input: form },
        {
          onSuccess: () => {
            setShowAddModal(false);
            setEditingItem(null);
            setAlertMsg({ type: "success", text: "Gallery photo updated successfully!" });
            setTimeout(() => setAlertMsg(null), 3000);
          },
          onError: (err: any) => {
            setAlertMsg({ type: "error", text: err?.message || "Failed to update gallery photo." });
          },
        }
      );
    } else {
      createItem.mutate(form, {
        onSuccess: () => {
          setShowAddModal(false);
          setAlertMsg({ type: "success", text: "New photo added to showroom gallery!" });
          setTimeout(() => setAlertMsg(null), 3000);
        },
        onError: (err: any) => {
          setAlertMsg({ type: "error", text: err?.message || "Failed to add gallery photo." });
        },
      });
    }
  };

  const handleDelete = (id: number, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}" from the showroom gallery?`)) {
      deleteItem.mutate(id, {
        onSuccess: () => {
          setAlertMsg({ type: "success", text: "Photo removed from gallery." });
          setTimeout(() => setAlertMsg(null), 3000);
        },
        onError: (err: any) => {
          setAlertMsg({ type: "error", text: err?.message || "Failed to delete photo." });
        },
      });
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ color: "var(--text-main)", margin: 0, fontSize: 24, fontWeight: 800 }}>
            Showroom Gallery Management
          </h2>
          <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: 14 }}>
            Manage public showroom photos, customer key handover ceremonies, and facility inspection highlights ({gallery.length} total photos).
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Plus size={16} />
          <span>Add New Photo</span>
        </button>
      </div>

      {alertMsg && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            marginBottom: 20,
            background: alertMsg.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            border: alertMsg.type === "success" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
            color: alertMsg.type === "success" ? "#34d399" : "#f87171",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{alertMsg.text}</span>
        </div>
      )}

      <div style={{ background: "var(--bg-surface)", padding: 18, borderRadius: "var(--radius-md)", border: "1px solid var(--border)", marginBottom: 24, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`btn btn-sm ${activeCategory === cat ? "btn-primary" : "btn-glass"}`}
              style={{ fontSize: 13, padding: "6px 14px", textTransform: "capitalize" }}
            >
              {cat === "all" ? `All (${gallery.length})` : cat}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", minWidth: 260 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-dim)" }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title or caption..."
            className="form-input"
            style={{ paddingLeft: 36, fontSize: 13, height: 38 }}
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <RefreshCw className="animate-spin" size={28} style={{ margin: "0 auto 12px", color: "var(--primary)" }} />
          <p style={{ color: "var(--text-muted)" }}>Loading showroom gallery...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "var(--bg-surface)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border)" }}>
          <ImageIcon size={48} style={{ opacity: 0.3, margin: "0 auto 16px" }} />
          <h3 style={{ color: "var(--text-main)", marginBottom: 8 }}>No Gallery Photos Found</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 20 }}>
            {searchTerm ? "No photos match your search query." : "No photos in this category yet. Click Add New Photo to upload."}
          </p>
          <button onClick={handleOpenAdd} className="btn btn-outline btn-sm">
            <Plus size={14} /> Add First Photo
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              style={{
                background: "var(--bg-surface)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              <div style={{ position: "relative", height: 200, width: "100%", background: "#0a0a0c" }}>
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                />
                <span
                  style={{
                    position: "absolute",
                    top: 10,
                    left: 10,
                    background: "rgba(0, 0, 0, 0.75)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "var(--radius-full)",
                    padding: "3px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--primary)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {item.category}
                </span>
                <span
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: "rgba(0, 0, 0, 0.75)",
                    borderRadius: "var(--radius-full)",
                    padding: "2px 8px",
                    fontSize: 11,
                    color: "#fff",
                  }}
                >
                  #{item.sortOrder || item.id}
                </span>
              </div>

              <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <h4 style={{ color: "var(--text-main)", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                  {item.title}
                </h4>
                {item.caption && (
                  <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.5, margin: "0 0 16px", flexGrow: 1 }}>
                    {item.caption}
                  </p>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: "auto" }}>
                  <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
                    ID: {item.id}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="btn btn-glass btn-sm"
                      title="Edit photo details"
                      style={{ padding: "5px 10px", fontSize: 12 }}
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="btn btn-outline btn-sm"
                      title="Delete photo"
                      style={{ padding: "5px 10px", fontSize: 12, borderColor: "rgba(239, 68, 68, 0.4)", color: "#ef4444" }}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="modal-backdrop" onClick={() => setShowAddModal(false)} style={{ zIndex: 10001 }}>
          <div className="modal-content" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ color: "#ffffff", fontSize: 18, margin: 0 }}>
                  {editingItem ? "Edit Gallery Photo" : "Add New Showroom Photo"}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "4px 0 0" }}>
                  {editingItem ? "Update photo title, category, image URL, or caption" : "Upload or link a new photo to showcase on the public gallery"}
                </p>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: 24 }}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Photo Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. BMW 530d Key Handover Ceremony"
                  className="form-input"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="form-input"
                  >
                    <option value="Customer Deliveries">Customer Deliveries</option>
                    <option value="Showroom">Showroom & Fleet</option>
                    <option value="Facilities">Facilities & Inspection</option>
                    <option value="Events">Events & Celebrations</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Sort Order Number</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                    className="form-input"
                    placeholder="1, 2, 3..."
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label">Upload Photo from Device *</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageFileSelect}
                  style={{ display: "none" }}
                />

                {!form.imageUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: "2px dashed var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "32px 18px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: "rgba(255, 255, 255, 0.02)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)";
                    }}
                  >
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        background: "rgba(239, 68, 68, 0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 12px",
                        color: "var(--primary)",
                      }}
                    >
                      {isUploadingPhoto ? <RefreshCw className="animate-spin" size={24} /> : <UploadCloud size={26} />}
                    </div>
                    <h4 style={{ color: "var(--text-main)", fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>
                      {isUploadingPhoto ? "Uploading Photo..." : "Click to Choose Photo from Device"}
                    </h4>
                    <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
                      Select photo directly from your phone gallery, computer, or camera
                    </p>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        position: "relative",
                        background: "#0a0a0c",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border)",
                        overflow: "hidden",
                        maxHeight: 220,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={form.imageUrl}
                        alt="Selected"
                        style={{ maxHeight: 220, width: "100%", objectFit: "contain" }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.85) 100%)",
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                        }}
                      >
                        <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>
                          Photo Selected from Device
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: 12, padding: "5px 12px" }}
                        >
                          <Camera size={13} />
                          <span>Change Photo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Caption / Description</label>
                <textarea
                  rows={3}
                  value={form.caption}
                  onChange={(e) => setForm((prev) => ({ ...prev, caption: e.target.value }))}
                  placeholder="Ceremonial delivery moment, verified documentation handover, etc."
                  className="form-textarea"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-glass"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createItem.isPending || updateItem.isPending}
                  className="btn btn-primary"
                >
                  {createItem.isPending || updateItem.isPending ? "Saving..." : editingItem ? "Update Photo" : "Add to Gallery"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
