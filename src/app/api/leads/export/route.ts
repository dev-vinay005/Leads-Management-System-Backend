import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLeadSchema } from "@/validation/leads.validation";
import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";
import { Parser } from "json2csv";

export async function GET(req: NextRequest) {
  const parser = new Parser();
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

    //fetch leads
    const leads = await prisma.lead.findMany({
      where: {
        organizationId: user.organizationId,
        companyId: user.companyId,
      },
      include: {
        information: true,
        status: {
          select: {
            name: true,
          },
        },
        assignedTo: {
          select: {
            name: true,
            email: true,
          },
        },

        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    // Flattening the data
    const exportData = leads.map((lead) => ({
      FirstName: lead.information?.firstName ?? "",
      LastName: lead.information?.lastName ?? "",
      Phone: lead.information?.phone ?? "",
      Email: lead.information?.email ?? "",
      Company: lead.information?.company ?? "",
      Address: lead.information?.address ?? "",
      JobTitle: lead.information?.jobTitle ?? "",
      Status: lead.status.name,
      AssignedTo: lead.assignedTo?.name ?? "Unassigned",
      CreatedBy: lead.createdBy?.name ?? "",
      LeadSource: lead.sourceChannel ?? "",
      notes: lead.notes ?? "",
      createdAt: lead.createdAt.toLocaleDateString(),
    }));

    const csv = parser.parse(exportData);
    const fileName = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error("Export Lead Error:", err);

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
