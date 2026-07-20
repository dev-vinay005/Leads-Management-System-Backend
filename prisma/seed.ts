import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // -----------------------------
  // Seed Roles
  // // -----------------------------
  // const roles = ["ADMIN", "USER"];

  // for (const name of roles) {
  //   await prisma.role.upsert({
  //     where: { name },
  //     update: {},
  //     create: { name },
  //   });
  // }

  // -----------------------------
  // Seed Lead Statuses
  // -----------------------------
  const statuses = ["New", "High", "Urgent", "Follow-up", "Next Week"];

  for (const name of statuses) {
    await prisma.leadStatus.upsert({
      where: {
        organizationId_name: {
          organizationId: "6a51d4b80f5d2ace6f70af1c",
          name,
        },
      },
      update: {},
      create: { name, organizationId: "6a51d4b80f5d2ace6f70af1c" },
    });
  }

  // // -----------------------------
  // // Fetch Roles
  // // -----------------------------
  // const adminRole = await prisma.role.findUnique({
  //   where: { name: "ADMIN" },
  // });

  // const userRole = await prisma.role.findUnique({
  //   where: { name: "USER" },
  // });

  // if (!adminRole || !userRole) {
  //   throw new Error("Roles not found.");
  // }

  // // -----------------------------
  // // Create Organization
  // // -----------------------------
  // let organization = await prisma.organization.findUnique({
  //   where: {
  //     name: "Aura Dialer",
  //   },
  // });

  // if (!organization) {
  //   organization = await prisma.organization.create({
  //     data: {
  //       name: "Aura Dialer",
  //     },
  //   });
  // }

  // // -----------------------------
  // // Create Companies
  // // -----------------------------
  // const companyNames = ["Sales", "Support", "Marketing", "Operations"];

  // const companies = [];

  // for (const name of companyNames) {
  //   let company = await prisma.company.findFirst({
  //     where: {
  //       name,
  //       organizationId: organization.id,
  //     },
  //   });

  //   if (!company) {
  //     company = await prisma.company.create({
  //       data: {
  //         name,
  //         organizationId: organization.id,
  //       },
  //     });
  //   }

  //   companies.push(company);
  // }

  // // -----------------------------
  // // Password
  // // -----------------------------
  // const password = await bcrypt.hash("Password@123", 10);

  // // -----------------------------
  // // Create Admin User
  // // -----------------------------
  // let admin = await prisma.user.findUnique({
  //   where: {
  //     email: "admin@auradialer.com",
  //   },
  // });

  // if (!admin) {
  //   admin = await prisma.user.create({
  //     data: {
  //       name: "System Admin",
  //       email: "admin@auradialer.com",
  //       password,
  //       roleId: adminRole.id,
  //       organizationId: organization.id,
  //       companyId: companies[0].id,
  //     },
  //   });

  //   await prisma.organization.update({
  //     where: {
  //       id: organization.id,
  //     },
  //     data: {
  //       createdById: admin.id,
  //     },
  //   });

  //   for (const company of companies) {
  //     await prisma.company.update({
  //       where: {
  //         id: company.id,
  //       },
  //       data: {
  //         createdById: admin.id,
  //       },
  //     });
  //   }
  // }

  // // -----------------------------
  // // Create 4 Users
  // // -----------------------------
  // for (let i = 1; i <= 4; i++) {
  //   const email = `user${i}@auradialer.com`;

  //   const existing = await prisma.user.findUnique({
  //     where: {
  //       email,
  //     },
  //   });

  //   if (existing) continue;

  //   await prisma.user.create({
  //     data: {
  //       name: `User ${i}`,
  //       email,
  //       password,
  //       roleId: userRole.id,
  //       organizationId: organization.id,
  //       companyId: companies[(i - 1) % companies.length].id,
  //     },
  //   });
  // }

  console.log("✅ Database seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
