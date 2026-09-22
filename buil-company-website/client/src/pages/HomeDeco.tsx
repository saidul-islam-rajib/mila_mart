/** Mila “Navy Atelier” home-deco page: curated finishing items expressed with warm material cards. */
import CollectionPage from "@/pages/CollectionPage";
import { homeDecoEntries } from "@/data/catalog";

export default function HomeDeco() {
  return <CollectionPage eyebrow="MILA CATALOG — 03" title="Home Deco" highlight="Items" description="ঘরের শেষ ছোঁয়ায় আলো, সবুজ ও ছোট ডেকোর উপকরণ গুরুত্বপূর্ণ। আপনার জায়গার মুড ও ব্যবহার মাথায় রেখে বাছাই করা আইটেমের তথ্য জানতে পারেন।" entries={homeDecoEntries} note="আপনার ঘরের ছবি বা পছন্দের মুড পাঠান; কোন ধরনের ডেকোর উপযোগী হবে তা নিয়ে কথা বলা যাবে।" />;
}
