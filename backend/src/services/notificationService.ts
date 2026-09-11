import { Notification, NotificationType } from '../models/Notification';

export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedBooking?: string,
): Promise<void> {
  await Notification.create({ user: userId, type, title, message, relatedBooking });
  // In-app notification is persisted above. Email dispatch for the same
  // event is triggered from the calling controller/service via emailService,
  // keeping "what happened" (notification) separate from "how we told them" (channel).
}
