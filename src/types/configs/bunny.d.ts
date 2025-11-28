export interface BunnyMdData {
  id: string;
  title: string;
  file: string;
  icon: string;
  excerpt: string;
  link?: string;
}

export interface BunnyData {
  id: string;
  title: string;
  icon: string;
  md: BunnyMdData[];
}
