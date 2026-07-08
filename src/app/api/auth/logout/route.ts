import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
    (await cookies()).delete("auth-token");

    return NextResponse.json({ message: "Logged out" }, { status: 200 })
}
