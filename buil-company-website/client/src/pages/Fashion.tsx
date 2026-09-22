/** Mila “Navy Atelier” fashion page: a forthcoming collection with no fabricated product availability claims. */
import CollectionPage from "@/pages/CollectionPage";
import { fashionEntries } from "@/data/catalog";

export default function Fashion() {
  return <CollectionPage eyebrow="MILA SELECTS · SECONDARY CATALOG — 04" title="Mila Selects" highlight="Fashion" description="ইন্টেরিয়র ও হোম-সংক্রান্ত মূল সেবার পাশাপাশি Mila Selects-এ সীমিত পরিসরে বাছাই করা Fashion, Bag ও Cosmetic যুক্ত হচ্ছে। এটি একটি সেকেন্ডারি ক্যাটালগ বিভাগ।" entries={fashionEntries} note="নির্দিষ্ট পণ্য, ছবি, মূল্য ও স্টক যোগ হলে এই সেকেন্ডারি বিভাগটি একটি পূর্ণাঙ্গ ক্যাটালগে রূপ নেবে।" />;
}
