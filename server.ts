import express from "express";
import path from "path";
import dns from "dns";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { INITIAL_COMPLAINTS } from "./src/data/mockComplaints";

dotenv.config();

const PORT = 3000;

// Admin Account Single-Slot Storage
interface StoredAdmin {
  name: string;
  username: string;
  email?: string;
  password: string;
  roleTitle: string;
  createdAt: string;
  updatedAt?: string;
}

const ADMIN_FILE_PATH = path.join(process.cwd(), "admin-account.json");
const ADMIN_SYSTEM_ROW_ID = "__HOSTEL_ADMIN_MASTER_SLOT__";
let currentAdmin: StoredAdmin | null = null;

// Resolve and manage Supabase credentials
const SUPABASE_CONFIG_PATH = path.join(process.cwd(), "supabase-config.json");

function sanitizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return "";
  let u = rawUrl.trim();
  if (!u.startsWith("http://") && !u.startsWith("https://")) {
    u = `https://${u}`;
  }
  u = u.replace(/\/rest\/v1\/?$/i, "");
  u = u.replace(/\/+$/, "");
  return u;
}

interface SupabaseConfigData {
  url: string;
  key: string;
  projectId: string;
}

function getStoredSupabaseConfig(): SupabaseConfigData {
  let saved: Partial<SupabaseConfigData> = {};
  try {
    if (fs.existsSync(SUPABASE_CONFIG_PATH)) {
      saved = JSON.parse(fs.readFileSync(SUPABASE_CONFIG_PATH, "utf-8"));
    }
  } catch (err) {
    console.warn("Could not read supabase-config.json:", err);
  }

  const rawUrl = saved.url || process.env.SUPABASE_URL || "";
  const cleanedUrl = sanitizeSupabaseUrl(rawUrl) || "https://edvlhmjdjzqnrpuqclye.supabase.co";

  let key = saved.key || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || "";

  let projectId = saved.projectId || process.env.SUPABASE_PROJECT_ID || "";
  if (!projectId && cleanedUrl) {
    try {
      projectId = new URL(cleanedUrl).hostname.split(".")[0];
    } catch {}
  }
  if (!projectId) {
    projectId = "edvlhmjdjzqnrpuqclye";
  }

  return {
    url: cleanedUrl,
    key: key.trim(),
    projectId,
  };
}

function saveStoredSupabaseConfig(urlInput: string, keyInput: string) {
  const cleanedUrl = sanitizeSupabaseUrl(urlInput);
  let projectId = "";
  try {
    projectId = new URL(cleanedUrl).hostname.split(".")[0];
  } catch {}
  const toSave = {
    url: cleanedUrl,
    key: keyInput.trim(),
    projectId: projectId || "edvlhmjdjzqnrpuqclye",
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(SUPABASE_CONFIG_PATH, JSON.stringify(toSave, null, 2), "utf-8");
  cachedSupabaseClient = null;
  return toSave;
}

function getSupabaseHostname(urlStr: string): string {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return "";
  }
}

// In-memory backend storage ensuring 100% reliable complaint registration and retrieval
const inMemoryComplaints: any[] = [];

// Cached DNS reachability status
let cachedDnsCheck = {
  hostname: "",
  resolves: false,
  checkedAt: 0,
};

async function checkHostResolves(hostname: string): Promise<boolean> {
  if (!hostname) return false;
  const now = Date.now();
  if (cachedDnsCheck.hostname === hostname && now - cachedDnsCheck.checkedAt < 45000) {
    return cachedDnsCheck.resolves;
  }
  return new Promise((resolve) => {
    dns.lookup(hostname, (err) => {
      const ok = !err;
      cachedDnsCheck = { hostname, resolves: ok, checkedAt: now };
      resolve(ok);
    });
  });
}

let cachedSupabaseClient: { client: ReturnType<typeof createClient>; configKey: string } | null = null;

function getSupabase() {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.key) return null;
  const configKey = `${config.url}:::${config.key}`;
  if (!cachedSupabaseClient || cachedSupabaseClient.configKey !== configKey) {
    cachedSupabaseClient = {
      client: createClient(config.url, config.key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }),
      configKey,
    };
  }
  return cachedSupabaseClient.client;
}

// Durable multi-layer Admin slot loader (Memory -> Local Disk -> Supabase Cloud)
async function loadAdminAsync(): Promise<StoredAdmin | null> {
  if (currentAdmin) return currentAdmin;

  // 1. Try reading local file
  try {
    if (fs.existsSync(ADMIN_FILE_PATH)) {
      const content = fs.readFileSync(ADMIN_FILE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && parsed.username && parsed.password) {
        currentAdmin = parsed;
        return currentAdmin;
      }
    }
  } catch (err) {
    console.warn("Could not read admin-account.json:", err);
  }

  // 2. Try querying Supabase for master slot row
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await (supabase as any)
        .from("complaints")
        .select("*")
        .eq("id", ADMIN_SYSTEM_ROW_ID)
        .maybeSingle();

      if (!error && data && data.status === "locked" && data.student_name && data.description) {
        let meta: any = {};
        try {
          meta = JSON.parse(data.admin_remarks || "{}");
        } catch {}

        currentAdmin = {
          name: data.title || "Hostel Warden",
          username: data.student_name || "admin",
          email: data.student_contact || "",
          password: data.description || "",
          roleTitle: data.urgency || "Hostel Warden & Maintenance Head",
          createdAt: meta.createdAt || data.created_at || new Date().toISOString(),
          updatedAt: meta.updatedAt,
        };

        // Cache locally to file
        try {
          fs.writeFileSync(ADMIN_FILE_PATH, JSON.stringify(currentAdmin, null, 2), "utf-8");
        } catch {}

        return currentAdmin;
      }
    }
  } catch (err) {
    console.warn("Could not fetch admin from Supabase:", err);
  }

  return currentAdmin;
}

async function saveAdminAsync(account: StoredAdmin): Promise<void> {
  currentAdmin = account;

  // 1. Save to local file
  try {
    fs.writeFileSync(ADMIN_FILE_PATH, JSON.stringify(account, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write admin-account.json:", err);
  }

  // 2. Persist to Supabase cloud database
  try {
    const supabase = getSupabase();
    if (supabase) {
      const payload = {
        id: ADMIN_SYSTEM_ROW_ID,
        title: account.name,
        description: account.password,
        category: "__SYS_ADMIN__",
        urgency: account.roleTitle || "Hostel Warden",
        student_name: account.username,
        student_id: "SYS-MASTER-SLOT",
        student_contact: account.email || "",
        block: "ADMIN_OFFICE",
        room_number: "WARDEN-DESK",
        status: "locked",
        admin_remarks: JSON.stringify({
          createdAt: account.createdAt,
          updatedAt: new Date().toISOString(),
          slotStatus: "master_locked",
        }),
      };

      await (supabase as any).from("complaints").upsert(payload);
    }
  } catch (err) {
    console.warn("Could not sync admin slot to Supabase:", err);
  }
}

// SQL schema for user reference
const TABLE_SCHEMA_SQL = `-- Run this in your Supabase SQL Editor if 'complaints' table does not exist:
CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  urgency TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  student_contact TEXT NOT NULL,
  block TEXT NOT NULL,
  room_number TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  assigned_worker TEXT,
  admin_remarks TEXT
);

-- Enable public read & insert for hostel complaints
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on complaints" 
ON complaints FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

CREATE POLICY "Allow public select on complaints" 
ON complaints FOR SELECT 
TO anon, authenticated 
USING (true);

CREATE POLICY "Allow public update on complaints" 
ON complaints FOR UPDATE 
TO anon, authenticated 
USING (true)
WITH CHECK (true);
`;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 1. Check Admin Account & Slot Status (reads Memory -> File -> Supabase)
  app.get("/api/admin/status", async (_req, res) => {
    const admin = await loadAdminAsync();
    if (!admin) {
      return res.json({
        hasAdmin: false,
        slotAvailable: true,
        admin: null,
      });
    }

    return res.json({
      hasAdmin: true,
      slotAvailable: false,
      admin: {
        name: admin.name,
        username: admin.username,
        email: admin.email || "",
        roleTitle: admin.roleTitle || "Hostel Warden",
        createdAt: admin.createdAt,
      },
    });
  });

  // 2. Setup/Claim the SINGLE admin slot (Permanently locks across server & Supabase - exactly one chance)
  app.post("/api/admin/setup", async (req, res) => {
    const existing = await loadAdminAsync();
    if (existing) {
      return res.status(403).json({
        error: `Registration is permanently closed. The single admin slot has already been claimed by @${existing.username} and can never be claimed again.`,
      });
    }

    const { name, username, email, password, roleTitle } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ error: "Name, username, and password are required." });
    }

    const cleanPass = String(password).trim();
    if (cleanPass.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters long." });
    }

    const newAdmin: StoredAdmin = {
      name: String(name).trim(),
      username: String(username).trim().replace(/^@+/, ""),
      email: email ? String(email).trim() : "",
      password: cleanPass,
      roleTitle: roleTitle ? String(roleTitle).trim() : "Hostel Warden / Administrator",
      createdAt: new Date().toISOString(),
    };

    await saveAdminAsync(newAdmin);

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully. The single admin slot is now permanently locked forever.",
      admin: {
        name: newAdmin.name,
        username: newAdmin.username,
        email: newAdmin.email,
        roleTitle: newAdmin.roleTitle,
        createdAt: newAdmin.createdAt,
      },
    });
  });

  // 3. Admin Authentication Login (Flexible matching by username, @username, email, or full name)
  app.post("/api/admin/login", async (req, res) => {
    const admin = await loadAdminAsync();
    if (!admin) {
      return res.status(400).json({
        error: "No admin account exists yet. Please claim the single admin slot first.",
        slotAvailable: true,
      });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Please enter your username/email and password." });
    }

    const rawInput = String(username).trim();
    const cleanInput = rawInput.toLowerCase().replace(/^@+/, "");
    const cleanAdminUser = admin.username.trim().toLowerCase().replace(/^@+/, "");
    const cleanAdminEmail = (admin.email || "").trim().toLowerCase();
    const cleanAdminName = admin.name.trim().toLowerCase();

    // Match against username (with or without @), email, full name, or partial name
    const matchesUser =
      cleanInput === cleanAdminUser ||
      (cleanAdminEmail && cleanInput === cleanAdminEmail) ||
      cleanInput === cleanAdminName ||
      (cleanInput.length >= 3 && cleanAdminName.includes(cleanInput)) ||
      (cleanInput.length >= 3 && cleanAdminUser.includes(cleanInput));

    const rawPass = String(password);
    const matchesPass =
      rawPass === admin.password ||
      rawPass.trim() === admin.password.trim();

    if (!matchesUser) {
      return res.status(401).json({
        error: `Username or email not recognized. Registered as @${admin.username}${admin.email ? ` (${admin.email})` : ''}.`,
      });
    }

    if (!matchesPass) {
      return res.status(401).json({
        error: "Incorrect password. Please check your password and try again.",
      });
    }

    return res.json({
      success: true,
      admin: {
        name: admin.name,
        username: admin.username,
        email: admin.email,
        roleTitle: admin.roleTitle,
        createdAt: admin.createdAt,
      },
    });
  });

  // 4. Admin Sync Claim (Client-side auto-healing backup)
  app.post("/api/admin/sync-claim", async (req, res) => {
    const existing = await loadAdminAsync();
    if (existing) {
      return res.json({ success: true, admin: existing, wasAlreadySet: true });
    }

    const { name, username, email, password, roleTitle, createdAt } = req.body;
    if (username && password) {
      const cleanPass = String(password).trim();
      const restoredAdmin: StoredAdmin = {
        name: String(name || "Hostel Warden").trim(),
        username: String(username).trim().replace(/^@+/, ""),
        email: email ? String(email).trim() : "",
        password: cleanPass,
        roleTitle: roleTitle ? String(roleTitle).trim() : "Hostel Warden",
        createdAt: createdAt || new Date().toISOString(),
      };
      await saveAdminAsync(restoredAdmin);
      return res.json({ success: true, admin: restoredAdmin, restored: true });
    }

    return res.status(400).json({ error: "Invalid backup data." });
  });

  // 7. Admin Logout
  app.post("/api/admin/logout", (_req, res) => {
    return res.json({ success: true });
  });

  // Supabase connection & table status endpoint
  app.get("/api/supabase/status", async (_req, res) => {
    const config = getStoredSupabaseConfig();
    const hostname = getSupabaseHostname(config.url);

    const isPlaceholderKey = config.key === "qaxtu6-xuctUk-wubwyp" || config.key.length < 25;
    const keyPreview = config.key
      ? isPlaceholderKey
        ? "Invalid placeholder (qaxtu6-xuctUk-wubwyp)"
        : `${config.key.slice(0, 10)}...${config.key.slice(-4)}`
      : "Not configured";

    try {
      if (!hostname) {
        return res.json({
          connected: false,
          hostResolves: false,
          supabaseUrl: config.url,
          projectId: config.projectId,
          keyPreview,
          isPlaceholderKey,
          error: "No Supabase Project URL configured.",
          hint: "Provide your Supabase project URL (e.g., https://your-project.supabase.co)",
          schemaSql: TABLE_SCHEMA_SQL,
        });
      }

      const resolves = await checkHostResolves(hostname);

      if (!resolves) {
        return res.json({
          connected: false,
          hostResolves: false,
          supabaseUrl: config.url,
          projectId: config.projectId,
          keyPreview,
          isPlaceholderKey,
          error: `Project host '${hostname}' is not currently resolving in DNS.`,
          hint: "The Supabase project domain is not responding on DNS. Please verify your Project URL.",
          schemaSql: TABLE_SCHEMA_SQL,
        });
      }

      if (isPlaceholderKey) {
        return res.json({
          connected: false,
          hostResolves: true,
          supabaseUrl: config.url,
          projectId: config.projectId,
          keyPreview,
          isPlaceholderKey: true,
          error: "Invalid API key: The placeholder key 'qaxtu6-xuctUk-wubwyp' is set instead of your real Supabase Anon Public key.",
          hint: "In your Supabase dashboard, go to Project Settings > API > Project API keys and copy the 'anon' 'public' key (starts with 'eyJ...'), then save it in Admin Settings.",
          schemaSql: TABLE_SCHEMA_SQL,
        });
      }

      const supabase = getSupabase();
      if (!supabase) {
        return res.json({
          connected: false,
          hostResolves: true,
          supabaseUrl: config.url,
          projectId: config.projectId,
          keyPreview,
          isPlaceholderKey,
          error: "Failed to initialize Supabase client. Missing URL or Key.",
          schemaSql: TABLE_SCHEMA_SQL,
        });
      }

      const { data, error } = await (supabase as any)
        .from("complaints")
        .select("id")
        .limit(1);

      if (error) {
        return res.json({
          connected: false,
          hostResolves: true,
          supabaseUrl: config.url,
          projectId: config.projectId,
          keyPreview,
          isPlaceholderKey,
          error: error.message,
          code: error.code,
          hint: error.hint || (error.code === "42P01"
            ? "Table 'complaints' does not exist in your Supabase project yet. Run the SQL schema below in your Supabase SQL Editor."
            : "Double check your Supabase 'anon' public key and Row-Level Security (RLS) policies."),
          schemaSql: TABLE_SCHEMA_SQL,
        });
      }

      return res.json({
        connected: true,
        hostResolves: true,
        supabaseUrl: config.url,
        projectId: config.projectId,
        keyPreview,
        isPlaceholderKey: false,
        recordCountDetected: data ? data.length : 0,
        schemaSql: TABLE_SCHEMA_SQL,
      });
    } catch (err: any) {
      return res.json({
        connected: false,
        hostResolves: false,
        supabaseUrl: config.url,
        projectId: config.projectId,
        keyPreview,
        isPlaceholderKey,
        error: err.message || "Failed to query Supabase",
        schemaSql: TABLE_SCHEMA_SQL,
      });
    }
  });

  // POST: Update Supabase credentials directly
  app.post("/api/supabase/config", async (req, res) => {
    const { url, key } = req.body;
    if (!url || !key) {
      return res.status(400).json({ error: "Both Supabase URL and API Key are required." });
    }

    try {
      const saved = saveStoredSupabaseConfig(url, key);
      const hostname = getSupabaseHostname(saved.url);
      const resolves = await checkHostResolves(hostname);

      if (!resolves) {
        return res.json({
          success: true,
          saved,
          connected: false,
          error: `Project host '${hostname}' could not be reached via DNS.`,
          hint: "Double check your Supabase project URL domain.",
        });
      }

      const supabase = getSupabase();
      if (!supabase) {
        return res.json({
          success: true,
          saved,
          connected: false,
          error: "Could not create Supabase client with provided parameters.",
        });
      }

      const { data, error } = await (supabase as any)
        .from("complaints")
        .select("id")
        .limit(1);

      if (error) {
        return res.json({
          success: true,
          saved,
          connected: false,
          error: error.message,
          code: error.code,
          hint: error.hint || (error.code === "42P01"
            ? "Table 'complaints' not found. Please execute the provided SQL setup script in Supabase SQL Editor."
            : "Check that this key is your anon/public key and that RLS policies are enabled."),
          schemaSql: TABLE_SCHEMA_SQL,
        });
      }

      return res.json({
        success: true,
        saved,
        connected: true,
        recordCount: data ? data.length : 0,
        message: "Successfully connected to Supabase database!",
      });
    } catch (err: any) {
      return res.status(500).json({
        error: err.message || "Failed to test and save Supabase credentials",
      });
    }
  });

  // POST: Push/sync all complaints to Supabase
  app.post("/api/supabase/sync", async (req, res) => {
    const config = getStoredSupabaseConfig();
    const supabase = getSupabase();

    if (!supabase) {
      return res.status(400).json({
        error: "Supabase client is not connected. Configure your URL and Anon Key first.",
      });
    }

    // Complaints can come from request body (e.g. from frontend state) or from inMemoryComplaints
    const incomingComplaints: any[] = Array.isArray(req.body.complaints) && req.body.complaints.length > 0
      ? req.body.complaints
      : inMemoryComplaints;

    if (incomingComplaints.length === 0) {
      return res.json({
        success: true,
        message: "No complaints to sync. Database is currently clean.",
        syncedCount: 0,
      });
    }

    const rowsToUpsert = incomingComplaints.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description || "",
      category: c.category || "electrical",
      urgency: c.urgency || "medium",
      student_name: c.studentName || c.student_name || "Student",
      student_id: c.studentId || c.student_id || "STU-HOSTEL",
      student_contact: c.studentContact || c.student_contact || "",
      block: c.block || "Floor 0",
      room_number: c.roomNumber || c.room_number || "",
      created_at: c.createdAt || c.created_at || new Date().toISOString(),
      status: c.status || "pending",
      resolved_at: c.resolvedAt || c.resolved_at || null,
      resolved_by: c.resolvedBy || c.resolved_by || null,
      assigned_worker: c.assignedWorker || c.assigned_worker || null,
      admin_remarks: c.adminRemarks || c.admin_remarks || null,
    }));

    try {
      const { data, error } = await (supabase as any)
        .from("complaints")
        .upsert(rowsToUpsert, { onConflict: "id" })
        .select();

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: error.code,
          hint: error.hint || (error.code === "42P01"
            ? "Table 'complaints' not found. Please execute the provided SQL setup script in Supabase SQL Editor."
            : "Check your Supabase RLS policies."),
          schemaSql: TABLE_SCHEMA_SQL,
        });
      }

      return res.json({
        success: true,
        syncedCount: data ? data.length : rowsToUpsert.length,
        message: `Successfully synchronized ${data ? data.length : rowsToUpsert.length} complaint(s) to Supabase!`,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to sync complaints to Supabase",
      });
    }
  });

  // GET: Fetch all complaints
  app.get("/api/complaints", async (_req, res) => {
    const config = getStoredSupabaseConfig();
    const hostname = getSupabaseHostname(config.url);

    try {
      const resolves = await checkHostResolves(hostname);

      if (resolves) {
        try {
          const supabase = getSupabase();
          if (supabase) {
            const { data, error } = await (supabase as any)
              .from("complaints")
              .select("*")
              .order("created_at", { ascending: false });

            if (!error && Array.isArray(data)) {
              const studentRows = data.filter(
                (row: any) =>
                  !String(row.id || "").startsWith("__") &&
                  row.category !== "__SYS_ADMIN__"
              );

              const remoteComplaints = studentRows.map((row: any) => ({
                id: row.id,
                title: row.title,
                description: row.description,
                category: row.category,
                urgency: row.urgency,
                studentName: row.student_name || row.studentName || "Student",
                studentId: row.student_id || row.studentId || "STU-HOSTEL",
                studentContact: row.student_contact || row.studentContact || "",
                block: row.block || "Floor 0",
                roomNumber: row.room_number || row.roomNumber || "",
                createdAt: row.created_at || row.createdAt || new Date().toISOString(),
                status: row.status || "pending",
                resolvedAt: row.resolved_at || row.resolvedAt || undefined,
                resolvedBy: row.resolved_by || row.resolvedBy || undefined,
                assignedWorker: row.assigned_worker || row.assignedWorker || undefined,
                adminRemarks: row.admin_remarks || row.adminRemarks || undefined,
              }));

              // Sync remote records into in-memory store
              const remoteIds = new Set(remoteComplaints.map((c) => c.id));
              const localUnique = inMemoryComplaints.filter((c) => !remoteIds.has(c.id));
              inMemoryComplaints.length = 0;
              inMemoryComplaints.push(...remoteComplaints, ...localUnique);

              return res.json({
                source: "supabase",
                complaints: inMemoryComplaints,
              });
            }
          }
        } catch {
          // Handled quietly without crashing
        }
      }

      // Serve from resilient server memory store
      return res.json({
        source: "server_store",
        complaints: inMemoryComplaints,
      });
    } catch {
      return res.json({
        source: "server_fallback",
        complaints: inMemoryComplaints,
      });
    }
  });

  // POST: Insert a new complaint
  app.post("/api/complaints", async (req, res) => {
    const complaint = req.body;

    if (!complaint || !complaint.title || !complaint.roomNumber) {
      return res.status(400).json({ error: "Missing required complaint fields" });
    }

    const newId = complaint.id || `CMP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const fullComplaint = {
      id: newId,
      title: complaint.title,
      description: complaint.description || "",
      category: complaint.category || "electrical",
      urgency: complaint.urgency || "medium",
      studentName: complaint.studentName,
      studentId: complaint.studentId,
      studentContact: complaint.studentContact,
      block: complaint.block,
      roomNumber: complaint.roomNumber,
      createdAt: complaint.createdAt || new Date().toISOString(),
      status: complaint.status || "pending",
      resolvedAt: complaint.resolvedAt || undefined,
      resolvedBy: complaint.resolvedBy || undefined,
      assignedWorker: complaint.assignedWorker || undefined,
      adminRemarks: complaint.adminRemarks || undefined,
    };

    // Save into server in-memory database
    const existingIdx = inMemoryComplaints.findIndex((c) => c.id === newId);
    if (existingIdx >= 0) {
      inMemoryComplaints[existingIdx] = fullComplaint;
    } else {
      inMemoryComplaints.unshift(fullComplaint);
    }

    let supabaseSaved = false;
    let supabaseError: string | null = null;

    // Check if host resolves before making network calls
    const config = getStoredSupabaseConfig();
    const hostname = getSupabaseHostname(config.url);

    try {
      const resolves = await checkHostResolves(hostname);
      if (resolves) {
        const supabase = getSupabase();
        if (supabase) {
          const snakeRow = {
            id: fullComplaint.id,
            title: fullComplaint.title,
            description: fullComplaint.description,
            category: fullComplaint.category,
            urgency: fullComplaint.urgency,
            student_name: fullComplaint.studentName,
            student_id: fullComplaint.studentId,
            student_contact: fullComplaint.studentContact,
            block: fullComplaint.block,
            room_number: fullComplaint.roomNumber,
            created_at: fullComplaint.createdAt,
            status: fullComplaint.status,
            resolved_at: fullComplaint.resolvedAt || null,
            resolved_by: fullComplaint.resolvedBy || null,
            assigned_worker: fullComplaint.assignedWorker || null,
            admin_remarks: fullComplaint.adminRemarks || null,
          };

          const insertResult: any = await (supabase as any)
            .from("complaints")
            .insert(snakeRow)
            .select();

          if (!insertResult.error) {
            supabaseSaved = true;
          } else {
            supabaseError = insertResult.error.message;
            if (insertResult.error.message && insertResult.error.message.includes("column")) {
              const camelRow = {
                id: fullComplaint.id,
                title: fullComplaint.title,
                description: fullComplaint.description,
                category: fullComplaint.category,
                urgency: fullComplaint.urgency,
                studentName: fullComplaint.studentName,
                studentId: fullComplaint.studentId,
                studentContact: fullComplaint.studentContact,
                block: fullComplaint.block,
                roomNumber: fullComplaint.roomNumber,
                createdAt: fullComplaint.createdAt,
                status: fullComplaint.status,
                resolvedAt: fullComplaint.resolvedAt || null,
                resolvedBy: fullComplaint.resolvedBy || null,
                assignedWorker: fullComplaint.assignedWorker || null,
                adminRemarks: fullComplaint.adminRemarks || null,
              };
              const camelResult: any = await (supabase as any)
                .from("complaints")
                .insert(camelRow)
                .select();
              if (!camelResult.error) {
                supabaseSaved = true;
                supabaseError = null;
              }
            }
          }
        }
      }
    } catch (err: any) {
      supabaseError = err.message || "Network error communicating with Supabase";
    }

    return res.status(201).json({
      success: true,
      supabaseSaved,
      supabaseError,
      complaint: fullComplaint,
      schemaSql: TABLE_SCHEMA_SQL,
    });
  });

  // PATCH: Update complaint status / assigned technician / remarks
  app.patch("/api/complaints/:id", async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Update in-memory database
    const idx = inMemoryComplaints.findIndex((c) => c.id === id);
    if (idx >= 0) {
      inMemoryComplaints[idx] = {
        ...inMemoryComplaints[idx],
        ...updates,
      };
    }

    // Sync to Supabase if host resolves
    const config = getStoredSupabaseConfig();
    const hostname = getSupabaseHostname(config.url);

    try {
      const resolves = await checkHostResolves(hostname);
      if (resolves) {
        const supabase = getSupabase();
        if (supabase) {
          const snakeUpdates: Record<string, any> = {};
          if (updates.status !== undefined) snakeUpdates.status = updates.status;
          if (updates.resolvedAt !== undefined) snakeUpdates.resolved_at = updates.resolvedAt;
          if (updates.resolvedBy !== undefined) snakeUpdates.resolved_by = updates.resolvedBy;
          if (updates.assignedWorker !== undefined) snakeUpdates.assigned_worker = updates.assignedWorker;
          if (updates.adminRemarks !== undefined) snakeUpdates.admin_remarks = updates.adminRemarks;

          const updateResult: any = await (supabase as any)
            .from("complaints")
            .update(snakeUpdates)
            .eq("id", id)
            .select();

          if (updateResult.error && updateResult.error.message && updateResult.error.message.includes("column")) {
            await (supabase as any)
              .from("complaints")
              .update(updates)
              .eq("id", id);
          }
        }
      }
    } catch {
      // Safe catch
    }

    return res.json({ success: true, updated: idx >= 0 ? inMemoryComplaints[idx] : updates });
  });

  // Clear all complaints from server store
  app.delete("/api/complaints", (_req, res) => {
    inMemoryComplaints.length = 0;
    return res.json({ success: true, message: "All complaints cleared." });
  });

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    const initialConfig = getStoredSupabaseConfig();
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Supabase target URL: ${initialConfig.url}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
