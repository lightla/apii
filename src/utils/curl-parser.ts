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

  // 1. Làm sạch command: xóa dấu xuyệt xuống dòng và các khoảng trắng dư thừa
  const cleanCommand = curlCommand.replace(/\\\n/g, ' ').replace(/\s+/g, ' ').trim();

  // 2. Trích xuất URL (Tìm chuỗi bắt đầu bằng http và nằm trong hoặc ngoài ngoặc)
  const urlMatch = cleanCommand.match(/(?:['"])(https?:\/\/[^'"]+)(?:['"])|(https?:\/\/[^\s]+)/);
  if (urlMatch) {
    const fullUrl = (urlMatch[1] || urlMatch[2]).replace(/['"]$/, ''); // Xóa dấu nháy thừa ở cuối nếu có
    const [baseUrl, queryString] = fullUrl.split('?');
    result.url = baseUrl;

    // Parse Query Params
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

  // 5. Trích xuất Body
  const bodyMatch = cleanCommand.match(/(?:--data|--data-raw|-d)\s+['"]?({[\s\S]+?}|[^'"]+)['"]?/);
  if (bodyMatch) {
    result.body = bodyMatch[1].replace(/^'|'$/g, ''); // Xóa dấu nháy bao quanh body
  }

  return result;
}

export function matchUrlPattern(currentPattern: string, pastedUrl: string): Record<string, string> | null {
  if (!currentPattern || !pastedUrl) return null;

  // Tạo regex từ pattern (ví dụ: {id} -> ([^/]+))
  const regexString = currentPattern.replace(/{([^}]+)}/g, '(?<$1>[^/\\?#]+)');
  const regex = new RegExp(regexString);

  // Thử khớp phần path của URL
  try {
    const path = pastedUrl.includes('://') ? new URL(pastedUrl).pathname : pastedUrl;
    const match = path.match(regex);
    return match?.groups || null;
  } catch {
    const match = pastedUrl.match(regex);
    return match?.groups || null;
  }
}
