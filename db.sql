-- ========================
-- EXTENSION FOR UUID
-- ========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================
-- USERS
-- ========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    company_name TEXT,
    industry TEXT,
    role TEXT,
    whatsapp_limit INT DEFAULT 100,
    mail_limit INT DEFAULT 100,
    visit_limit INT DEFAULT 10,
    call_limit INT DEFAULT 30,
    monthly_credit_limit INT DEFAULT 0,
    monthly_credits_used INT DEFAULT 0,
    subscription_start TIMESTAMP,
    subscription_end TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- PLANS
-- ========================
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    monthly_credits INT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- CREDIT_PACKAGES
-- ========================
CREATE TABLE credit_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    credits INT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- PAYMENTS
-- ========================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    package_id UUID REFERENCES plans(id),
    amount NUMERIC(10,2),
    currency TEXT DEFAULT 'TRY',
    status TEXT CHECK (status IN ('pending','completed','failed')) DEFAULT 'pending',
    note TEXT,
    payment_date TIMESTAMP DEFAULT NOW(),
    payment_provider TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- USER CREDIT TRANSACTIONS
-- ========================
CREATE TABLE user_credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type TEXT CHECK (type IN ('add','use')) NOT NULL,
    credits INT NOT NULL,
    amount NUMERIC(10,2),
    note TEXT,
    source TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_credit_user_id ON user_credit_transactions(user_id);

-- ========================
-- LEAD GROUPS
-- ========================
CREATE TABLE lead_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- LEADS
-- ========================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    company TEXT,
    address TEXT,
    city TEXT,
    district TEXT,
    plus_code TEXT,
    phone TEXT,
    website TEXT,
    lat NUMERIC(9,6),
    lng NUMERIC(9,6),
    rating NUMERIC(3,2),
    review_count INT,
    business_type TEXT,
    google_maps_url TEXT,
    search_term TEXT,
    profile_image_url TEXT,
    working_hours JSONB,
    primary_group_id UUID REFERENCES lead_groups(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_leads_primary_group ON leads(primary_group_id);
CREATE INDEX idx_leads_city_district ON leads(city, district);

-- ========================
-- LEAD GROUPS MAP
-- ========================
CREATE TABLE lead_groups_map (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    lead_id UUID REFERENCES leads(id),
    lead_group_id UUID REFERENCES lead_groups(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lgm_user_id ON lead_groups_map(user_id);
CREATE INDEX idx_lgm_lead_group_id ON lead_groups_map(lead_group_id);
CREATE INDEX idx_lgm_lead_id ON lead_groups_map(lead_id);

-- ========================
-- LEAD TAGS
-- ========================
CREATE TABLE lead_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================
-- LEAD TAG MAP
-- ========================
CREATE TABLE lead_tag_map (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    lead_id UUID REFERENCES leads(id),
    tag_id UUID REFERENCES lead_tags(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ltm_user_id ON lead_tag_map(user_id);
CREATE INDEX idx_ltm_lead_id ON lead_tag_map(lead_id);
CREATE INDEX idx_ltm_tag_id ON lead_tag_map(tag_id);

-- ========================
-- CAMPAIGNS
-- ========================
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    title TEXT,
    content TEXT,
    campaign_type TEXT CHECK (campaign_type IN ('whatsapp','mail','call','visit')) NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status TEXT CHECK (status IN ('draft','active','completed','cancelled')) DEFAULT 'draft',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);

-- ========================
-- CAMPAIGN GROUPS
-- ========================
CREATE TABLE campaign_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    campaign_id UUID REFERENCES campaigns(id),
    lead_group_id UUID REFERENCES lead_groups(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cg_user_id ON campaign_groups(user_id);
CREATE INDEX idx_cg_campaign_id ON campaign_groups(campaign_id);
CREATE INDEX idx_cg_lead_group_id ON campaign_groups(lead_group_id);

-- ========================
-- CAMPAIGN LEADS
-- ========================
CREATE TABLE campaign_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    campaign_id UUID REFERENCES campaigns(id),
    lead_id UUID REFERENCES leads(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cl_user_id ON campaign_leads(user_id);
CREATE INDEX idx_cl_campaign_id ON campaign_leads(campaign_id);
CREATE INDEX idx_cl_lead_id ON campaign_leads(lead_id);

-- ========================
-- ACTIVITIES
-- ========================
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    lead_id UUID REFERENCES leads(id),
    activity_type TEXT CHECK (activity_type IN ('note','email','call','task','visit','meeting')) NOT NULL,
    title TEXT,
    content TEXT,
    status TEXT CHECK (status IN ('pending','completed')) DEFAULT 'pending',
    due_date TIMESTAMP,
    campaign_id UUID REFERENCES campaigns(id),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_lead_id ON activities(lead_id);
CREATE INDEX idx_activities_campaign_id ON activities(campaign_id);

-- ========================
-- TASKS
-- ========================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    activity_id UUID REFERENCES activities(id),
    lead_id UUID REFERENCES leads(id),
    task_type TEXT CHECK (task_type IN ('task','follow_up','visit','call')) NOT NULL,
    status TEXT CHECK (status IN ('pending','completed')) DEFAULT 'pending',
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_lead_id ON tasks(lead_id);
CREATE INDEX idx_tasks_activity_id ON tasks(activity_id);

-- ========================
-- NOTIFICATIONS
-- ========================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);





/*

Supabase auth, supabase psql ve supa storage kullanacağız. Kullanıcı supabase ile oturum açacak. 

- plans tablosu olmalıdır. Şimdilik 4 Paketlerimiz var -> 
| id | name     | monthly_credits | price  | is_active |
| -- | -------- | --------------- | ------ | --------- |
| 1  | Starter  | 5,000           | 4,000₺ | 1         |
| 2  | Growth   | 10,000          | 5,000₺ | 1         |
| 3  | Pro      | 20,000          | 6,000₺ | 1         |
| 4  | Business | 50,000          | 9,000₺ | 1         |


- credit_packages tablomuz olmalı:
| id | name          | credits | price | is_active |
| -- | ------------- | ------- | ----- | --------- |
| 1  | +5.000 kredi  | 5000    | 2000  | 1         |
| 2  | +10.000 kredi | 10000   | 3000  | 1         |
| 3  | +50.000 kredi | 50000   | 7000  | 1         |


- user_credit_transactions→ Kullanıcının kredilerinin eklenmesi veya kampanyalarda harcanmasını loglar ve toplam kredi bakiyesini takip eder.
| id | user_id | type | credits | amount | source       | created_at |
| -- | ------- | ---- | ------- | ------ | ------------ | ---------- |
| 21 | 10      | add  | 5000    | 2000   | shopier      | 2025-01-01 |
| 22 | 10      | use  | -1      | null   | campaign:123 | 2025-01-01 |
| 23 | 10      | add  | 10000   | 3000   | shopier      | 2025-01-03 |

payments → Kullanıcının satın aldığı paket veya ek kredi ödemelerini, tutar, tarih ve ödeme durumu ile birlikte kaydeder.

campaigns → Kampanya ana bilgileri (isim, tür, tarih, durum, oluşturucu).

campaign_groups → Kampanyaya bağlı lead grupları.

campaign_leads → Kampanyaya tek tek eklenen leadler (individual).

leads → Tüm lead bilgileri (isim, firma, adres, iletişim, primary_group_id ile ana gurubu tutulur
### Mapten elde ettiğimiz dataşar şunlar. Bunları tabloda barındırabilmemiz gerekiyor: İşletme Adı, İl adı, İlçe adı, Tam Adres, Plus Code,Telefon,Web Sitesi,Lat,Lng,Puan,Yorum Sayısı,İşletme Türü,Google Maps URL,Arama Terimi,Resim URL,Çalışma Saatleri ### ).

lead_groups → Leadleri gruplamak için (örn. İstanbul Kuaför Listesi).

lead_groups_map → Kullanıcının oluşturduğu Lead–LeadGroup ilişki tablosu (many-to-many).

users → Sistemdeki kullanıcı bilgileri - supa auth ile ilişkili, hesap bilgilerini tutar

user_credit_transactions → Kampanyalarda veya ek kredilerde kullanılan/eklenen krediler (opsiyonel, paketle ilişkili).

activities (kampanya + CRM aktiviteleri) → Lead ile yapılan tüm etkileşimleri ve aktiviteleri (note, email, call, visit, meeting, task) tek bir tabloda kronolojik olarak tutar; kampanya kaynaklı aktiviteler campaign_id ile ayırt edilir ve böylece her lead için zaman çizelgesi ve geçmiş aksiyonlar yönetilebilir.

tasks -> Sadece “tamamlanması gereken görevleri” (task, follow-up, ziyaret, arama hatırlatma vb.) hızlı listelemek için optimize edilmiş, activity kayıtlarının görev niteliğindeki alt kümesini tutan performans odaklı tablodur.

lead_tags → Kullanıcının oluşturduğu etiketleri (örn: “VIP”, “Hot Lead”, “Tekrar Aranacak”) saklayan tablo.

lead_tag_map → Lead ile etiketlerin ilişkisini tutan many-to-many bağlantı tablosu.

notifications → Kullanıcıya sistem mesajı veya uyarı göndermek için (veri hazır, kredi yetersiz, ödeme hatası).
 */