import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getAuthenticatedUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      roleId: true,
      organizationId: true,
      companyId: true,
      role: true,
    },
  });

  return user;
}
