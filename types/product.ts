export interface WooImage {
  id?: number;
  src: string;
  alt?: string;
}

export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regular_price: string;
  sale_price: string;
  images: WooImage[];
  short_description: string;
  description: string;
}

export interface CatalogProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  image: string | null;
  imageAlt: string;
  shortDescription: string;
  description: string;
}
