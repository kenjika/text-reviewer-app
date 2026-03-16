import Papa from "papaparse";

export type CsvItem = {
  id: string;
  title: string;
  content: string;
};

const REQUIRED_HEADERS = ["ID", "Title", "Content"] as const;

export function parseItemsCsv(csvText: string): CsvItem[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    throw new Error(`CSVの読み込みに失敗しました: ${parsed.errors[0].message}`);
  }

  const fields = parsed.meta.fields?.map((field) => field.trim()) ?? [];
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !fields.includes(header));

  if (missingHeaders.length > 0) {
    throw new Error(
      `CSVヘッダーに必須カラムが不足しています: ${missingHeaders.join(", ")}`,
    );
  }

  return parsed.data.map((row, index) => {
    const id = (row.ID ?? "").trim();
    const title = (row.Title ?? "").trim();
    const content = (row.Content ?? "").trim();

    if (!id || !title || !content) {
      throw new Error(`${index + 2}行目に空の値があります (ID, Title, Content は必須です)`);
    }

    return {
      id,
      title,
      content,
    };
  });
}
