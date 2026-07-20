import { createLeadSchema } from "@/validation/leads.validation";

export interface CsvLeadRow {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  company?: string;
  address?: string;
  status: string;
  notes?: string;
}

interface ValidationError {
  row: number;
  errors: Record<string, string[] | undefined>;
}

interface ValidLead {
  leadInfo: {
    firstName: string;
    lastName?: string;
    phone: string;
    email?: string;
    company?: string;
    address?: string;
  };
  statusId: string;
  notes?: string;
}

interface ValidateCsvRowsParams {
  rows: CsvLeadRow[];
  statusMap: Map<string, string>;
}

export function validateCsvRows({ rows, statusMap }: ValidateCsvRowsParams) {
  const validRows: ValidLead[] = [];
  const invalidRows: ValidationError[] = [];

  rows.forEach((row, index) => {
    const statusId = statusMap.get(row.status?.trim().toLowerCase() ?? "");

    if (!statusId) {
      invalidRows.push({
        row: index + 2, // +2 because CSV header is row 1
        errors: {
          status: ["Invalid lead status"],
        },
      });
      return;
    }

    const leadData = {
      leadInfo: {
        firstName: row.firstName?.trim(),
        lastName: row.lastName?.trim() || undefined,
        phone: row.phone?.trim(),
        email: row.email?.trim() || undefined,
        company: row.company?.trim() || undefined,
      },
      statusId,
      notes: row.notes?.trim() || undefined,
    };

    const result = createLeadSchema.safeParse(leadData);

    if (!result.success) {
      invalidRows.push({
        row: index + 2,
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    validRows.push(result.data);
  });

  return {
    validRows,
    invalidRows,
  };
}
