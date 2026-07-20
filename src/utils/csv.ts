import csv from "csv-parser";
import { Readable } from "stream";

export async function parseCSV(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const rows: Record<string, string>[] = [];

  return new Promise((resolve, reject) => {
    Readable.from(buffer)
      .pipe(csv())
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", () => {
        resolve(rows);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}
