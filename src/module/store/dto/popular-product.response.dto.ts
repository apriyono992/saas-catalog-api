import {
  ProductListItemResponseDto,
  toProductListItemDto,
} from './product-list-item.response.dto';

export interface PopularProductResponseDto extends ProductListItemResponseDto {
  clickCount: number;
}

interface PopularProductSource {
  id: string;
  name: string;
  slug: string;
  basePrice: string;
  images: { url: string }[];
  category: { id: string; name: string; slug: string } | null;
}

export function toPopularProductDto(
  product: PopularProductSource,
  clickCount: number,
): PopularProductResponseDto {
  return { ...toProductListItemDto(product), clickCount };
}
