export interface ParsedCurl {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  params: Record<string, string>;
}

export function parseCurl(curlCommand: string): ParsedCurl {
  const result: ParsedCurl = {
    method: 'GET',
    url: '',
    headers: {},
    body: '',
    params: {}
  };

  // 1. Làm sạch sơ bộ (chỉ xóa xuống dòng)
  const cleanCommand = curlCommand.replace(/\\\s*\n/g, ' ').trim();

  // 2. Trích xuất URL
  const urlMatch = cleanCommand.match(/(?:['"])(https?:\/\/[^'"]+)(?:['"])|(https?:\/\/[^\s]+)/);
  if (urlMatch) {
    let fullUrl = (urlMatch[1] || urlMatch[2]);
    fullUrl = fullUrl.replace(/^['"]|['"]$/g, ''); 
    const [baseUrl, queryString] = fullUrl.split('?');
    result.url = baseUrl;

    if (queryString) {
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((value, key) => {
        result.params[key] = value;
      });
    }
  }

  // 3. Trích xuất Method
  const methodMatch = cleanCommand.match(/-X\s+(\w+)/);
  if (methodMatch) {
    result.method = methodMatch[1].toUpperCase();
  } else if (cleanCommand.includes('--data') || cleanCommand.includes('-d ') || cleanCommand.includes('--data-raw')) {
    result.method = 'POST';
  }

  // 4. Trích xuất Headers
  const headerMatches = cleanCommand.matchAll(/-H\s+['"]([^'"]+)['"]/g);
  for (const match of headerMatches) {
    const [key, ...valueParts] = match[1].split(':');
    if (key && valueParts.length > 0) {
      result.headers[key.trim()] = valueParts.join(':').trim();
    }
  }

  // 5. Trích xuất Body (Logic mới: Lấy toàn bộ nội dung trong dấu nháy)
  const bodyFlags = ['--data-raw', '--data-binary', '--data', '-d'];
  for (const flag of bodyFlags) {
    const flagIndex = cleanCommand.indexOf(flag);
    if (flagIndex !== -1) {
      const remaining = cleanCommand.substring(flagIndex + flag.length).trim();
      const quoteChar = remaining[0];
      if (quoteChar === "'" || quoteChar === '"') {
        // Tìm dấu nháy đóng tương ứng
        const closingQuoteIndex = remaining.indexOf(quoteChar, 1);
        if (closingQuoteIndex !== -1) {
          result.body = remaining.substring(1, closingQuoteIndex);
          break;
        }
      } else {
        // Nếu không có dấu nháy, lấy đến khoảng trắng tiếp theo
        result.body = remaining.split(' ')[0];
        break;
      }
    }
  }

  return result;
}

export function matchUrlPattern(currentPattern: string, pastedUrl: string): Record<string, string> | null {
  if (!currentPattern || !pastedUrl) return null;
  const regexString = currentPattern.replace(/{([^}]+)}/g, '(?<$1>[^/\\?#]+)');
  const regex = new RegExp(regexString);
  try {
    const path = pastedUrl.includes('://') ? new URL(pastedUrl).pathname : pastedUrl;
    const match = path.match(regex);
    return match?.groups || null;
  } catch {
    const match = pastedUrl.match(regex);
    return match?.groups || null;
  }
}
