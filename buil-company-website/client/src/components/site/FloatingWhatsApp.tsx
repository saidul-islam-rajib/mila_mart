/** Mila “Navy Atelier” contact control: a fixed, high-contrast WhatsApp route on every page. */
import { MessageCircle } from "lucide-react";

const whatsappUrl = "https://wa.me/8801404225856?text=%E0%A6%86%E0%A6%B8%E0%A7%8D%E0%A6%B8%E0%A6%BE%E0%A6%B2%E0%A6%BE%E0%A6%AE%E0%A7%81%20%E0%A6%86%E0%A6%B2%E0%A6%BE%E0%A6%87%E0%A6%95%E0%A7%81%E0%A6%AE%2C%20Mila%20Interior%20Solutions-%E0%A6%8F%E0%A6%B0%20%E0%A6%AA%E0%A6%A3%E0%A7%8D%E0%A6%AF%2F%E0%A6%B8%E0%A7%87%E0%A6%AC%E0%A6%BE%20%E0%A6%B8%E0%A6%AE%E0%A7%8D%E0%A6%AA%E0%A6%B0%E0%A7%8D%E0%A6%95%E0%A7%87%20%E0%A6%9C%E0%A6%BE%E0%A6%A8%E0%A6%A4%E0%A7%87%20%E0%A6%9A%E0%A6%BE%E0%A6%87%E0%A5%A4";

export default function FloatingWhatsApp() {
  return (
    <a className="floating-whatsapp" href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="WhatsApp-এ Mila Interior Solutions-কে বার্তা পাঠান">
      <MessageCircle size={22} aria-hidden="true" />
      <span>WhatsApp</span>
    </a>
  );
}
