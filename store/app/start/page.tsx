import { allProducts } from "@/lib/db";
import { objClass } from "@/lib/formats";
import Quiz from "./quiz";

export const metadata = {
  title: "Not sure what to get? Take the 1-minute quiz | HelioConvert",
  description: "Answer five quick questions and get a bundle or course picked for your goal, your time and the way you like to learn.",
  alternates: { canonical: "/start" },
};

export default async function Start() {
  const items = await allProducts();
  const covers = ["Book", "Checklist", "Mini-Course"]
    .map((f) => items.find((i) => i.format === f && i.cover_url))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({ src: p.cover_url!, alt: p.title, obj: objClass(p.format) }));
  return <Quiz covers={covers} />;
}
