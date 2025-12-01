Lead-Gun projemiz için bu nextjs projesini güncelleyelim. 
public/logo.png dosyasını ekledim. Logo olarak kullanabilirsin. Tamamen mock data olacak. Data için bir dosya oluştur düm datayı oradan çekelim şimdilik.

Bu dashboard tüm lead-gun ürünlerinin kontrol edildiği merkez. Buraya Lead-Center isimini veriyoruz. Tüm dashboard İngilizce olmalıdır!


Aşağıda **Cursor AI editöründe direkt kullanabileceğin**, UI tasarımı mock data ile oluşturmak için hazırlanmış **tam kapsamlı, detaylı ve mükemmel biçimlendirilmiş bir PROMPT** veriyorum.

Bu prompt, LeadGun → LeadCenter MVP panelinin **tüm ekranlarını**, menü yapısını, UI bileşenlerini, CRM detay sayfalarını, renk paletini ve davranış kurallarını içerir.

---

# ✅ **LEADCENTER MVP – CURSOR AI PROJE BAŞLATMA PROMPT’U**

Aşağıdaki prompt’u **Cursor AI’ye aynen yapıştır** ve proje tasarımını oluşturmasını sağla.

---

## 🚀 **PROMPT (Cursor için tam metin)**

**You are building a complete React-based CRM-style admin panel for the LeadGun → LeadCenter MVP.
Use modern CRM UX patterns similar to HubSpot, Pipedrive, Apollo, Close.
Use ONLY mock data.
Your task is to generate all UI screens, layouts, components, placeholder interactions, and data mocks.
No backend. Only UI/UX.**

---

# 🎨 GENERAL DESIGN REQUIREMENTS

### **Overall UI**

* Modern CRM style
* Light theme
* Border radius: **10–12px**
* Soft shadows
* Clean typography (Inter / Roboto)
* Use a **collapsible left sidebar menu**

  * When collapsed → icons only
  * On hover → expand and show menu text
* Top bar includes:

  * **Global Search bar**
  * **CREATE button** (quick actions menu)

### **Color Palette** (modern CRM-safe set):

* Primary: `#3B82F6` (Tailwind *blue-500*)
* Secondary: `#1E293B` (Slate-800)
* Background: `#F8FAFC` (Slate-50)
* Border: `#E2E8F0` (Slate-200)
* Success: `#22C55E`
* Warning: `#F59E0B`
* Danger: `#EF4444`

### **Icon Set:** Lucide Icons

---

# 📂 **MENU STRUCTURE (Left Sidebar)**

Use this menu structure:

```
Dashboard
Lead Groups
Leads
Campaigns
Tasks
```

At the bottom of the sidebar:

* Settings
* User Profile

Sidebar must be collapsible.

---

# 📌 **GLOBAL COMPONENTS TO INCLUDE**

* Top navigation bar with:

  * Search bar (searching leads, groups, campaigns)
  * Create button
    When clicked, modal opens:

    * Create Lead Group
    * Create Lead
    * Create Campaign
    * Create Task
* Notification bell icon (mocked)
* Profile avatar

---

# 🖥️ **SCREENS TO BUILD**

---

# 1️⃣ DASHBOARD SCREEN

## Layout:

* Page title: **Dashboard**
* Cards row:

  * Total Leads
  * Total Lead Groups
  * Active Campaigns
  * Tasks Due Today

## Sections:

### **a) Today’s Tasks**

* List of today’s tasks with status toggle (mock)

### **b) Latest Lead Groups**

* Table:

  * Group name
  * Status (Pending, Processing, Completed)
  * Lead Count
  * Last Updated

### **c) Ongoing Campaigns**

* Progress bars showing:

  * Name
  * Type (WhatsApp / Email / Call / Visit)
  * Sent / Remaining
  * Status (Active, Completed)

---

# 2️⃣ LEAD GROUPS SCREEN

## Lead Group List Page:

Columns:

* Group Name
* Status (Pending / Processing / Completed)
* Lead Count
* Date Created
* Actions (View, Export)

### “Create Lead Group” modal:

Fields:

* Name (e.g., “İstanbul Kuaför Listesi”)
* City / District selection
* Keywords input (tags)
* Description
* Create button → Add to mock list

---

## Lead Group Detail Page:

Layout:

* Title: Group Name
* Status badge
* Lead count
* Export button
* Shortcut: "Create Campaign with this Group"

### Tabs:

1. **Leads** (table)
2. **Notes** (simple notes list)
3. **History** (mock events)

---

# 3️⃣ LEADS SCREEN

### Lead List Page:

Columns:

* Company Name
* Category
* Phone
* Email
* City / District
* Source Group
* Last Activity
* Actions (View)

Filters:

* By Lead Group
* By City
* By Category
* By Activity

Sorting options included.

---

## Lead Detail Page (Very Important – CRM Style)

**This page must replicate HubSpot’s layout:**

### Left Column (Info panel)

* Business Name
* Address
* Phone
* Email
* Website
* Google Maps Link (button)
* Belongs to Lead Groups list
* Tags
* Edit button

### Middle Column (Activity Timeline)

HubSpot-style tab navigation:

* **Activity** (default)
* Notes
* Emails
* Calls
* WhatsApp
* Tasks
* Meetings

Activity feed items include mock:

* Notes
* Logged calls
* Logged emails
* Logged WhatsApp messages
* Completed tasks
* Campaign interactions

### Right Column (Quick actions)

Buttons:

* Add Note
* Log Email
* Log Call
* Add Task
* Add Meeting

Each opens a modal.
Each modal has a **“Follow-up task” checkbox** which auto-creates a task on save.

---

# 4️⃣ CAMPAIGNS SCREEN

## Campaign List Page

Columns:

* Campaign Name
* Type (WhatsApp, Email, Call, Visit)
* Lead Count
* Status (Active, Completed)
* Created Date
* Actions (View)

### Campaign Filters:

* Type
* Status

---

## Create Campaign Modal

Fields:

* Name
* Type (Dropdown: WhatsApp / Email / Call / Visit)
* Select Lead Groups (multi-select)
* Message Template
  → Single template for all leads
  → Merge tags: {{company_name}}, {{city}}, {{district}}
* Save

**No scheduling. No per-lead message. No date.
Campaign sends leads to the “daily queue” logic (mock only).**

---

## Campaign Detail Page

Sections:

### Header:

* Campaign name
* Status badge
* Type badge
* Lead count

### Buttons:

* Pause / Resume
* Delete

### Tabs:

1. **Overview**

   * Progress bar: sent / remaining
   * Stats cards
2. **Leads**

   * Table:

     * Lead name
     * Status (pending/sent/failed)
     * Last interaction
3. **Activity**

   * Timeline of all sends
4. **Message Template**

   * Read-only view of the template

---

# 5️⃣ TASKS SCREEN

## Task List

Columns:

* Task Name
* Related Lead
* Due Date
* Status
* Type (Call / Email / Follow-up / Visit / Custom)
* Actions (Complete, View)

Filters:

* Due Today
* Overdue
* Completed
* Assigned To (mock only)

### Create Task Modal:

* Task name
* Related Lead
* Due date
* Type dropdown
* Description

---

# 📌 **MOCK DATA REQUIREMENTS**

Generate JSON mock data for:

* Leads
* Lead Groups
* Campaigns
* Tasks
* Activity events

Use realistic sample Turkish business names:

* “Gül Kuaför”
* “Mavi Dental Klinik”
* “Lezzet Döner”
* “İstanbul Temizlik”
* “Ada Oto Servis"

---

# 📦 **FILE STRUCTURE SUGGESTION**

Cursor can scaffold:

```
src/
  components/
  pages/
    Dashboard/
    LeadGroups/
    Leads/
    Campaigns/
    Tasks/
  layout/
    Sidebar.jsx
    TopBar.jsx
  mock/
    leads.json
    leadGroups.json
    campaigns.json
    tasks.json
```

---

# 🧠 **IMPORTANT RULES**

* Only UI (React/Next.js).
* No backend logic.
* All data must come from mock JSON.
* No scheduling, no per-lead message customization.
* Use nice cards, tables, badges, buttons.
* Include loading skeletons.
* Include empty states.