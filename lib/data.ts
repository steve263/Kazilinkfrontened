// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "customer" | "provider" | "admin";
export type ProviderType = "fundi" | "business";
export type VerificationStatus = "unverified" | "pending" | "verified";
export type VerificationBadge = "Verified Fundi" | "Verified Business";
export type TrustLevel = "bronze" | "silver" | "gold" | "platinum";
export type ReportReason =
  | "fraud"
  | "fake_profile"
  | "no_show"
  | "harassment"
  | "fake_reviews"
  | "overcharging"
  | "impersonation"
  | "other";
export type ReportStatus = "pending" | "investigating" | "resolved" | "dismissed";
export type AccountStatus = "active" | "suspended" | "banned";

export interface TrustScore {
  overall: number; // 0–100
  level: TrustLevel;
  components: {
    identity: number;    // ID + selfie verified → max 25
    phone: number;       // Phone OTP verified → max 15
    portfolio: number;   // Real photos uploaded → max 20
    ratings: number;     // Based on avg rating → max 25
    completions: number; // Jobs completed → max 10
    reports: number;     // Deducted for reports → max -20
  };
  lastUpdated: string;
}

export interface Report {
  id: string;
  reportedId: string;
  reportedName: string;
  reportedType: "provider" | "customer";
  reporterName: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  createdAt: string;
  evidence?: string[];
}

export interface FraudFlag {
  id: string;
  providerId: string;
  type: "duplicate_image" | "location_mismatch" | "suspicious_reviews" | "rapid_signup" | "unverified_id";
  description: string;
  severity: "low" | "medium" | "high";
  createdAt: string;
  resolved: boolean;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
  city: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
}

export interface PortfolioItem {
  id: string;
  image: string;
  caption: string;
  beforeImage?: string;
  afterImage?: string;
  isBeforeAfter?: boolean;
  imageHash?: string; // for duplicate detection
}

export interface FundiProfile {
  yearsOfExperience: number;
  education: string;
  skills: string[];
  certificates: string[];
  idVerified: boolean;
  selfieVerified?: boolean;
  selfieUrl?: string;
  idFrontUrl?: string;
  portfolio: PortfolioItem[];
}

export interface BusinessProfile {
  photos: string[];
  openingHours: { open: string; close: string; days: string };
}

export interface ServiceProvider {
  id: string;
  providerType: ProviderType;
  name: string;
  phone: string;
  whatsapp: string;
  description: string;
  category: string;
  subcategory: string;
  profileImage: string;
  coverImage: string;
  location: Location;
  verificationStatus: VerificationStatus;
  verificationBadge?: VerificationBadge;
  rating: number;
  reviewCount: number;
  featured: boolean;
  priceRange: "$" | "$$" | "$$$";
  tags: string[];
  services: Service[];
  distance?: string;
  fundiProfile?: FundiProfile;
  businessProfile?: BusinessProfile;
  // Fraud prevention & trust
  trustScore?: TrustScore;
  accountStatus?: AccountStatus;
  phoneVerified?: boolean;
  locationVerified?: boolean;
  reportCount?: number;
  completedJobs?: number;
  fraudFlags?: FraudFlag[];
}

export interface Post {
  id: string;
  providerId: string;
  providerName: string;
  providerImage: string;
  verificationBadge?: VerificationBadge;
  image: string;
  caption: string;
  likes: number;
  comments: Comment[];
  timestamp: string;
  type: "photo" | "promotion" | "video";
  isLiked?: boolean;
  isTrending?: boolean;
  tag?: string;
}

export interface Comment {
  id: string;
  user: string;
  avatar: string;
  text: string;
  timestamp: string;
}

export interface Review {
  id: string;
  user: string;
  avatar: string;
  rating: number;
  comment: string;
  timestamp: string;
  providerId: string;
  verifiedPurchase?: boolean;
  jobCompleted?: boolean;
  helpful?: number;
  isSuspicious?: boolean;
  serviceUsed?: string;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: "salon", label: "Salon & Beauty", icon: "✂️", color: "#FF6B2B" },
  { id: "cleaning", label: "Cleaning", icon: "🧹", color: "#00C896" },
  { id: "repair", label: "Repairs", icon: "🔧", color: "#0EA5E9" },
  { id: "plumbing", label: "Plumbing", icon: "🚿", color: "#0EA5E9" },
  { id: "electrical", label: "Electrical", icon: "⚡", color: "#F59E0B" },
  { id: "fitness", label: "Fitness", icon: "💪", color: "#8B5CF6" },
  { id: "food", label: "Food & Catering", icon: "🍽️", color: "#F59E0B" },
  { id: "tech", label: "Tech & IT", icon: "💻", color: "#0EA5E9" },
  { id: "events", label: "Events", icon: "🎉", color: "#F59E0B" },
  { id: "health", label: "Health", icon: "🏥", color: "#00C896" },
  { id: "education", label: "Tutoring", icon: "📚", color: "#8B5CF6" },
  { id: "photography", label: "Photography", icon: "📸", color: "#EC4899" },
  { id: "transport", label: "Transport", icon: "🚗", color: "#EC4899" },
  { id: "security", label: "Security", icon: "🔒", color: "#1A1714" },
];

export const FUNDI_CATEGORIES = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "Mason / Builder",
  "Welder",
  "Mechanic",
  "Cleaner / Housekeeper",
  "Tailor / Seamstress",
  "Hairdresser",
  "Tutor / Teacher",
  "IT Technician",
  "Photographer",
  "Catering / Chef",
  "Event Planner",
  "Security Guard",
  "Other",
];

export const BUSINESS_CATEGORIES = [
  "Salon & Barbershop",
  "Restaurant & Hotel",
  "Cleaning Company",
  "Repair Shop",
  "Gym & Fitness Centre",
  "Clinic & Hospital",
  "School & Training Centre",
  "Photography Studio",
  "Event Company",
  "Security Company",
  "Catering Company",
  "Other",
];

export const EDUCATION_LEVELS = [
  "Primary School",
  "Secondary School (KCSE)",
  "Certificate",
  "Diploma",
  "Degree (Bachelor's)",
  "Postgraduate",
  "Self-Taught / Artisan",
];

// ─── Demo Providers (minimal — for UI display) ────────────────────────────────

export const PROVIDERS: ServiceProvider[] = [
  {
    id: "1",
    providerType: "fundi",
    name: "James Mwangi",
    phone: "+254 712 345 678",
    whatsapp: "+254712345678",
    description:
      "Certified electrician with 8 years of experience in residential and commercial wiring. Available 7 days a week across Nairobi.",
    category: "electrical",
    subcategory: "Electrician",
    profileImage:
      "https://ui-avatars.com/api/?name=James+Mwangi&background=FF6B2B&color=fff&size=200",
    coverImage:
      "https://images.unsplash.com/photo-1621905251189-08b45249be09?w=800&q=80",
    location: { lat: -1.2921, lng: 36.8219, address: "Westlands, Nairobi", city: "Nairobi" },
    verificationStatus: "verified",
    verificationBadge: "Verified Fundi",
    rating: 4.9,
    reviewCount: 87,
    featured: true,
    priceRange: "$$",
    tags: ["wiring", "sockets", "lighting", "KPLC certified"],
    services: [
      { id: "s1", name: "House Wiring", description: "Full residential electrical wiring", price: 5000, duration: "1 day" },
      { id: "s2", name: "Socket Repair", description: "Repair or replace faulty sockets", price: 500, duration: "1–2 hrs" },
      { id: "s3", name: "Lighting Installation", description: "LED & fluorescent lighting setup", price: 1500, duration: "2–3 hrs" },
    ],
    distance: "1.2 km",
    phoneVerified: true,
    locationVerified: true,
    accountStatus: "active",
    completedJobs: 87,
    reportCount: 0,
    trustScore: {
      overall: 96,
      level: "platinum",
      components: { identity: 25, phone: 15, portfolio: 20, ratings: 24, completions: 10, reports: 0 },
      lastUpdated: "2025-04-20",
    },
    fundiProfile: {
      yearsOfExperience: 8,
      education: "Certificate",
      skills: ["House Wiring", "Solar Installation", "Generator Setup", "CCTV Wiring"],
      certificates: ["KPLC Licensed Electrician", "Solar PV Installation Certificate"],
      idVerified: true,
      selfieVerified: true,
      portfolio: [
        { id: "p1", image: "https://images.unsplash.com/photo-1621905251189-08b45249be09?w=600&q=80", caption: "Commercial wiring — Westlands office block" },
        { id: "p2", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", caption: "Residential lighting installation, Karen" },
      ],
    },
  },
  {
    id: "2",
    providerType: "fundi",
    name: "Peter Otieno",
    phone: "+254 722 111 222",
    whatsapp: "+254722111222",
    description:
      "Professional plumber specialising in pipe installation, leak repair, and bathroom fitting. 10+ years experience in Nairobi.",
    category: "plumbing",
    subcategory: "Plumber",
    profileImage:
      "https://ui-avatars.com/api/?name=Peter+Otieno&background=0EA5E9&color=fff&size=200",
    coverImage:
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
    location: { lat: -1.2841, lng: 36.8155, address: "Parklands, Nairobi", city: "Nairobi" },
    verificationStatus: "verified",
    verificationBadge: "Verified Fundi",
    rating: 4.7,
    reviewCount: 134,
    featured: true,
    priceRange: "$",
    tags: ["pipes", "leak repair", "bathroom", "drain"],
    services: [
      { id: "s1", name: "Leak Repair", description: "Fix burst or leaking pipes fast", price: 800, duration: "1–3 hrs" },
      { id: "s2", name: "Bathroom Fitting", description: "Full bathroom plumbing installation", price: 8000, duration: "2 days" },
      { id: "s3", name: "Drain Unblocking", description: "Clear blocked drains and pipes", price: 600, duration: "1–2 hrs" },
    ],
    distance: "2.0 km",
    phoneVerified: true,
    locationVerified: true,
    accountStatus: "active",
    completedJobs: 134,
    reportCount: 0,
    trustScore: {
      overall: 92,
      level: "platinum",
      components: { identity: 25, phone: 15, portfolio: 18, ratings: 22, completions: 10, reports: 0 },
      lastUpdated: "2025-04-18",
    },
    fundiProfile: {
      yearsOfExperience: 10,
      education: "Diploma",
      skills: ["Pipe Installation", "Leak Detection", "Bathroom Fitting", "Water Tank Setup"],
      certificates: ["NCA Certified Plumber"],
      idVerified: true,
      selfieVerified: true,
      portfolio: [
        { id: "p1", image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80", caption: "Bathroom complete refit — Kilimani" },
      ],
    },
  },
  {
    id: "3",
    providerType: "business",
    name: "Glamour Studio",
    phone: "+254 733 456 789",
    whatsapp: "+254733456789",
    description:
      "Premium hair and beauty salon. Braids, locs, weaves, natural hair treatments. Walk-ins welcome.",
    category: "salon",
    subcategory: "Salon & Barbershop",
    profileImage:
      "https://ui-avatars.com/api/?name=Glamour+Studio&background=EC4899&color=fff&size=200",
    coverImage:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80",
    location: { lat: -1.3031, lng: 36.8342, address: "Kilimani, Nairobi", city: "Nairobi" },
    verificationStatus: "verified",
    verificationBadge: "Verified Business",
    rating: 4.8,
    reviewCount: 234,
    featured: true,
    priceRange: "$$",
    tags: ["braids", "locs", "natural hair", "weaves"],
    services: [
      { id: "s1", name: "Box Braids", description: "Full box braids — all lengths", price: 2500, duration: "3–4 hrs" },
      { id: "s2", name: "Hair Treatment", description: "Deep conditioning + scalp treatment", price: 1200, duration: "1.5 hrs" },
      { id: "s3", name: "Locs Retwist", description: "Professional loc retwist and styling", price: 1800, duration: "2 hrs" },
    ],
    distance: "0.8 km",
    phoneVerified: true,
    locationVerified: true,
    accountStatus: "active",
    completedJobs: 234,
    reportCount: 0,
    trustScore: {
      overall: 94,
      level: "platinum",
      components: { identity: 25, phone: 15, portfolio: 20, ratings: 23, completions: 10, reports: 0 },
      lastUpdated: "2025-04-21",
    },
    businessProfile: {
      photos: [
        "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80",
        "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
      ],
      openingHours: { open: "08:00", close: "20:00", days: "Mon–Sat" },
    },
  },
  {
    id: "4",
    providerType: "business",
    name: "CleanPro Services",
    phone: "+254 700 111 222",
    whatsapp: "+254700111222",
    description:
      "Professional home and office cleaning. Trained staff, eco-friendly products, and guaranteed satisfaction.",
    category: "cleaning",
    subcategory: "Cleaning Company",
    profileImage:
      "https://ui-avatars.com/api/?name=CleanPro&background=00C896&color=fff&size=200",
    coverImage:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    location: { lat: -1.2763, lng: 36.8118, address: "CBD, Nairobi", city: "Nairobi" },
    verificationStatus: "verified",
    verificationBadge: "Verified Business",
    rating: 4.7,
    reviewCount: 189,
    featured: false,
    priceRange: "$$",
    tags: ["home cleaning", "office cleaning", "laundry", "deep clean"],
    services: [
      { id: "s1", name: "Home Cleaning", description: "Full house clean", price: 1500, duration: "3–4 hrs" },
      { id: "s2", name: "Deep Clean", description: "Thorough deep cleaning", price: 3000, duration: "6–8 hrs" },
      { id: "s3", name: "Office Cleaning", description: "Commercial office cleaning", price: 2500, duration: "4–6 hrs" },
    ],
    distance: "3.4 km",
    phoneVerified: true,
    locationVerified: true,
    accountStatus: "active",
    completedJobs: 189,
    reportCount: 0,
    trustScore: {
      overall: 88,
      level: "gold",
      components: { identity: 25, phone: 15, portfolio: 15, ratings: 22, completions: 10, reports: 0 },
      lastUpdated: "2025-04-19",
    },
    businessProfile: {
      photos: [
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
      ],
      openingHours: { open: "06:00", close: "18:00", days: "Mon–Sat" },
    },
  },
  {
    id: "5",
    providerType: "fundi",
    name: "Grace Njeri",
    phone: "+254 711 333 444",
    whatsapp: "+254711333444",
    description:
      "Professional cleaner and housekeeper available for daily, weekly, or one-off cleaning in Nairobi and surrounds.",
    category: "cleaning",
    subcategory: "Cleaner / Housekeeper",
    profileImage:
      "https://ui-avatars.com/api/?name=Grace+Njeri&background=00C896&color=fff&size=200",
    coverImage:
      "https://images.unsplash.com/photo-1556909114-44e3e9699e2b?w=800&q=80",
    location: { lat: -1.2882, lng: 36.8423, address: "Upper Hill, Nairobi", city: "Nairobi" },
    verificationStatus: "verified",
    verificationBadge: "Verified Fundi",
    rating: 4.6,
    reviewCount: 62,
    featured: false,
    priceRange: "$",
    tags: ["housekeeping", "laundry", "ironing", "daily clean"],
    services: [
      { id: "s1", name: "House Cleaning", description: "Full clean including kitchen and bathrooms", price: 1000, duration: "3–4 hrs" },
      { id: "s2", name: "Laundry & Ironing", description: "Wash, dry and iron clothes", price: 500, duration: "Half day" },
    ],
    distance: "1.9 km",
    phoneVerified: true,
    locationVerified: false,
    accountStatus: "active",
    completedJobs: 62,
    reportCount: 1,
    trustScore: {
      overall: 71,
      level: "silver",
      components: { identity: 25, phone: 15, portfolio: 10, ratings: 20, completions: 8, reports: -5 },
      lastUpdated: "2025-04-15",
    },
    fraudFlags: [
      { id: "ff1", providerId: "5", type: "location_mismatch", description: "GPS location differs from registered address by >20 km on 2 occasions", severity: "medium", createdAt: "2025-04-10", resolved: false },
    ],
    fundiProfile: {
      yearsOfExperience: 5,
      education: "Secondary School (KCSE)",
      skills: ["House Cleaning", "Laundry", "Ironing", "Cooking"],
      certificates: [],
      idVerified: true,
      selfieVerified: false,
      portfolio: [
        { id: "p1", image: "https://images.unsplash.com/photo-1556909114-44e3e9699e2b?w=600&q=80", caption: "After deep clean — 3-bedroom house, Upper Hill" },
      ],
    },
  },
  {
    id: "6",
    providerType: "business",
    name: "TechFix Nairobi",
    phone: "+254 720 888 999",
    whatsapp: "+254720888999",
    description:
      "Fast and reliable phone and laptop repair. Genuine parts. Walk-ins welcome, or book online.",
    category: "tech",
    subcategory: "Repair Shop",
    profileImage:
      "https://ui-avatars.com/api/?name=TechFix&background=0EA5E9&color=fff&size=200",
    coverImage:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80",
    location: { lat: -1.2997, lng: 36.7902, address: "Lavington, Nairobi", city: "Nairobi" },
    verificationStatus: "verified",
    verificationBadge: "Verified Business",
    rating: 4.5,
    reviewCount: 321,
    featured: false,
    priceRange: "$$",
    tags: ["phone repair", "laptop repair", "screen replacement", "battery"],
    services: [
      { id: "s1", name: "Screen Replacement", description: "Original screen — all brands", price: 3500, duration: "1–2 hrs" },
      { id: "s2", name: "Battery Replacement", description: "Genuine battery for all models", price: 1200, duration: "30 min" },
      { id: "s3", name: "Laptop Repair", description: "Software and hardware repair", price: 2000, duration: "1–3 days" },
    ],
    distance: "4.2 km",
    phoneVerified: true,
    locationVerified: true,
    accountStatus: "active",
    completedJobs: 321,
    reportCount: 0,
    trustScore: {
      overall: 82,
      level: "gold",
      components: { identity: 20, phone: 15, portfolio: 12, ratings: 21, completions: 10, reports: 0 },
      lastUpdated: "2025-04-22",
    },
    businessProfile: {
      photos: ["https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80"],
      openingHours: { open: "08:30", close: "18:30", days: "Mon–Sat" },
    },
  },
];

// ─── Posts ─────────────────────────────────────────────────────────────────────

export const POSTS: Post[] = [
  {
    id: "post1",
    providerId: "1",
    providerName: "James Mwangi",
    providerImage: "https://ui-avatars.com/api/?name=James+Mwangi&background=FF6B2B&color=fff&size=200",
    verificationBadge: "Verified Fundi",
    image: "https://images.unsplash.com/photo-1621905251189-08b45249be09?w=800&q=80",
    caption: "Just completed this commercial wiring project in Westlands ⚡ 3-floor office block, all KPLC-compliant. Book me for your next project! #ElectricalWork #Nairobi",
    likes: 87,
    comments: [
      { id: "c1", user: "Brian O.", avatar: "https://ui-avatars.com/api/?name=Brian+O&background=F59E0B&color=fff", text: "Great work! How much for a 2-bedroom house?", timestamp: "2h ago" },
    ],
    timestamp: "4h ago",
    type: "photo",
    isLiked: false,
    isTrending: true,
    tag: "Trending",
  },
  {
    id: "post2",
    providerId: "3",
    providerName: "Glamour Studio",
    providerImage: "https://ui-avatars.com/api/?name=Glamour+Studio&background=EC4899&color=fff&size=200",
    verificationBadge: "Verified Business",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
    caption: "Fresh box braids for the weekend 💫 Book your slot before Friday — DM or call us. #BoxBraids #NairobiHair",
    likes: 312,
    comments: [
      { id: "c1", user: "Amina K.", avatar: "https://ui-avatars.com/api/?name=Amina+K&background=FF6B2B&color=fff", text: "These look gorgeous! 😍", timestamp: "1h ago" },
    ],
    timestamp: "3h ago",
    type: "promotion",
    isLiked: false,
    isTrending: true,
    tag: "🔥 Offer",
  },
  {
    id: "post3",
    providerId: "2",
    providerName: "Peter Otieno",
    providerImage: "https://ui-avatars.com/api/?name=Peter+Otieno&background=0EA5E9&color=fff&size=200",
    verificationBadge: "Verified Fundi",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80",
    caption: "Before & after: full bathroom refit done in 2 days 🚿 Leak-free and looking clean! Available across Nairobi. Call to book. #Plumber #NairobiPlumbing",
    likes: 145,
    comments: [],
    timestamp: "6h ago",
    type: "photo",
    isLiked: false,
    isTrending: false,
  },
  {
    id: "post4",
    providerId: "4",
    providerName: "CleanPro Services",
    providerImage: "https://ui-avatars.com/api/?name=CleanPro&background=00C896&color=fff&size=200",
    verificationBadge: "Verified Business",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    caption: "Before & after ✨ Transformed this apartment in 4 hours. Deep clean service available this weekend — book now, slots filling fast!",
    likes: 245,
    comments: [
      { id: "c1", user: "Janet M.", avatar: "https://ui-avatars.com/api/?name=Janet+M&background=00C896&color=fff", text: "I need this for my house! 😅", timestamp: "3h ago" },
    ],
    timestamp: "8h ago",
    type: "photo",
    isLiked: false,
    isTrending: true,
  },
];

// ─── Reviews ───────────────────────────────────────────────────────────────────

export const REVIEWS: Review[] = [
  {
    id: "r1",
    user: "Brian O.",
    avatar: "https://ui-avatars.com/api/?name=Brian+O&background=F59E0B&color=fff",
    rating: 5,
    comment: "James arrived on time and rewired my whole house in one day. Very professional and clean work. Highly recommend!",
    timestamp: "3 days ago",
    providerId: "1",
    verifiedPurchase: true,
    jobCompleted: true,
    helpful: 12,
    serviceUsed: "House Wiring",
  },
  {
    id: "r2",
    user: "Mary W.",
    avatar: "https://ui-avatars.com/api/?name=Mary+W&background=8B5CF6&color=fff",
    rating: 5,
    comment: "Fixed a burst pipe in under 2 hours. Peter was fast, polite, and the price was fair. Will call again.",
    timestamp: "1 week ago",
    providerId: "2",
    verifiedPurchase: true,
    jobCompleted: true,
    helpful: 8,
    serviceUsed: "Leak Repair",
  },
  {
    id: "r3",
    user: "Amina K.",
    avatar: "https://ui-avatars.com/api/?name=Amina+K&background=EC4899&color=fff",
    rating: 5,
    comment: "Best salon in Kilimani! My braids came out perfect and the staff are so friendly.",
    timestamp: "5 days ago",
    providerId: "3",
    verifiedPurchase: true,
    jobCompleted: true,
    helpful: 21,
    serviceUsed: "Box Braids",
  },
  {
    id: "r4",
    user: "Kevin M.",
    avatar: "https://ui-avatars.com/api/?name=Kevin+M&background=0EA5E9&color=fff",
    rating: 2,
    comment: "Didn't show up at the agreed time. Had to wait 3 hours. No proper communication.",
    timestamp: "2 weeks ago",
    providerId: "5",
    verifiedPurchase: true,
    jobCompleted: false,
    helpful: 5,
    serviceUsed: "House Cleaning",
    isSuspicious: false,
  },
];

// ─── Reports ──────────────────────────────────────────────────────────────────

export const REPORTS: Report[] = [
  {
    id: "rep1",
    reportedId: "5",
    reportedName: "Grace Njeri",
    reportedType: "provider",
    reporterName: "Kevin M.",
    reason: "no_show",
    description: "She confirmed the booking then never arrived. Did not answer calls for 2 hours.",
    status: "investigating",
    createdAt: "2025-04-10",
    evidence: [],
  },
  {
    id: "rep2",
    reportedId: "unknown_1",
    reportedName: "Ali Hassan",
    reportedType: "provider",
    reporterName: "John K.",
    reason: "fake_profile",
    description: "Profile photos look like stock images. He could not identify the tools in his portfolio when I asked.",
    status: "pending",
    createdAt: "2025-04-18",
  },
  {
    id: "rep3",
    reportedId: "unknown_2",
    reportedName: "Unnamed Customer",
    reportedType: "customer",
    reporterName: "James Mwangi",
    reason: "fraud",
    description: "Customer booked and paid with a number that was later reported as stolen. M-Pesa transaction reversed.",
    status: "resolved",
    createdAt: "2025-04-05",
  },
];

// ─── Fraud flags ───────────────────────────────────────────────────────────────

export const FRAUD_FLAGS: FraudFlag[] = [
  { id: "ff1", providerId: "5", type: "location_mismatch", description: "GPS location differs from registered address by >20 km on 2 occasions", severity: "medium", createdAt: "2025-04-10", resolved: false },
  { id: "ff2", providerId: "unknown_1", type: "duplicate_image", description: "Portfolio image matches a Google stock photo with 98% similarity", severity: "high", createdAt: "2025-04-18", resolved: false },
  { id: "ff3", providerId: "unknown_1", type: "rapid_signup", description: "Account created and 5 bookings placed within first 2 hours of registration", severity: "medium", createdAt: "2025-04-18", resolved: false },
];

// ─── Admin stats ───────────────────────────────────────────────────────────────

export const ADMIN_STATS = {
  totalUsers: 0,
  activeUsers: 0,
  totalProviders: 0,
  pendingApprovals: 3,
  totalBookings: 0,
  todayBookings: 0,
  totalRevenue: 0,
  monthRevenue: 0,
  reportedContent: REPORTS.filter((r) => r.status === "pending" || r.status === "investigating").length,
  fraudFlags: FRAUD_FLAGS.filter((f) => !f.resolved).length,
  suspendedAccounts: 0,
};
