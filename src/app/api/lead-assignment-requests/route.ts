import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";

export async function POST(req: NextRequest) {
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

    const { leadIds, assignedToId, message } = await req.json();

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one lead is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (leadIds.length > 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Bulk lead transfer is not supported yet.",
        },
        {
          status: 400,
        },
      );
    }

    // check lead in the DB
    const leadId = leadIds[0];
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        organizationId: user.organizationId,
        companyId: user.companyId,
      },
      include: {
        information: {
          select: {
            id: true,
            leadId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: "Lead not found.",
        },
        { status: 404 },
      );
    }

    // self Self Assignment check = checking a user can not assign a lead to himself
    if (assignedToId === user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot send a transfer request to yourself.",
        },
        { status: 400 },
      );
    }
    // Ownership Check = this is for only lead owner and managers can assign a lead to any user
    const isManager =
      user.role.name === "ORG_MANAGER" || user.role.name === "COMPANY_MANAGER";

    // if (!isManager && lead.assignedToId !== user.id) {}
    if (!isManager) {
      if (lead.assignedToId !== user.id) {
        return NextResponse.json(
          {
            success: false,
            error: "You can only transfer leads assigned to you.",
          },
          { status: 403 },
        );
      }
    }

    // checking the receiver exsits in the DB
    const receiver = await prisma.user.findFirst({
      where: {
        id: assignedToId,
        organizationId: user.organizationId,
        companyId: user.companyId,
      },
    });
    if (!receiver) {
      return NextResponse.json(
        {
          success: false,
          error: "Assigned user not found.",
        },
        { status: 404 },
      );
    }
    // Receiver already owns this lead
    if (lead.assignedToId === receiver.id) {
      return NextResponse.json(
        {
          success: false,
          error: `This is already assigned to ${receiver.name}.`,
        },
        { status: 409 },
      );
    }

    // check pending requests for the same lead and same receiver
    const existingPendingRequest = await prisma.leadAssignmentRequest.findFirst(
      {
        where: {
          leadIds: { has: lead.id },
          fromUserId: user.id,
          toUserId: receiver.id,
          status: "PENDING",
        },
      },
    );

    if (existingPendingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "A pending transfer request for this lead already exists.",
        },
        { status: 409 },
      );
    }

    // here we are going to use transaction to create lead assignment request and notification for the receiver
    const result = await prisma.$transaction(async (prisma) => {
      const createLeadAssignmentRequest =
        await prisma.leadAssignmentRequest.create({
          data: {
            organizationId: user.organizationId!,
            companyId: user.companyId!,
            fromUserId: user.id,
            toUserId: assignedToId,
            leadIds: [lead.id],
            message: message,
          },
        });

      await prisma.notification.create({
        data: {
          senderId: user.id,
          receiverId: assignedToId,
          title: "Lead Transfer Request",
          message: `${user.name} has requested to transfer lead  "${lead.information?.firstName ?? "Unknown"} ${lead.information?.lastName ?? "Unknown"}"  to you.`,
          type: "TRANSFER_REQUEST_RECEIVED",
          entityType: "ASSIGNMENT_REQUEST",
          entityId: createLeadAssignmentRequest.id,
        },
      });

      return {
        createLeadAssignmentRequest,
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: `Lead Transfer Request Sent to ${receiver.name}`,
        data: result.createLeadAssignmentRequest,
      },
      {
        status: 201,
      },
    );
  } catch (err) {
    console.log("Error while assigning lead to user", err);
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

export async function GET() {
  try {
    console.log("welcome to API route to get lead assignment requests");
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

    const getLeadAssignmentRequest =
      await prisma.leadAssignmentRequest.findMany({
        where: {
          organizationId: user.organizationId,
          companyId: user.companyId,
          toUserId: user.id,
          // toUserId: "6a51d4bb0f5d2ace6f70af24",
        },
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      {
        success: true,
        data: getLeadAssignmentRequest,
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.log("Error while getting Lead assignment requests:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}
