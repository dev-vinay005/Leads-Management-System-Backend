import { NextRequest, NextResponse } from "next/server"
import { findUserByEmail, createUser, storeOTP } from "@/lib/auth"
import { sendOTP } from "@/lib/nodemailer"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
    const { email } = await req.json();

    if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    let user = await findUserByEmail(email);

    if (!user) {
        const userRole = await prisma.role.findUnique({ where: { name: "USER" } })
        if (!userRole) {
            return NextResponse.json({ error: "Default role not found " }, { status: 500 })
        }
        user = await createUser(email, userRole.id);
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    await storeOTP(user.id, otp);
    await sendOTP(email, otp);

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
}
