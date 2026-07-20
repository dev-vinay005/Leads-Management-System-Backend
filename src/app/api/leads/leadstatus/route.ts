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
          error: "Not authorize Only ORG_MANAGER can Create the LeadStatus",
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

    // find existing  leadStatus

    const existingLeadStatus = await prisma.leadStatus.findFirst({
      where: {
        name,
        organizationId: user.organizationId,
      },
    });

    if (existingLeadStatus) {
      return NextResponse.json(
        {
          success: false,
          error: "This Lead Status is already exists",
        },
        {
          status: 409,
        },
      );
    }
    const leadStatus = await prisma.leadStatus.create({
      data: {
        name,
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lead Status Created Successfully",
        leadStatus,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.log("Error while creating Lead Status: ", error);
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

export async function GET(req: NextRequest) {
  try {
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

    const getLeadsStatus = await prisma.leadStatus.findMany({
      where: {
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "All Leads Status Fetched Successfully",
        data: getLeadsStatus,
      },
      {
        status: 200,
      },
    );
  } catch (err) {
    console.log("Error while Fetching LeadStatus", err);
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
