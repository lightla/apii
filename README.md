https://ui.shadcn.com/#
https://primevue.org/
https://quasar.dev/



# RUN DEV
npm run dev

// todo:
hojc theo Path Variables cua postman cho URI Params




Phân tích:
+ RequestContainer:
- Là entry point:
    + Nhận params từ client:
        + Client Base URL (không cần, dựa vào env tự xác định)
        + Danh sách route (TH1. client dùng html set trực tiếp)
        + URL load danh sách route (TH2. client cung cấp api call để trả về json)
          + URL để lưu all request params
              + Lưu vào file hay db do client tự triển khai
              + Hành động: Ctrl + S
              + Thiết kế thêm thanh process bar (fixed)
                [All request is saving...]
- Gồm 2 component hoạt động độc lập:
    + RequestList:
        + Nhận params từ container: Danh sách route
        + Quản lý danh sách request
        + Dùng provide & inject
        + Action:
            + click 1 route -> emit cho container
            + Container chuyển clickedRoute cho editor
    + RequestEditor
        + Nhận params từ container: clickedRoute
        + Quản lý UI, thực hiện request
        + Phân tích route
          => route
          => Path Variable Names
          => 2 thông tin này dùng provide & inject

        + globalStorage(pinia):
            + Env
            + EnvVariable
              => Do độc lập, không chịu tác động của client

        + Gồm 3 thành phần:
            + EditorEnv
            + EditorUrlBar
                + Chứa icon send request:
                    + Để send được request cần:
                        + url preview (là kết quả của route + query string)
                        + headers
                        + body
            + EditorPayload
                + Chứa:
                    + ParamTab
                        + Chứa:
                            + URL Preview
                            + Path Variable (hay URI Params VD: {id})
                            + Query Params (hay query string)
                    + HeaderTab
                        + Header (key, value)
                    + BodyTab
                        + Body Content tùy loại (JSON, FILE)
            + EditorReponse
                + Chứa nội dung kết quả sau khi bấm send
                + Gồm:
                    + Json Tab
                    + Html Tab
                    + Raw Tab



🧠 Summary: Best Practice cho bạn
Use Case	Dùng Pinia	Dùng Provide/Inject
Quản lý Env, EnvVariables, config toàn cục	✅	❌
Quản lý danh sách route, clickedRoute trong RequestContainer	❌ (tạm thời)	✅
Chia sẻ giữa các component con trong Editor	❌	✅
Gửi request: cần lấy envVariable, urlPreview, headers, body	✅ (env), ✅ (inject context)	✅



1. **Dùng Interface khi:**
```txt
// 1. Plain object shapes
interface Product {
    id: string;
    name: string;
    price: number;
}

// 2. Service/Class contracts
interface PaymentGateway {
    processPayment(amount: number): Promise<void>;
}

// Dùng Interface nếu:
// - Object shape đơn giản
// - Có thể reuse ở nhiều nơi
interface PaginationParams {
    page: number;
    limit: number;
}

// Good: Basic object shape
interface User {
    id: string;
    name: string;
    email: string;
}

// Good: Service contract
interface UserService {
    getUser(id: string): Promise<User>;
    createUser(user: User): Promise<void>;
}

// Good: Configuration object
interface RequestConfig {
    timeout: number;
    retries: number;
    baseURL: string;
}
```

1. **Dùng Type khi:**
```txt
// 1. Unions
type PaymentMethod = 'credit' | 'debit' | 'cash';

// 2. Complex combinations
type CartItem = Product & {
    quantity: number;
    totalPrice: number;
}

// 3. Function params với conditions
type CheckoutParams = {
    items: CartItem[];
    method: PaymentMethod;
} & (
    | { method: 'credit'; cardNumber: string }
    | { method: 'debit'; accountId: string }
    | { method: 'cash' }
)

// Dùng Type nếu:
// - Có unions/intersections
// - Specific cho một function
// - Dùng utility types
type SortParams<T> = {
    field: keyof T;
    order: 'asc' | 'desc';
}

// Better with Type: Khi param có union
type ValidateOptions = {
    mode: 'strict' | 'loose';
    throwError?: boolean;
}

// Better with Type: Khi extend từ nhiều source
type CreateUserParams = Pick<User, 'name' | 'email'> & {
    password: string;
}

// Better with Type: Khi cần utility types
type UpdateUserParams = Partial<User> & {
    id: string; // id is required
}


// Good: Combining multiple types
type UserResponse = User & {
    token: string;
    lastLogin: Date;
}

// Good: Union types
type Status = 'pending' | 'success' | 'error';

// Good: Complex combinations
type RequestOptions = Partial<RequestConfig> & {
    headers?: Record<string, string>;
}

```