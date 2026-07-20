import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}
// this route is for Fetch a single lead from the DB
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized, Please Login first",
        },
        {
          status: 401,
        },
      );
    }

    if (!user.organizationId || !user.companyId) {
      return NextResponse.json(
        {
          success: false,
          error: "User is not assigned to an organization or company",
        },
        { status: 403 },
      );
    }
    const LeadStatus = await prisma.leadStatus.findFirst({
      where: {
        id,
      },
    });

    if (!LeadStatus) {
      return NextResponse.json(
        {
          success: false,
          error: "Lead Status Not Found",
        },
        {
          status: 404,
        },
      );
    }
    return NextResponse.json(
      {
        success: true,
        message: "Lead Status fetch successfully",
        data: LeadStatus,
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.log("Error while Fetching the Single Lead Status", err);
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
// this route is for update lead information
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized, Please Login first",
        },
        {
          status: 401,
        },
      );
    }
    if (user.role.name !== "ORG_MANAGER") {
      return NextResponse.json(
        {
          success: false,
          error: "Not authorize Only ORG_MANAGER can Update the LeadStatus",
        },
        {
          status: 401,
        },
      );
    }

    if (!user.organizationId || !user.companyId) {
      return NextResponse.json(
        {
          success: false,
          error: "User is not assigned to an organization or company",
        },
        { status: 403 },
      );
    }
    const { name } = await req.json();
    const checkLeadStatus = await prisma.leadStatus.findFirst({
      where: {
        id,
      },
    });

    if (!checkLeadStatus) {
      return NextResponse.json(
        {
          success: false,
          error: "Lead Status Not Found",
        },
        {
          status: 404,
        },
      );
    }

    const changeLeadStatus = await prisma.leadStatus.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lead Status Updated",
      },
      { status: 200 },
    );
  } catch (err) {
    console.log("Error while update the Lead Status", err);
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
// this route is for Delete lead from the DB
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized, Please Login first",
        },
        {
          status: 401,
        },
      );
    }

    if (user.role.name !== "ORG_MANAGER") {
      return NextResponse.json(
        {
          success: false,
          error: "Not authorize Only ORG_MANAGER can Delete the LeadStatus",
        },
        {
          status: 401,
        },
      );
    }

    if (!user.organizationId || !user.companyId) {
      return NextResponse.json(
        {
          success: false,
          error: "User is not assigned to an organization or company",
        },
        { status: 403 },
      );
    }
    const LeadStatus = await prisma.leadStatus.findFirst({
      where: {
        id,
      },
    });

    if (!LeadStatus) {
      return NextResponse.json(
        {
          success: false,
          error: "Lead Status Not Found",
        },
        {
          status: 404,
        },
      );
    }

    const deleteLeadStatus = await prisma.leadStatus.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lead Status Deleted Successfully",
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.log("Error while update the Lead Status", err);
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
