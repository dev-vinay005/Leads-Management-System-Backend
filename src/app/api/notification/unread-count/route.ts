import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";

export async function GET() {
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

    const unreadCount = await prisma.notification.count({
      where: {
        receiverId: user.id,
        isRead: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Unread Notification Count Fetched Successfully",
        data: {
          count: unreadCount,
        },
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.log("Error while getting unread-notification-count", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      {
        status: 500,
      },
    );
  }
}
