import { prisma } from "@/lib/prisma";
import { CreateLeadInput } from "@/validation/leads.validation";

interface ImportLeadsParams {
  organizationId: string;
  companyId: string;
  userId: string;
  leads: CreateLeadInput[];
}

export async function createBuildLeads({
  organizationId,
  companyId,
  userId,
  leads,
}: ImportLeadsParams) {
  if (leads.length === 0) {
    return [];
  }

  const operations = leads.map((lead) => {
    return prisma.lead.create({
      data: {
        organizationId: organizationId,
        companyId: companyId,
        statusId: lead.statusId,
        sourceChannel: "CSV IMPORT",
        notes: lead.notes,
        createdById: userId,
        assignedToId: userId,
        information: {
          create: {
            firstName: lead.leadInfo.firstName,
            lastName: lead.leadInfo.lastName,
            phone: lead.leadInfo.phone,
            email: lead.leadInfo.email,
            address: lead.leadInfo.address,
            company: lead.leadInfo.company,
          },
        },
      },
    });
  });
  return prisma.$transaction(operations);
}
