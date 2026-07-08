import { NextRequest, NextResponse } from "next/server"
import { findUserByEmail, createUser, storeOTP } from "@/lib/auth"
import { sendOTP } from "@/lib/nodemailer"
import crypto from "crypto"

export async function POST(req: NextRequest) {
    const { email } = await req.json();

    if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    let user = await findUserByEmail(email);

    if (!user) {
        user = await createUser(email, "ROLE_ID_HERE");
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    await storeOTP(user.id, otp);
    await sendOTP(email, otp);

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
}
