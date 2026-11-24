<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Public pages read data through publishable-key server functions in `src/lib/public.functions.ts`; all public writes (orders, appointments, reviews, leads, tracking) go through security-definer RPCs so prices and fees are computed in the database, never trusted from the browser.
- Admin screens live under `src/routes/_authenticated/admin.*` and use the browser client directly; access is enforced by RLS via `public.is_admin()` and the `user_roles` table, which admins get by having a confirmed email listed in `admin_emails`.
- Editable site copy, contacts, fees, delivery and payment details live in the `site_content` table (keys: clinic, home, about, store) and are merged with defaults in `src/lib/content.ts`.
- Uploaded images go to the private `media` bucket and are served through `/api/public/media/*`; store the bucket path, render with `mediaUrl()`.
- Delivery fee logic is mirrored in `src/lib/pricing.ts` (UI) and `place_order` (database); change both together and keep `src/test/pricing.test.ts` passing.
- The public site shell (header/footer/cart) is skipped for `/admin` paths in `src/routes/__root.tsx`.
