import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../utils/apiClient";

const noop = () => {};

const normaliseClasses = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const id = "id" in item ? item.id : undefined;
      const name = "name" in item ? item.name : undefined;
      const categoryId =
        "categoryId" in item ? item.categoryId : "category_id" in item ? item.category_id : undefined;

      if (id == null || name == null) {
        return null;
      }

      return {
        id: typeof id === "number" ? id : Number(id),
        name: typeof name === "string" ? name : String(name),
        categoryId: categoryId ?? null,
      };
    })
    .filter((value) => value !== null);
};

const toOptionValue = (value) => {
  if (value == null) {
    return "";
  }

  return typeof value === "number" ? String(value) : String(value ?? "");
};

const ClassSelector = ({
  value,
  onChange = noop,
  className = "",
  selectedCategory = "",
}) => {
  const [classes, setClasses] = useState([]);
  const [internalValue, setInternalValue] = useState("");

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const url = selectedCategory
          ? `/api/classes?category_id=${selectedCategory}`
          : "/api/classes";
        const data = await apiFetch(url);
        console.log("📦 불러온 수업 목록:", data);
        const nextClasses = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.classes)
          ? data.classes
          : [];
        setClasses(nextClasses);
      } catch (error) {
        console.error("❌ 수업 목록 오류:", error);
        setClasses([]);
      }
    };
    fetchClasses();
  }, [selectedCategory]);

  useEffect(() => {
    setInternalValue(toOptionValue(value));
  }, [value]);

  const handleChange = (event) => {
    const nextValue = event.target.value;
    setInternalValue(nextValue);
    onChange(nextValue);
  };

  const options = useMemo(() => normaliseClasses(classes), [classes]);

  const selectedClassId = internalValue;

  return (
    <select
      className={className}
      value={selectedClassId}
      onChange={handleChange}
    >
      <option value="">수업을 선택하세요</option>
      {options.length > 0 ? (
        options.map((cls) => (
          <option key={cls.id} value={String(cls.id)}>
            {cls.name}
          </option>
        ))
      ) : (
        <option disabled>수업이 없습니다</option>
      )}
    </select>
  );
};

export default ClassSelector;
