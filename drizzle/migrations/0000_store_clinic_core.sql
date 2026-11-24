
-- ROLES
create type public.app_role as enum ('admin', 'staff');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin')
$$;

create table public.admin_emails (
  email text primary key,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.admin_emails to authenticated;
grant all on public.admin_emails to service_role;
alter table public.admin_emails enable row level security;
create policy "Admins manage admin emails" on public.admin_emails for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.admin_emails (email) values ('khaliqrahimmedicalcenter@gmail.com');

create or replace function public.grant_admin_on_confirm()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and exists (select 1 from public.admin_emails where lower(email) = lower(new.email)) then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end; $$;

create trigger on_auth_user_admin_grant
after insert or update of email_confirmed_at on auth.users
for each row execute function public.grant_admin_on_confirm();

create or replace function public.grant_admin_on_email_added()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_roles (user_id, role)
  select u.id, 'admin' from auth.users u
  where lower(u.email) = lower(new.email) and u.email_confirmed_at is not null
  on conflict do nothing;
  return new;
end; $$;

create trigger on_admin_email_added
after insert on public.admin_emails
for each row execute function public.grant_admin_on_email_added();

create or replace function public.revoke_admin_on_email_removed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.user_roles r using auth.users u
  where r.user_id = u.id and r.role = 'admin' and lower(u.email) = lower(old.email);
  return old;
end; $$;

create trigger on_admin_email_removed
after delete on public.admin_emails
for each row execute function public.revoke_admin_on_email_removed();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- CMS
create table public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
grant select on public.site_content to anon, authenticated;
grant insert, update, delete on public.site_content to authenticated;
grant all on public.site_content to service_role;
alter table public.site_content enable row level security;
create policy "Anyone reads content" on public.site_content for select to anon, authenticated using (true);
create policy "Admins write content" on public.site_content for insert to authenticated with check (public.is_admin());
create policy "Admins update content" on public.site_content for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete content" on public.site_content for delete to authenticated using (public.is_admin());
create trigger site_content_touch before update on public.site_content for each row execute function public.touch_updated_at();

-- CATALOG
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  tone text not null default 'sage',
  icon text not null default 'leaf',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Anyone reads categories" on public.categories for select to anon, authenticated using (true);
create policy "Admins insert categories" on public.categories for insert to authenticated with check (public.is_admin());
create policy "Admins update categories" on public.categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete categories" on public.categories for delete to authenticated using (public.is_admin());

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  price int not null check (price >= 0),
  compare_at_price int check (compare_at_price is null or compare_at_price >= 0),
  size text,
  short_description text,
  description text,
  uses text[] not null default '{}',
  dosage text,
  ingredients text,
  image_url text,
  stock int not null default 100,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Anyone reads active products" on public.products for select to anon, authenticated using (is_active or public.is_admin());
create policy "Admins insert products" on public.products for insert to authenticated with check (public.is_admin());
create policy "Admins update products" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete products" on public.products for delete to authenticated using (public.is_admin());
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

-- CUSTOMERS
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  email text,
  city text,
  address text,
  visitor_ids text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
grant select, update, delete on public.customers to authenticated;
grant all on public.customers to service_role;
alter table public.customers enable row level security;
create policy "Admins read customers" on public.customers for select to authenticated using (public.is_admin());
create policy "Admins update customers" on public.customers for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete customers" on public.customers for delete to authenticated using (public.is_admin());

-- ORDERS
create sequence public.order_number_seq start 1001;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  phone text not null,
  email text,
  address text not null,
  city text not null,
  notes text,
  payment_method text not null check (payment_method in ('cod','jazzcash','easypaisa','bank')),
  payment_reference text,
  payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
  status text not null default 'pending' check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  subtotal int not null,
  delivery_fee int not null,
  total int not null,
  visitor_id text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "Admins read orders" on public.orders for select to authenticated using (public.is_admin());
create policy "Admins update orders" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete orders" on public.orders for delete to authenticated using (public.is_admin());
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  unit_price int not null,
  quantity int not null check (quantity > 0),
  line_total int not null
);
grant select on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "Admins read order items" on public.order_items for select to authenticated using (public.is_admin());

-- APPOINTMENTS
create sequence public.ticket_number_seq start 1001;
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  patient_name text not null,
  phone text not null,
  email text,
  age int,
  gender text,
  consultation_type text not null check (consultation_type in ('in_clinic','online','follow_up')),
  preferred_date date not null,
  preferred_time text not null,
  complaint text,
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled','no_show')),
  fee int,
  visitor_id text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update, delete on public.appointments to authenticated;
grant all on public.appointments to service_role;
alter table public.appointments enable row level security;
create policy "Admins read appointments" on public.appointments for select to authenticated using (public.is_admin());
create policy "Admins update appointments" on public.appointments for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete appointments" on public.appointments for delete to authenticated using (public.is_admin());
create trigger appointments_touch before update on public.appointments for each row execute function public.touch_updated_at();

-- LEADS
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  name text not null,
  phone text not null,
  email text,
  product_id uuid references public.products(id) on delete set null,
  source text not null default 'contact' check (source in ('product_inquiry','contact','callback')),
  message text,
  status text not null default 'new' check (status in ('new','contacted','converted','closed')),
  visitor_id text,
  created_at timestamptz not null default now()
);
grant select, update, delete on public.leads to authenticated;
grant all on public.leads to service_role;
alter table public.leads enable row level security;
create policy "Admins read leads" on public.leads for select to authenticated using (public.is_admin());
create policy "Admins update leads" on public.leads for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete leads" on public.leads for delete to authenticated using (public.is_admin());

-- PRODUCT EVENTS
create table public.product_events (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  product_id uuid not null references public.products(id) on delete cascade,
  event text not null check (event in ('view','add_to_cart','whatsapp','inquiry','purchase')),
  created_at timestamptz not null default now()
);
create index product_events_product_idx on public.product_events(product_id, event);
create index product_events_visitor_idx on public.product_events(visitor_id);
grant select on public.product_events to authenticated;
grant all on public.product_events to service_role;
alter table public.product_events enable row level security;
create policy "Admins read events" on public.product_events for select to authenticated using (public.is_admin());

-- REVIEWS
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  name text not null,
  city text,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);
grant select on public.reviews to anon, authenticated;
grant update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "Anyone reads approved reviews" on public.reviews for select to anon, authenticated using (status = 'approved' or public.is_admin());
create policy "Admins update reviews" on public.reviews for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins delete reviews" on public.reviews for delete to authenticated using (public.is_admin());

-- HELPERS (internal)
create or replace function public.normalize_phone(p text)
returns text language plpgsql immutable set search_path = public as $$
declare d text;
begin
  d := regexp_replace(coalesce(p,''), '[^0-9]', '', 'g');
  if length(d) = 12 and left(d, 2) = '92' then d := '0' || substr(d, 3); end if;
  if length(d) = 10 and left(d, 1) = '3' then d := '0' || d; end if;
  return d;
end; $$;

create or replace function public.upsert_customer(p_name text, p_phone text, p_email text, p_city text, p_address text, p_visitor text)
returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  insert into public.customers (name, phone, email, city, address, visitor_ids)
  values (p_name, p_phone, nullif(p_email,''), nullif(p_city,''), nullif(p_address,''),
          case when coalesce(p_visitor,'') = '' then '{}'::text[] else array[p_visitor] end)
  on conflict (phone) do update set
    name = excluded.name,
    email = coalesce(excluded.email, customers.email),
    city = coalesce(excluded.city, customers.city),
    address = coalesce(excluded.address, customers.address),
    visitor_ids = case when coalesce(p_visitor,'') = '' or p_visitor = any(customers.visitor_ids) then customers.visitor_ids
                       else array_append(customers.visitor_ids, p_visitor) end,
    last_seen_at = now()
  returning id into cid;
  return cid;
end; $$;
revoke execute on function public.upsert_customer(text,text,text,text,text,text) from public, anon, authenticated;

-- PUBLIC RPCs
create or replace function public.place_order(
  p_name text, p_phone text, p_email text, p_address text, p_city text, p_notes text,
  p_payment_method text, p_payment_reference text, p_items jsonb, p_visitor text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_phone text := public.normalize_phone(p_phone);
  v_cid uuid; v_order_id uuid; v_number text;
  v_sub int := 0; v_fee int; v_free int; v_store jsonb;
  it jsonb; v_prod record; v_qty int; v_count int := 0;
begin
  if length(trim(coalesce(p_name,''))) < 2 or length(p_name) > 100 then raise exception 'Please enter your full name'; end if;
  if length(v_phone) <> 11 then raise exception 'Please enter a valid mobile number (e.g. 0333-0501084)'; end if;
  if length(trim(coalesce(p_address,''))) < 8 or length(p_address) > 500 then raise exception 'Please enter your complete delivery address'; end if;
  if length(trim(coalesce(p_city,''))) < 2 or length(p_city) > 80 then raise exception 'Please enter your city'; end if;
  if p_payment_method not in ('cod','jazzcash','easypaisa','bank') then raise exception 'Invalid payment method'; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then raise exception 'Your cart is empty'; end if;
  if jsonb_array_length(p_items) > 30 then raise exception 'Too many items'; end if;

  v_cid := public.upsert_customer(trim(p_name), v_phone, p_email, trim(p_city), trim(p_address), p_visitor);
  v_number := 'KR' || nextval('public.order_number_seq');

  insert into public.orders (order_number, customer_id, customer_name, phone, email, address, city, notes,
    payment_method, payment_reference, subtotal, delivery_fee, total, visitor_id)
  values (v_number, v_cid, trim(p_name), v_phone, nullif(p_email,''), trim(p_address), trim(p_city), left(nullif(p_notes,''), 1000),
    p_payment_method, left(nullif(p_payment_reference,''), 100), 0, 0, 0, nullif(p_visitor,''))
  returning id into v_order_id;

  for it in select * from jsonb_array_elements(p_items) loop
    v_qty := coalesce((it->>'quantity')::int, 0);
    if v_qty < 1 or v_qty > 20 then raise exception 'Invalid quantity'; end if;
    select id, name, price, stock into v_prod from public.products where id = (it->>'product_id')::uuid and is_active;
    if not found then raise exception 'A product in your cart is no longer available'; end if;
    if v_prod.stock < v_qty then raise exception '% is out of stock', v_prod.name; end if;
    update public.products set stock = stock - v_qty where id = v_prod.id;
    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
    values (v_order_id, v_prod.id, v_prod.name, v_prod.price, v_qty, v_prod.price * v_qty);
    if coalesce(p_visitor,'') <> '' then
      insert into public.product_events (visitor_id, product_id, event) values (p_visitor, v_prod.id, 'purchase');
    end if;
    v_sub := v_sub + v_prod.price * v_qty;
    v_count := v_count + 1;
  end loop;

  select value into v_store from public.site_content where key = 'store';
  v_fee := coalesce((v_store->>'delivery_fee')::int, 250);
  v_free := coalesce((v_store->>'free_delivery_over')::int, 3000);
  if v_free > 0 and v_sub >= v_free then v_fee := 0; end if;

  update public.orders set subtotal = v_sub, delivery_fee = v_fee, total = v_sub + v_fee where id = v_order_id;
  return jsonb_build_object('order_number', v_number, 'subtotal', v_sub, 'delivery_fee', v_fee, 'total', v_sub + v_fee, 'phone', v_phone);
end; $$;
grant execute on function public.place_order(text,text,text,text,text,text,text,text,jsonb,text) to anon, authenticated;

create or replace function public.track_order(p_order_number text, p_phone text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare o record; items jsonb;
begin
  select * into o from public.orders where upper(order_number) = upper(trim(p_order_number)) and phone = public.normalize_phone(p_phone);
  if not found then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('name', product_name, 'quantity', quantity, 'unit_price', unit_price, 'line_total', line_total)), '[]'::jsonb)
    into items from public.order_items where order_id = o.id;
  return jsonb_build_object('order_number', o.order_number, 'status', o.status, 'payment_status', o.payment_status,
    'payment_method', o.payment_method, 'customer_name', o.customer_name, 'city', o.city,
    'subtotal', o.subtotal, 'delivery_fee', o.delivery_fee, 'total', o.total, 'created_at', o.created_at, 'items', items);
end; $$;
grant execute on function public.track_order(text,text) to anon, authenticated;

create or replace function public.book_appointment(
  p_name text, p_phone text, p_email text, p_age int, p_gender text, p_type text,
  p_date date, p_time text, p_complaint text, p_visitor text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_phone text := public.normalize_phone(p_phone); v_cid uuid; v_ticket text; v_fee int; v_clinic jsonb;
begin
  if length(trim(coalesce(p_name,''))) < 2 or length(p_name) > 100 then raise exception 'Please enter the patient name'; end if;
  if length(v_phone) <> 11 then raise exception 'Please enter a valid mobile number (e.g. 0333-0501084)'; end if;
  if p_type not in ('in_clinic','online','follow_up') then raise exception 'Please choose a consultation type'; end if;
  if p_date is null or p_date < (now() at time zone 'Asia/Karachi')::date then raise exception 'Please choose today or a future date'; end if;
  if p_date > (now() at time zone 'Asia/Karachi')::date + 60 then raise exception 'Please choose a date within the next 60 days'; end if;
  if extract(dow from p_date) = 0 then raise exception 'The clinic is closed on Sunday. Please choose Monday to Saturday.'; end if;
  if coalesce(p_time,'') = '' or length(p_time) > 20 then raise exception 'Please choose a time'; end if;
  if p_age is not null and (p_age < 0 or p_age > 120) then raise exception 'Please enter a valid age'; end if;

  select value into v_clinic from public.site_content where key = 'clinic';
  v_fee := case p_type
    when 'in_clinic' then coalesce((v_clinic->'fees'->>'consultation')::int, 1000)
    when 'follow_up' then coalesce((v_clinic->'fees'->>'follow_up')::int, 500)
    else null end;

  v_cid := public.upsert_customer(trim(p_name), v_phone, p_email, null, null, p_visitor);
  v_ticket := 'KRT-' || nextval('public.ticket_number_seq');
  insert into public.appointments (ticket_number, customer_id, patient_name, phone, email, age, gender, consultation_type,
    preferred_date, preferred_time, complaint, fee, visitor_id)
  values (v_ticket, v_cid, trim(p_name), v_phone, nullif(p_email,''), p_age, nullif(p_gender,''), p_type,
    p_date, p_time, left(nullif(p_complaint,''), 2000), v_fee, nullif(p_visitor,''));
  return jsonb_build_object('ticket_number', v_ticket, 'fee', v_fee, 'date', p_date, 'time', p_time, 'type', p_type, 'name', trim(p_name));
end; $$;
grant execute on function public.book_appointment(text,text,text,int,text,text,date,text,text,text) to anon, authenticated;

create or replace function public.submit_lead(p_name text, p_phone text, p_email text, p_product_id uuid, p_source text, p_message text, p_visitor text)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_phone text := public.normalize_phone(p_phone); v_cid uuid;
begin
  if length(trim(coalesce(p_name,''))) < 2 or length(p_name) > 100 then raise exception 'Please enter your name'; end if;
  if length(v_phone) <> 11 then raise exception 'Please enter a valid mobile number'; end if;
  if p_source not in ('product_inquiry','contact','callback') then raise exception 'Invalid request'; end if;
  v_cid := public.upsert_customer(trim(p_name), v_phone, p_email, null, null, p_visitor);
  insert into public.leads (customer_id, name, phone, email, product_id, source, message, visitor_id)
  values (v_cid, trim(p_name), v_phone, nullif(p_email,''), p_product_id, p_source, left(nullif(p_message,''), 2000), nullif(p_visitor,''));
  if p_product_id is not null and coalesce(p_visitor,'') <> '' then
    insert into public.product_events (visitor_id, product_id, event) values (p_visitor, p_product_id, 'inquiry');
  end if;
  return true;
end; $$;
grant execute on function public.submit_lead(text,text,text,uuid,text,text,text) to anon, authenticated;

create or replace function public.submit_review(p_product_id uuid, p_name text, p_city text, p_rating int, p_comment text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if length(trim(coalesce(p_name,''))) < 2 or length(p_name) > 80 then raise exception 'Please enter your name'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'Please choose a rating'; end if;
  if length(trim(coalesce(p_comment,''))) < 5 or length(p_comment) > 1500 then raise exception 'Please write a few words about your experience'; end if;
  insert into public.reviews (product_id, name, city, rating, comment) values (p_product_id, trim(p_name), left(nullif(trim(p_city),''), 80), p_rating, trim(p_comment));
  return true;
end; $$;
grant execute on function public.submit_review(uuid,text,text,int,text) to anon, authenticated;

create or replace function public.track_product_event(p_visitor text, p_product_id uuid, p_event text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(p_visitor,'') = '' or length(p_visitor) > 64 then return; end if;
  if p_event not in ('view','add_to_cart','whatsapp') then return; end if;
  if not exists (select 1 from public.products where id = p_product_id) then return; end if;
  insert into public.product_events (visitor_id, product_id, event) values (p_visitor, p_product_id, p_event);
end; $$;
grant execute on function public.track_product_event(text,uuid,text) to anon, authenticated;

-- ADMIN INSIGHTS
create or replace function public.admin_product_insights(p_days int default 30)
returns table (product_id uuid, name text, image_url text, views bigint, carts bigint, whatsapp bigint, inquiries bigint, purchases bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Forbidden'; end if;
  return query
  select p.id, p.name, p.image_url,
    count(*) filter (where e.event = 'view'),
    count(*) filter (where e.event = 'add_to_cart'),
    count(*) filter (where e.event = 'whatsapp'),
    count(*) filter (where e.event = 'inquiry'),
    count(*) filter (where e.event = 'purchase')
  from public.products p
  left join public.product_events e on e.product_id = p.id and e.created_at > now() - make_interval(days => p_days)
  group by p.id order by 4 desc, 8 desc;
end; $$;
grant execute on function public.admin_product_insights(int) to authenticated;

create or replace function public.admin_customer_interests(p_customer_id uuid)
returns table (product_id uuid, name text, views bigint, carts bigint, whatsapp bigint, inquiries bigint, purchases bigint, last_seen timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Forbidden'; end if;
  return query
  select p.id, p.name,
    count(*) filter (where e.event = 'view'),
    count(*) filter (where e.event = 'add_to_cart'),
    count(*) filter (where e.event = 'whatsapp'),
    count(*) filter (where e.event = 'inquiry'),
    count(*) filter (where e.event = 'purchase'),
    max(e.created_at)
  from public.customers c
  join public.product_events e on e.visitor_id = any(c.visitor_ids)
  join public.products p on p.id = e.product_id
  where c.id = p_customer_id
  group by p.id order by max(e.created_at) desc;
end; $$;
grant execute on function public.admin_customer_interests(uuid) to authenticated;

create or replace function public.admin_hot_leads(p_days int default 30)
returns table (customer_id uuid, customer_name text, phone text, product_id uuid, product_name text, carts bigint, views bigint, last_seen timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Forbidden'; end if;
  return query
  select c.id, c.name, c.phone, p.id, p.name,
    count(*) filter (where e.event = 'add_to_cart'),
    count(*) filter (where e.event = 'view'),
    max(e.created_at)
  from public.customers c
  join public.product_events e on e.visitor_id = any(c.visitor_ids) and e.created_at > now() - make_interval(days => p_days)
  join public.products p on p.id = e.product_id
  where not exists (
    select 1 from public.product_events e2
    where e2.product_id = p.id and e2.event = 'purchase' and e2.visitor_id = any(c.visitor_ids)
  )
  group by c.id, p.id
  having count(*) filter (where e.event in ('add_to_cart','whatsapp','inquiry')) > 0 or count(*) filter (where e.event = 'view') >= 2
  order by max(e.created_at) desc
  limit 100;
end; $$;
grant execute on function public.admin_hot_leads(int) to authenticated;

-- SEED: CONTENT
insert into public.site_content (key, value) values
('clinic', '{
  "name": "Khaliq Rahim Medical Center",
  "doctor_name": "Dr. Khaliq Rahim",
  "doctor_title": "Homeopathic Specialist · Physician & Consultant",
  "experience_years": 30,
  "qualifications": ["Ph.D (I.Land)", "Doctorate of Medicine (U.K)", "D.I.HOM (UK)", "B.H.M.S — University of Peshawar", "DHMS (PAK)", "Ex. Medical Officer IHMC (IBD)"],
  "phone": "0333-0501084",
  "whatsapp": "923330501084",
  "email": "khaliqrahimmedicalcenter@gmail.com",
  "address": "Kiyani Road, Near Athal Chowk, Bhara Kahu, Islamabad",
  "city": "Bhara Kahu, Islamabad",
  "maps_url": "https://maps.app.goo.gl/M8nBCR6EZgvxMCYk6",
  "hours": "Monday – Saturday, 9:00 AM – 8:00 PM",
  "holiday": "Sunday closed",
  "fees": {"consultation": 1000, "follow_up": 500, "online": "Depends on case"},
  "social": {"facebook": "https://www.facebook.com/share/1FBG3Zmdbm/", "instagram": "https://www.instagram.com/krhomeomedical", "tiktok": "https://www.tiktok.com/@krhomeo", "youtube": ""},
  "doctor_photo_url": "",
  "logo_url": "",
  "certificate_url": ""
}'::jsonb),
('home', '{
  "announcement": "Home delivery across Pakistan · Cash on Delivery · WhatsApp 0333-0501084",
  "hero_eyebrow": "Homeopathic Clinic & Medicine Store · Islamabad",
  "hero_title": "Gentle healing,",
  "hero_highlight": "for the whole you.",
  "hero_subtitle": "Individualized homeopathic treatment by Dr. Khaliq Rahim — 30+ years of experience. Consult in clinic or online, and get your medicines delivered to your door."
}'::jsonb),
('about', '{
  "doctor_intro": "Dr. Khaliq Rahim is a homeopathic physician and consultant with more than three decades of clinical practice. Trained in Pakistan and the United Kingdom, he treats every patient as a whole person — listening carefully to the body, the mind and the story behind each complaint before choosing a remedy.",
  "mission": "To make safe, gentle and individualized homeopathic care easy to reach — in our clinic, online, and right at your doorstep.",
  "vision": "A healthier community where families trust natural, side‑effect‑conscious treatment guided by real clinical experience."
}'::jsonb),
('store', '{
  "delivery_fee": 250,
  "free_delivery_over": 3000,
  "delivery_time": "2–4 working days across Pakistan",
  "jazzcash_number": "",
  "jazzcash_title": "",
  "easypaisa_number": "",
  "easypaisa_title": "",
  "bank_name": "",
  "bank_account_title": "",
  "bank_account_number": "",
  "bank_iban": ""
}'::jsonb);

-- SEED: CATEGORIES
insert into public.categories (name, slug, description, tone, icon, sort_order) values
('Mother Tinctures', 'mother-tinctures', 'Pure Q‑strength plant extracts for gentle, everyday support.', 'sage', 'sprout', 1),
('Dilutions & Potencies', 'dilutions', 'Classical remedies in 30, 200 and 1M potencies.', 'sky', 'droplets', 2),
('Biochemic Tablets', 'biochemic', 'Tissue salts and combinations for nerves, bones and energy.', 'sand', 'pill', 3),
('Syrups & Tonics', 'syrups-tonics', 'Family‑friendly syrups and restorative tonics.', 'blush', 'flask', 4),
('Skin & Hair Care', 'skin-hair', 'Natural oils, creams and remedies for skin and hair.', 'mint', 'flower', 5),
('Treatment Kits', 'treatment-kits', 'Doctor‑designed courses for common long‑term complaints.', 'gold', 'package', 6);

-- SEED: PRODUCTS
insert into public.products (slug, name, category_id, price, compare_at_price, size, short_description, description, uses, dosage, ingredients, image_url, stock, is_featured, sort_order)
select v.slug, v.name, c.id, v.price, v.compare, v.size, v.short, v.descr, v.uses, v.dosage, v.ingr, v.img, 100, v.featured, v.sort
from (values
 ('arnica-montana-30', 'Arnica Montana 30', 'dilutions', 450, null::int, '30 ml', 'The classic remedy for bruises, muscle soreness and shock after injury.', 'Arnica Montana is one of the best known homeopathic remedies. It is commonly used after falls, sprains, over‑exertion and minor injuries, and is a trusted first‑aid companion for every home.', array['Bruises & swelling','Muscle soreness','After injury or over‑exertion'], '3–4 drops on the tongue, 3 times a day, or as directed by the doctor.', 'Arnica montana 30C in alcohol base', '/images/products/arnica-montana-30.jpg', true, 1),
 ('berberis-vulgaris-q', 'Berberis Vulgaris Q', 'mother-tinctures', 650, 750, '30 ml', 'Mother tincture traditionally used for kidney and urinary comfort.', 'Berberis Vulgaris Q is a mother tincture prepared from barberry. It is widely used in homeopathy to support the kidneys and urinary tract, and for back pain radiating from the kidney region.', array['Kidney stone support','Urinary discomfort','Kidney region back pain'], '10–15 drops in half a cup of water, 3 times a day.', 'Berberis vulgaris mother tincture (Q)', '/images/products/berberis-vulgaris-q.jpg', true, 2),
 ('calendula-q', 'Calendula Q', 'mother-tinctures', 600, null, '30 ml', 'Soothing marigold tincture for cuts, wounds and skin healing.', 'Calendula Q is the natural antiseptic of homeopathy. Diluted in water it can be applied to minor cuts, scrapes and skin irritation to support clean, quick healing.', array['Minor cuts & wounds','Skin irritation','Mouth ulcers (as rinse)'], 'External: 10 drops in a little boiled water, apply on the area. Internal use only as advised.', 'Calendula officinalis mother tincture (Q)', '/images/products/calendula-q.jpg', false, 3),
 ('nux-vomica-200', 'Nux Vomica 200', 'dilutions', 450, null, '30 ml', 'For acidity, indigestion and the effects of a stressful lifestyle.', 'Nux Vomica is a well known remedy for digestive complaints linked to stress, late nights, rich food and irregular routines — acidity, gas, constipation and irritability.', array['Acidity & gas','Constipation','Stress‑related indigestion'], '3–4 drops on the tongue, twice a day, or as directed.', 'Strychnos nux‑vomica 200C', '/images/products/nux-vomica-200.jpg', true, 4),
 ('five-phos-tablets', 'Five Phos Tablets', 'biochemic', 550, null, '450 tablets', 'Biochemic nerve tonic for tiredness, weakness and mental fatigue.', 'Five Phos combines five phosphate tissue salts that nourish the nerves and muscles. It is a popular general tonic for students, working adults and the elderly.', array['Physical & mental fatigue','Nervous weakness','Poor concentration'], '4 tablets 3 times a day, or as directed.', 'Calc phos, Ferrum phos, Kali phos, Mag phos, Nat phos 6X', '/images/products/five-phos-tablets.jpg', true, 5),
 ('kali-phos-6x', 'Kali Phos 6X', 'biochemic', 400, null, '450 tablets', 'Calming tissue salt for stress, exam nerves and restless sleep.', 'Kali Phos is known as the nerve nutrient of biochemic medicine. It is used for nervous exhaustion, worry, sleeplessness from overthinking and stress headaches.', array['Stress & anxiety','Sleeplessness','Nervous headache'], '4 tablets 3 times a day.', 'Kalium phosphoricum 6X', '/images/products/kali-phos-6x.jpg', false, 6),
 ('alfalfa-tonic', 'Alfalfa Tonic', 'syrups-tonics', 750, 850, '450 ml', 'Appetite and energy tonic for the whole family.', 'Alfalfa Tonic is a classic homeopathic general tonic that supports healthy appetite, digestion and energy. Suitable for adults and children recovering from illness or feeling run down.', array['Poor appetite','Weakness & low energy','Recovery after illness'], 'Adults: 2 teaspoons 3 times a day. Children: 1 teaspoon.', 'Alfalfa Q, Avena sativa Q, Ginseng Q and other remedies', '/images/products/alfalfa-tonic.jpg', true, 7),
 ('drosera-cough-syrup', 'Drosera Cough Syrup', 'syrups-tonics', 480, null, '120 ml', 'Soothing syrup for dry, tickly and spasmodic cough.', 'A gentle homeopathic cough syrup based on Drosera and supporting remedies. Helps soothe dry, irritating and night‑time coughs in adults and children.', array['Dry cough','Night cough','Throat irritation'], 'Adults: 2 teaspoons 3–4 times a day. Children: 1 teaspoon.', 'Drosera, Bryonia, Spongia, Ipecac in syrup base', '/images/products/drosera-cough-syrup.jpg', false, 8),
 ('jaborandi-hair-oil', 'Jaborandi Hair Oil', 'skin-hair', 700, null, '200 ml', 'Nourishing hair oil to reduce hair fall and support healthy growth.', 'A homeopathic hair oil enriched with Jaborandi and Arnica, massaged into the scalp to strengthen roots, reduce hair fall and keep dandruff under control.', array['Hair fall','Weak hair roots','Dandruff'], 'Massage gently into the scalp 3–4 times a week; leave on for at least 1 hour.', 'Jaborandi Q, Arnica Q, Cantharis Q in natural oil base', '/images/products/jaborandi-hair-oil.jpg', true, 9),
 ('thuja-skin-cream', 'Thuja Skin Cream', 'skin-hair', 520, null, '25 g', 'Gentle cream for warts, moles and rough skin patches.', 'Thuja Occidentalis is the best known homeopathic remedy for skin growths. This cream is applied locally on warts and rough skin, and works best alongside the doctor‑advised internal remedy.', array['Warts','Rough skin patches','Skin tags'], 'Apply a thin layer on the affected area twice a day.', 'Thuja occidentalis Q in cream base', '/images/products/thuja-skin-cream.jpg', false, 10),
 ('rhus-tox-30', 'Rhus Tox 30', 'dilutions', 450, null, '30 ml', 'For stiff joints and back pain that feel better with movement.', 'Rhus Toxicodendron is a leading remedy for joint and muscle stiffness that is worse in the morning or in cold, damp weather, and eases with gentle movement.', array['Joint stiffness','Back pain','Sprains'], '3–4 drops on the tongue, 3 times a day.', 'Rhus toxicodendron 30C', '/images/products/rhus-tox-30.jpg', false, 11),
 ('avena-sativa-q', 'Avena Sativa Q', 'mother-tinctures', 650, null, '30 ml', 'Oat tincture for restful sleep, calm nerves and steady energy.', 'Avena Sativa Q is made from the common oat. It is a gentle nerve tonic used for sleeplessness, nervous exhaustion and weakness after long illness.', array['Sleeplessness','Nervous exhaustion','General weakness'], '10–15 drops in water, twice a day.', 'Avena sativa mother tincture (Q)', '/images/products/avena-sativa-q.jpg', false, 12),
 ('femi-care-tonic', 'Femi Care Tonic', 'syrups-tonics', 800, null, '200 ml', 'Supports a comfortable, regular monthly cycle and hormonal balance.', 'A women''s health tonic combining Pulsatilla, Sepia and other classical remedies to support a regular cycle, ease cramps and reduce weakness.', array['Irregular periods','Period cramps','Weakness & fatigue'], '2 teaspoons twice a day, or as directed.', 'Pulsatilla, Sepia, Senecio, Ashoka in syrup base', '/images/products/femi-care-tonic.jpg', true, 13),
 ('joint-care-kit', 'Joint Care Treatment Kit', 'treatment-kits', 2400, 2800, '1 month course', 'A doctor‑designed one‑month course for joint pain and stiffness.', 'This kit combines internal remedies and a topical oil chosen by Dr. Khaliq Rahim for common joint pain and stiffness. For best results, share your case with the doctor on WhatsApp after ordering.', array['Knee & joint pain','Morning stiffness','Arthritis support'], 'Follow the dosage card inside the kit.', 'Rhus tox, Bryonia, Ruta, Calc fluor 6X and Arnica oil', '/images/products/joint-care-kit.jpg', true, 14)
) as v(slug, name, cat, price, compare, size, short, descr, uses, dosage, ingr, img, featured, sort)
join public.categories c on c.slug = v.cat;
