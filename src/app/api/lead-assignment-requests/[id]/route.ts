import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
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

    const assignmentRequest = await prisma.leadAssignmentRequest.findFirst({
      where: {
        id: id,
        organizationId: user.organizationId,
        companyId: user.companyId,
      },
      select: {
        id: true,
        status: true,
        message: true,
        rejectionReason: true,
        createdAt: true,

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

        leadIds: true,
      },
    });

    if (!assignmentRequest) {
      return NextResponse.json(
        {
          success: false,
          error: "Transfer request not found.",
        },
        {
          status: 404,
        },
      );
    }

    const leadId = assignmentRequest.leadIds[0];
    const leadDetails = await prisma.lead.findMany({
      where: {
        id: leadId,
      },
      include: {
        information: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            company: true,
          },
        },
      },
    });

    console.log("Lead Details:", leadDetails);

    return NextResponse.json(
      {
        success: true,
        data: assignmentRequest,
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
