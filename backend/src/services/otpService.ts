import { env } from '../config/env';
import { generateOtp } from '../utils/generateOtp';
import { User } from '../models/User';

let twilioClient: import('twilio').Twilio | null = null;
async function getTwilioClient() {
  if (!twilioClient) {
    const { Twilio } = await import('twilio');
    twilioClient = new Twilio(env.twilio.accountSid, env.twilio.authToken);
  }
  return twilioClient;
}

export async function issuePhoneOtp(userId: string): Promise<{ otpForDev?: string }> {
  const otp = generateOtp(6);
  const expires = new Date(Date.now() + env.otp.expiryMinutes * 60 * 1000);

  const user = await User.findByIdAndUpdate(userId, { otpCode: otp, otpExpires: expires }, { new: true });
  if (!user) throw new Error('User not found while issuing OTP.');

  if (env.otp.mockMode || !env.twilio.accountSid) {
    // No SMS provider configured yet (or OTP_MOCK_MODE=true): return the OTP
    // in the API response / server log instead of sending a real text message.
    // eslint-disable-next-line no-console
    console.log(`[otp:mock] user=${userId} phone=${user.phone} otp=${otp}`);
    return { otpForDev: otp };
  }

  // Real Twilio SMS send. Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and
  // TWILIO_FROM_NUMBER in .env, and OTP_MOCK_MODE=false.
  const client = await getTwilioClient();
  await client.messages.create({
    to: user.phone,
    from: env.twilio.fromNumber,
    body: `Your RideIt verification code is ${otp}. It expires in ${env.otp.expiryMinutes} minutes.`,
  });

  return {};
}

export async function verifyPhoneOtp(userId: string, code: string): Promise<boolean> {
  const user = await User.findById(userId).select('+otpCode +otpExpires');
  if (!user?.otpCode || !user.otpExpires) return false;
  if (user.otpExpires < new Date()) return false;
  if (user.otpCode !== code) return false;

  user.isPhoneVerified = true;
  user.otpCode = undefined;
  user.otpExpires = undefined;
  await user.save();
  return true;
}
