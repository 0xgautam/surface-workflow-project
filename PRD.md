# Take Home Assignment

<aside>
💡

**Thanks for interviewing with Surface Labs!**

This document contains instructions for your full-stack take-home assessment which will test:
**(1)** your ability to translate Figma mocks into working React + Typescript code

**(2)** you ability to work with PostgreSQL, serverless functions, and scripts

**Scoring Criteria:**

- Code quality
- Operates as expected

- Backend design decisions
- Closeness of code to Figma mocks

</aside>

## Task

You will implement the frontend and backend for a portion of the Surface Labs onboarding steps that will prompt the user to add the Surface Tag to their website in order for us to start tracking incoming events.

This will be similar to [Segment.com](http://Segment.com) website JavaScript snippet instructions (feel free to make a free account on [app.segment.com](http://app.segment.com) to play around with it).

There are three parts to this assignment. Try to complete as much of this assignment as you can within 1-3 days.

### **Part 1: Turn a Figma Mock into working React + Typescript Code**

- Details
  View the Figma file and clickable Prototype links below or download the `.fig` file to import into Figma (you may need to manually import the `.fig` file to see all of the exact component styles)
  [Take_Home_Figma.fig](https://prod-files-secure.s3.us-west-2.amazonaws.com/e53017c5-201c-4d75-8d76-3110e1d5c3a9/f717ba70-16df-43bf-9dd0-00073c2d092a/Take_Home_Figma.fig)
  https://www.figma.com/design/9MrZcpvuZ8YfB7ERz12EXo/Take-Home-Figma-Mocks?node-id=0-1&t=QF0wjVZorKMPPmyR-1
  https://www.figma.com/proto/9MrZcpvuZ8YfB7ERz12EXo/Take-Home-Figma-Mocks?page-id=0%3A1&node-id=10-977&node-type=frame&t=O1AoWC6yY84fUMMb-0&scaling=min-zoom&content-scaling=fixed&starting-point-node-id=10%3A977
  - **Expectations:**
    - We mostly care about the main onboarding flow being implemented as closely as possible to the Figma mocks — you can ignore the Sidebar for simplicity.
    - Use NextJS App Router
  - **_Bonus points:_**
    - Implement the sidebar view — there are some free icons that you can find at https://heroicons.com/
    - Make the table in the Event Testing view update in real-time as new events come in
    - Add syntax highlighting to the code snippet preview
    - Make the onboarding step rows collapsable/ expandable when they are clicked on
    - Ensure responsive design

### Part 2: Implement `surface_analytics.js` script

- Details
  Now you will implement surface*analytics.js. This will be js script that user’s will embed on their websites.
  This will be a lightweight analytics script similar to what is used by popular event analytics tools like Segment and Amplitude. The script needs to track the following on-page events (at the very least) and emit them to a backend endpoint(s). Feel free to reference existing analytics scripts that are referenced at the bottom of this section for inspiration.
  \_Events to Track:*
  - Track script initialization — this one will be used to detect if the script is present on a page during the first onboarding step
  - Track page view
  - Track email entered
  - Track click on page element
    When emitting the events to the backend, include the following metadata:
  - Details relevant to event (e.g. element ID)
  - Visitor ID
    - _Note: You will need to determine how to uniquely identify the page visitor so that multiple events sent by the same user can be grouped together later on._

**Expectations:**

- Track all of the above events
- Implement tracking in a serverless manner using NextJS
- Setup a local `index.html` using the following file with the tag embedded in the `<head/>` . You can use the following file to get started.
  [index.html](https://prod-files-secure.s3.us-west-2.amazonaws.com/e53017c5-201c-4d75-8d76-3110e1d5c3a9/7516c383-3553-4fd6-8168-5c3caa7728b9/index.html)

**Resources:**

1. https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/
2. https://www.npmjs.com/package/analytics
3. https://segment.com/docs/connections/spec/

### Part 3: Implement backend support for capturing events

- Details
  You will implement the backend functionality required for tracking incoming events from the Surface Tag on the page and for displaying the events on the page in the second step of the frontend onboarding flow.
  Design the backend system in a way that its easy to add more events. The more extensible the backend design is, the better
  **Expectations:**
  - Use NextJS App Router
  - Implement the backend routes as serverless functions using NextJS
  - Create a PostgreSQL database and table and use Prisma ORM to insert incoming events into the table

---

## Getting Started

### Tech Stack

_Use the following technologies as part of your implementation._

- Tech Stack
  - Typescript
  - NextJS App Router
    - For Front End
    - Serverless Backend
  - Vercel (hosting)
  - Tailwind CSS
  - PostgresSQL backend
  - Prisma

### Boilerplate

Here’s a set of commands to run to easily setup a NextJS + Typescript app boilerplate with support for Prisma ORM and PostgreSQL.

```bash
## Run this and answer the questions with the info in the comments
pnpm create t3-app@latest

##### Answer the prompts with this info #####
*## Call the project surface-work*flow-project
## Choose typescript
## Say yes to choosing tailwind CSS
## Say no to TRPC
## Say None for authentication
## Choose Prisma for the ORM
## Say yes for the APP router
## Choose PostgresSQL for the database provider
## Say yes for initializing a git repo
## Say yes to running pnpm install
## No import alias

cd surface-workflow-project

# If you're running into issues running start-database.sh open the script for additional instructions for running it on windows
./start-database.sh
## Say yes for the random password

pnpm db:push
pnpm dev
git commit -m "initial commit"
```

## Deliverable

Create a git repo with your work.

We should be able to clone the repo, start the database locally, push the Prisma schema into the database.

If the project needs environment variables to run, please just check in your `.env` file.
