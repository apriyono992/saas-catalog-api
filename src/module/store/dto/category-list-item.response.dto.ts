export interface CategoryListItemResponseDto {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

interface CategoryListItemSource {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export function toCategoryListItemDto(
  category: CategoryListItemSource,
): CategoryListItemResponseDto {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    imageUrl: category.imageUrl,
  };
}
