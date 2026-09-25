# Hack the Den

Hackathon platform for the Basha DevOps Club. It handles in-person check-in, teams, submissions, judging, a live projector screen with a winner reveal, per-team AI budgets, and a mentor help queue.

**Stack:** Next.js 16 · Clerk · DynamoDB + S3 (AWS) · OpenRouter · shadcn/ui (Base UI) · SWR polling · Vitest

## How it works

| Role | Home | What they do |
|---|---|---|
| Participant | `/dashboard` | Join with name + room code (no account) → form a team (1–4 people) → submit → claim the team's AI key → ask mentors for help |
| Mentor | `/mentor` | Claim and resolve help requests |
| Judge | `/judge` | Score every submitted project against the rubric (autosaves) |
| Officer | `/admin` | Everything: event settings, people and roles, rubric, leaderboard, results reveal, announcements, schedule, AI keys |
| Projector | `/screen/<token>` | Countdown, room code, schedule, announcements (a new one takes over the screen for two minutes), live stats, winner reveal |

- **Participants don't make accounts.** They open `/join`, type their name and the room code shown on the projector, and they're in. A secure cookie keeps them signed in on that device; a personal **rejoin code** on their dashboard gets them back in on another device (officers can look it up or reset it in **Admin → People**). Luma handles RSVPs separately and has no integration with the app.
- **Staff sign in with Clerk.** Officers, judges and mentors use real accounts (`/sign-in`) because they change roles, see scores and release results. New Clerk accounts start as participants; officers promote them in **Admin → People**. Emails listed in `SUPER_ADMIN_EMAILS` are always officers.
- **AI budget.** Each team gets its own OpenRouter key with a hard spending limit ($5 by default, editable in **Admin → Event**). OpenRouter enforces the limit, so a team can't overspend.
- **Scoring.**
  - Team score = the mean, across judges, of each judge's weighted rubric score.
  - Ties are broken by per-criterion means (heaviest criterion first), then by number of judges, then by who submitted first.
  - Officers can override the order before locking results.
  - Officers pick prize-category winners when they lock results.

## Try it locally (demo mode)

```bash
npm install
npm run demo
```

Open <http://localhost:3000/demo>. The demo stores its data in `.demo/` on your machine and uses fake photo storage and fake AI keys, so it doesn't need AWS, Clerk or OpenRouter. You can pick any sample person (officer, judge, mentor or participant) and switch between them. Use **Reset all demo data** to start over.

Picking who you are is only for demos. Demo mode is off unless you start it with `npm run demo`, and it can never switch on in production. `npm run dev` and every deployment use real Clerk sign-in.

## Setup

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Clerk (staff only)
Create an application at [clerk.com](https://clerk.com) and copy both keys into `.env.local`. Only officers, judges and mentors sign in with Clerk; participants join with the room code. No other Clerk configuration is needed, because roles are stored in DynamoDB.

Production uses a Clerk **production instance** on `hacktheden.vercel.app`. Since a `*.vercel.app` domain can't carry DNS records, the Frontend API is proxied through the app at `/__clerk` (`app/__clerk/[[...path]]/route.ts`): Vercel has the `pk_live`/`sk_live` keys plus `NEXT_PUBLIC_CLERK_PROXY_URL=https://hacktheden.vercel.app/__clerk`, and the same proxy URL is set in Clerk Dashboard → Domains. Local development keeps the dev-instance test keys.

### 3. AWS
The app needs one DynamoDB table and one private S3 bucket. The examples use region `us-east-1`, which matches Vercel's default `iad1`. (The live site uses the club sandbox account: table `launchpad`, bucket `launchpad-basha-photos-941377149556`, IAM user `launchpad-app` — these AWS resource names predate the rename and are fine to keep.)

```bash
aws dynamodb create-table --table-name launchpad \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST --region us-east-1

aws dynamodb update-continuous-backups --table-name launchpad \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true --region us-east-1

aws s3api create-bucket --bucket launchpad-photos --region us-east-1
aws s3api put-public-access-block --bucket launchpad-photos \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

The browser uploads photos directly to S3, so the bucket needs a CORS rule. Save the following as `cors.json`, then run `aws s3api put-bucket-cors --bucket launchpad-photos --cors-configuration file://cors.json`:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000", "https://hacktheden.vercel.app", "https://bashahacks.vercel.app"],
      "AllowedMethods": ["PUT", "GET"],
      "AllowedHeaders": ["Content-Type"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

Next, create an IAM user (for example `launchpad-app`) and attach the inline policy below. Replace `ACCOUNT_ID` with your AWS account ID. Then create access keys for this user and put them in `APP_AWS_ACCESS_KEY_ID` and `APP_AWS_SECRET_ACCESS_KEY`.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem", "dynamodb:Query", "dynamodb:ConditionCheckItem"],
      "Resource": "arn:aws:dynamodb:us-east-1:ACCOUNT_ID:table/launchpad"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::launchpad-photos/events/*"
    }
  ]
}
```

The app creates its event record on first load, so there is nothing to seed.

### 4. OpenRouter
1. Add credits to the account. Plan for budget × number of teams plus some buffer, for example about $100 for 20 teams at $5 each.
2. Create a **provisioning key** under Settings → Provisioning API Keys and set it as `OPENROUTER_PROVISIONING_KEY`.
3. *(Recommended)* Restrict teams to cheap models at the account level: Settings → Privacy / Guardrails, allowed models. The keys API can't restrict models per key, but each key's spend cap still applies. The app recommends the models listed in `lib/constants.ts`.

### 5. Vercel
The production site is **https://hacktheden.vercel.app** (also reachable at https://bashahacks.vercel.app and https://basha-hacks.vercel.app). It's Vercel project `hacktheden`, connected to this GitHub repo — every push to `main` deploys. `bh.vercel.app` itself is owned by another Vercel account, so it can't be used. Environment variables live in the project settings; add every variable from `.env.example`. Set the function region to `iad1`.

Displayed times are pinned to `America/Phoenix` (`EVENT_TZ` in `lib/format.ts`), so server-rendered times match the venue. Officers should enter times in **Admin** from a browser set to venue time.

## Scripts

```bash
npm run typecheck
npm run lint
npm run test
```

## Event-day runbook

**The week before**
- [ ] Set the event name, start time, submission deadline, end time and Luma URL in **Admin → Event**.
- [ ] Add the schedule, the rubric and the prize categories.
- [ ] Promote judges and mentors in **Admin → People**. They need to sign up first.
- [ ] Recheck the model slugs and prices in `lib/constants.ts`, and top up OpenRouter credits.
- [ ] Do a rehearsal with `EVENT_ID=rehearsal` and a few club members, then switch `EVENT_ID` back.

**Doors open**
- [ ] On the projector laptop, open **Admin → Overview**, copy the screen link, open it and go fullscreen. Don't sign that laptop in as an officer.
- [ ] Participants open the site, join with their name + the room code, form teams and claim their AI key. No sign-up.
- [ ] If the room code leaks outside the room, **regenerate** it. People already checked in stay checked in.

**Submission deadline**
- [ ] Submissions and team changes lock automatically, and judging opens.
- [ ] Watch judge progress in **Admin → Judging**.

**Closing ceremony**
- [ ] In **Admin → Results**: lock the results, then press **Start** and **Next** to reveal the winners on the projector. Reaching the finale publishes the results to participants.
- [ ] In **Admin → Teams**, choose **Disable all AI keys**.

## Data model
Each event is one DynamoDB partition, `PK = EVENT#<EVENT_ID>`. The sort keys are:

- `META`
- `USER#<clerkId>`
- `TEAM#<id>`
- `JOIN#<code>`
- `SUB#<teamId>`
- `SCORE#<teamId>#<judgeId>`
- `ANN#…`
- `SCHED#…`
- `TICKET#…`

There are no indexes. Every read is either a single `GetItem` or a `begins_with` query within the event partition.
