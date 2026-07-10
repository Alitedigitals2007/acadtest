# AcadTest User Manual

**Smart Online Examination Platform**  
*Create. Deliver. Monitor. Score.*  

Contact: alitedigitals430@gmail.com | 09154681851

---

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [User Roles & Access](#user-roles--access)
3. [Organization Admin Guide](#organization-admin-guide)
4. [Student Guide](#student-guide)
5. [Participant Guide](#participant-guide)
6. [Features Deep Dive](#features-deep-dive)
7. [Security & Integrity](#security--integrity)
8. [Pricing & Add-Ons](#pricing--add-ons)
9. [Troubleshooting & Support](#troubleshooting--support)

---

## Platform Overview

**AcadTest** is an all-in-one Computer-Based Testing (CBT) platform that helps organizations create, deliver, monitor, and score exams securely online. Runs in any browser — no installation required.

### Key Capabilities
- **Create exams in minutes** — intuitive test builder with multiple question types
- **Deliver tests securely online** — browser-based, device-agnostic
- **Auto-score results instantly** — automatic marking with immediate feedback
- **Monitor candidates live** — real-time submission tracking
- **Manage thousands of students** — bulk import via CSV, Excel, JSON
- **Works offline-friendly** — auto-save every 10s, crash recovery

---

## User Roles & Access

| Role | Access Level | Login Portal |
|------|-------------|--------------|
| **Organization Admin** | Full org management: students, tests, results, payments | `/org-admin` |
| **Student** | Assigned tests, results, profile | `/student` |
| **Participant** | Public test access via code (no account needed) | `/join/[code]` or `/participant/login` |

> **Note**: Super Admin (platform owner) manages organizations, billing, and platform settings — not covered in this manual.

---

## Organization Admin Guide

### Getting Started
1. **Login** at `/auth/login` with your org admin credentials
2. **Dashboard** shows overview: students count, tests, recent activity
3. **Organization Code** — share this with students for registration

### Managing Students
**Location**: `/org-admin/students`

#### Add Single Student
1. Click **"Add Student"**
2. Fill required fields:
   - Full Name
   - Department
   - Level (e.g., 200, 300)
   - Email (unique within org)
   - Username (unique within org)
   - Password
3. Click **"Add Student"** — credentials auto-generated

#### Bulk Import Students
1. Click **"CSV Template"** to download template
2. Fill CSV with columns: `fullname,department,level,email,username`
3. Click **"Import Students"** and upload CSV/Excel/JSON
4. System validates and creates accounts in bulk

#### Student Management
- View all students in sortable table
- Search by name, department, level, email
- Track submission counts per student

### Creating Tests
**Location**: `/org-admin/tests/create`

#### Test Settings
| Setting | Description |
|---------|-------------|
| **Title** | Test name |
| **Description** | Instructions for students |
| **Duration** | Minutes (auto-submits when time expires) |
| **Questions Count** | Number of questions to pull |
| **Start / End Date** | Availability window |
| **Shuffle Questions** | Randomize question order |
| **Shuffle Options** | Randomize answer options |
| **Auto-Mark** | Instant scoring (MCQ) |
| **Show Leaderboard** | Display rankings after test |
| **Enable Calculator** | Basic + scientific calculator |
| **Immediate Results** | Show score instantly on submit |

#### Adding Questions
1. Click **"Add Question"**
2. Select type: Multiple Choice (default)
3. Enter question text (supports **LaTeX** for math/science)
4. Add options (mark correct answer)
5. Set order index
6. Save — repeat for all questions

#### Test Actions
- **Save as Draft** — edit later
- **Publish** — make available to students
- **Copy Public Code** — share for public access

### Managing Tests
**Location**: `/org-admin/tests`

- Filter by status: Draft / Published / Ended
- View: title, dates, duration, question count, status
- Actions: Edit, View Details, Delete (drafts only)

### Viewing Results
**Location**: `/org-admin/results`

- Select test from dropdown
- View: Student name, score, percentage, submission time
- Leaderboard enabled tests show rankings
- Export results to CSV

### Payments & Subscription
**Location**: `/org-admin/payment`

- View current plan and usage
- Purchase add-ons:
  - **Additional Tests**: +5 (₦5,000), +10 (₦9,000), +25 (₦20,000)
  - **Additional Students**: +100 (₦3,000), +500 (₦10,000), +1,000 (₦18,000)
- Payment via **Paystack** (Card, Bank Transfer, USSD)
- Auto-updates limits on successful payment

---

## Student Guide

### First Login
1. Receive credentials from your org admin (email + username + password)
2. Go to `/auth/login`
3. Login with **email** and **password**
4. Redirected to **Student Dashboard** (`/student`)

### Dashboard Overview
- **Upcoming Tests** — tests not yet started
- **Active Tests** — currently available
- **Completed Tests** — with scores
- Quick stats: total tests, average score

### Taking a Test
**Location**: `/student/tests` → Click test → `/student/tests/[id]`

#### Before Starting
- Read instructions carefully
- Check duration and question count
- Ensure stable internet connection

#### During Test
- **Timer** — counts down; auto-submits at 0:00
- **Navigation** — Previous/Next or question palette
- **Auto-save** — answers saved every 10 seconds
- **Calculator** — click icon (if enabled by admin)
- **LaTeX Rendering** — math formulas display correctly
- **Fullscreen Enforced** — leaving tab/window triggers warning

#### Security Rules (Strict)
| Violation | Consequence |
|-----------|-------------|
| Exit fullscreen | Warning (3 strikes = auto-submit) |
| Switch tabs/apps | Warning (3 strikes = auto-submit) |
| Browser crash / close | **Crash Recovery** — reopen, answers + time restored |
| Network loss | Answers saved locally; sync on reconnect |

#### Submitting
- Click **"Submit Test"** when done
- Confirm submission
- If **Immediate Results** enabled: see score instantly
- Otherwise: results released by admin

### Viewing Results
**Location**: `/student/results`

- Filter by test
- View: score, percentage, rank (if leaderboard), submission time
- Review answers (if enabled by admin)

---

## Participant Guide

### Public Test Access (No Account)
1. Receive **test code** from organizer (e.g., `ABC123`)
2. Go to `/join/ABC123` or `/participant/login`
3. Enter code → click **Join Test**
4. Fill details: Full Name, Department, Level, Email
5. Start test immediately

### During Test
- Same interface as students
- Same security rules (fullscreen, tab-switch detection, auto-save)
- Crash recovery works identically

### After Submission
- See score immediately (if enabled)
- Results accessible via same code + email
- No login needed for future access

---

## Features Deep Dive

### LaTeX Math Support
Write formulas using standard LaTeX:
```
Inline: $E = mc^2$
Block: $$ \int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi} $$
```
Renders beautifully in questions and options.

### Built-in Calculator
- **Basic**: + − × ÷ % √ x²
- **Scientific**: sin, cos, tan, log, ln, π, e, ^, !
- Toggle between modes
- Available only when admin enables for test

### Bulk Import Formats
| Format | Columns Required |
|--------|------------------|
| CSV | fullname,department,level,email,username |
| Excel (.xlsx) | Same as CSV |
| JSON | Array of objects with same fields |

Template download available in Students page.

### Question Types (Current)
- **Multiple Choice** — single correct answer
- Future: True/False, Multiple Response, Fill-in-blank, Essay

### Live Monitoring (Admin)
- Real-time submission feed
- See who's in progress, submitted, not started
- Filter by test, status, time

### Crash Recovery
- **Auto-save** every 10 seconds to browser storage
- On reload: "Restore Session" prompt appears
- Restores: answers, current question, **remaining time**
- Works across browser crashes, power loss, accidental close

---

## Security & Integrity

### Exam Integrity Features
| Feature | Description |
|---------|-------------|
| **Fullscreen Enforcement** | Test runs in fullscreen; exit = violation |
| **Tab-Switch Detection** | 3 strikes = auto-submit with current answers |
| **Countdown Timer** | Server-synced; cannot be manipulated |
| **Auto-Submit** | Forces submit at time expiry |
| **Data Isolation** | Org data completely separated (multi-tenant) |
| **JWT + Bcrypt** | Secure auth; passwords never stored plain |

### Participant Verification
- Students: pre-registered by admin (email + username unique per org)
- Participants: verified by email + code at test start
- No impersonation possible

---

## Pricing & Add-Ons

### Base Plans (via Paystack)
Payments in **Nigerian Naira (₦)** via Card, Bank Transfer, USSD.

### Add-Ons (Scale Without Upgrading Plan)
| Add-On | Price (₦) |
|--------|-----------|
| **+5 Tests** | 5,000 |
| **+10 Tests** | 9,000 |
| **+25 Tests** | 20,000 |
| **+100 Students** | 3,000 |
| **+500 Students** | 10,000 |
| **+1,000 Students** | 18,000 |

> Purchase anytime from `/org-admin/payment` — limits update instantly on payment confirmation.

---

## Troubleshooting & Support

### Common Issues

| Issue | Solution |
|-------|----------|
| **Can't login** | Check email/password; contact admin for reset |
| **Test not visible** | Confirm test is published and within date window |
| **Timer wrong** | Refresh page — syncs with server |
| **Answers lost** | Reopen test — auto-restore should appear |
| **Calculator missing** | Admin must enable per test |
| **LaTeX not rendering** | Check syntax: use `$...$` or `$$...$$` |
| **Payment not reflecting** | Wait 2-3 mins; refresh; contact support with reference |

### Browser Requirements
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- JavaScript **required**
- Cookies & LocalStorage **required** (for auto-save/recovery)
- Pop-ups allowed for payment redirect

### Support
- **Email**: alitedigitals430@gmail.com
- **Phone**: 09154681851
- Include: Organization name, user email, test code (if applicable), screenshot of error

---

## Quick Reference: Keyboard Shortcuts (Test Mode)

| Key | Action |
|-----|--------|
| `Alt + N` | Next question |
| `Alt + P` | Previous question |
| `Alt + S` | Submit test (with confirmation) |
| `Alt + C` | Toggle calculator |
| `1-9, 0` | Jump to question (in palette) |

---

## Appendix: Pitch Deck Summary

**AcadTest — The Smarter Way To Test**

### The Problem
Traditional exams suffer from: manual marking delays, cheating/impersonation, lost answers from interruptions, difficulty managing large candidate management, heavy admin workload.

### The Solution
All-in-one CBT platform: create in minutes, deliver securely, auto-score instantly, monitor live, manage thousands easily.

### Core Features
- Multi-tenant (isolated orgs)
- Auto-marking
- Bulk import (CSV/Excel/JSON)
- Built-in calculator (basic + scientific)
- LaTeX support (math/science)
- Public tests (code-based, no signup)
- Live monitoring
- Fullscreen enforcement + tab-switch detection (3-strike auto-submit)
- Crash recovery (auto-save 10s + time restore)
- Any device, browser-only, no install
- Paystack payments (₦)

### Target Markets
- Schools & Universities (exams, CBT, entrance)
- Training Centres (certifications, skills)
- HR / Corporate (recruitment, evaluations)
- NGOs & Government (large-scale screenings)

### Pricing
Affordable Naira plans + pay-as-you-grow add-ons. Card, transfer, USSD via Paystack.

### Contact
**alitedigitals430@gmail.com** | **09154681851**

---

*Last updated: July 2026 | AcadTest v1.0*