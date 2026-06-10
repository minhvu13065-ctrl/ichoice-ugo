import vi from "../../messages/vi.json";
import en from "../../messages/en.json";

type Messages = typeof vi;
type Lang = "vi" | "en";

const messages: Record<Lang, Messages> = { vi, en };

export function useTranslations(lang: Lang) {
  const dict = messages[lang] ?? messages.vi;

  return function t(key: string): string {
    const parts = key.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let val: any = dict;
    for (const part of parts) {
      val = val?.[part];
    }
    return typeof val === "string" ? val : key;
  };
}
