import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized, please Login First",
        },
        { status: 401 },
      );
    }

    if (!user.organizationId || !user.companyId) {
      return NextResponse.json(
        {
          success: false,
          error: "User is not assigned to an organization or company",
        },
        {
          status: 403,
        },
      );
    }

    const notifications = await prisma.notification.findMany({
      where: {
        receiverId: user.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        {
          isRead: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
    });
    return NextResponse.json(
      {
        success: true,
        message: "Notification fetched Successfully",
        data: notifications,
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.log("Error: while getting Notifications:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
