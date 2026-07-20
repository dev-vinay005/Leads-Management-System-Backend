import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";
import { parseCSV } from "@/utils/csv";
import { validateCsvRows } from "@/validation/validateCsvRows";
import { findDuplicateImportLeads } from "@/lib/leads/findDuplicateImportLeads";
import { createBuildLeads } from "@/lib/leads/createBulkLeads";

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
    if (!user.organizationId || !user.companyId) {
      return NextResponse.json(
        {
          success: false,
          error: "User is not assigned to an organization or company",
        },
        { status: 403 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: "CSV file is required",
        },
        {
          status: 400,
        },
      );
    }
    // Validate file type
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        {
          success: false,
          error: "Only CSV files are allowed",
        },
        {
          status: 400,
        },
      );
    }

    // here we are going to Parse a CSV file
    const rows = await parseCSV(file as File);
    const statuses = await prisma.leadStatus.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    const statusMap = new Map(
      statuses.map((status) => [status.name.toLocaleLowerCase(), status.id]),
    );

    // validate CSV Row and get valid and invalid rows
    const { validRows, invalidRows } = validateCsvRows({ rows, statusMap });

    // finding the duplicate values
    const { uniqueRows, duplicateRows } = await findDuplicateImportLeads({
      organizationId: user.organizationId,
      validRows,
    });
    // Create Bulk Leads by importing them
    await createBuildLeads({
      organizationId: user.organizationId,
      companyId: user.companyId,
      userId: user.id,
      leads: uniqueRows,
    });

    return NextResponse.json(
      {
        success: true,
        summary: {
          totalRows: rows.length,
          imported: uniqueRows.length,
          duplicates: duplicateRows.length,
          invalid: invalidRows.length,
        },
        duplicateRows,
        invalidRows,
      },
      {
        status: 201,
      },
    );
  } catch (err) {
    console.log("Error while import CSV file", err);
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
