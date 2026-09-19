export interface ProductDetailResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: string;
  strikePrice: string | null;
  images: string[];
  category: { id: string; name: string; slug: string } | null;
  categories: { id: string; name: string; slug: string }[];
  variantTypes: { name: string; options: string[] }[];
  marketplaceLinks: { id: string; marketplaceName: string; iconUrl: string | null }[];
}

interface ProductDetailSource {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: string;
  strikePrice?: string | null;
  images: { url: string }[];
  category: { id: string; name: string; slug: string } | null;
  productCategories?: { category: { id: string; name: string; slug: string } }[];
  variantTypes: { name: string; options: { value: string }[] }[];
  marketplaceLinks: {
    id: string;
    marketplaceName: string;
    marketplace?: { iconUrl: string | null } | null;
  }[];
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
    strikePrice: product.strikePrice ?? null,
    images: product.images.map((image) => image.url),
    category: product.category,
    categories:
      product.productCategories && product.productCategories.length > 0
        ? product.productCategories.map((pc) => pc.category)
        : product.category
          ? [product.category]
          : [],
    variantTypes: product.variantTypes.map((variantType) => ({
      name: variantType.name,
      options: variantType.options.map((option) => option.value),
    })),
    marketplaceLinks: product.marketplaceLinks.map((link) => ({
      id: link.id,
      marketplaceName: link.marketplaceName,
      iconUrl: link.marketplace?.iconUrl ?? null,
    })),
  };
}
