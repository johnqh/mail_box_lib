/**
 * Utility functions for handling email attachments
 */

/**
 * Convert a File object to a Base64-encoded attachment
 * Uses chunking to avoid stack overflow with large files
 *
 * @param file - The file to convert
 * @returns Promise with filename, base64 content, and content type
 */
export async function convertFileToBase64Attachment(file: File): Promise<{
  filename: string;
  content: string;
  contentType: string;
}> {
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  // Process in chunks to avoid stack overflow with large files
  let binaryString = '';
  const chunkSize = 8192; // Process 8KB at a time
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(
      i,
      Math.min(i + chunkSize, uint8Array.length)
    );
    binaryString += String.fromCharCode(...chunk);
  }

  // btoa is a browser global for base64 encoding
  // eslint-disable-next-line no-undef
  const base64 = btoa(binaryString);
  return {
    filename: file.name,
    content: base64,
    contentType: file.type || 'application/octet-stream',
  };
}

/**
 * Convert multiple File objects to Base64-encoded attachments
 *
 * @param files - Array of files to convert
 * @returns Promise with array of Base64-encoded attachments
 */
export async function convertFilesToBase64Attachments(
  files: File[]
): Promise<Array<{ filename: string; content: string; contentType: string }>> {
  return Promise.all(files.map(file => convertFileToBase64Attachment(file)));
}
