import { useEffect, useState } from "react";

export default function ClassSelector() {
  const [categories, setCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState({ categories: false, classes: false });
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCategories() {
      setLoading((prev) => ({ ...prev, categories: true }));
      try {
        const res = await fetch("/_functions/api/class_categories");
        if (!res.ok) {
          throw new Error(`Failed to fetch categories: ${res.status}`);
        }
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("카테고리 정보를 불러오지 못했습니다.");
      } finally {
        setLoading((prev) => ({ ...prev, categories: false }));
      }
    }

    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchClasses() {
      setLoading((prev) => ({ ...prev, classes: true }));
      try {
        const res = await fetch("/_functions/api/classes");
        if (!res.ok) {
          throw new Error(`Failed to fetch classes: ${res.status}`);
        }
        const data = await res.json();
        setClasses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching classes:", err);
        setError("클래스 정보를 불러오지 못했습니다.");
      } finally {
        setLoading((prev) => ({ ...prev, classes: false }));
      }
    }

    fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setFiltered([]);
      return;
    }

    const filteredData = classes.filter(
      (c) => String(c.categoryId) === String(selectedCategory)
    );
    setFiltered(filteredData);
  }, [selectedCategory, classes]);

  const handleCategoryChange = (event) => {
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

      {error && <p className="class-selector__error">{error}</p>}

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
          {categories.map((category) => (
            <option key={category.id ?? category.slug} value={category.id}>
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
            {filtered.map((cls) => (
              <li key={cls.id} className="class-selector__item">
                <h3>{cls.title}</h3>
                {cls.description && <p>{cls.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
