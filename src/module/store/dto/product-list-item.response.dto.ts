export interface ProductListItemResponseDto {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  strikePrice: string | null;
  thumbnailUrl: string | null;
  category: { id: string; name: string; slug: string } | null;
}

interface ProductListItemSource {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  strikePrice?: string | null;
  images: { url: string }[];
  category: { id: string; name: string; slug: string } | null;
}

export function toProductListItemDto(
  product: ProductListItemSource,
): ProductListItemResponseDto {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    basePrice: product.basePrice,
    strikePrice: product.strikePrice ?? null,
    thumbnailUrl: product.images[0]?.url ?? null,
    category: product.category,
  };
}
