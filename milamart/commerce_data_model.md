# Mila Shop & Studio — অর্ডার ডেটা মডেল

Shopify হবে ওয়েবসাইটের public পণ্যের মূল্য, স্টক, ছবি, ভ্যারিয়েন্ট এবং checkout-এর একমাত্র উৎস। Mila-এর protected dashboard আলাদাভাবে ফোন, WhatsApp, Home এবং Courier উৎসের manual order সংরক্ষণ করবে।

| ডেটা | কেন রাখা হচ্ছে |
|---|---|
| Customer name, phone, email, address | গ্রাহকের যোগাযোগ ও ডেলিভারির জন্য |
| Product summary, dimensions, quantity | কাস্টম স্টিকার বা মাপভিত্তিক অর্ডারের বিবরণের জন্য |
| Source ও delivery mode | Phone/WhatsApp/Walk-in উৎস এবং Home/Courier/Pickup ধরনের হিসাবের জন্য |
| Order value ও prepayment | বকেয়া অর্থ এবং অর্ডার সারসংক্ষেপ হিসাবের জন্য |
| Payment status ও order status | নতুন অর্ডার থেকে delivery পর্যন্ত ব্যবস্থাপনার জন্য |
| Shopify order ID | ভবিষ্যতে Shopify checkout অর্ডার যুক্ত করার জন্য |

> নির্দিষ্ট মূল্য বা স্টক জানা না থাকলে অ্যাডমিন অর্ডার ফর্মে তা কাল্পনিকভাবে যোগ করা হবে না।

