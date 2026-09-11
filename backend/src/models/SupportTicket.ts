import mongoose, { Document, Schema } from 'mongoose';

export interface ITicketMessage {
  sender: mongoose.Types.ObjectId;
  senderRole: 'user' | 'admin';
  message: string;
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  user: mongoose.Types.ObjectId;
  category: 'payment' | 'booking' | 'bike' | 'refund' | 'document' | 'other';
  subject: string;
  relatedBooking?: mongoose.Types.ObjectId;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: mongoose.Types.ObjectId;
  messages: ITicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ticketMessageSchema = new Schema<ITicketMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['user', 'admin'], required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      enum: ['payment', 'booking', 'bike', 'refund', 'document', 'other'],
      required: true,
    },
    subject: { type: String, required: true },
    relatedBooking: { type: Schema.Types.ObjectId, ref: 'Booking' },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    messages: { type: [ticketMessageSchema], default: [] },
  },
  { timestamps: true },
);

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', supportTicketSchema);
