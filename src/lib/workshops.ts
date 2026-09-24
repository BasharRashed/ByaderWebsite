import coffeeImage from "@/assets/workshop-coffee.jpg";
import calligraphyImage from "@/assets/workshop-calligraphy.jpg";
import photographyImage from "@/assets/workshop-photography.jpg";

export type Workshop = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  description: string;
  day: string;
  time: string;
  duration: string;
  capacity: number;
  reserved: number;
  remaining: number;
  isFull: boolean;
  isCompleted: boolean;
  host: string;
  image: string;
};

/** Maps the image_key stored in the database to a bundled local asset. */
const workshopImages: Record<string, string> = {
  coffee: coffeeImage,
  calligraphy: calligraphyImage,
  photography: photographyImage,
};

export function resolveWorkshopImage(imageKey: string): string {
  if (imageKey.startsWith("http://") || imageKey.startsWith("https://")) return imageKey;
  return workshopImages[imageKey] ?? coffeeImage;
}
