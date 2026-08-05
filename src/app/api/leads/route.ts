import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLeadSchema } from "@/validation/leads.validation";
import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";
import { checkDuplicateLead } from "@/lib/leads/checkDuplicatedLead";

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized, Please Login first",
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
        { status: 403 },
      );
    }
    const body = await req.json();
    // Validate Request
    const validationResult = createLeadSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { leadInfo, statusId, notes } = validationResult.data;

    // Verify Lead Status
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
        { status: 404 },
      );
    }

    const duplicateLead = await checkDuplicateLead({
      organizationId: user.organizationId,
      phone: leadInfo.phone,
      email: leadInfo.email,
    });

    if (duplicateLead) {
      return NextResponse.json(
        {
          success: false,
          error: `Lead already exists with this ${duplicateLead.duplicateBy}.`,
        },
        {
          status: 409,
        },
      );
    }

    const lead = await prisma.lead.create({
      data: {
        organizationId: user.organizationId,
        companyId: user.companyId,
        statusId,
        sourceChannel: "Manual",
        notes,
        createdById: user.id,
        assignedToId: user.id, // defaults to creator; change if you have an assignment flow
        information: {
          create: {
            firstName: leadInfo.firstName,
            lastName: leadInfo.lastName,
            phone: leadInfo.phone,
            email: leadInfo.email,
            address: leadInfo.address,
            company: leadInfo.company,
          },
        },
      },
      include: {
        information: true, // return the nested record in the response
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Lead created successfully",
        data: lead,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create Lead Error:", error);

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
        { status: 401 },
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
    const searchParams = req.nextUrl.searchParams;

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);

    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 10, 1),
      100,
    );

    const skip = (page - 1) * limit;

    const search = searchParams.get("search")?.trim() || "";

    // shared where query for total leads and leads

    const where = {
      organizationId: user.organizationId,
      companyId: user.companyId,
      assignedToId: user.id,
    };

    if (search) {
      where.information = {
        is: {
          OR: [
            {
              firstName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              lastName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              phone: {
                contains: search,
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              company: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        },
      };
    }

    const [totalLeads, leads] = await Promise.all([
      prisma.lead.count({
        where,
      }),
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          sourceChannel: true,
          notes: true,
          createdAt: true,
          updatedAt: true,

          information: true,

          status: {
            select: {
              id: true,
              name: true,
            },
          },

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
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const totalPages = Math.ceil(totalLeads / limit);

    return NextResponse.json(
      {
        success: true,
        message: "Leads Fetched Successfully",
        data: leads,
        pagination: {
          page,
          limit,
          totalLeads,
          totalPages,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  const deleterec = await prisma.leadInformation.deleteMany();

  return NextResponse.json(
    {
      success: true,
      message: "Leads deleted successfully",
    },
    {
      status: 200,
    },
  );
}
