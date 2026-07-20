import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export interface Session {
  userId: string;
  email: string;
}

export async function createSession(
  userId: string,
  email: string,
): Promise<void> {
  const token = jwt.sign({ userId, email }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  (await cookies()).set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get("auth-token")?.value;
  try {
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as Session;
      return decoded;
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export function createUser(email: string, roleId: string) {
  return prisma.user.create({ data: { email, password: "", roleId } });
}

export function storeOTP(userId: string, otp: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      otp: otp,
      otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
    },
  });
}

export async function verifyOTP(email: string, otp: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    if (user.otp === otp && user.otpExpiry && !(new Date() > user.otpExpiry)) {
      await prisma.user.update({
        where: { email: email },
        data: {
          otp: null,
          otpExpiry: null,
        },
      });
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}
