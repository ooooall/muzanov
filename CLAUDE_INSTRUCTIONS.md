# QUARTERS · Production Roadmap

Пошаговый план доведения прототипа до production-ready приложения.

---

## ТЕКУЩЕЕ СОСТОЯНИЕ

✅ **Готово:**
- Статичный HTML-прототип с премиум-дизайном
- Интерактивная SVG-карта квартиры (9 зон)
- Система статусов (8 состояний)
- Типы операций (10 операций)
- Базовая логика работы (owner/viewer роли)
- PWA meta-теги и iOS-оптимизация
- Диалоги подтверждения
- Toast-уведомления
- История операций

⚠️ **Требуется:**
- Миграция в Next.js + TypeScript
- Реальная аутентификация через Supabase Auth
- 3 роли с разными интерфейсами
- Улучшенная карта (новая геометрия, без дверей)
- Более сдержанный визуальный стиль
- Синхронизация в реальном времени
- Деплой на Vercel

---

## ЭТАП 0 · ПОДГОТОВКА (1-2 дня)

### 0.1 Финализация дизайн-системы

**Цель:** Обновить визуальный язык — сделать более строгим, минималистичным, инженерным.

**Задачи:**
1. Убрать все "мягкие" градиенты и glow-эффекты
2. Заменить цветовую палитру на более монохромную:
   - Основа: черный (#000000) / dark graphite (#0a0a0a / #121212)
   - Акцент: один цвет вместо rainbow-палитры (например, желтый #f5c518 оставить как единственный)
   - Статусы: оттенки серого + желтый (progress) + зеленый (done)
   - Убрать оранжевый, красный, фиолетовый
3. Сделать типографику строже:
   - Уменьшить font-weight где возможно (500 → 400, 600 → 500)
   - Увеличить letter-spacing для uppercase текста
   - Убрать serif шрифт из заголовков drawer (оставить sans)
4. Убрать декоративные элементы:
   - Grid background — сделать менее заметным (opacity: 0.01 вместо 0.022)
   - Radial gradients — убрать или снизить до 0.01 opacity
   - Pulse animations — оставить только для критичных статусов
5. Ужесточить border-radius:
   - Крупные панели: 8px вместо 14px
   - Средние элементы: 6px вместо 10px
   - Кнопки: 6px вместо 10px
   - Pills: оставить 999px
6. Обновить shadows:
   - Убрать все colored shadows (glow)
   - Оставить только neutral black shadows с низкой opacity
   - Максимум: `0 4px 20px rgba(0,0,0,0.3)`

**Результат:**
- Обновленная дизайн-система в CSS-переменных
- Референсы в Figma/Sketch (опционально)
- Design tokens файл для Next.js (`design-tokens.ts`)

---

### 0.2 Новая геометрия карты

**Цель:** Перерисовать план квартиры — ровные прямоугольники, без дверей, чистая геометрия.

**Задачи:**
1. Проанализировать исходный план (размеры комнат, пропорции)
2. Создать упрощенную схему:
   - Все комнаты = прямоугольники или простые L-полигоны
   - Убрать все маркеры дверей
   - Добавить минимальные зазоры между зонами (2-4px gap) для визуального разделения
   - Сохранить пропорции площадей
3. Обновить координаты в ROOMS константе
4. Добавить микро-детали (опционально):
   - Тонкие линии разметки (engineering grid overlay)
   - Координатные метки по углам
   - Масштаб и ориентация (N-E-S-W)
5. Создать альтернативный вариант карты для планшета/десктопа (горизонтальная ориентация)

**Результат:**
- Обновленная SVG-геометрия
- Константа `ROOMS` с новыми координатами
- Визуально чище и строже

---

### 0.3 Определение ролей и permissions

**Цель:** Четко разграничить 3 роли, их интерфейсы и доступы.

#### Роли:

1. **VIEWER (Наблюдатель) — без регистрации**
   - **Доступ:** read-only ко всей карте и истории
   - **Интерфейс:**
     - Главная: карта + статусы (без кнопок управления)
     - Feed: операции в реальном времени
     - История: полный лог
   - **Запрещено:**
     - Менять статусы
     - Создавать задачи
     - Редактировать операции
     - Видеть настройки или control panel
   - **Как получить доступ:**
     - Открыть публичную ссылку без авторизации
     - Или войти как viewer через email (опционально)

2. **WORKER (Исполнитель) — регистрация обязательна**
   - **Доступ:** может менять статусы назначенных ему зон
   - **Интерфейс:**
     - Главная: карта + свои активные зоны
     - Детальная панель: кнопки смены статуса, таймер, чеклисты
     - Может отмечать "начато" → "в процессе" → "пауза" → "завершено"
     - Может добавлять заметки к зоне
     - Может ставить "требует внимания" / "переделать"
   - **Запрещено:**
     - Назначать операции другим
     - Создавать новые типы операций
     - Удалять историю
     - Видеть control panel
     - Сбрасывать карту
   - **Как получить доступ:**
     - Регистрация через email/password
     - Роль назначается админом (TaskMaster)

3. **TASKMASTER (Постановщик задач / Владелец) — регистрация обязательна**
   - **Доступ:** полный контроль над системой
   - **Интерфейс:**
     - Главная: карта + control panel
     - Может назначать операции на зоны
     - Может назначать исполнителей (workers)
     - Может создавать/редактировать типы операций
     - Может менять любые статусы
     - Может очищать карту / сбрасывать зоны
     - Видит аналитику и статистику
   - **Специальные возможности:**
     - Управление пользователями (добавить/удалить worker)
     - Настройки системы
     - Экспорт истории
     - Архивирование
   - **Как получить доступ:**
     - Первый пользователь = автоматически TaskMaster
     - Или через invite link от существующего TaskMaster

**Результат:**
- Документ `ROLES.md` с подробным описанием
- TypeScript типы для ролей (`types/roles.ts`)
- Матрица permissions (`lib/permissions.ts`)

---

## ЭТАП 1 · МИГРАЦИЯ В NEXT.JS (3-4 дня)

### 1.1 Инициализация проекта

```bash
npx create-next-app@latest quarters --typescript --tailwind --app --src-dir
cd quarters
```

**Установка зависимостей:**
```bash
# UI
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tabs
npm install lucide-react
npm install framer-motion
npm install sonner  # toast notifications

# Forms
npm install react-hook-form zod @hookform/resolvers

# Auth & DB
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# Utils
npm install clsx tailwind-merge
npm install date-fns

# Dev
npm install -D @types/node
```

**Структура проекта:**
```
quarters/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── layout.tsx          # Public layout (viewer mode)
│   │   │   └── page.tsx            # Public dashboard
│   │   ├── (worker)/
│   │   │   ├── layout.tsx          # Worker layout
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   └── zone/[id]/
│   │   │       └── page.tsx
│   │   ├── (taskmaster)/
│   │   │   ├── layout.tsx          # TaskMaster layout
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── control/
│   │   │   │   └── page.tsx        # Control panel
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx
│   │   │   └── settings/
│   │   │       └── page.tsx
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── callback/
│   │   │       └── route.ts        # OAuth callback
│   │   ├── api/
│   │   │   ├── zones/
│   │   │   │   ├── route.ts        # GET all zones
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts    # GET/PATCH zone
│   │   │   ├── operations/
│   │   │   │   └── route.ts
│   │   │   └── realtime/
│   │   │       └── route.ts        # SSE endpoint
│   │   ├── layout.tsx              # Root layout
│   │   ├── globals.css
│   │   └── manifest.ts             # PWA manifest
│   ├── components/
│   │   ├── ui/                     # shadcn components
│   │   ├── map/
│   │   │   ├── FloorPlan.tsx       # Main map component
│   │   │   ├── RoomShape.tsx       # Individual room SVG
│   │   │   └── MapControls.tsx     # Filters, zoom, etc
│   │   ├── panels/
│   │   │   ├── OverviewPanel.tsx
│   │   │   ├── FeedPanel.tsx
│   │   │   └── ZoneDetailDrawer.tsx
│   │   ├── role-specific/
│   │   │   ├── ViewerDashboard.tsx
│   │   │   ├── WorkerDashboard.tsx
│   │   │   └── TaskMasterDashboard.tsx
│   │   └── shared/
│   │       ├── Header.tsx
│   │       ├── BottomNav.tsx
│   │       └── StatusBadge.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser client
│   │   │   ├── server.ts           # Server client
│   │   │   └── middleware.ts       # Auth middleware
│   │   ├── permissions.ts          # Role checks
│   │   ├── constants.ts            # STATUSES, OPERATIONS, ROOMS
│   │   └── utils.ts                # Helpers
│   ├── types/
│   │   ├── database.types.ts       # Generated from Supabase
│   │   ├── roles.ts
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useZones.ts             # SWR/React Query
│   │   ├── useRealtime.ts          # Supabase realtime
│   │   └── usePermissions.ts
│   └── styles/
│       └── design-tokens.ts
├── public/
│   ├── icons/                      # PWA icons
│   └── manifest.webmanifest
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── .env.local
├── .env.example
├── middleware.ts                   # Next.js middleware for auth
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

**Результат:**
- Работающий Next.js проект с правильной структурой
- Все зависимости установлены
- Базовая конфигурация Tailwind + TypeScript

---

### 1.2 Конфигурация и базовые утилиты

**tailwind.config.ts:**
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Premium industrial palette
        base: '#000000',
        canvas: '#0a0a0a',
        elevated: '#121212',
        panel: '#151515',
        hover: '#1a1a1a',
        
        border: 'rgba(255, 255, 255, 0.06)',
        'border-strong': 'rgba(255, 255, 255, 0.12)',
        
        text: {
          1: '#f5f5f5',
          2: '#c0c0c0',
          3: '#8a8a8a',
          4: '#5a5a5a',
        },
        
        accent: '#f5c518',
        success: '#3aae5f',
        
        status: {
          idle: '#5a5a5a',
          progress: '#f5c518',
          completed: '#3aae5f',
          attention: '#d4a017',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        lg: '8px',
        xl: '12px',
      },
    },
  },
  plugins: [],
}
export default config
```

**lib/utils.ts:**
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: Date | string | null): string {
  if (!date) return '—'
  const d = new Date(date)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export function formatRelative(date: Date | string | null): string {
  if (!date) return '—'
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const minutes = Math.round(diff / 60000)
  
  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes} мин назад`
  
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} ч назад`
  
  return d.toLocaleDateString('ru-RU')
}
```

**lib/constants.ts:**
```typescript
export const STATUSES = {
  idle: { label: 'Не начато', sub: 'IDLE', color: 'status-idle' },
  scheduled: { label: 'Запланировано', sub: 'SCHEDULED', color: 'status-idle' },
  in_progress: { label: 'В процессе', sub: 'IN PROGRESS', color: 'status-progress' },
  paused: { label: 'Пауза', sub: 'PAUSED', color: 'status-progress' },
  attention: { label: 'Требует внимания', sub: 'ATTENTION', color: 'status-attention' },
  completed: { label: 'Готово', sub: 'COMPLETED', color: 'status-completed' },
  rework: { label: 'Переделать', sub: 'REWORK', color: 'status-attention' },
} as const

export const OPERATIONS = [
  { code: 'MTN-01', label: 'Поддерживающая уборка', sub: 'Maintenance' },
  { code: 'DEP-01', label: 'Глубокая уборка', sub: 'Deep Clean' },
  { code: 'WET-01', label: 'Влажная обработка', sub: 'Wet Treatment' },
  { code: 'DRY-01', label: 'Сухая очистка', sub: 'Dry Clean' },
  { code: 'FUL-01', label: 'Полный цикл', sub: 'Full Cycle' },
] as const

// Обновленная геометрия будет добавлена после Этапа 0.2
export const ROOMS = [
  // ... новые координаты
] as const
```

**Результат:**
- Готовая конфигурация Tailwind с дизайн-токенами
- Базовые утилиты
- Константы вынесены в отдельные файлы

---

### 1.3 Миграция компонентов из HTML

**Задачи:**
1. Конвертировать HTML-разметку в React-компоненты
2. Перенести CSS в Tailwind-классы (где возможно)
3. Сохранить кастомные CSS-переменные для сложных стилей
4. Разбить монолитный script на хуки и утилиты

**Приоритет миграции:**
1. **FloorPlan.tsx** — главная карта
2. **ZoneDetailDrawer.tsx** — детальная панель зоны
3. **OverviewPanel.tsx** — статистика
4. **FeedPanel.tsx** — лента операций
5. **Header.tsx** + **BottomNav.tsx** — навигация
6. Остальные UI-компоненты

**Результат:**
- Все компоненты переведены в TypeScript + React
- Tailwind CSS вместо inline-стилей (где возможно)
- Типизированные пропсы

---

## ЭТАП 2 · SUPABASE SETUP (2-3 дня)

### 2.1 Создание проекта в Supabase

1. Зайти в https://supabase.com
2. Создать новый проект `quarters-prod`
3. Регион: `eu-central-1` (ближе к Европе)
4. Сохранить:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (для серверных операций)

**Добавить в `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

### 2.2 Схема базы данных

**Файл:** `supabase/migrations/001_initial_schema.sql`

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM ('viewer', 'worker', 'taskmaster');
CREATE TYPE zone_status AS ENUM ('idle', 'scheduled', 'in_progress', 'paused', 'attention', 'completed', 'rework');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'viewer',
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Zones table
CREATE TABLE zones (
  id TEXT PRIMARY KEY,  -- e.g. 'bedroom_small'
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  code TEXT NOT NULL,   -- e.g. 'BR-01'
  area NUMERIC NOT NULL,
  geometry JSONB NOT NULL,  -- SVG coordinates
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Operations types table
CREATE TABLE operation_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  sub_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Zone states table (current state of each zone)
CREATE TABLE zone_states (
  zone_id TEXT PRIMARY KEY REFERENCES zones(id) ON DELETE CASCADE,
  status zone_status NOT NULL DEFAULT 'idle',
  operation_type_id UUID REFERENCES operation_types(id) ON DELETE SET NULL,
  assigned_worker_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  started_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity log table (history of all changes)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id TEXT NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,  -- 'status_change', 'operation_assigned', 'note_added', etc.
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_log_zone ON activity_log(zone_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX idx_zone_states_status ON zone_states(status);
CREATE INDEX idx_zone_states_worker ON zone_states(assigned_worker_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zones_updated_at BEFORE UPDATE ON zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zone_states_updated_at BEFORE UPDATE ON zone_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policies for zones (read-only reference data)
CREATE POLICY "Zones are viewable by everyone"
  ON zones FOR SELECT
  USING (true);

-- Policies for zone_states
CREATE POLICY "Zone states are viewable by everyone"
  ON zone_states FOR SELECT
  USING (true);

CREATE POLICY "Workers can update their assigned zones"
  ON zone_states FOR UPDATE
  USING (
    auth.uid() = assigned_worker_id OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'taskmaster'
    )
  );

CREATE POLICY "TaskMasters can update any zone"
  ON zone_states FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'taskmaster'
    )
  );

-- Policies for operation_types
CREATE POLICY "Operation types are viewable by everyone"
  ON operation_types FOR SELECT
  USING (true);

CREATE POLICY "Only TaskMasters can manage operation types"
  ON operation_types FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'taskmaster'
    )
  );

-- Policies for activity_log
CREATE POLICY "Activity log is viewable by everyone"
  ON activity_log FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert activity"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
```

**Результат:**
- Полная схема базы данных
- RLS policies для безопасности
- Типы и индексы

---

### 2.3 Seed данные

**Файл:** `supabase/seed.sql`

```sql
-- Insert zones (9 комнат)
INSERT INTO zones (id, name, short_name, code, area, geometry) VALUES
  ('bedroom_small', 'Спальня Маленькая', 'Спальня M', 'BR-01', 11.5, '{"type":"rect","x":20,"y":20,"w":140,"h":380}'),
  ('bedroom_medium', 'Спальня Средняя', 'Спальня S', 'BR-02', 14.0, '{"type":"rect","x":170,"y":20,"w":290,"h":280}'),
  ('wardrobe', 'Гардероб', 'Гардероб', 'WD-01', 3.0, '{"type":"rect","x":470,"y":20,"w":110,"h":280}'),
  ('entry', 'Прихожая', 'Прихожая', 'EN-01', 4.5, '{"type":"rect","x":470,"y":310,"w":110,"h":140}'),
  ('bath', 'Ванная', 'Ванная', 'BT-01', 2.6, '{"type":"rect","x":20,"y":410,"w":140,"h":95}'),
  ('wc', 'Туалет', 'Туалет', 'WC-01', 1.2, '{"type":"rect","x":20,"y":515,"w":140,"h":75}'),
  ('corridor', 'Коридор', 'Коридор', 'CR-01', 8.5, '{"type":"polygon","points":"170,310 460,310 460,450 210,450 210,600 170,600"}'),
  ('kitchen', 'Кухня', 'Кухня', 'KT-01', 10.2, '{"type":"rect","x":20,"y":600,"w":180,"h":180}'),
  ('living', 'Спальня Большая / Гостиная', 'Гостиная', 'LR-01', 20.5, '{"type":"rect","x":220,"y":460,"w":360,"h":320}');

-- Insert operation types
INSERT INTO operation_types (code, label, sub_label) VALUES
  ('MTN-01', 'Поддерживающая уборка', 'Maintenance Pass'),
  ('DEP-01', 'Глубокая уборка', 'Deep Cleaning Cycle'),
  ('WET-01', 'Влажная обработка', 'Wet Surface Treatment'),
  ('DRY-01', 'Сухая очистка', 'Dry Particle Extraction'),
  ('FUL-01', 'Полный цикл', 'Full Scope Cycle');

-- Initialize zone states (all idle)
INSERT INTO zone_states (zone_id, status)
SELECT id, 'idle' FROM zones;
```

**Запуск миграций:**
```bash
# Локально (если используешь Supabase CLI)
supabase db reset

# Или через Dashboard:
# SQL Editor → New Query → вставить 001_initial_schema.sql → Run
# Затем seed.sql → Run
```

**Результат:**
- База данных заполнена начальными данными
- 9 зон
- 5 типов операций
- Все зоны в статусе idle

---

### 2.4 Supabase клиенты

**lib/supabase/client.ts** (browser):
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database.types'

export const createClient = () => createClientComponentClient<Database>()
```

**lib/supabase/server.ts** (server):
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export const createClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
}
```

**Генерация типов:**
```bash
npx supabase gen types typescript --project-id your-project-id > src/types/database.types.ts
```

**Результат:**
- Клиенты для браузера и сервера
- Типизированные запросы

---

## ЭТАП 3 · АУТЕНТИФИКАЦИЯ (2-3 дня)

### 3.1 Настройка Supabase Auth

**В Supabase Dashboard:**
1. Authentication → Settings
2. Включить Email provider
3. Настроить Email templates (welcome, password reset)
4. Redirect URLs:
   - `http://localhost:3000/auth/callback` (dev)
   - `https://your-domain.vercel.app/auth/callback` (prod)
5. Site URL: `https://your-domain.vercel.app`

---

### 3.2 Auth компоненты

**app/auth/login/page.tsx:**
```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      router.push('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Вход</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full px-4 py-3 bg-elevated border border-border rounded"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-4 py-3 bg-elevated border border-border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-accent text-black font-medium rounded"
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
```

**app/auth/callback/route.ts:**
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

---

### 3.3 Middleware для защиты роутов

**middleware.ts:**
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }

  // TaskMaster only routes
  if (req.nextUrl.pathname.startsWith('/control')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'taskmaster') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/control/:path*', '/settings/:path*'],
}
```

**Результат:**
- Рабочая аутентификация
- Защищенные роуты
- Редиректы по ролям

---

## ЭТАП 4 · REALTIME СИНХРОНИЗАЦИЯ (2 дня)

### 4.1 Включение Realtime в Supabase

**В Supabase Dashboard:**
1. Database → Replication
2. Включить Realtime для таблиц:
   - `zone_states`
   - `activity_log`

---

### 4.2 Realtime хук

**hooks/useRealtime.ts:**
```typescript
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database.types'

type ZoneState = Database['public']['Tables']['zone_states']['Row']

export function useRealtimeZones(onUpdate: (payload: any) => void) {
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('zone-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zone_states' },
        (payload) => {
          onUpdate(payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onUpdate, supabase])
}
```

**Использование:**
```typescript
'use client'

import { useState, useCallback } from 'react'
import { useRealtimeZones } from '@/hooks/useRealtime'

export default function Dashboard() {
  const [zones, setZones] = useState([])

  const handleUpdate = useCallback((payload: any) => {
    // Update local state when DB changes
    setZones((prev) => {
      const updated = [...prev]
      const idx = updated.findIndex((z) => z.zone_id === payload.new.zone_id)
      if (idx >= 0) updated[idx] = payload.new
      return updated
    })
  }, [])

  useRealtimeZones(handleUpdate)

  // ...
}
```

**Результат:**
- Синхронизация в реальном времени
- Все клиенты видят изменения мгновенно

---

## ЭТАП 5 · РОЛЬ-СПЕЦИФИЧНЫЕ ИНТЕРФЕЙСЫ (3-4 дня)

### 5.1 Viewer (публичный доступ)

**app/(public)/page.tsx:**
```typescript
import { createClient } from '@/lib/supabase/server'
import ViewerDashboard from '@/components/role-specific/ViewerDashboard'

export default async function PublicPage() {
  const supabase = createClient()

  const { data: zones } = await supabase
    .from('zone_states')
    .select('*, zones(*)')
    .order('updated_at', { ascending: false })

  const { data: activity } = await supabase
    .from('activity_log')
    .select('*, zones(*)')
    .order('created_at', { ascending: false })
    .limit(50)

  return <ViewerDashboard zones={zones} activity={activity} />
}
```

**Особенности:**
- Без кнопок управления
- Read-only карта
- Live feed
- Без регистрации

---

### 5.2 Worker (авторизованный)

**app/(worker)/dashboard/page.tsx:**
```typescript
import { createClient } from '@/lib/supabase/server'
import WorkerDashboard from '@/components/role-specific/WorkerDashboard'
import { redirect } from 'next/navigation'

export default async function WorkerDashboardPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/auth/login')

  // Fetch только назначенные зоны
  const { data: assignedZones } = await supabase
    .from('zone_states')
    .select('*, zones(*), operation_types(*)')
    .eq('assigned_worker_id', session.user.id)

  const { data: allZones } = await supabase
    .from('zone_states')
    .select('*, zones(*)')

  return (
    <WorkerDashboard
      assignedZones={assignedZones}
      allZones={allZones}
      userId={session.user.id}
    />
  )
}
```

**Особенности:**
- Фокус на "Мои зоны"
- Кнопки смены статуса
- Таймер работы
- Чеклисты
- Добавление заметок
- Нельзя назначать операции другим

---

### 5.3 TaskMaster (полный контроль)

**app/(taskmaster)/dashboard/page.tsx:**
```typescript
import { createClient } from '@/lib/supabase/server'
import TaskMasterDashboard from '@/components/role-specific/TaskMasterDashboard'
import { redirect } from 'next/navigation'

export default async function TaskMasterDashboardPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (profile?.role !== 'taskmaster') redirect('/dashboard')

  const { data: zones } = await supabase
    .from('zone_states')
    .select('*, zones(*), operation_types(*), profiles(*)')

  const { data: workers } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'worker')

  return (
    <TaskMasterDashboard
      zones={zones}
      workers={workers}
    />
  )
}
```

**Особенности:**
- Полная карта + Control Panel
- Назначение операций
- Назначение исполнителей
- Создание/редактирование типов операций
- Управление пользователями
- Аналитика
- Dangerous actions (clear, reset, archive)

---

## ЭТАП 6 · ДОПОЛНИТЕЛЬНЫЙ ФУНКЦИОНАЛ (3-5 дней)

### 6.1 Чеклисты для зон

**Таблица:**
```sql
CREATE TABLE zone_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id TEXT NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  operation_type_id UUID NOT NULL REFERENCES operation_types(id) ON DELETE CASCADE,
  items JSONB NOT NULL,  -- [{ label: "...", done: false }, ...]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(zone_id, operation_type_id)
);
```

**UI:**
- Worker видит чеклист при открытии зоны
- Отмечает пункты по мере выполнения
- Прогресс виден в реальном времени

---

### 6.2 Таймер работы

**В компоненте Worker:**
```typescript
const [elapsed, setElapsed] = useState(0)

useEffect(() => {
  if (zone.status !== 'in_progress') return

  const start = new Date(zone.started_at).getTime()
  const interval = setInterval(() => {
    setElapsed(Date.now() - start)
  }, 1000)

  return () => clearInterval(interval)
}, [zone.status, zone.started_at])

const formatElapsed = (ms: number) => {
  const sec = Math.floor(ms / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  return `${String(hr).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
}
```

---

### 6.3 Аналитика (TaskMaster)

**app/(taskmaster)/analytics/page.tsx:**

Метрики:
- Среднее время на зону
- Самые быстрые/медленные зоны
- Производительность по исполнителям
- Частота повторной обработки (rework)
- График операций по дням недели
- Heatmap активности

**Визуализация:**
- Recharts или Chart.js
- Таблицы с сортировкой
- Экспорт в CSV

---

### 6.4 Уведомления (опционально)

**Push notifications через Supabase:**
- Worker: "Вам назначена новая зона"
- TaskMaster: "Зона завершена · требует проверки"

**Email через Supabase:**
- Еженедельный отчет
- Критические события (attention status)

---

## ЭТАП 7 · ФИНАЛЬНАЯ ПОЛИРОВКА (2-3 дня)

### 7.1 Оптимизация производительности

**Задачи:**
1. React.memo для тяжелых компонентов
2. useMemo/useCallback где нужно
3. Lazy loading для drawer/modals
4. Image optimization (next/image)
5. Code splitting
6. Bundle analysis

```bash
npm run build
npx @next/bundle-analyzer
```

---

### 7.2 Accessibility (a11y)

**Checklist:**
- [ ] Все интерактивные элементы доступны с клавиатуры
- [ ] ARIA labels на иконках и кнопках
- [ ] Focus states видны
- [ ] Контраст текста >= 4.5:1
- [ ] Screen reader friendly
- [ ] Тестирование с VoiceOver/NVDA

---

### 7.3 Mobile UX review

**Проверить на iPhone:**
- [ ] Safe areas работают корректно
- [ ] Drawer не ломается при открытии клавиатуры
- [ ] Tap targets >= 44x44px
- [ ] Скролл плавный
- [ ] Нет горизонтального overflow
- [ ] PWA установка работает
- [ ] Standalone mode корректен

---

### 7.4 Error handling

**Добавить:**
- Error boundaries
- Fallback UI для ошибок загрузки
- Retry механизмы
- Graceful degradation при потере сети
- Toast для ошибок API

---

## ЭТАП 8 · ДЕПЛОЙ (1 день)

### 8.1 Vercel setup

```bash
npm install -g vercel
vercel login
vercel
```

**Настройки:**
1. Project Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
2. Domains → добавить кастомный домен (опционально)
3. Production deployment

---

### 8.2 Supabase production config

**В Supabase Dashboard:**
1. Settings → API → Allowed URLs:
   - Добавить `https://your-app.vercel.app`
2. Authentication → Redirect URLs:
   - Добавить `https://your-app.vercel.app/auth/callback`
3. Проверить RLS policies
4. Настроить rate limiting (если нужно)

---

### 8.3 Post-deploy checklist

- [ ] Проверить все роуты
- [ ] Проверить аутентификацию
- [ ] Проверить realtime обновления
- [ ] Проверить PWA install
- [ ] Проверить на разных устройствах
- [ ] Lighthouse audit (Performance, Accessibility, PWA)
- [ ] Sentry/error tracking (опционально)

---

## ДОПОЛНИТЕЛЬНЫЕ УЛУЧШЕНИЯ (Backlog)

### Фаза 2 (после MVP):
- [ ] Invite system для Workers
- [ ] Теги/категории для зон
- [ ] Кастомные операции (user-defined)
- [ ] Recurring tasks (еженедельная уборка)
- [ ] File attachments (фото до/после)
- [ ] Voice notes (audio)
- [ ] Multi-apartment support (несколько квартир для TaskMaster)
- [ ] Telegram bot integration
- [ ] Calendar integration
- [ ] Export reports (PDF)
- [ ] Dark/Light mode toggle
- [ ] Multi-language support
- [ ] Offline mode (Service Worker)

---

## TIMELINE SUMMARY

| Этап | Задача | Время |
|------|--------|-------|
| 0 | Подготовка (дизайн + геометрия) | 1-2 дня |
| 1 | Next.js миграция | 3-4 дня |
| 2 | Supabase setup | 2-3 дня |
| 3 | Аутентификация | 2-3 дня |
| 4 | Realtime | 2 дня |
| 5 | Роль-специфичные UI | 3-4 дня |
| 6 | Доп. функционал | 3-5 дней |
| 7 | Полировка | 2-3 дня |
| 8 | Деплой | 1 день |
| **TOTAL** | **MVP** | **~20-28 дней** |

---

## КРИТИЧЕСКИЕ МОМЕНТЫ

1. **Не пытайся сделать всё сразу** — работай поэтапно, проверяй каждый этап
2. **RLS policies критичны** — без них безопасность ломается
3. **Типизация спасёт время** — не игнорируй TypeScript ошибки
4. **Mobile-first обязателен** — iPhone — основной клиент
5. **Realtime может глючить** — добавь fallback на polling
6. **Тестируй на реальных данных** — seed более 100 записей для проверки производительности
7. **Git commits после каждого этапа** — чтобы можно было откатиться

---

## ФАЙЛЫ ДЛЯ СТАРТА

Когда будешь готов начать Этап 1, запроси:
1. `package.json` с полным списком зависимостей
2. `tailwind.config.ts` с финальной палитрой
3. Обновленную геометрию ROOMS после редизайна карты
4. Starter templates для компонентов

---

**Вопросы / Next Steps:**
- Когда начинаем Этап 0?
- Нужна ли помощь с редизайном карты?
- Какие приоритеты по функционалу (что сделать в первую очередь)?