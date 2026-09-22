

export type Money = {
  amount: string; // decimal string, e.g. "385.00"
  currencyCode: string; // ISO 4217, e.g. "USD"
};

export type Image = {
  url: string;
  altText: string | null;
  width?: number;
  height?: number;
};

export type ProductOption = {
  name: string; // e.g. "Size"
  values: string[]; // e.g. ["Small", "Medium", "Large"]
};

export type SelectedOption = {
  name: string;
  value: string;
};

export type ProductVariant = {
  
  id: string;
  
  title: string;
  price: Money;
  compareAtPrice: Money | null;
  availableForSale: boolean;
  
  selectedOptions: SelectedOption[];
};

export type Product = {
  id: string;
  
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  productType: string | null;
  vendor: string | null;
  tags: string[];
  images: Image[];
  
  priceRange: { min: Money; max: Money };
  
  options: ProductOption[];
  variants: ProductVariant[];
};

export type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: Image | null;
};

export type CartItem = {
  
  lineId: string;
  variantId: string;
  productHandle: string;
  productTitle: string;
  variantTitle: string;
  image: Image | null;
  unitPrice: Money;
  quantity: number;
  lineTotal: Money;
};

export type Cart = {
  id: string;
  
  checkoutUrl: string;
  items: CartItem[];
  itemCount: number;
  subtotal: Money;
  total: Money;
};
