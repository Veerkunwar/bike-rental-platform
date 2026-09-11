import mongoose, { Document as MongooseDocument, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type DocumentStatus = 'not_uploaded' | 'pending' | 'approved' | 'rejected';

export interface IUserDocumentFile {
  status: DocumentStatus;
  fileUrl?: string;
  fileKey?: string;
  rejectionReason?: string;
  uploadedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
}

export interface IUser extends MongooseDocument {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth?: Date;
  city?: string;
  address?: string;
  emergencyContact?: string;
  profilePhotoUrl?: string;

  role: 'user' | 'admin';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isSuspended: boolean;

  documents: {
    governmentId: IUserDocumentFile;
    drivingLicense: IUserDocumentFile;
    selfie: IUserDocumentFile;
  };

  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  otpCode?: string;
  otpExpires?: Date;

  comparePassword(candidate: string): Promise<boolean>;
  areDocumentsApproved(): boolean;
  createdAt: Date;
  updatedAt: Date;
}

const documentFileSchema = new Schema<IUserDocumentFile>(
  {
    status: {
      type: String,
      enum: ['not_uploaded', 'pending', 'approved', 'rejected'],
      default: 'not_uploaded',
    },
    fileUrl: String,
    fileKey: String,
    rejectionReason: String,
    uploadedAt: Date,
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    dateOfBirth: Date,
    city: String,
    address: String,
    emergencyContact: String,
    profilePhotoUrl: String,

    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },

    documents: {
      governmentId: { type: documentFileSchema, default: () => ({}) },
      drivingLicense: { type: documentFileSchema, default: () => ({}) },
      selfie: { type: documentFileSchema, default: () => ({}) },
    },

    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    otpCode: { type: String, select: false },
    otpExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.areDocumentsApproved = function (this: IUser) {
  return (
    this.documents.governmentId.status === 'approved' &&
    this.documents.drivingLicense.status === 'approved' &&
    this.documents.selfie.status === 'approved'
  );
};

userSchema.index({ role: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
