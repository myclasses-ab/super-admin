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
  serviceCities: string[];
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
  subject: string;
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

export enum ActivityActorType {
  STUDENT = 'STUDENT',
  INSTITUTE_ADMIN = 'INSTITUTE_ADMIN',
  INSTITUTE_STAFF = 'INSTITUTE_STAFF',
  SUPER_ADMIN = 'SUPER_ADMIN',
  SYSTEM = 'SYSTEM',
}

export enum ActivityEntityType {
  USER = 'USER',
  INSTITUTE = 'INSTITUTE',
  BRANCH = 'BRANCH',
  COURSE = 'COURSE',
  FACULTY = 'FACULTY',
  RESULT = 'RESULT',
  REVIEW = 'REVIEW',
  BOOKMARK = 'BOOKMARK',
  INQUIRY = 'INQUIRY',
  FACILITY = 'FACILITY',
  FAQ = 'FAQ',
  MEDIA = 'MEDIA',
  CREDIT = 'CREDIT',
  CREDIT_TRANSACTION = 'CREDIT_TRANSACTION',
  FEATURED_PURCHASE = 'FEATURED_PURCHASE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  USER_INSTITUTE_ASSOCIATION = 'USER_INSTITUTE_ASSOCIATION',
}

export enum ActivityActionType {
  LOGIN = 'LOGIN',
  LOGIN_OTP = 'LOGIN_OTP',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  STUDENT_REGISTERED = 'STUDENT_REGISTERED',
  STUDENT_PROFILE_UPDATED = 'STUDENT_PROFILE_UPDATED',
  INSTITUTE_CREATED = 'INSTITUTE_CREATED',
  INSTITUTE_UPDATED = 'INSTITUTE_UPDATED',
  INSTITUTE_DELETED = 'INSTITUTE_DELETED',
  INSTITUTE_VERIFIED = 'INSTITUTE_VERIFIED',
  INSTITUTE_UNVERIFIED = 'INSTITUTE_UNVERIFIED',
  INSTITUTE_FEATURED = 'INSTITUTE_FEATURED',
  INSTITUTE_UNFEATURED = 'INSTITUTE_UNFEATURED',
  INSTITUTE_ACTIVATED = 'INSTITUTE_ACTIVATED',
  INSTITUTE_DEACTIVATED = 'INSTITUTE_DEACTIVATED',
  COURSE_CREATED = 'COURSE_CREATED',
  COURSE_UPDATED = 'COURSE_UPDATED',
  COURSE_DELETED = 'COURSE_DELETED',
  SUBMITTED_INQUIRY = 'SUBMITTED_INQUIRY',
  BOOKED_DEMO = 'BOOKED_DEMO',
  UNLOCKED_LEAD = 'UNLOCKED_LEAD',
  BRANCH_CREATED = 'BRANCH_CREATED',
  BRANCH_UPDATED = 'BRANCH_UPDATED',
  BRANCH_DELETED = 'BRANCH_DELETED',
  FACULTY_CREATED = 'FACULTY_CREATED',
  FACULTY_UPDATED = 'FACULTY_UPDATED',
  FACULTY_DELETED = 'FACULTY_DELETED',
  RESULT_CREATED = 'RESULT_CREATED',
  RESULT_UPDATED = 'RESULT_UPDATED',
  RESULT_DELETED = 'RESULT_DELETED',
  FACILITY_CREATED = 'FACILITY_CREATED',
  FACILITY_UPDATED = 'FACILITY_UPDATED',
  FAQ_CREATED = 'FAQ_CREATED',
  FAQ_UPDATED = 'FAQ_UPDATED',
  FAQ_DELETED = 'FAQ_DELETED',
  MEDIA_UPLOADED = 'MEDIA_UPLOADED',
  MEDIA_DELETED = 'MEDIA_DELETED',
  SUBMITTED_REVIEW = 'SUBMITTED_REVIEW',
  REVIEW_VOTED = 'REVIEW_VOTED',
  BOOKMARKED = 'BOOKMARKED',
  REMOVED_BOOKMARK = 'REMOVED_BOOKMARK',
  COMPARED_INSTITUTES = 'COMPARED_INSTITUTES',
  SEARCHED_INSTITUTES = 'SEARCHED_INSTITUTES',
  VIEWED_INSTITUTE = 'VIEWED_INSTITUTE',
  VIEWED_COURSE = 'VIEWED_COURSE',
  STAFF_ADDED = 'STAFF_ADDED',
  STAFF_REMOVED = 'STAFF_REMOVED',
  STAFF_ROLE_CHANGED = 'STAFF_ROLE_CHANGED',
  CREDITS_GRANTED = 'CREDITS_GRANTED',
  CREDITS_DEDUCTED = 'CREDITS_DEDUCTED',
  TOP_UP_REQUESTED = 'TOP_UP_REQUESTED',
  TOP_UP_APPROVED = 'TOP_UP_APPROVED',
  TOP_UP_REJECTED = 'TOP_UP_REJECTED',
  FEATURED_PURCHASED = 'FEATURED_PURCHASED',
  SUBSCRIPTION_CHANGED = 'SUBSCRIPTION_CHANGED',
}

export interface ActivityLog {
  identifier: string;
  actorType: ActivityActorType;
  actorIdentifier: string;
  actorName: string;
  actionType: ActivityActionType;
  entityType: ActivityEntityType;
  entityIdentifier: string;
  entityName: string;
  instituteIdentifier: string;
  description: string;
  oldValue: string | null;
  newValue: string | null;
  metadata: Record<string, unknown> | null;
  source: string;
  createdAt: string;
}

export interface ActivityLogPageResponse {
  content: ActivityLog[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ActivityLogSearchParams {
  page?: number;
  size?: number;
  actorType?: ActivityActorType;
  actionType?: ActivityActionType;
  entityType?: ActivityEntityType;
  actorIdentifier?: string;
  instituteIdentifier?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface TopActor {
  identifier: string;
  name: string;
  count: number;
}

export interface ActionCount {
  actionType: ActivityActionType;
  count: number;
}

export interface ActivityLogStatsResponse {
  totalToday: number;
  totalWeek: number;
  totalMonth: number;
  topStudents: TopActor[];
  topInstitutes: TopActor[];
  actionCounts: ActionCount[];
}
