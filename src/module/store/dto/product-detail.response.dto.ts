export interface ProductDetailResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: string;
  images: string[];
  category: { id: string; name: string; slug: string } | null;
  variantTypes: { name: string; options: string[] }[];
  marketplaceLinks: { id: string; marketplaceName: string }[];
}

interface ProductDetailSource {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: string;
  images: { url: string }[];
  category: { id: string; name: string; slug: string } | null;
  variantTypes: { name: string; options: { value: string }[] }[];
  marketplaceLinks: { id: string; marketplaceName: string }[];
}

export function toProductDetailDto(
  product: ProductDetailSource,
): ProductDetailResponseDto {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: product.basePrice,
    images: product.images.map((image) => image.url),
    category: product.category,
    variantTypes: product.variantTypes.map((variantType) => ({
      name: variantType.name,
      options: variantType.options.map((option) => option.value),
    })),
    marketplaceLinks: product.marketplaceLinks.map((link) => ({
      id: link.id,
      marketplaceName: link.marketplaceName,
    })),
  };
}
