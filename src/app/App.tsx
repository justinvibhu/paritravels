import { useEffect, useState, useRef } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import BookingSuccessPage from "../BookingSuccessPage";
import {
  MapPin, Calendar, Users, Car, Search, Star, ChevronDown, ChevronUp,
  Menu, X, Phone, Mail, ArrowRight, ArrowLeft, Check, CreditCard,
  Download, LayoutDashboard, Ticket, Heart, Bell, Settings, LogOut,
  User, Bus, Truck, Package, ChevronRight, Moon, Sun, MessageCircle,
  Building2, DollarSign, Activity, Facebook, Twitter, Instagram,
  Wallet, Smartphone, FileText, Trash2, CheckCircle, XCircle,
  TrendingUp, Shield, Filter, Clock, Globe, Plus, Minus, Eye, Pencil
} from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { useAuth } from "../contexts/AuthContext.tsx";
import { createBooking, getUserBookings, getVehicles, getTours, getSponsors } from "../supabase/db";
import TourBookingPage from "../TourBookingPage";
type VehicleItem = { id: string | number; name: string; type: string; capacity: number; price: number; ac: boolean; img: string; features: string[]; rating: number; reviews: number; category: string; imageUrl?: string; vehicleNumber?: string };
type SearchFilters = { from?: string; to?: string; date?: string; returnDate?: string; passengers?: number; vehicleType?: string };
type DriverItem = { id: string; name: string; phone?: string; licenseNumber?: string; experienceYears?: number; status?: string; imageUrl?: string };

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

// ─── Types ────────────────────────────────────────────────────────────────────
type Page = "home" | "login" | "register" | "forgot" | "vehicles" | "booking" | "tours" | "dashboard";
type Seat = { id: string; label: string; type: "driver" | "seat" | "aisle" | "empty"; booked?: boolean };

// ─── Data ─────────────────────────────────────────────────────────────────────
const reviewsData = [
  { name: "Priya Sharma", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&auto=format", rating: 5, text: "Absolutely amazing service! The Goa trip was perfectly organized. The vehicle was clean and the driver was professional. Will definitely book again!", location: "Mumbai", tour: "Goa Beach Escape" },
  { name: "Rahul Mehta", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&auto=format", rating: 5, text: "Pari Travels made our Kashmir trip unforgettable. Every detail was taken care of. The Fortuner was super comfortable for our family.", location: "Pune", tour: "Kashmir Paradise" },
  { name: "Anjali Singh", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&auto=format", rating: 5, text: "Great experience with the Shirdi tour. Booking was seamless and the seat selection feature is brilliant! Highly recommend to everyone.", location: "Nagpur", tour: "Shirdi Spiritual Tour" },
  { name: "Vikram Patel", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&auto=format", rating: 5, text: "Corporate transport for our company event handled flawlessly. On-time, professional drivers, and excellent vehicles. Will use again!", location: "Surat", tour: "Corporate Transport" },
];

const faqsData = [
  { q: "How do I book a vehicle?", a: "Search for your route, select your preferred vehicle, choose your seats, fill passenger details, and complete payment. The entire process takes less than 5 minutes." },
  { q: "Can I cancel my booking?", a: "Yes, cancellations are allowed up to 24 hours before departure for a full refund. Cancellations within 24 hours are subject to a 25% cancellation fee. Manage bookings from your Customer Dashboard." },
  { q: "What payment methods are accepted?", a: "We accept UPI (PhonePe, GPay, Paytm), all major Credit/Debit cards, Net Banking, and Cash on pickup. All online payments are secured with 256-bit SSL encryption." },
  { q: "Is there a loyalty points program?", a: "Yes! Every booking earns you Pari Points. 100 points = ₹100 discount on your next booking. Premium members earn 2x points on all bookings." },
  { q: "Do you provide airport transfers?", a: "Absolutely! We offer 24/7 airport transfer services with real-time flight tracking. Book at least 2 hours before your flight for guaranteed availability." },
];

// ─── Seat Layout Generator ─────────────────────────────────────────────────────
function getSeatLayout(category: string): Seat[][] {
  const s = (id: string, label: string): Seat => ({ id, label, type: "seat", booked: false });
  const driver: Seat = { id: "driver", label: "Driver", type: "driver" };

  if (category === "sedan") {
    return [
      [driver, s("A1", "A1")],
      [s("B1", "B1"), s("B2", "B2")],
    ];
  }
  if (category === "suv") {
    return [
      [driver, s("A1", "A1")],
      [s("B1", "B1"), s("B2", "B2")],
      [s("C1", "C1"), s("C2", "C2")],
      [s("D1", "D1"), s("D2", "D2")],
    ];
  }
  if (category === "tempo") {
    return [
      [driver, s("A1", "A1"), s("A2", "A2"), s("A3", "A3")],
      [s("B1", "B1"), s("B2", "B2"), s("B3", "B3"), s("B4", "B4")],
      [s("C1", "C1"), s("C2", "C2"), s("C3", "C3"), s("C4", "C4")],
      [s("D1", "D1"), s("D2", "D2"), s("D3", "D3"), s("D4", "D4")],
    ];
  }
  // bus
  return [
    [driver, { id: "e1", label: "", type: "empty" }, { id: "e2", label: "", type: "empty" }, { id: "e3", label: "", type: "empty" }, { id: "e4", label: "", type: "empty" }],
    [s("A1", "A1"), s("A2", "A2"), { id: "ai1", label: "", type: "aisle" }, s("A3", "A3"), s("A4", "A4")],
    [s("B1", "B1"), s("B2", "B2"), { id: "ai2", label: "", type: "aisle" }, s("B3", "B3"), s("B4", "B4")],
    [s("C1", "C1"), s("C2", "C2"), { id: "ai3", label: "", type: "aisle" }, s("C3", "C3"), s("C4", "C4")],
    [s("D1", "D1"), s("D2", "D2"), { id: "ai4", label: "", type: "aisle" }, s("D3", "D3"), s("D4", "D4")],
    [s("E1", "E1"), s("E2", "E2"), { id: "ai5", label: "", type: "aisle" }, s("E3", "E3"), s("E4", "E4")],
    [s("F1", "F1"), s("F2", "F2"), { id: "ai6", label: "", type: "aisle" }, s("F3", "F3"), s("F4", "F4")],
    [s("G1", "G1"), s("G2", "G2"), { id: "ai7", label: "", type: "aisle" }, s("G3", "G3"), s("G4", "G4")],
  ];
}

// ─── Shared Components ─────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={14} className={i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300 fill-gray-300"} />
      ))}
    </div>
  );
}

function Badge({ text, color = "blue" }: { text: string; color?: string }) {
  const cls: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    purple: "bg-purple-100 text-purple-700",
    red: "bg-red-100 text-red-700",
  };
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls[color] ?? cls.blue}`}>{text}</span>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Confirmed") return <Badge text="Confirmed" color="green" />;
  if (status === "Completed") return <Badge text="Completed" color="blue" />;
  if (status === "Pending") return <Badge text="Pending" color="amber" />;
  if (status === "Cancelled") return <Badge text="Cancelled" color="red" />;
  return <Badge text={status} />;
}

function SeatMap({ layout, selected, onToggle, booked }: { layout: Seat[][], selected: string[], onToggle: (id: string) => void, booked: Set<string> }) {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white rounded-2xl p-6 border border-blue-100">
      <div className="flex items-center gap-6 mb-5 text-sm flex-wrap gap-y-2">
        <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded border-2 border-blue-200 bg-white inline-block" />Available</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-blue-600 inline-block" />Selected</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-gray-300 inline-block" />Booked</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-blue-900 inline-block" />Driver</span>
      </div>
      <div className="border-2 border-dashed border-blue-200 rounded-xl p-4 inline-block">
        <div className="flex flex-col gap-2">
          {layout.map((row, ri) => (
            <div key={ri} className="flex gap-2">
              {row.map((seat) => {
                if (seat.type === "driver") return (
                  <div key={seat.id} className="w-10 h-10 rounded-lg bg-blue-900 text-white text-xs flex items-center justify-center font-semibold">🚗</div>
                );
                if (seat.type === "aisle") return <div key={seat.id} className="w-10 h-10" />;
                if (seat.type === "empty") return <div key={seat.id} className="w-10 h-10 opacity-0" />;
                const isBooked = seat.booked || booked.has(seat.id);
                const isSelected = selected.includes(seat.id);
                return (
                  <button
                    key={seat.id}
                    disabled={isBooked}
                    onClick={() => !isBooked && onToggle(seat.id)}
                    className={`w-10 h-10 rounded-lg text-xs font-semibold transition-all duration-150 border-2
                      ${isBooked ? "bg-gray-200 border-gray-200 text-gray-400 cursor-not-allowed" :
                        isSelected ? "bg-blue-600 border-blue-600 text-white scale-95 shadow-md" :
                          "bg-white border-blue-200 text-blue-800 hover:border-blue-500 hover:bg-blue-50"}`}
                  >
                    {seat.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BookingStepIndicator({ step }: { step: number }) {
  const steps = ["Route", "Vehicle", "Seats", "Passengers", "Payment", "Ticket"];
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-2">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={n} className="flex items-center">
            <div className={`flex flex-col items-center min-w-[60px]`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${done ? "bg-green-500 text-white" : active ? "bg-blue-600 text-white shadow-lg ring-4 ring-blue-100" : "bg-gray-100 text-gray-400"}`}>
                {done ? <Check size={14} /> : n}
              </div>
              <span className={`text-xs mt-1 whitespace-nowrap font-medium ${active ? "text-blue-600" : done ? "text-green-600" : "text-gray-400"}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-10 h-0.5 mb-4 mx-1 ${n < step ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser, userData, logout } = useAuth();

  const navLinks = [
    { label: "Home", page: "home" as Page },
    { label: "Vehicles", page: "vehicles" as Page },
    { label: "Tours", page: "tours" as Page },
    { label: "Dashboard", page: "dashboard" as Page },
  ];

  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-blue-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-lg">
            <Globe size={18} className="text-white" />
          </div>
          <div className="leading-tight">
            <div className="font-black text-blue-700 text-lg tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Pari Travels</div>
            <div className="text-[10px] text-blue-400 -mt-1 font-medium tracking-wider">PREMIUM JOURNEYS</div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link key={l.page} to={`/${l.page}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname.includes(l.page) ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:text-blue-700 hover:bg-blue-50"}`}>
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setDark(!dark)} className="w-9 h-9 rounded-lg border border-blue-100 flex items-center justify-center text-blue-500 hover:bg-blue-50 transition-colors">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          
          {currentUser ? (
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{userData?.fullName || currentUser.email}</span>
              <button onClick={() => logout()} className="px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="hidden md:block px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">Login</Link>
          )}
          <Link to="/booking" className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-500 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg hover:opacity-90 transition-all">
            <Car size={14} /> Book Now
          </Link>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden w-9 h-9 rounded-lg border border-blue-100 flex items-center justify-center text-blue-600">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-blue-50 px-4 py-3 space-y-1">
          {navLinks.map(l => (
            <Link key={l.page} to={`/${l.page}`} onClick={() => setMenuOpen(false)}
              className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname.includes(l.page) ? "bg-blue-50 text-blue-700" : "text-gray-600"}`}>
              {l.label}
            </Link>
          ))}
          {!currentUser && <Link to="/login" onClick={() => setMenuOpen(false)} className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600">Login</Link>}
          <Link to="/booking" onClick={() => setMenuOpen(false)} className="block w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold">Book Now</Link>
        </div>
      )}
    </nav>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage() {
  const { userData } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchForm, setSearchForm] = useState({ from: "", to: "", date: "", returnDate: "", passengers: 1, vehicleType: "suv" });
  const [passengers, setPassengers] = useState(1);
  const [featuredVehicles, setFeaturedVehicles] = useState<VehicleItem[]>([]);
  const [featuredTours, setFeaturedTours] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const vData = await getVehicles();
        if (vData && vData.length > 0) {
          setFeaturedVehicles(vData.slice(0, 6).map((v: any) => ({
            id: v.id,
            name: v.name || v.model || "Vehicle",
            type: v.type || v.category || "Unknown",
            capacity: v.capacity || 4,
            price: v.price || v.price_per_day || 0,
            ac: v.ac !== undefined ? v.ac : true,
            img: v.imageUrl || v.image_url || v.img || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=480&h=300&fit=crop&auto=format",
            features: v.features || ["AC", "GPS"],
            rating: v.rating || 4.5,
            reviews: v.reviews || 0,
            category: v.category || v.type?.toLowerCase() || "suv",
          })));
        }

        const tData = await getTours();
        if (tData && tData.length > 0) {
          setFeaturedTours(tData.slice(0, 6).map((t: any) => ({
            id: t.id, name: t.name || "Tour", dest: t.destination || t.name, duration: t.durationDays ? `${t.durationDays}D` : "2D/1N",
            price: t.price || 0, rating: t.rating || 4.8, reviews: t.reviews || 100,
            img: t.imageUrl || t.img || "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=480&h=300&fit=crop&auto=format", category: t.category || "city", tag: t.tag || "Popular",
            includes: t.includes || ["Vehicle", "Hotel"]
          })));
        }

        try {
          const sponsorData = await getSponsors(true);
          if (sponsorData && sponsorData.length > 0) {
            setSponsors(sponsorData.slice(0, 6));
          }
        } catch (e) {
          console.error("Failed to load sponsors:", e);
        }
      } catch (e) {
        console.error("Failed to load featured data:", e);
      }
    };
    loadData();
  }, []);

  const citySuggestions = [
    "Mumbai",
    "Pune",
    "Goa",
    "Delhi",
    "Bangalore",
    "Chennai",
    "Hyderabad",
    "Jaipur",
    "Ahmedabad",
    "Kolkata",
  ];

  const services = [
    { icon: Car, title: "Vehicle Rental", desc: "Premium fleet of cars, SUVs & buses for any journey", color: "from-blue-500 to-blue-600" },
    { icon: Globe, title: "Tour Packages", desc: "Curated packages to top destinations across India", color: "from-sky-500 to-sky-600" },
    { icon: Heart, title: "Wedding Transport", desc: "Luxury vehicles for your special day", color: "from-pink-500 to-rose-600" },
    { icon: Building2, title: "Commercial Transport", desc: "Corporate & employee transport solutions", color: "from-violet-500 to-violet-600" },
    { icon: Truck, title: "Goods Transport", desc: "Safe & timely delivery of goods & cargo", color: "from-emerald-500 to-emerald-600" },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-sky-900" />
        <img
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&h=1080&fit=crop&auto=format"
          alt="Travel road"
          className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 via-transparent to-blue-900/80" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center pt-20">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-sm mb-6">
            <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" />
            India's Most Trusted Travel Partner
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            Explore India<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-blue-300">Your Way</span>
          </h1>
          <p className="text-white/70 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light">
            Premium vehicles, curated tours, and seamless bookings. Travel in comfort and style with Pari Travels.
          </p>

          {/* Booking Widget */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 md:p-6 max-w-4xl mx-auto shadow-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3 col-span-2 md:col-span-1">
                <MapPin size={18} className="text-sky-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white/60 text-xs mb-0.5">Pickup Location</div>
                  <input value={searchForm.from} onChange={e => setSearchForm({ ...searchForm, from: e.target.value })}
                    placeholder="Enter city..." list="city-suggestions" className="bg-transparent text-white placeholder-white/40 text-sm w-full outline-none font-medium" />
                  <datalist id="city-suggestions">
                    {citySuggestions.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3 col-span-2 md:col-span-1">
                <MapPin size={18} className="text-sky-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white/60 text-xs mb-0.5">Destination</div>
                  <input value={searchForm.to} onChange={e => setSearchForm({ ...searchForm, to: e.target.value })}
                    placeholder="Going to..." list="city-suggestions" className="bg-transparent text-white placeholder-white/40 text-sm w-full outline-none font-medium" />
                </div>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <Calendar size={18} className="text-sky-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white/60 text-xs mb-0.5">Journey Date</div>
                  <input type="date" value={searchForm.date} onChange={e => setSearchForm({ ...searchForm, date: e.target.value })}
                    className="bg-transparent text-white text-sm w-full outline-none font-medium" style={{ colorScheme: "dark" }} />
                </div>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <Calendar size={18} className="text-sky-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white/60 text-xs mb-0.5">Return Date</div>
                  <input type="date" value={searchForm.returnDate} onChange={e => setSearchForm({ ...searchForm, returnDate: e.target.value })}
                    className="bg-transparent text-white text-sm w-full outline-none font-medium" style={{ colorScheme: "dark" }} />
                </div>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <Users size={18} className="text-sky-300 shrink-0" />
                <div className="flex-1">
                  <div className="text-white/60 text-xs mb-0.5">Passengers</div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPassengers(Math.max(1, passengers - 1))} className="w-5 h-5 rounded bg-white/20 text-white flex items-center justify-center hover:bg-white/30">
                      <Minus size={10} />
                    </button>
                    <span className="text-white font-semibold text-sm w-4 text-center">{passengers}</span>
                    <button onClick={() => setPassengers(Math.min(50, passengers + 1))} className="w-5 h-5 rounded bg-white/20 text-white flex items-center justify-center hover:bg-white/30">
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                <Car size={18} className="text-sky-300 shrink-0" />
                <div className="flex-1">
                  <div className="text-white/60 text-xs mb-0.5">Vehicle Type</div>
                  <select value={searchForm.vehicleType} onChange={e => setSearchForm({ ...searchForm, vehicleType: e.target.value })}
                    className="bg-transparent text-white text-sm w-full outline-none font-medium" style={{ colorScheme: "dark" }}>
                    <option value="sedan" className="text-gray-900">Sedan (4 Seater)</option>
                    <option value="suv" className="text-gray-900">SUV (6-7 Seater)</option>
                    <option value="tempo" className="text-gray-900">Tempo Traveller</option>
                    <option value="bus" className="text-gray-900">Bus</option>
                  </select>
                </div>
              </div>
            </div>
            <button onClick={() => navigate("/booking", { state: { from: searchForm.from.trim(), to: searchForm.to.trim(), date: searchForm.date } })}
              disabled={!searchForm.from.trim() || !searchForm.to.trim()}
              className="w-full disabled:cursor-not-allowed disabled:bg-slate-500 bg-gradient-to-r from-sky-400 to-blue-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-blue-900/30 text-base">
              <Search size={18} /> Search Available Vehicles
            </button>
            <div className="mt-4 text-center">
              {userData?.role === 'admin' && (
                <Link to="/admin" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/20 text-sm font-semibold text-white hover:bg-white/10 transition">
                  <Shield size={16} /> Admin Panel
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 mt-10 text-white/70 text-sm">
            {[["5000+", "Happy Customers"], ["200+", "Vehicles"], ["50+", "Destinations"], ["4.9★", "Rating"]].map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-heading)" }}>{n}</div>
                <div className="text-xs">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {sponsors.length > 0 && (
        <section className="py-20 bg-slate-950 text-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="mb-12 text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Sponsored By</p>
              <h2 className="text-3xl md:text-4xl font-bold mt-3">Trusted Brand Partners</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {sponsors.map((sponsor) => (
                <a key={sponsor.id} href={sponsor.link || "#"} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-sky-300/40 hover:bg-white/10">
                  <div className="flex items-center justify-center rounded-3xl bg-slate-900 p-6 mb-5 min-h-[180px]">
                    <img src={sponsor.imageUrl || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&h=600&fit=crop&auto=format"} alt={sponsor.title} className="max-h-40 object-contain" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">{sponsor.title}</h3>
                    <p className="text-sm text-slate-300 leading-relaxed mb-4">{sponsor.description || "Exclusive offers available now."}</p>
                    <span className="inline-flex items-center gap-2 text-sky-300 font-semibold">
                      View Offer <ArrowRight size={16} />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-blue-600 font-semibold text-sm tracking-widest uppercase">What We Offer</span>
            <h2 className="text-4xl font-black text-gray-900 mt-2" style={{ fontFamily: "var(--font-heading)" }}>Our Services</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">From personal travel to large-scale commercial transport, we cover every journey need.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {services.map((s) => (
              <div key={s.title} className="group text-center p-6 rounded-2xl border border-blue-50 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer bg-gradient-to-b from-white to-blue-50/50">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <s.icon size={24} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-800 text-sm mb-1">{s.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Vehicles */}
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-blue-600 font-semibold text-sm tracking-widest uppercase">Our Fleet</span>
              <h2 className="text-4xl font-black text-gray-900 mt-1" style={{ fontFamily: "var(--font-heading)" }}>Featured Vehicles</h2>
            </div>
            <Link to="/vehicles" className="flex items-center gap-1 text-blue-600 font-semibold text-sm hover:gap-2 transition-all">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredVehicles.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-500">Loading vehicles...</div>
            ) : featuredVehicles.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl overflow-hidden border border-blue-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="relative h-48 bg-blue-100 overflow-hidden">
                  <img src={v.img} alt={v.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3">
                    {v.ac && <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">AC</span>}
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                    <Star size={12} className="fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold">{v.rating}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{v.name}</h3>
                      <p className="text-blue-500 text-sm font-medium">{v.type}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-blue-700 font-black text-lg">₹{v.price.toLocaleString()}</div>
                      <div className="text-gray-400 text-xs">per day</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-3 text-gray-500 text-xs">
                    <Users size={12} /> {v.capacity} Seats &nbsp;·&nbsp; {v.reviews} reviews
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {v.features.map((f) => <span key={f} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{f}</span>)}
                  </div>
                  <Link to="/booking" className="block text-center w-full py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity">
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Tours */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-blue-600 font-semibold text-sm tracking-widest uppercase">Destinations</span>
              <h2 className="text-4xl font-black text-gray-900 mt-1" style={{ fontFamily: "var(--font-heading)" }}>Popular Tours</h2>
            </div>
            <Link to="/tours" className="flex items-center gap-1 text-blue-600 font-semibold text-sm hover:gap-2 transition-all">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTours.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-500">Loading tours...</div>
            ) : featuredTours.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl overflow-hidden border border-blue-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
                <div className="relative h-52 bg-blue-100 overflow-hidden">
                  <img src={t.img} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{t.tag}</span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div>
                      <p className="text-white font-black text-xl" style={{ fontFamily: "var(--font-heading)" }}>{t.dest}</p>
                      <p className="text-white/70 text-xs">{t.duration}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-black text-lg">₹{t.price.toLocaleString()}</p>
                      <p className="text-white/70 text-xs">per person</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">{t.name}</h3>
                    <div className="flex items-center gap-1">
                      <Stars rating={Math.round(t.rating)} />
                      <span className="text-xs text-gray-500">{t.rating}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {t.includes.slice(0, 3).map((inc: string) => (
                      <span key={inc} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={10} />{inc}
                      </span>
                    ))}
                  </div>
                  <Link to="/tours" className="block text-center w-full py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 bg-gradient-to-b from-blue-900 to-blue-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-sky-400 font-semibold text-sm tracking-widest uppercase">Testimonials</span>
            <h2 className="text-4xl font-black text-white mt-2" style={{ fontFamily: "var(--font-heading)" }}>What Our Travellers Say</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {reviewsData.map((r) => (
              <div key={r.name} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <img src={r.img} alt={r.name} className="w-11 h-11 rounded-full object-cover border-2 border-sky-400" />
                  <div>
                    <p className="text-white font-semibold text-sm">{r.name}</p>
                    <p className="text-white/50 text-xs">{r.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(r.rating)].map((_, i) => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-3">"{r.text}"</p>
                <span className="text-sky-400 text-xs font-medium">{r.tour}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-blue-600 font-semibold text-sm tracking-widest uppercase">Support</span>
            <h2 className="text-4xl font-black text-gray-900 mt-2" style={{ fontFamily: "var(--font-heading)" }}>Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqsData.map((f, i) => (
              <div key={i} className={`border rounded-2xl overflow-hidden transition-all ${openFaq === i ? "border-blue-300 shadow-md" : "border-gray-100"}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-blue-50/50 transition-colors">
                  <span className="font-semibold text-gray-800 text-sm pr-4">{f.q}</span>
                  {openFaq === i ? <ChevronUp size={18} className="text-blue-600 shrink-0" /> : <ChevronDown size={18} className="text-gray-400 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-blue-50 pt-4">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center">
                  <Globe size={18} className="text-white" />
                </div>
                <div>
                  <div className="font-black text-white text-lg">Pari Travels</div>
                  <div className="text-xs text-gray-500 -mt-1">PREMIUM JOURNEYS</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-4">India's most trusted travel partner for premium vehicle rentals, tours, and commercial transport.</p>
              <div className="flex gap-3">
                {[Facebook, Twitter, Instagram].map((Icon, i) => (
                  <a key={i} href="#" className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>
            {[
              { title: "Quick Links", links: ["Home", "Vehicles", "Tours", "Blog", "Careers", "About Us"] },
              { title: "Services", links: ["Vehicle Rental", "Tour Packages", "Wedding Transport", "Commercial Transport", "Goods Transport", "Airport Transfer"] },
              { title: "Contact", links: ["+91 86260 48673", "info@paritravels.in", "Pune, Maharashtra", "Mon-Sat: 9AM-9PM"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-bold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((l) => (
                    <li key={l}><a href="#" className="text-sm hover:text-blue-400 transition-colors flex items-center gap-1">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm">
            <p>© 2025 Pari Travels. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Refund Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a href="https://wa.me/918626048673" target="_blank" rel="noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30 z-50 transition-all hover:scale-110">
        <MessageCircle size={24} className="text-white" />
      </a>
    </div>
  );
}

// ─── Auth Pages ───────────────────────────────────────────────────────────────
function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleLogin = async () => {
    setLoading(true);
    try {
      const userProfile = await login(form.email, form.password);
      if (userProfile?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("home");
      }
    } catch (error: any) {
      alert(`Login failed: ${error.message || "Check your credentials."}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-sky-900 px-4 pt-20">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Globe size={28} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-heading)" }}>Welcome Back</h2>
            <p className="text-white/60 text-sm mt-1">Sign in to Pari Travels</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">Email Address</label>
              <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus-within:border-sky-400 transition-colors">
                <Mail size={16} className="text-white/50" />
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com" className="bg-transparent text-white placeholder-white/30 text-sm flex-1 outline-none" />
              </div>
            </div>
            <div>
              <label className="text-white/70 text-sm font-medium block mb-1.5">Password</label>
              <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3 focus-within:border-sky-400 transition-colors">
                <Shield size={16} className="text-white/50" />
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••" className="bg-transparent text-white placeholder-white/30 text-sm flex-1 outline-none" />
              </div>
            </div>
            <div className="flex justify-end">
              <Link to="/forgot" className="text-sky-300 text-sm hover:text-white transition-colors">Forgot Password?</Link>
            </div>
            <button onClick={handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-sky-400 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-xl shadow-blue-900/30 disabled:opacity-50">
              {loading ? "Signing In..." : "Sign In"}
            </button>
            <div className="relative text-center">
              <div className="absolute inset-y-0 left-0 right-0 flex items-center"><div className="flex-1 border-t border-white/10" /></div>
              <span className="relative bg-transparent px-3 text-white/40 text-xs">or continue with</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={async () => { await loginWithGoogle(); navigate("/home"); }} className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 rounded-xl py-3 text-white text-sm font-medium hover:bg-white/20 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 rounded-xl py-3 text-white text-sm font-medium hover:bg-white/20 transition-colors">
                <Facebook size={16} className="text-blue-400" /> Facebook
              </button>
            </div>
          </div>
          <p className="text-center text-white/50 text-sm mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-sky-300 font-semibold hover:text-white transition-colors">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function RegisterPage() {
  const [form, setForm] = useState({ name: "", mobile: "", email: "", password: "", confirm: "", terms: false });
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (form.password !== form.confirm) return alert("Passwords do not match");
    if (!form.terms) return alert("Please accept terms");
    setLoading(true);
    try {
      await register(form.email, form.password, form.name, form.mobile);
      alert('Account created successfully! Please sign in with your account.');
      navigate("/login");
    } catch (err: any) {
      console.error('Registration error:', err);
      let msg = '';
      try {
        if (err && typeof err === 'object') msg = err.message || err.error_description || JSON.stringify(err);
        else msg = String(err);
      } catch (e) {
        msg = 'Registration failed';
      }
      if (!msg) msg = 'Registration failed (no additional details)';
      alert(`Registration failed: ${msg}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-sky-900 px-4 pt-20 pb-10">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-white" style={{ fontFamily: "var(--font-heading)" }}>Create Account</h2>
            <p className="text-white/60 text-sm mt-1">Join Pari Travels today</p>
          </div>
          <div className="space-y-3">
            {[
              { label: "Full Name", key: "name", type: "text", placeholder: "John Doe", icon: User },
              { label: "Mobile Number", key: "mobile", type: "tel", placeholder: "+91 98765 43210", icon: Phone },
              { label: "Email Address", key: "email", type: "email", placeholder: "you@example.com", icon: Mail },
              { label: "Password", key: "password", type: "password", placeholder: "Min. 8 characters", icon: Shield },
              { label: "Confirm Password", key: "confirm", type: "password", placeholder: "Repeat password", icon: Shield },
            ].map(({ label, key, type, placeholder, icon: Icon }) => (
              <div key={key}>
                <label className="text-white/70 text-xs font-medium block mb-1">{label}</label>
                <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 focus-within:border-sky-400 transition-colors">
                  <Icon size={15} className="text-white/50" />
                  <input type={type} value={(form as any)[key]}
                    onChange={e => setForm({ ...form, [key]: type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value })}
                    placeholder={placeholder} className="bg-transparent text-white placeholder-white/30 text-sm flex-1 outline-none" />
                </div>
              </div>
            ))}
            <label className="flex items-start gap-3 cursor-pointer mt-1">
              <input type="checkbox" checked={form.terms} onChange={e => setForm({ ...form, terms: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded accent-sky-400" />
              <span className="text-white/60 text-xs">I agree to the <a href="#" className="text-sky-300 underline">Terms of Service</a> and <a href="#" className="text-sky-300 underline">Privacy Policy</a></span>
            </label>
            <button onClick={handleRegister} disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-sky-400 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity shadow-xl shadow-blue-900/30 mt-1 disabled:opacity-50">
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
          <p className="text-center text-white/50 text-sm mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-sky-300 font-semibold hover:text-white transition-colors">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-sky-900 px-4 pt-20">
      <div className="w-full max-w-sm">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl text-center">
          {!sent ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-500 flex items-center justify-center mx-auto mb-5 shadow-xl">
                <Mail size={28} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "var(--font-heading)" }}>Forgot Password?</h2>
              <p className="text-white/60 text-sm mb-6">Enter your email and we'll send a reset link.</p>
              <div className="flex items-center gap-3 bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-4 focus-within:border-sky-400 transition-colors">
                <Mail size={16} className="text-white/50" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" className="bg-transparent text-white placeholder-white/30 text-sm flex-1 outline-none" />
              </div>
              <button onClick={() => setSent(true)} className="w-full bg-gradient-to-r from-blue-500 to-sky-400 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity">
                Send Reset Link
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-5 shadow-xl">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: "var(--font-heading)" }}>Email Sent!</h2>
              <p className="text-white/60 text-sm mb-6">Check your inbox for the password reset link. It expires in 30 minutes.</p>
              <Link to="/login" className="block w-full bg-gradient-to-r from-blue-500 to-sky-400 text-white font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity">
                Back to Login
              </Link>
            </>
          )}
          <Link to="/login" className="mt-4 text-white/50 text-sm hover:text-white transition-colors flex items-center gap-1 mx-auto">
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Vehicles Page ────────────────────────────────────────────────────────────
function VehiclesPage() {
  const [category, setCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState(20000);
  const [acOnly, setAcOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const navigate = useNavigate();

  const categories = [
    { id: "all", label: "All Vehicles" },
    { id: "sedan", label: "Sedan" },
    { id: "suv", label: "SUV" },
    { id: "tempo", label: "Tempo Traveller" },
    { id: "bus", label: "Bus" },
  ];

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const data = await getVehicles();
        if (data.length > 0) {
          setVehicles(data.map((v: any) => ({
            id: v.id,
            name: v.name || v.model || "Vehicle",
            type: v.type || v.category || "Unknown",
            capacity: v.capacity || 4,
            price: v.price || 0,
            ac: v.ac !== undefined ? v.ac : true,
            img: v.imageUrl || v.img || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=480&h=300&fit=crop&auto=format",
            features: v.features || ["AC", "GPS"],
            rating: v.rating || 4.5,
            reviews: v.reviews || 0,
            category: v.category || v.type?.toLowerCase() || "sedan",
            imageUrl: v.imageUrl || v.img,
          })));
        }
      } catch (error) {
        console.error("Failed to load vehicles:", error);
      } finally {
        setLoadingVehicles(false);
      }
    };
    loadVehicles();
  }, []);

  const filtered = vehicles.filter((v) => {
    if (category !== "all" && v.category !== category) return false;
    if (acOnly && !v.ac) return false;
    if (v.price > maxPrice) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-blue-50/50 pt-20">
      <div className="bg-gradient-to-r from-blue-700 to-sky-600 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: "var(--font-heading)" }}>Our Fleet</h1>
          <p className="text-white/80">Choose from our premium selection of vehicles</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-50 sticky top-24">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Filter size={16} className="text-blue-600" /> Filters</h3>
              <div className="mb-5">
                <p className="text-sm font-semibold text-gray-600 mb-2">Vehicle Type</p>
                <div className="space-y-1">
                  {categories.map((c) => (
                    <button key={c.id} onClick={() => setCategory(c.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${category === c.id ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"}`}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-5">
                <p className="text-sm font-semibold text-gray-600 mb-2">Max Price: <span className="text-blue-600">₹{maxPrice.toLocaleString()}</span></p>
                <input type="range" min={1000} max={20000} step={500} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)}
                  className="w-full accent-blue-600" />
                <div className="flex justify-between text-xs text-gray-400 mt-1"><span>₹1,000</span><span>₹20,000</span></div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">AC Only</span>
                <button onClick={() => setAcOnly(!acOnly)} className={`w-10 h-5 rounded-full transition-colors ${acOnly ? "bg-blue-600" : "bg-gray-200"} relative`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${acOnly ? "left-5.5 left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-5">
              <p className="text-gray-600 text-sm"><span className="font-bold text-gray-900">{filtered.length}</span> vehicles found</p>
              <div className="flex gap-2">
                <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100"}`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="0" y="0" width="7" height="7" rx="1" fill="currentColor"/><rect x="9" y="0" width="7" height="7" rx="1" fill="currentColor"/><rect x="0" y="9" width="7" height="7" rx="1" fill="currentColor"/><rect x="9" y="9" width="7" height="7" rx="1" fill="currentColor"/></svg>
                </button>
                <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:bg-gray-100"}`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="0" y="1" width="16" height="2.5" rx="1" fill="currentColor"/><rect x="0" y="6.5" width="16" height="2.5" rx="1" fill="currentColor"/><rect x="0" y="12" width="16" height="2.5" rx="1" fill="currentColor"/></svg>
                </button>
              </div>
            </div>
            <div className={viewMode === "grid" ? "grid md:grid-cols-2 xl:grid-cols-3 gap-5" : "space-y-4"}>
              {loadingVehicles ? (
                <div className="col-span-full rounded-2xl border border-blue-50 bg-white p-10 text-center text-gray-500">Loading vehicles...</div>
              ) : filtered.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-blue-50 bg-white p-10 text-center text-gray-500">No vehicles match the selected filters.</div>
              ) : filtered.map((v) => (
                <div key={v.id} className={`bg-white rounded-2xl overflow-hidden border border-blue-50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${viewMode === "list" ? "flex" : ""}`}>
                  <div className={`relative bg-blue-100 ${viewMode === "list" ? "w-48 shrink-0" : "h-48"}`}>
                    <img src={v.img} alt={v.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-white/90 rounded-lg px-2 py-0.5 flex items-center gap-1">
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold">{v.rating}</span>
                    </div>
                  </div>
                  <div className="p-4 flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-900">{v.name}</h3>
                        <p className="text-blue-500 text-sm">{v.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-700 font-black text-lg">₹{v.price.toLocaleString()}</p>
                        <p className="text-gray-400 text-xs">per day</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><Users size={12} />{v.capacity} seats</span>
                      {v.ac && <span className="text-green-600 font-medium text-xs">✓ AC</span>}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3 min-h-[20px]">
                      {v.features.slice(0, 3).map(f => <span key={f} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{f}</span>)}
                    </div>
                    <button onClick={() => navigate("booking")} className="w-full py-2 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity">
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Booking Flow ─────────────────────────────────────────────────────────────
function BookingFlowPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { from: initialFrom, to: initialTo, date: initialDate } = (location.state as SearchFilters) || {};
  const [step, setStep] = useState(1);
  const [from, setFrom] = useState(initialFrom || "Pune");
  const [to, setTo] = useState(initialTo || "Goa");
  const [date, setDate] = useState(initialDate || "2025-06-20");
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleItem | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookedSeatLabels, setBookedSeatLabels] = useState<Set<string>>(new Set());
  const [seatLoading, setSeatLoading] = useState(false);
  const [seatError, setSeatError] = useState<string | null>(null);
  const [passengers, setPassengers] = useState([{ name: "Priya Sharma", age: "28", gender: "female" }]);
  const [payTab, setPayTab] = useState<"upi" | "card" | "netbanking">("upi");
  const [upiId, setUpiId] = useState("");
  const [cardForm, setCardForm] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [isCreating, setIsCreating] = useState(false);
  const [bookingSavedId, setBookingSavedId] = useState<string | null>(null);
  const [availableVehicles, setAvailableVehicles] = useState<VehicleItem[]>([]);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const filters = { status: 'active', ...(from && to ? { origin: from, destination: to } : {}) };
        const vData = await getVehicles(filters);
        if (vData && vData.length > 0) {
          setAvailableVehicles(vData.map((v: any) => ({
            id: v.id,
            name: v.name || v.model || "Vehicle",
            vehicleNumber: v.vehicleNumber || v.vehicle_number || "",
            type: v.type || v.category || "Unknown",
            capacity: v.capacity || 4,
            price: v.price || v.price_per_day || 0,
            ac: v.ac !== undefined ? v.ac : true,
            img: v.imageUrl || v.image_url || v.img || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=480&h=300&fit=crop&auto=format",
            features: v.features || ["AC", "GPS"],
            rating: v.rating || 4.5,
            reviews: v.reviews || 0,
            category: v.category || v.type?.toLowerCase() || "suv",
          })));
        } else {
          setAvailableVehicles([]);
        }
      } catch (e) {
        console.error("Using fallback vehicle data");
      }
    };
    fetchVehicles();
  }, [from, to]);

  const bookingId = bookingSavedId || "PT" + Date.now().toString().slice(-8);

  const getSeatLabelFromNumber = (number: number) => {
    const row = Math.floor((number - 1) / 4);
    const col = ((number - 1) % 4) + 1;
    return `${String.fromCharCode(65 + row)}${col}`;
  };

  const toggleSeat = (id: string) => {
    if (bookedSeatLabels.has(id)) return;
    setSelectedSeats(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  useEffect(() => {
    const fetchBookedSeats = async () => {
      if (!selectedVehicle || !date) {
        setBookedSeatLabels(new Set());
        setSeatError(null);
        return;
      }

      setSeatLoading(true);
      setSeatError(null);
      try {
        const API_URL = import.meta.env.VITE_API_URL || "/api";
        const response = await fetch(`${API_URL}/vehicles/${selectedVehicle.id}/seats?date=${date}`);
        if (!response.ok) {
          const body = await response.text().catch(() => "");
          throw new Error(`Failed to load seat availability (${response.status})${body ? `: ${body}` : ""}`);
        }

        const data = await response.json();
        const labels = new Set<string>();

        if (Array.isArray(data.bookedSeats)) {
          data.bookedSeats.forEach((seat: any) => {
            const rawLabel = seat.seatLabel || seat.seat_label || "";
            const normalized = String(rawLabel).trim().toUpperCase();
            if (normalized) {
              labels.add(normalized);
            } else if (typeof seat.seatNumber === "number") {
              labels.add(getSeatLabelFromNumber(seat.seatNumber));
            }
          });
        }

        setBookedSeatLabels(labels);
      } catch (error) {
        setSeatError(error instanceof Error ? error.message : String(error));
        setBookedSeatLabels(new Set());
      } finally {
        setSeatLoading(false);
      }
    };

    fetchBookedSeats();
  }, [selectedVehicle, date]);

  useEffect(() => {
    if (!selectedSeats.length || !bookedSeatLabels.size) return;
    const filtered = selectedSeats.filter((seat) => !bookedSeatLabels.has(seat));
    if (filtered.length !== selectedSeats.length) {
      setSelectedSeats(filtered);
    }
  }, [bookedSeatLabels, selectedSeats]);

  const vehLayout = selectedVehicle ? getSeatLayout(selectedVehicle.category) : getSeatLayout("suv");

  const totalFare = selectedVehicle ? selectedVehicle.price + selectedSeats.length * 200 : 0;

  const handleConfirmBooking = async () => {
    if (!currentUser) {
      alert("Please sign in first to complete your booking.");
      navigate("/login");
      return;
    }

    if (!selectedVehicle || selectedSeats.length === 0) {
      alert("Please select a vehicle and seats before proceeding.");
      return;
    }

    setIsCreating(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "/api";
      
      // First, create the booking
      const savedBookingId = await createBooking({
        userId: currentUser.id,
        userEmail: currentUser.email,
        customerName: passengers[0]?.name || "Guest",
        origin: from,
        destination: to,
        route: `${from} → ${to}`,
        date,
        travelDate: date,
        vehicle: selectedVehicle.name,
        vehicleNumber: selectedVehicle.vehicleNumber || selectedVehicle.name,
        vehicleName: selectedVehicle.name,
        seatNumbers: selectedSeats,
        passengers,
        amount: totalFare,
        amountText: `₹${totalFare}`,
        paymentMethod: payTab,
        paymentStatus: "Pending",
        bookingStatus: "Confirmed",
      });

      // Then, book the seats with gender information
      if (selectedSeats.length > 0) {
        const seatBookingPayload = {
          vehicleId: selectedVehicle.id,
          bookingId: savedBookingId,
          seatNumbers: selectedSeats,
          passengers: passengers.map((p, idx) => ({
            name: p.name,
            seat: selectedSeats[idx],
            seatLabel: selectedSeats[idx],
            gender: (p.gender || 'not_specified').toLowerCase(),
          })),
          passengerName: passengers[0]?.name || "Guest",
          travelDate: date,
          vehicleName: selectedVehicle.name,
          origin: from,
          destination: to,
        };

        const seatResponse = await fetch(`${API_URL}/seat-bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(seatBookingPayload),
        });

        if (!seatResponse.ok) {
          const errData = await seatResponse.json();
          console.warn("Failed to book seats:", errData.error || seatResponse.statusText);
        }
      }

      setBookingSavedId(savedBookingId);
      setStep(6);
    } catch (error) {
      console.error("Booking creation failed:", error);
      alert("Could not create booking. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadTicket = () => {
    if (!ticketRef.current) {
      console.error("Ticket element not found.");
      return;
    }

    html2canvas(ticketRef.current, {
      scale: 2, // Use a higher scale for better resolution
      useCORS: true, // This helps with loading external images if any
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`PariTravels-Ticket-${bookingId}.pdf`);
    });
  };

  return (
    <div className="min-h-screen bg-blue-50/50 pt-20">
      <div className="bg-gradient-to-r from-blue-700 to-sky-600 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-black text-white mb-4" style={{ fontFamily: "var(--font-heading)" }}>Book Your Journey</h1>
          <BookingStepIndicator step={step} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Step 1: Route Selection */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-blue-50">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Select Your Route</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: "Pickup Location", value: from, set: setFrom, placeholder: "Enter city..." },
                { label: "Destination", value: to, set: setTo, placeholder: "Going to..." },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">{label}</label>
                  <div className="flex items-center gap-3 border border-blue-100 rounded-xl px-4 py-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-blue-50/50">
                    <MapPin size={16} className="text-blue-500" />
                    <input value={value} onChange={e => set(e.target.value)} placeholder={placeholder} className="bg-transparent text-gray-900 text-sm flex-1 outline-none" />
                  </div>
                </div>
              ))}
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Journey Date</label>
                <div className="flex items-center gap-3 border border-blue-100 rounded-xl px-4 py-3 focus-within:border-blue-500 bg-blue-50/50">
                  <Calendar size={16} className="text-blue-500" />
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-gray-900 text-sm flex-1 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Return Date (Optional)</label>
                <div className="flex items-center gap-3 border border-blue-100 rounded-xl px-4 py-3 focus-within:border-blue-500 bg-blue-50/50">
                  <Calendar size={16} className="text-blue-500" />
                  <input type="date" className="bg-transparent text-gray-900 text-sm flex-1 outline-none" />
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-xl flex items-center gap-3 text-sm text-blue-700">
              <MapPin size={16} className="text-blue-500 shrink-0" />
              Route: <strong>{from || "—"}</strong> → <strong>{to || "—"}</strong> · {date || "Select date"}
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setStep(2)} disabled={!from || !to || !date}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40">
                Next: Choose Vehicle <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Vehicle Selection */}
        {step === 2 && (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-blue-50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Select Vehicle</h2>
              <span className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full">{from} → {to} · {date}</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {availableVehicles.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-10 text-center text-blue-700">
                  <h3 className="text-lg font-semibold mb-2">No vehicles available on this route</h3>
                  <p className="text-sm text-blue-600">We couldn’t find any vehicles for {from} → {to} on {date}. Please try a different route, date, or vehicle type.</p>
                </div>
              ) : availableVehicles.map((v) => (
                <button key={v.id} onClick={() => setSelectedVehicle(v)}
                  className={`text-left rounded-2xl overflow-hidden border-2 transition-all hover:shadow-md ${selectedVehicle?.id === v.id ? "border-blue-600 shadow-md" : "border-gray-100"}`}>
                  <div className="h-36 bg-blue-50">
                    <img src={v.img} alt={v.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between mb-1">
                      <h3 className="font-bold text-gray-900 text-sm">{v.name}</h3>
                      <span className="font-black text-blue-700">₹{v.price.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{v.type} · {v.capacity} seats</p>
                    <div className="flex gap-1 flex-wrap">
                      {v.features.slice(0, 3).map(f => <span key={f} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{f}</span>)}
                    </div>
                    {selectedVehicle?.id === v.id && (
                      <div className="mt-2 flex items-center gap-1 text-green-600 text-sm font-semibold">
                        <CheckCircle size={14} /> Selected
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-2.5 border border-blue-200 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors">
                <ArrowLeft size={16} /> Back
              </button>
              <button onClick={() => setStep(3)} disabled={!selectedVehicle}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-40">
                Next: Select Seats <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Seat Selection */}
        {step === 3 && (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-blue-50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Select Your Seats</h2>
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{selectedVehicle?.name}</span>
            </div>
            <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-300" /> Available
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-blue-50 px-3 py-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Selected
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-100 px-3 py-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Unavailable
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-900" /> Driver
                  </span>
                  <span className="ml-auto text-xs text-gray-500">
                    {seatLoading ? 'Loading latest availability…' : `${bookedSeatLabels.size} seat${bookedSeatLabels.size === 1 ? '' : 's'} unavailable`}
                  </span>
                </div>
                {seatError && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{seatError}</div>}
                <SeatMap layout={vehLayout} selected={selectedSeats} onToggle={toggleSeat} booked={bookedSeatLabels} />
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-blue-50 rounded-2xl p-4">
                  <h3 className="font-bold text-gray-800 mb-3">Booking Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600"><span>Route</span><span className="font-medium text-gray-900">{from} → {to}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Date</span><span className="font-medium text-gray-900">{date}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Vehicle</span><span className="font-medium text-gray-900">{selectedVehicle?.name}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Base Fare</span><span className="font-medium text-gray-900">₹{selectedVehicle?.price.toLocaleString()}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Seats ({selectedSeats.length})</span><span className="font-medium text-gray-900">₹{(selectedSeats.length * 200).toLocaleString()}</span></div>
                    <div className="border-t pt-2 flex justify-between font-bold text-gray-900 text-base">
                      <span>Total</span><span className="text-blue-700">₹{totalFare.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {selectedSeats.length > 0 && (
                  <div className="bg-white border border-blue-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Selected Seats:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSeats.map(s => <span key={s} className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-lg font-bold">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 px-5 py-2.5 border border-blue-200 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors">
                <ArrowLeft size={16} /> Back
              </button>
              <button onClick={() => setStep(4)} disabled={selectedSeats.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-40">
                Next: Passenger Details <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Passenger Details */}
        {step === 4 && (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-blue-50">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Passenger Details</h2>
            <div className="space-y-4">
              {selectedSeats.map((seatId, idx) => (
                <div key={seatId} className="border border-blue-100 rounded-2xl p-5 bg-blue-50/30">
                  <p className="font-semibold text-blue-700 text-sm mb-3">Passenger {idx + 1} · Seat {seatId}</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Full Name</label>
                      <input value={passengers[idx]?.name ?? ""} placeholder="Enter name"
                        onChange={e => {
                          const updated = [...passengers];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setPassengers(updated);
                        }}
                        className="w-full border border-blue-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Age</label>
                      <input type="number" value={passengers[idx]?.age ?? ""} placeholder="Age"
                        onChange={e => {
                          const updated = [...passengers];
                          updated[idx] = { ...updated[idx], age: e.target.value };
                          setPassengers(updated);
                        }}
                        className="w-full border border-blue-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Gender</label>
                      <select value={passengers[idx]?.gender ?? "male"}
                        onChange={e => {
                          const updated = [...passengers];
                          updated[idx] = { ...updated[idx], gender: e.target.value };
                          setPassengers(updated);
                        }}
                        className="w-full border border-blue-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white">
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              <div className="border border-blue-100 rounded-2xl p-5">
                <p className="font-semibold text-gray-700 text-sm mb-3">Contact Information</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Mobile Number</label>
                    <input placeholder="+91 98765 43210" className="w-full border border-blue-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Email (for e-ticket)</label>
                    <input type="email" placeholder="you@example.com" className="w-full border border-blue-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(3)} className="flex items-center gap-2 px-5 py-2.5 border border-blue-200 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors">
                <ArrowLeft size={16} /> Back
              </button>
              <button onClick={() => setStep(5)} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold rounded-xl hover:opacity-90">
                Next: Confirm Booking <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Confirm Booking */}
        {step === 5 && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-blue-50">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Confirm Booking</h2>
              <p className="text-sm text-gray-600 mb-6">Payment gateway is disabled for now. Your booking will be confirmed immediately and the ticket will be generated.</p>
              <div className="space-y-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex items-start gap-3 text-sm text-blue-700">
                  <Shield size={18} className="mt-0.5" />
                  <div>
                    <p className="font-semibold">Booking will be completed without payment</p>
                    <p className="text-gray-600">This temporary flow is for previewing the completed booking and ticket. Payment can be added later.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(4)} className="flex items-center gap-2 px-5 py-2.5 border border-blue-200 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={handleConfirmBooking}
                  disabled={isCreating}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:opacity-90 shadow-lg shadow-green-500/20 disabled:opacity-40">
                  <CheckCircle size={16} /> {isCreating ? "Confirming..." : "Confirm Booking"}
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-50 h-fit">
              <h3 className="font-bold text-gray-800 mb-4">Order Summary</h3>
              <img src={selectedVehicle?.img} alt="" className="w-full h-28 object-cover rounded-xl mb-4 bg-blue-100" />
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between"><span>Vehicle</span><span className="font-semibold text-gray-900 text-right max-w-[150px]">{selectedVehicle?.name}</span></div>
                <div className="flex justify-between"><span>Route</span><span className="font-semibold text-gray-900">{from} → {to}</span></div>
                <div className="flex justify-between"><span>Date</span><span className="font-semibold text-gray-900">{date}</span></div>
                <div className="flex justify-between"><span>Seats</span><span className="font-semibold text-gray-900">{selectedSeats.join(", ")}</span></div>
                <div className="flex justify-between"><span>Passengers</span><span className="font-semibold text-gray-900">{selectedSeats.length}</span></div>
                <div className="border-t pt-2 flex justify-between text-base font-black text-blue-700">
                  <span>Total</span><span>₹{totalFare.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: E-Ticket */}
        {step === 6 && (
          <div className="max-w-2xl mx-auto">
            <div ref={ticketRef} className="bg-white rounded-3xl overflow-hidden shadow-xl border border-blue-50">
              {/* Ticket Header */}
              <div className="bg-gradient-to-r from-blue-700 to-sky-600 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Globe size={20} />
                    </div>
                    <div>
                      <p className="font-black text-lg" style={{ fontFamily: "var(--font-heading)" }}>Pari Travels</p>
                      <p className="text-white/70 text-xs">E-Ticket / Boarding Pass</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 text-xs">Booking ID</p>
                    <p className="font-black text-lg tracking-wider">{bookingId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div><p className="text-white/60 text-xs">FROM</p><p className="font-bold text-xl">{from}</p></div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 border-t-2 border-dashed border-white/30" />
                    <Car size={18} className="text-white/60" />
                    <div className="flex-1 border-t-2 border-dashed border-white/30" />
                  </div>
                  <div className="text-right"><p className="text-white/60 text-xs">TO</p><p className="font-bold text-xl">{to}</p></div>
                </div>
              </div>

              {/* Tear line */}
              <div className="relative flex items-center px-6">
                <div className="absolute -left-4 w-8 h-8 rounded-full bg-blue-50 border border-blue-100" />
                <div className="flex-1 border-t-2 border-dashed border-blue-100" />
                <div className="absolute -right-4 w-8 h-8 rounded-full bg-blue-50 border border-blue-100" />
              </div>

              {/* Ticket Body */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-5 mb-5">
                  {[
                    ["Passenger", passengers[0]?.name ?? "Passenger"],
                    ["Vehicle", selectedVehicle?.name ?? ""],
                    ["Vehicle No", selectedVehicle?.vehicleNumber || selectedVehicle?.name || "N/A"],
                    ["Date", date],
                    ["Seats", selectedSeats.join(", ")],
                    ["Fare", `₹${totalFare.toLocaleString()}`],
                    ["Status", "Confirmed"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-gray-500 text-xs font-medium mb-0.5">{label}</p>
                      <p className={`font-bold text-gray-900 ${label === "Status" ? "text-green-600" : ""}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* QR Code placeholder */}
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <div className="w-20 h-20 bg-white rounded-xl p-2 border border-blue-100 flex items-center justify-center">
                    <QRCode
                      value={bookingId}
                      size={64} // 64x64 pixels to fit inside the padded container
                      level="H" // High error correction for better scannability
                      bgColor="#FFFFFF"
                      fgColor="#000000"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">Scan to Verify</p>
                    <p className="text-xs text-gray-500">Present this QR code to the driver for verification. Valid for selected date only.</p>
                  </div>
                </div>

              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => navigate("/dashboard")} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
                View My Bookings
              </button>
              <button onClick={handleDownloadTicket} className="flex items-center gap-2 px-5 py-3 border border-blue-200 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors">
                <Download size={16} /> Download
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tours Page ───────────────────────────────────────────────────────────────
function ToursPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [maxBudget, setMaxBudget] = useState(35000);
  const [tours, setTours] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadTours = async () => {
      try {
        const data = await getTours();
        if (data && data.length > 0) {
          setTours(data.map((t: any) => ({
            id: t.id, name: t.name || "Tour", dest: t.destination || t.name, duration: t.durationDays ? `${t.durationDays}D` : "2D/1N",
            price: t.price || 0, rating: t.rating || 4.8, reviews: t.reviews || 100,
            img: t.imageUrl || t.img || "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=480&h=300&fit=crop&auto=format", category: t.category || "city", tag: t.tag || "Popular",
            includes: t.includes || ["Vehicle", "Hotel"]
          })));
        }
      } catch (e) {}
    };
    loadTours();
  }, []);

  const categories = ["all", "beach", "spiritual", "hills", "adventure", "heritage", "city"];

  const filtered = tours.filter((t) => {
    if (selectedCategory !== "all" && t.category !== selectedCategory) return false;
    if (t.price > maxBudget) return false;
    return true;
  });

  const tagColors: Record<string, string> = { Bestseller: "blue", Popular: "green", Trending: "amber", Premium: "purple", Luxury: "purple", Weekend: "green" };

  return (
    <div className="min-h-screen bg-blue-50/50 pt-20">
      <div className="bg-gradient-to-r from-blue-700 to-sky-600 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: "var(--font-heading)" }}>Tour Packages</h1>
          <p className="text-white/80">Curated travel experiences across India's most beautiful destinations</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-8">
          <div className="flex gap-2 flex-wrap">
            {categories.map((c) => (
              <button key={c} onClick={() => setSelectedCategory(c)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize ${selectedCategory === c ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-100 hover:border-blue-200"}`}>
                {c === "all" ? "All Tours" : c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 bg-white border border-blue-100 rounded-xl px-4 py-2">
            <DollarSign size={14} className="text-blue-500" />
            Budget: <span className="font-bold text-blue-700">₹{maxBudget.toLocaleString()}</span>
            <input type="range" min={5000} max={35000} step={1000} value={maxBudget} onChange={e => setMaxBudget(+e.target.value)}
              className="w-24 accent-blue-600" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">No tours match your criteria.</div>
          )}
          {filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl overflow-hidden border border-blue-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className="relative h-56 bg-blue-100">
                <img src={t.img} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent" />
                <div className="absolute top-3 left-3"><Badge text={t.tag} color={tagColors[t.tag] ?? "blue"} /></div>
                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                  <div>
                    <p className="text-white font-black text-xl" style={{ fontFamily: "var(--font-heading)" }}>{t.dest}</p>
                    <p className="text-white/70 text-xs">{t.duration}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-black text-xl">₹{t.price.toLocaleString()}</p>
                    <p className="text-white/60 text-xs">per person</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900">{t.name}</h3>
                  <div className="flex items-center gap-1"><Stars rating={5} /><span className="text-xs text-gray-500 ml-1">{t.rating}</span></div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {t.includes.map((inc: string) => (
                    <span key={inc} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                      <Check size={10} /> {inc}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate("/tour-booking", { state: { tour: t } })} className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold rounded-xl text-sm hover:opacity-90">Book Now</button>
                  <button className="px-3 py-2.5 border border-blue-100 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors">
                    <Heart size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Customer Dashboard ───────────────────────────────────────────────────────
function CustomerDashboard() {
  const { currentUser, logout } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"bookings" | "profile">("bookings");

  useEffect(() => {
    const fetchUserBookings = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const userBookings = await getUserBookings(currentUser.id);
        setBookings(userBookings || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserBookings();
  }, [currentUser]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center pt-20">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please log in to view your dashboard.</p>
          <button onClick={() => navigate("/login")} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50/50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-sky-600 py-8 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={() => navigate("home")} className="flex items-center gap-2 text-white hover:bg-white/20 px-4 py-2 rounded-lg transition">
              <ArrowLeft size={20} /> Back
            </button>
            <div>
              <h1 className="text-3xl font-black text-white" style={{ fontFamily: "var(--font-heading)" }}>My Dashboard</h1>
              <p className="text-white/80 text-sm">Welcome, {currentUser.email}!</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white/20 text-white hover:bg-white/30 px-4 py-2 rounded-lg font-semibold transition">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-4 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === "bookings"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Ticket size={18} />
            My Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 font-semibold transition-colors flex items-center gap-2 ${
              activeTab === "profile"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <User size={18} />
            My Profile
          </button>
        </div>

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div>
            {loading ? (
              <div className="text-center py-12 text-gray-600">Loading your bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-blue-50">
                <Ticket size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
                <p className="text-gray-600 mb-6">You haven't made any bookings. Let's book your first journey!</p>
                <button onClick={() => navigate("/booking")} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition">
                  Book Now
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {bookings.map((booking) => (
                  <div key={booking.bookingId || booking.id} className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden hover:shadow-md transition">
                    <div className={`h-1 ${
                      booking.bookingStatus?.toLowerCase() === "confirmed" ? "bg-green-500" :
                      booking.bookingStatus?.toLowerCase() === "cancelled" ? "bg-red-500" :
                      "bg-yellow-500"
                    }`} />

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Booking ID</p>
                          <h3 className="text-lg font-bold text-gray-900">{booking.bookingId}</h3>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          booking.bookingStatus?.toLowerCase() === "confirmed" ? "bg-green-100 text-green-800" :
                          booking.bookingStatus?.toLowerCase() === "cancelled" ? "bg-red-100 text-red-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {booking.bookingStatus || "Pending"}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="flex items-start gap-3">
                          <MapPin size={20} className="text-blue-600 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Route</p>
                            <p className="font-semibold text-gray-900">{booking.origin || booking.from} → {booking.destination || booking.to}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 mb-1">Vehicle</p>
                          <p className="font-semibold text-gray-900">{booking.vehicleName || booking.vehicle}</p>
                        </div>

                        <div className="flex items-start gap-3">
                          <Calendar size={20} className="text-blue-600 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Travel Date</p>
                            <p className="font-semibold text-gray-900">
                              {booking.travelDate ? new Date(booking.travelDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" }) : "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Users size={20} className="text-blue-600 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Passengers</p>
                            <p className="font-semibold text-gray-900">
                              {booking.passengers?.length || 1} {booking.passengers?.length > 1 ? "Passengers" : "Passenger"}
                              {booking.seatNumbers && ` • Seats: ${booking.seatNumbers.join(", ")}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <DollarSign size={20} className="text-green-600 mt-1" />
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Amount</p>
                            <p className="font-bold text-green-600 text-lg">₹{booking.amount || "0"}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${
                            booking.paymentStatus?.toLowerCase() === "paid" ? "bg-green-100 text-green-800" :
                            booking.paymentStatus?.toLowerCase() === "failed" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {booking.paymentStatus || "Pending"}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
                        Booked on {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Email Address</label>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-900">{currentUser.email}</div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">User ID</label>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-gray-500 font-mono text-sm">{currentUser.id}</div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Account Status</label>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-gray-900 font-semibold">Active</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Statistics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{bookings.length}</p>
                      <p className="text-sm text-gray-600">Total Bookings</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {bookings.filter(b => b.bookingStatus?.toLowerCase() === "confirmed").length}
                      </p>
                      <p className="text-sm text-gray-600">Confirmed</p>
                    </div>
                    <div className="bg-yellow-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        ₹{bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Spent</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const showNav = !["/login", "/register", "/forgot"].includes(location.pathname);

  return (
    <div className={dark ? "dark" : ""}>
      <div className={`bg-background text-foreground min-h-screen ${dark ? "bg-gray-950 text-white" : ""}`}>
        {showNav && <Navbar dark={dark} setDark={setDark} />}

        <Routes>
          <Route index element={<HomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot" element={<ForgotPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/booking" element={<BookingFlowPage />} />
          <Route path="/tour-booking" element={<TourBookingPage />} />
          <Route path="/booking-success" element={<BookingSuccessPage />} />
          <Route path="/tours" element={<ToursPage />} />
          <Route path="/dashboard" element={<CustomerDashboard />} />
        </Routes>
      </div>
    </div>
  );
}
