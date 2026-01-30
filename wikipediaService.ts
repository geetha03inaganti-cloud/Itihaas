
import { WikiImage } from './types';

export const WikipediaService = {
  async searchHeritagePlaces(query: string = "Heritage sites in Andhra Pradesh"): Promise<string[]> {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const response = await fetch(url);
    const data = await response.json();
    return data.query.search.map((s: any) => s.title);
  },

  async getPlaceImages(title: string): Promise<WikiImage[]> {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&format=json&origin=*`;
    const response = await fetch(url);
    const data = await response.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const images = pages[pageId].images || [];
    
    const imageUrls: WikiImage[] = [];
    for (const img of images.slice(0, 5)) {
      const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(img.title)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
      const imgRes = await fetch(imgUrl);
      const imgData = await imgRes.json();
      const imgPages = imgData.query.pages;
      const imgPageId = Object.keys(imgPages)[0];
      const url = imgPages[imgPageId].imageinfo?.[0]?.url;
      if (url && !url.endsWith('.svg')) {
        imageUrls.push({ url, caption: img.title.replace('File:', '') });
      }
    }
    return imageUrls;
  },

  async getSummary(title: string): Promise<string> {
    const url = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(title)}&format=json&origin=*`;
    const response = await fetch(url);
    const data = await response.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    return pages[pageId].extract || "";
  }
};
