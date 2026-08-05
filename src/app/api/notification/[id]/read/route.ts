import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}
export async function PATCH(req: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const notificationDetails = await prisma.notification.findFirst({
      where: {
        id,
        receiverId: user.id,
      },
    });

    if (!notificationDetails) {
      return NextResponse.json(
        {
          success: false,
          error: "Notfication Not found ",
        },
        {
          status: 404,
        },
      );
    }

    if (notificationDetails.isRead) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification already marked as read.",
        },
        {
          status: 409,
        },
      );
    }
    const updateNotification = await prisma.notification.update({
      where: {
        id: notificationDetails.id,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Notification update successfully",
        data: { id: updateNotification.id, isRead: updateNotification.isRead },
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
