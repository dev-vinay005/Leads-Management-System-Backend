import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient();

async function main() {
    const roles = ["ADMIN", "USER"]
    for (const name of roles) {
        await prisma.role.upsert({
            where: { name },
            update: {},
            create: { name },
        })
    }

    const statuses = ["New", "High", "Urgent", "Follow-up", "Next Week"]
    for (const name of statuses) {
        await prisma.leadStatus.upsert({
            where: { name },
            update: {},
            create: { name },
        })
    }

    console.log("Seeded successfully")
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
