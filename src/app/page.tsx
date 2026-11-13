import { Becoming } from "@/components/becoming";
import { owner, portfolio, publicEntries } from "@/content/portfolio";

export default function Home() {
  return <Becoming entries={publicEntries(portfolio)} owner={owner} />;
}
