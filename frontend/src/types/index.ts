export type DocumentStatus = 'not_uploaded' | 'pending' | 'approved' | 'rejected';

export interface UserDocumentFile {
  status: DocumentStatus;
  fileUrl?: string;
  rejectionReason?: string;
  uploadedAt?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  city?: string;
  profilePhotoUrl?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  documentsApproved?: boolean;
  documents: {
    governmentId: UserDocumentFile;
    drivingLicense: UserDocumentFile;
    selfie: UserDocumentFile;
  };
}

export interface City {
  _id: string;
  name: string;
  state: string;
  description?: string;
  thumbnailUrl?: string;
  popularity: number;
  isActive: boolean;
}

export interface Location {
  _id: string;
  city: string | City;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contactNumber?: string;
  openingTime?: string;
  closingTime?: string;
}

export type BikeCategory =
  | 'scooty' | 'scooter' | 'commuter' | 'sports' | 'cruiser' | 'adventure' | 'electric';
export type BikeStatus = 'available' | 'booked' | 'rented' | 'maintenance' | 'disabled';

export interface Bike {
  _id: string;
  name: string;
  brand: string;
  modelName: string;
  manufacturingYear: number;
  category: BikeCategory;
  engineCC?: number;
  mileageKmpl?: number;
  fuelType: string;
  transmission: 'manual' | 'automatic';
  helmetIncluded: boolean;
  photos: string[];
  city: City;
  pickupLocation: Location;
  pricePerHour: number;
  pricePerDay: number;
  securityDeposit: number;
  status: BikeStatus;
  rentalTerms?: string;
  cancellationPolicy?: string;
  averageRating: number;
  reviewCount: number;
  isFeatured: boolean;
}

export interface PriceBreakdown {
  rentalAmount: number;
  helmetCharge: number;
  taxes: number;
  discount: number;
  securityDeposit: number;
  totalPayable: number;
}

export type BookingStatus =
  | 'pending' | 'confirmed' | 'payment_pending' | 'ready_for_pickup'
  | 'active' | 'completed' | 'cancelled' | 'rejected';

export interface Booking {
  _id: string;
  bookingId: string;
  user: string | User;
  bike: Bike;
  pickupLocation: Location;
  pickupDateTime: string;
  returnDateTime: string;
  priceBreakdown: PriceBreakdown;
  paymentMethod: 'online' | 'cash';
  status: BookingStatus;
  createdAt: string;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
}
