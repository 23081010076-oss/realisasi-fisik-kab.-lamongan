import prisma from "../services/prisma.js";
const opds = await prisma.opd.findMany({
  select: { name: true, code: true },
  orderBy: { name: "asc" },
});
opds.forEach((o) => console.log(o.code.padEnd(20), "|", o.name));
console.log("\nTotal:", opds.length);
await prisma.$disconnect();
