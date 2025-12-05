export type CategoryOption = {
  id: string;
  name: string;
};

export type ClassroomFormProps = {
  classId: string;
  onSaved: () => void | Promise<void>;
  editingItem: Record<string, any> | null;
  onCancelEdit: () => void;
  categoryId?: string;
  categoryOptions?: CategoryOption[];
  onCategoryChange?: (value: string) => void;
  isCategoryLoading?: boolean;
  categoryError?: string | null;
};
