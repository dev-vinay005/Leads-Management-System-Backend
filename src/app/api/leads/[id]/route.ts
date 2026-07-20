import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";
import { updateLeadSchema } from "@/validation/leads.validation";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// This route is for fetch single Lead data

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

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        companyId: user.companyId,
      },
      include: {
        status: {
          select: {
            id: true,
            name: true,
          },
        },
        information: true,
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: "Lead not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Lead fetched successfully",
        data: lead,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Get Lead Error:", error);

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

// This route is for Update Lead information and status
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
    // Validate Request Body
    const body = await req.json();
    const validationResult = updateLeadSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }
    const { leadInfo, statusId, notes } = validationResult.data;

    // checking is Lead exists
    const lead = await prisma.lead.findFirst({
      where: {
        id,
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
          error: "Lead not found",
        },
        {
          status: 404,
        },
      );
    }

    // checking is  Status exists
    if (statusId) {
      const leadStatus = await prisma.leadStatus.findUnique({
        where: {
          id: statusId,
        },
      });

      if (!leadStatus) {
        return NextResponse.json(
          {
            success: false,
            error: "Lead status not found",
          },
          {
            status: 404,
          },
        );
      }
    }

    // Update Lead

    const updatedLead = await prisma.lead.update({
      where: {
        id,
      },
      data: {
        statusId,
        notes,
        information: {
          update: {
            firstName: leadInfo
              ? leadInfo.firstName
              : lead.information?.firstName,
            lastName: leadInfo ? leadInfo.lastName : lead.information?.lastName,
            phone: leadInfo ? leadInfo.phone : lead.information?.phone,
            email: leadInfo ? leadInfo.email : lead.information?.email,
            company: leadInfo ? leadInfo.company : lead.information?.company,
            address: leadInfo ? leadInfo.address : lead.information?.address,
          },
        },
      },
      include: {
        information: true,
        status: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lead updated successfully",
        data: updatedLead,
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.log("Error while updating the lead", err);
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

// This route is for delete Lead from the database
export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        companyId: user.companyId,
      },
    });

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: "Lead not found",
        },
        {
          status: 404,
        },
      );
    }
    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lead deleted successfully",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Delete Lead Error:", error);
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
