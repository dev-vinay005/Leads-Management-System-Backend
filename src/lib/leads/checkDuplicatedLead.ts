import { prisma } from "@/lib/prisma";

interface CheckDuplicateLeadParams {
  organizationId: string;
  phone: string;
  email?: string;
}

export async function checkDuplicateLead({
  organizationId,
  phone,
  email,
}: CheckDuplicateLeadParams) {
  const duplicateConditions = [{ phone }];

  if (email) {
    duplicateConditions.push({ email });
  }

  const existingLead = await prisma.leadInformation.findFirst({
    where: {
      lead: {
        organizationId,
      },
      OR: duplicateConditions,
    },
    select: {
      id: true,
      phone: true,
      email: true,
      leadId: true,
    },
  });

  if (!existingLead) {
    return null;
  }

  return {
    lead: existingLead,
    duplicateBy: existingLead.phone === phone ? "phone" : "email",
  };
}
