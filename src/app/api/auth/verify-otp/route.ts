import { NextRequest, NextResponse } from "next/server"
import { findUserByEmail, verifyOTP, createSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
    const { email, otp } = await req.json();

    if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!otp) {
        return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    if (await verifyOTP(email, otp)) {
        let user = await findUserByEmail(email);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 400 });
        }
        await createSession(user.id, email);

        return NextResponse.json({ message: "Login successful" }, { status: 200 });
    }
    else {
        return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
    }
}
