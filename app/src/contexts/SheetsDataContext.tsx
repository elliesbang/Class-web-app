// app/src/contexts/SheetsDataContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

type VodCategory = {
  id: number;
  name: string;
  parent_id: number | null;
};

type VodVideo = {
  id: number;
  title: string;
  url: string;
  category_id: number;
  description?: string;
  isRecommended?: boolean;
};

type GlobalNotice = {
  id: number;
  title: string;
  content: string;
  isVisible: boolean;
};

type SheetsContextType = {
  vodCategories: VodCategory[];
  vodVideos: VodVideo[];
  globalNotices: GlobalNotice[];
  loading: boolean;
};

const SheetsDataContext = createContext<SheetsContextType>({
  vodCategories: [],
  vodVideos: [],
  globalNotices: [],
  loading: true,
});

export const SheetsDataProvider = ({ children }: { children: ReactNode }) => {
  const [vodCategories, setVodCategories] = useState<VodCategory[]>([]);
  const [vodVideos, setVodVideos] = useState<VodVideo[]>([]);
  const [globalNotices, setGlobalNotices] = useState<GlobalNotice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);

      const { data: categoriesData } = await supabase
        .from("vod_category")
        .select("*")
        .order("id");

      const { data: videosData } = await supabase
        .from("vod_videos")
        .select("*")
        .order("id");

      const { data: noticesData } = await supabase
        .from("notifications")
        .select("*")
        .eq("type", "global");

      setVodCategories(categoriesData || []);
      setVodVideos(videosData || []);
      setGlobalNotices(
        (noticesData || []).map((n: any) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          isVisible: n.is_visible,
        }))
      );

      setLoading(false);
    };

    loadAll();
  }, []);

  return (
    <SheetsDataContext.Provider
      value={{ vodCategories, vodVideos, globalNotices, loading }}
    >
      {children}
    </SheetsDataContext.Provider>
  );
};

export const useSheetsData = () => useContext(SheetsDataContext);
