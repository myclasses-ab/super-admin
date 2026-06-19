/**
 * Types for Super Admin App
 */

export interface User {
  identifier: string;
  fullName: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  avatarUrl: string;
  role: UserRole;
  currentStandard: Standard;
  targetExamIdentifiers: string[];
  searchedCities: string[];
  searchedExams: string[];
  visitedInstituteIdentifiers: string[];
  visitedInstituteNames: string[];
  cityIdentifier: string;
  state: string;
  pincode: string;
  schoolCollegeName: string;
  preferredLanguage: string;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  identifier: string;
  name: string;
  state: string;
  country: string;
  isActive: boolean;
  createdAt: string;
}

export interface ExamType {
  identifier: string;
  name: string;
  code: string;
  level: ExamLevel;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface Inquiry {
  identifier: string;
  instituteIdentifier: string;
  branchIdentifier: string | null;
  courseIdentifier: string | null;
  userIdentifier: string | null;
  name: string;
  email: string;
  phone: string;
  standard: string;
  targetExam: string;
  message: string;
  source: InquirySource;
  status: InquiryStatus;
  assignedTo: string;
  instituteNotes: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeadDistribution {
  identifier: string;
  userIdentifier: string;
  userName: string | null;
  userPhone: string | null;
  instituteIdentifier: string;
  instituteName: string | null;
  distributedBy: string | null;
  distributedAt: string | null;
  status: LeadDistributionStatus;
  notes: string | null;
  instituteNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Institute {
  identifier: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  foundedYear: number;
  logoUrl: string;
  bannerUrl: string;
  websiteUrl: string;
  email: string;
  phonePrimary: string;
  whatsappNumber: string;
  type: InstituteType;
  ownershipType: OwnershipType;
  isFranchise: boolean;
  parentInstituteIdentifier: string | null;
  averageRating: number | string;
  totalReviews: number;
  totalStudentsEnrolled: number;
  yearsOfExperience: number;
  isVerified: boolean;
  isFeatured: boolean;
  isActive: boolean;
  subscriptionTier: SubscriptionTier;
  metaTitle: string;
  metaDescription: string;
  cityIdentifier?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Branch {
  identifier: string;
  instituteIdentifier: string;
  name: string;
  isMainBranch: boolean;
  isOnlineOnly: boolean;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  cityIdentifier: string;
  cityName: string;
  state: string;
  pincode: string;
  latitude: number | string;
  longitude: number | string;
  googleMapsUrl: string;
  phone: string;
  email: string;
  totalAreaSqft: number;
  totalClassrooms: number;
  seatingCapacity: number;
  operatingHoursStart: string;
  operatingHoursEnd: string;
  operatingDays: string;
  isActive: boolean;
  createdAt: string;
}

export interface InstituteCourse {
  identifier: string;
  instituteIdentifier: string;
  courseIdentifier: string;
  courseName: string;
  description: string;
  feeMin: number;
  feeMax: number;
  durationMonths: number;
  durationHours: number;
  batchSize: number;
  courseType: CourseType;
  standard: Standard;
  examTypeIdentifiers: string[];
  subjectIdentifiers: string[];
  startDate: string;
  endDate: string;
  admissionOpen: boolean;
  admissionLastDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  identifier: string;
  name: string;
  description: string;
  courseType: CourseType;
  isActive: boolean;
  createdAt: string;
}

export interface Faculty {
  identifier: string;
  instituteIdentifier: string;
  name: string;
  designation: string;
  qualification: string;
  experienceYears: number;
  email: string;
  phone: string;
  photoUrl: string;
  createdAt: string;
}

export interface Review {
  identifier: string;
  instituteIdentifier: string;
  userIdentifier: string;
  reviewTitle: string;
  reviewText: string;
  overallRating: number | string;
  teachingQuality: number | string;
  studyMaterial: number | string;
  faculty: number | string;
  infrastructure: number | string;
  valueForMoney: number | string;
  status: ReviewStatus;
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Result {
  identifier: string;
  instituteIdentifier: string;
  studentName: string;
  examName: string;
  year: number;
  rankOrScoreType: RankOrScoreType;
  rankOrScoreValue: string;
  photoUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface LeadFilters {
  cityIdentifier?: string;
  examTypeIdentifier?: string;
  search?: string;
}

export interface InstituteFilters {
  search?: string;
  isVerified?: boolean | '';
  isFeatured?: boolean | '';
  subscriptionTier?: SubscriptionTier | '';
  cityIdentifier?: string;
}

export enum BookmarkEntityType {
  INSTITUTE = 'INSTITUTE',
  COURSE = 'COURSE',
}

export enum CourseType {
  REGULAR = 'REGULAR',
  CRASH = 'CRASH',
  WEEKEND = 'WEEKEND',
  ONLINE = 'ONLINE',
  DISTANCE = 'DISTANCE',
  HYBRID = 'HYBRID',
}

export enum ExamLevel {
  STATE = 'STATE',
  NATIONAL = 'NATIONAL',
  INTERNATIONAL = 'INTERNATIONAL',
}

export enum InquirySource {
  LISTING_PAGE = 'LISTING_PAGE',
  COURSE_PAGE = 'COURSE_PAGE',
  CHAT = 'CHAT',
  CALLBACK_REQUEST = 'CALLBACK_REQUEST',
  DIRECT = 'DIRECT',
}

export enum InquiryStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  FOLLOW_UP = 'FOLLOW_UP',
  ENROLLED = 'ENROLLED',
  NOT_INTERESTED = 'NOT_INTERESTED',
  DROPPED = 'DROPPED',
}

export enum InstituteStaffRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

export enum InstituteType {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  HYBRID = 'HYBRID',
}

export enum MediaEntityType {
  INSTITUTE = 'INSTITUTE',
  BRANCH = 'BRANCH',
  FACULTY = 'FACULTY',
  RESULT = 'RESULT',
  FACILITY = 'FACILITY',
  EVENT = 'EVENT',
}

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  YOUTUBE_LINK = 'YOUTUBE_LINK',
}

export enum NotificationType {
  INQUIRY_RECEIVED = 'INQUIRY_RECEIVED',
  REVIEW_APPROVED = 'REVIEW_APPROVED',
  ADMISSION_REMINDER = 'ADMISSION_REMINDER',
  SYSTEM = 'SYSTEM',
}

export enum OwnershipType {
  INDIVIDUAL = 'INDIVIDUAL',
  PARTNERSHIP = 'PARTNERSHIP',
  COMPANY = 'COMPANY',
  FRANCHISE = 'FRANCHISE',
}

export enum ProficiencyLevel {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
}

export enum RankOrScoreType {
  AIR_RANK = 'AIR_RANK',
  STATE_RANK = 'STATE_RANK',
  PERCENTILE = 'PERCENTILE',
  MARKS = 'MARKS',
  SELECTION = 'SELECTION',
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
}

export enum Standard {
  STANDARD_10 = 'STANDARD_10',
  STANDARD_11 = 'STANDARD_11',
  STANDARD_12 = 'STANDARD_12',
  DROPPER = 'DROPPER',
  STANDARD_11_AND_12 = 'STANDARD_11_AND_12',
  GRADUATE = 'GRADUATE',
  OTHER = 'OTHER',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  FEATURED = 'FEATURED',
}

export enum UserRole {
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  INSTITUTE_ADMIN = 'INSTITUTE_ADMIN',
  INSTITUTE_STAFF = 'INSTITUTE_STAFF',
  SUPER_ADMIN = 'SUPER_ADMIN',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
}

export enum VoteType {
  HELPFUL = 'HELPFUL',
  NOT_HELPFUL = 'NOT_HELPFUL',
}

export enum LeadDistributionStatus {
  PENDING = 'PENDING',
  VIEWED = 'VIEWED',
  CONTACTED = 'CONTACTED',
  CONVERTED = 'CONVERTED',
  EXPIRED = 'EXPIRED',
}

export interface InstituteCredit {
  identifier: string;
  instituteIdentifier: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTransaction {
  identifier: string;
  instituteIdentifier: string;
  amount: number;
  type: string;
  description: string;
  referenceIdentifier: string;
  createdAt: string;
}

export interface LeadRequest {
  identifier: string;
  instituteIdentifier: string;
  examTypeIdentifier: string;
  quantity: number;
  totalCost: number;
  status: string;
  notes: string;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeaturedPurchase {
  identifier: string;
  instituteIdentifier: string;
  cost: number;
  durationDays: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTopUpRequest {
  identifier: string;
  instituteIdentifier: string;
  requestedCredits: number;
  amountInRupees: number;
  transactionIdLast6: string;
  status: string;
  approvedBy: string;
  approvedAt: string;
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
}
