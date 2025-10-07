import { PrismaClient } from "~/app/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Create a test project
  const project = await prisma.project.upsert({
    where: { apiKey: "proj_test_12345" },
    update: {},
    create: {
      apiKey: "proj_test_12345",
      name: "Test Project",
      domain: "localhost:3000",
    },
  });

  console.log("✅ Created test project:", project);

  // // Create a test visitor
  // const visitor = await prisma.visitor.upsert({
  //   where: { visitorId: 'vis_test_abc123' },
  //   update: {},
  //   create: {
  //     visitorId: 'vis_test_abc123',
  //     fingerprint: 'fp_test123',
  //     projectId: project.id,
  //     initialReferrer: 'direct',
  //   },
  // });

  // console.log('✅ Created test visitor:', visitor);

  // // Create some test events
  // const events = await prisma.event.createMany({
  //   data: [
  //     {
  //       projectId: project.id,
  //       visitorId: visitor.id,
  //       eventType: 'script_init',
  //       eventName: 'script_init',
  //       sessionId: 'sess_test_1',
  //       pageUrl: 'http://localhost:3000',
  //       pageTitle: 'Test Page',
  //       properties: {
  //         snippet_version: '1.0.0',
  //         screen_resolution: '1920x1080',
  //       },
  //     },
  //     {
  //       projectId: project.id,
  //       visitorId: visitor.id,
  //       eventType: 'page_view',
  //       eventName: 'page_view',
  //       sessionId: 'sess_test_1',
  //       pageUrl: 'http://localhost:3000/pricing',
  //       pageTitle: 'Pricing',
  //       properties: {
  //         path: '/pricing',
  //       },
  //     },
  //     {
  //       projectId: project.id,
  //       visitorId: visitor.id,
  //       eventType: 'click',
  //       eventName: 'click',
  //       sessionId: 'sess_test_1',
  //       pageUrl: 'http://localhost:3000/pricing',
  //       properties: {
  //         element_id: 'cta-button',
  //         element_tag: 'button',
  //         element_text: 'Get Started',
  //       },
  //     },
  //   ],
  // });

  // console.log('✅ Created test events:', events.count);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
