import React, { useEffect, useState } from "react";

const normaliseCategoryItem = (item: any) => {
  if (item == null) {
    return null;
  }

  if (typeof item === "object") {
    const rawId = "id" in item ? item.id : "value" in item ? item.value : null;
    const rawName = "name" in item ? item.name : "label" in item ? item.label : rawId;

    const idString = rawId == null ? "" : String(rawId).trim();
    const nameString = rawName == null ? "" : String(rawName).trim();

    if (!idString || !nameString) {
      return null;
    }

    return { id: idString, name: nameString };
  }

  if (typeof item === "string") {
    const trimmed = item.trim();
    return trimmed ? { id: trimmed, name: trimmed } : null;
  }

  if (typeof item === "number" && Number.isFinite(item)) {
    const stringified = String(item);
    return { id: stringified, name: stringified };
  }

  return null;
};

const extractArrayPayload = (payload: any) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data)) {
      return payload.data;
    }

    if (Array.isArray(payload.results)) {
      return payload.results;
    }

    if (Array.isArray(payload.classes)) {
      return payload.classes;
    }
  }

  return [];
};

const resolveClassCategoryId = (cls: any, categoryList: any[]) => {
  if (!cls || typeof cls !== "object") {
    return null;
  }

  if ("categoryId" in cls && cls.categoryId != null) {
    return String(cls.categoryId);
  }

  if ("category_id" in cls && cls.category_id != null) {
    return String(cls.category_id);
  }

  const rawName =
    typeof cls.category === "string"
      ? cls.category
      : typeof cls.category_name === "string"
      ? cls.category_name
      : typeof cls.categoryName === "string"
      ? cls.categoryName
      : "";

  const name = rawName.trim();
  if (!name) {
    return null;
  }

  const matched = categoryList.find(
    (category) => category.name.localeCompare(name, 'ko', { sensitivity: 'base' }) === 0,
  );
  return matched ? matched.id : null;
};

export default function ClassSelector() {
  const [categories, setCategories] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState<any>({ categories: false, classes: false });
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setCategories([]);
    setLoading((prev) => ({ ...prev, categories: false }));
    setError(null);

    // async function fetchCategories() {
    //   setLoading((prev) => ({ ...prev, categories: true }));
    //   try {
    //     const payload = await apiFetch("/.netlify/functions/categories");
    //     const nextCategories = extractArrayPayload(payload)
    //       .map((item) => normaliseCategoryItem(item))
    //       .filter((item) => item !== null);
    //     setCategories(nextCategories);
    //   } catch (err) {
    //     console.error("Error fetching categories:", err);
    //     setError("카테고리 정보를 불러오지 못했습니다.");
    //   } finally {
    //     setLoading((prev) => ({ ...prev, categories: false }));
    //   }
    // }

    // fetchCategories();
  }, []);

  useEffect(() => {
    setClasses([]);
    setLoading((prev) => ({ ...prev, classes: false }));

    // async function fetchClasses() {
    //   setLoading((prev) => ({ ...prev, classes: true }));
    //   try {
    //     const payload = await apiFetch("/.netlify/functions/classes");
    //     const nextClasses = extractArrayPayload(payload);
    //     setClasses(nextClasses);
    //   } catch (err) {
    //     console.error("Error fetching classes:", err);
    //     setError("클래스 정보를 불러오지 못했습니다.");
    //   } finally {
    //     setLoading((prev) => ({ ...prev, classes: false }));
    //   }
    // }

    // fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setFiltered([]);
      return;
    }

    const filteredData = classes.filter((cls: any) => {
      const categoryId = resolveClassCategoryId(cls, categories);
      return categoryId !== null && String(categoryId) === String(selectedCategory);
    });
    setFiltered(filteredData);
  }, [selectedCategory, classes, categories]);

  const handleCategoryChange = (event: any) => {
    setSelectedCategory(event.target.value);
    setError(null);
  };

  const isLoading = loading.categories || loading.classes;

  return (
    <section className="class-selector">
      <header className="class-selector__header">
        <h2>클래스 선택</h2>
        <p>카테고리를 선택하면 해당 클래스 목록이 자동으로 표시됩니다.</p>
      </header>

      {/* 데이터 오류 안내 비활성화 */}

      <div className="class-selector__controls">
        <label htmlFor="category-select">카테고리</label>
        <select
          id="category-select"
          value={selectedCategory}
          onChange={handleCategoryChange}
          disabled={loading.categories}
        >
          <option value="" disabled>
            {loading.categories ? "카테고리 불러오는 중..." : "카테고리를 선택하세요"}
          </option>
          {categories.map((category: any) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="class-selector__results">
        {isLoading && <p>데이터 불러오는 중...</p>}

        {!isLoading && selectedCategory && filtered.length === 0 && (
          <p>선택한 카테고리에 해당하는 클래스가 없습니다.</p>
        )}

        {!isLoading && !selectedCategory && (
          <p>클래스를 확인하려면 카테고리를 선택하세요.</p>
        )}

        {!isLoading && filtered.length > 0 && (
          <ul className="class-selector__list">
            {filtered.map((cls: any) => {
              const rawTitle =
                typeof cls.title === "string"
                  ? cls.title
                  : typeof cls.name === "string"
                  ? cls.name
                  : null;
              const title = rawTitle && rawTitle.trim().length > 0 ? rawTitle : "수업";
              const description =
                typeof cls.description === "string"
                  ? cls.description
                  : typeof cls.overview === "string"
                  ? cls.overview
                  : null;

              return (
                <li key={cls.id ?? title} className="class-selector__item">
                  <h3>{title}</h3>
                  {description && <p>{description}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
