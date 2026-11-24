import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Quote } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/site/Reveal";
import { Stars } from "@/components/site/Stars";
import { ReviewForm } from "@/components/site/ReviewForm";
import { reviewsQuery } from "@/lib/queries";
import teaImg from "@/assets/windowsill-tea.jpg";

export const Route = createFileRoute("/reviews")({
  loader: ({ context }) => context.queryClient.ensureQueryData(reviewsQuery),
  head: () => ({
    meta: [
      { title: "Patient Reviews — Khaliq Rahim Medical Center" },
      { name: "description", content: "Read what patients say about their homeopathic treatment with Dr. Khaliq Rahim, and share your own experience." },
      { property: "og:title", content: "Patient Reviews — Khaliq Rahim Medical Center" },
      { property: "og:description", content: "Real experiences from patients of Khaliq Rahim Medical Center, Islamabad." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Reviews,
});

function Reviews() {
  const { data: reviews } = useSuspenseQuery(reviewsQuery);
  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;
  return (
    <>
      <section className="relative overflow-hidden bg-hero">
        <div className="container-site grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <Reveal>
            <p className="eyebrow">Patient stories</p>
            <h1 className="mt-4 text-5xl font-medium leading-[1.02] md:text-7xl">Healing, in <em className="italic text-gradient">their words.</em></h1>
            {reviews.length > 0 && (
              <div className="mt-8 flex items-center gap-4">
                <p className="font-display text-6xl text-primary">{avg.toFixed(1)}</p>
                <div><Stars value={Math.round(avg)} size="size-5" /><p className="mt-1 text-sm text-muted-foreground">{reviews.length} approved reviews</p></div>
              </div>
            )}
          </Reveal>
          <Reveal from="zoom">
            <img src={teaImg} alt="A cup of herbal tea on a sunny windowsill" className="aspect-[4/3] w-full rounded-[2.5rem] object-cover shadow-lift" />
          </Reveal>
        </div>
      </section>
      <section className="container-site grid gap-12 py-16 md:py-24 lg:grid-cols-[1.5fr_1fr]">
        <div>
          {reviews.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">No reviews yet. Be the first to share your experience.</div>
          ) : (
            <Stagger className="columns-1 gap-5 md:columns-2 [&>*]:mb-5">
              {reviews.map((r) => (
                <StaggerItem key={r.id} className="break-inside-avoid">
                  <figure className="rounded-3xl bg-card p-7 shadow-soft">
                    <Quote className="size-8 text-accent" />
                    <blockquote className="mt-3 text-lg leading-relaxed">{r.comment}</blockquote>
                    <figcaption className="mt-5 flex items-center justify-between gap-3 text-sm">
                      <span><span className="font-semibold">{r.name}</span>{r.city ? <span className="text-muted-foreground"> · {r.city}</span> : null}<br /><span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "d MMM yyyy")}</span></span>
                      <Stars value={r.rating} />
                    </figcaption>
                    {r.products && (
                      <Link to="/shop/$slug" params={{ slug: r.products.slug }} className="mt-4 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">{r.products.name}</Link>
                    )}
                  </figure>
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
        <Reveal from="right" className="lg:sticky lg:top-28 lg:self-start">
          <ReviewForm productId={null} />
        </Reveal>
      </section>
    </>
  );
}
