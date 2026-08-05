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

    const { rejectionReason } = await req.json();

    const assignmentRequest = await prisma.leadAssignmentRequest.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        companyId: user.companyId,
      },
    });

    if (!assignmentRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "Request not found",
        },
        {
          status: 404,
        },
      );
    }

    if (assignmentRequest?.toUserId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Only the receiver can respond to this transfer request.",
        },
        {
          status: 403,
        },
      );
    }

    if (assignmentRequest?.status !== "PENDING") {
      return NextResponse.json(
        {
          success: false,
          error: "This lead assignment request has already been processed.",
        },
        {
          status: 409,
        },
      );
    }

    const leadId = assignmentRequest.leadIds[0];
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        organizationId: user.organizationId,
        companyId: user.companyId,
      },
      include: {
        information: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: "Lead not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (lead.assignedToId !== assignmentRequest.fromUserId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Lead ownership has changed. This transfer request is no longer valid.",
        },
        {
          status: 409,
        },
      );
    }

    const result = await prisma.$transaction(async (prisma) => {
      const updatedRequest = await prisma.leadAssignmentRequest.update({
        where: {
          id,
        },
        data: {
          status: "REJECTED",
          rejectionReason,
        },
        select: {
          id: true,
          status: true,
          rejectionReason: true,
        },
      });
      await prisma.notification.create({
        data: {
          senderId: user.id,
          receiverId: assignmentRequest.fromUserId,
          title: "Lead Transfer Request Rejected",
          message: `${user.name} rejected your lead transfer request for "${lead.information?.firstName} ${lead.information?.lastName}".`,
          type: "TRANSFER_REQUEST_REJECTED",
          entityType: "ASSIGNMENT_REQUEST",
          entityId: updatedRequest.id,
        },
      });

      return { updatedRequest };
    });

    return NextResponse.json(
      {
        success: true,
        message: `Lead transfer request rejected by ${user.name}`,
        data: { request: result.updatedRequest },
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.log("Error while Accepting the lead transfer request:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}
