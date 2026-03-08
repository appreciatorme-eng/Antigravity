import { Resend } from "resend";
import { env } from "@/lib/config/env";

export const resend = env.resend.apiKey ? new Resend(env.resend.apiKey) : null;

export const FROM_ADDRESS = env.resend.fromEmail || "bookings@yourdomain.com";
export const FROM_NAME = env.resend.fromName;
