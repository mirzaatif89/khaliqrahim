DROP POLICY IF EXISTS "Anyone reads content" ON public.site_content;
CREATE POLICY "Anyone reads public content sections" ON public.site_content
  FOR SELECT TO anon, authenticated
  USING (key IN ('clinic', 'home', 'about', 'store') OR public.is_admin());