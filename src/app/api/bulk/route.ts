import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { calculateAvailable } from "@/lib/utils";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string;
    const organizationId = formData.get("organizationId") as string;
    const testId = formData.get("testId") as string | null;

    if (!file || !type || !organizationId) {
      return NextResponse.json({ error: "file, type, and organizationId required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    let records: Record<string, string>[] = [];

    if (fileName.endsWith(".json")) {
      const text = buffer.toString("utf-8");
      const parsed = JSON.parse(text);
      records = Array.isArray(parsed) ? parsed : parsed.data || parsed.records || [];
    } else if (fileName.endsWith(".csv")) {
      const text = buffer.toString("utf-8");
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        return NextResponse.json({ error: "CSV must have header and data rows" }, { status: 400 });
      }
      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ""; });
        records.push(row);
      }
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      try {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (json.length < 2) {
          return NextResponse.json({ error: "Sheet must have header and data rows" }, { status: 400 });
        }
        const headers = (json[0] as string[]).map((h: string) => h.toString().toLowerCase().trim());
        for (let i = 1; i < json.length; i++) {
          const values = json[i] as string[];
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => { row[h] = String(values[idx] ?? ""); });
          records.push(row);
        }
      } catch {
        return NextResponse.json({ error: "Failed to parse XLSX file. Ensure xlsx library is installed." }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: "Unsupported file format. Use JSON, CSV, or XLSX." }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({ error: "No records found in file" }, { status: 400 });
    }

    if (type === "students") {
      const org = await prisma.organization.findUnique({ where: { id: organizationId } });
      if (!org) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
      }
      const available = calculateAvailable(org.studentLimit, org.studentsUsed, org.bonusStudents);
      if (available < records.length) {
        return NextResponse.json({ error: `Not enough student slots. Available: ${available}, Needed: ${records.length}` }, { status: 403 });
      }
      const hashed = await bcrypt.hash("password123", 10);
      let created = 0;
      const errors: string[] = [];
      for (const r of records) {
        const fullName = r["fullname"] || r["name"] || r["full_name"];
        const department = r["department"] || r["dept"];
        const level = r["level"];
        const email = r["email"];
        const username = r["username"] || email?.split("@")[0];
        if (!fullName || !department || !level || !email) {
          errors.push(`Missing fields for record: ${JSON.stringify(r)}`);
          continue;
        }
        try {
          await prisma.student.create({
            data: {
              fullName, department, level, email, username: username || fullName.replace(/\s/g, "").toLowerCase(),
              password: hashed, organizationId,
            },
          });
          created++;
        } catch (e) {
          errors.push(`Failed to create ${email}: ${String(e)}`);
        }
      }
      if (created > 0) {
        await prisma.organization.update({
          where: { id: organizationId },
          data: { studentsUsed: { increment: created } },
        });
      }
      return NextResponse.json({ message: `Created ${created} students`, created, errors });
    }

    if (type === "questions") {
      if (!testId) {
        return NextResponse.json({ error: "testId required for questions bulk upload" }, { status: 400 });
      }
      const test = await prisma.test.findUnique({ where: { id: testId } });
      if (!test) {
        return NextResponse.json({ error: "Test not found" }, { status: 404 });
      }
      let created = 0;
      const errors: string[] = [];
      let orderIndex = await prisma.question.count({ where: { testId } });
      for (const r of records) {
        const questionText = r["questiontext"] || r["question_text"] || r["question"] || r["text"];
        const correctAnswer = r["correctanswer"] || r["correct_answer"] || r["answer"] || r["correct"];
        if (!questionText || !correctAnswer) {
          errors.push(`Missing required fields: ${JSON.stringify(r)}`);
          continue;
        }
        const optionA = r["optiona"] || r["option_a"] || r["a"] || "";
        const optionB = r["optionb"] || r["option_b"] || r["b"] || "";
        const optionC = r["optionc"] || r["option_c"] || r["c"] || "";
        const optionD = r["optiond"] || r["option_d"] || r["d"] || "";
        const optionsRaw = r["options"] || "";
        let options: string[];
        if (optionsRaw) {
          try {
            const parsed = JSON.parse(optionsRaw);
            options = Array.isArray(parsed) ? parsed : [optionsRaw];
          } catch {
            options = optionsRaw.split("|").map((o: string) => o.trim()).filter(Boolean);
          }
        } else {
          options = [optionA, optionB, optionC, optionD].filter(Boolean);
        }
        if (options.length === 0) {
          errors.push(`No options found for question: ${questionText.substring(0, 50)}`);
          continue;
        }
        let mappedCorrect = correctAnswer;
        const letterMap: Record<string, string> = { A: optionA, B: optionB, C: optionC, D: optionD };
        if (letterMap[correctAnswer.toUpperCase()]) {
          mappedCorrect = letterMap[correctAnswer.toUpperCase()];
        }
        try {
          await prisma.question.create({
            data: {
              testId,
              type: r["type"] || "multiple_choice",
              questionText,
              options: JSON.stringify(options),
              correctAnswer: mappedCorrect,
              orderIndex,
            },
          });
          orderIndex++;
          created++;
        } catch (e) {
          errors.push(`Failed to create question: ${String(e)}`);
        }
      }
      return NextResponse.json({ message: `Created ${created} questions`, created, errors });
    }

    return NextResponse.json({ error: "Invalid type. Use 'students' or 'questions'." }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Bulk upload failed", details: String(err) }, { status: 500 });
  }
}
