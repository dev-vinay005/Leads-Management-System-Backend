import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";

// This route is for assign lead to any other user
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getAuthenticatedUser();
    console.log(user?.role.name);
    const { id } = await params;
    const { assignedToId } = await req.json();

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

    // check lead in the DB
    const lead = await prisma.lead.findFirst({
      where: {
        id,
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

    // checking the assignedUser exsits in the DB
    const assignedUser = await prisma.user.findFirst({
      where: {
        id: assignedToId,
        organizationId: user.organizationId,
        companyId: user.companyId,
      },
    });
    if (!assignedUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Assigned user not found.",
        },
        { status: 404 },
      );
    }

    if (lead.assignedToId === assignedUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: `This lead is already assigned to ${assignedUser.name}.`,
        },
        {
          status: 409,
        },
      );
    }

    const updatedLead = await prisma.lead.update({
      where: {
        id: lead.id,
      },
      data: {
        assignedToId: assignedUser.id,
      },
      select: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(lead);

    const createNotidication = await prisma.notification.create({
      data: {
        senderId: user.id,
        receiverId: assignedToId,
        title: "New lead Assigned",
        message: `Lead "${lead.information?.firstName} ${lead.information?.lastName}" has been assigned to you by ${user.name}.`,
        type: "LEAD_ASSIGNED",
        entityId: lead.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Lead assigned successfully to ${assignedUser.name}`,
        updatedLead: updatedLead.assignedTo,
      },
      {
        status: 200,
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
