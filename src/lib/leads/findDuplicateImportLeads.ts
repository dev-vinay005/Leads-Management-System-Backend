import { prisma } from "@/lib/prisma";
import { CreateLeadInput } from "@/validation/leads.validation";

interface DuplicateLead {
  row: number;
  reason: string;
  data: CreateLeadInput;
}

interface DuplicateCheckResult {
  uniqueRows: CreateLeadInput[];
  duplicateRows: DuplicateLead[];
}

interface FindDuplicateImportLeadsParams {
  organizationId: string;
  validRows: CreateLeadInput[];
}

export async function findDuplicateImportLeads({
  organizationId,
  validRows,
}: FindDuplicateImportLeadsParams): Promise<DuplicateCheckResult> {
  // Extract phones & emails from CSV
  const phones = validRows.map((row) => row.leadInfo.phone);

  const emails = validRows
    .map((row) => row.leadInfo.email)
    .filter((email): email is string => Boolean(email));

  // Fetch all existing leads in one query
  const existingLeads = await prisma.leadInformation.findMany({
    where: {
      lead: {
        organizationId,
      },
      OR: [
        {
          phone: {
            in: phones,
          },
        },
        {
          email: {
            in: emails,
          },
        },
      ],
    },
    select: {
      phone: true,
      email: true,
    },
  });

  // Create Sets for Existing Phone number and Email
  const existingPhones = new Set(existingLeads.map((lead) => lead.phone));

  const existingEmails = new Set(
    existingLeads
      .map((lead) => lead.email)
      .filter((email): email is string => Boolean(email)),
  );

  const uniqueRows: CreateLeadInput[] = [];
  const duplicateRows: DuplicateLead[] = [];

  for (let index = 0; index < validRows.length; index++) {
    const row = validRows[index];

    const phoneExists = existingPhones.has(row.leadInfo.phone);

    const emailExists =
      row.leadInfo.email && existingEmails.has(row.leadInfo.email);

    if (phoneExists || emailExists) {
      duplicateRows.push({
        row: index + 2,
        reason: phoneExists ? "Phone already exists" : "Email already exists",
        data: row,
      });

      continue;
    }

    uniqueRows.push(row);
  }

  return {
    uniqueRows,
    duplicateRows,
  };
}
