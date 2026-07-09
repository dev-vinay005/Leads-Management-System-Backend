import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
    const session = await getSession();

    if (session === null) {
        return NextResponse.json({ error: "not logged in" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });

    const organisationId = user?.organizationId;
    const companyId = user?.companyId;

    if (!organisationId || !companyId) {
        return NextResponse.json({ error: "User is not assigned to an organisation or company" }, { status: 400 });
    }

    const { contactInfo, statusId, sourceChannel, notes } = await req.json();

    if (!contactInfo || !statusId) {
        return NextResponse.json({ error: "contactInfo and statusId are required" }, { status: 400 })
    }

    const lead = await prisma.lead.create({
        data: {
            organizationId: organisationId,
            companyId: companyId,
            contactInfo,
            statusId,
            sourceChannel,
            notes,
        },
    });

    return NextResponse.json({ message: "Lead created successfully", data: lead }, { status: 201 })
}
