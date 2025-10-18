export interface InfoNuggetCategory {
  id: number;
  name: string;
  color_hex?: string;
  visual_value: string; // icon name from Google Fonts
}

export interface InfoNugget {
  id?: number;
  category_id: number;
  is_active: boolean;
  title?: string;
  text_content?: string;
  display_duration_ms?: number;
  priority?: number;
  start_date?: string | null;
  expiration_date?: string | null;
  publish_start_time?: string | null; // HH:MM
  publish_end_time?: string | null;   // HH:MM
  created_at?: string;
  updated_at?: string;
  Category?: Partial<InfoNuggetCategory>;
}
