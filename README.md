
# RUN DEV
npm run dev

// todo:
hojc theo Path Variables cua postman cho URI Params



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