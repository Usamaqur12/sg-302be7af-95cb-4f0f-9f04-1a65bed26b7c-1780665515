type FilterOp = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "ilike" | "in" | "is" | "not_is";

interface Filter {
  column: string;
  op: FilterOp;
  value: unknown;
}

interface QueryBody {
  table: string;
  operation: "select" | "insert" | "update" | "delete" | "upsert";
  columns?: string;
  filters: Filter[];
  orFilters: Array<{ columns: string[]; op: "ilike"; value: string }>;
  order: Array<{ column: string; ascending: boolean }>;
  limit?: number;
  range?: { from: number; to: number };
  single?: boolean;
  maybeSingle?: boolean;
  head?: boolean;
  count?: "exact";
  payload?: object | object[];
  onConflict?: string;
}

function normalizeLike(value: unknown) {
  return String(value).replaceAll("*", "%");
}

function dataApiUrl() {
  if (typeof window !== "undefined") return "/api/data/query";

  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.SITE_URL ||
    `http://localhost:${process.env.PORT || 3000}`;

  return new URL("/api/data/query", configuredUrl).toString();
}

class MysqlQueryBuilder {
  private body: QueryBody;

  constructor(table: string) {
    this.body = {
      table,
      operation: "select",
      filters: [],
      orFilters: [],
      order: [],
    };
  }

  select(columns = "*", options?: { count?: "exact"; head?: boolean }) {
    this.body.operation = this.body.operation === "select" ? "select" : this.body.operation;
    this.body.columns = columns;
    this.body.count = options?.count;
    this.body.head = options?.head;
    return this;
  }

  insert(payload: QueryBody["payload"]) {
    this.body.operation = "insert";
    this.body.payload = payload;
    return this;
  }

  update(payload: object) {
    this.body.operation = "update";
    this.body.payload = payload;
    return this;
  }

  upsert(payload: QueryBody["payload"], options?: { onConflict?: string }) {
    this.body.operation = "upsert";
    this.body.payload = payload;
    this.body.onConflict = options?.onConflict;
    return this;
  }

  delete() {
    this.body.operation = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.body.filters.push({ column, op: "eq", value });
    return this;
  }

  neq(column: string, value: unknown) {
    this.body.filters.push({ column, op: "neq", value });
    return this;
  }

  gt(column: string, value: unknown) {
    this.body.filters.push({ column, op: "gt", value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.body.filters.push({ column, op: "gte", value });
    return this;
  }

  lt(column: string, value: unknown) {
    this.body.filters.push({ column, op: "lt", value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.body.filters.push({ column, op: "lte", value });
    return this;
  }

  ilike(column: string, value: unknown) {
    this.body.filters.push({ column, op: "ilike", value: normalizeLike(value) });
    return this;
  }

  textSearch(column: string, value: unknown, _options?: object) {
    void _options;
    return this.ilike(column, `%${value}%`);
  }

  in(column: string, value: unknown[]) {
    this.body.filters.push({ column, op: "in", value });
    return this;
  }

  is(column: string, value: unknown) {
    this.body.filters.push({ column, op: "is", value });
    return this;
  }

  not(column: string, operator: string, value: unknown) {
    if (operator === "is") {
      this.body.filters.push({ column, op: "not_is", value });
    }
    return this;
  }

  or(expression: string) {
    const parts = expression.split(",");
    const columns: string[] = [];
    let value = "";

    for (const part of parts) {
      const match = part.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.ilike\.(.+)$/);
      if (match) {
        columns.push(match[1]);
        value = normalizeLike(match[2]);
      }
    }

    if (columns.length && value) {
      this.body.orFilters.push({ columns, op: "ilike", value });
    }
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.body.order.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(limit: number) {
    this.body.limit = limit;
    return this;
  }

  range(from: number, to: number) {
    this.body.range = { from, to };
    return this;
  }

  single() {
    this.body.single = true;
    return this;
  }

  maybeSingle() {
    this.body.maybeSingle = true;
    return this;
  }

  async execute() {
    const response = await fetch(dataApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(this.body),
    });
    const payload = await response.json().catch(() => ({ data: null, error: { message: "Request failed" } }));
    return {
      data: payload.data ?? null,
      error: payload.error ?? null,
      count: payload.count ?? null,
    };
  }

  then<TResult1 = Awaited<ReturnType<MysqlQueryBuilder["execute"]>>, TResult2 = never>(
    onfulfilled?: ((value: Awaited<ReturnType<MysqlQueryBuilder["execute"]>>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

export const isSupabaseConfigured = true;

export const supabase = {
  from(table: string) {
    return new MysqlQueryBuilder(table);
  },
  rpc(name: string, params: Record<string, unknown>) {
    if (name === "search_products") {
      return new MysqlQueryBuilder("products")
        .select("*")
        .or(`title.ilike.%${params.search_query}%,description.ilike.%${params.search_query}%`)
        .eq("status", "approved")
        .limit(100);
    }
    return new MysqlQueryBuilder("products").select("*").limit(0);
  },
  auth: {
    async getSession() {
      const response = await fetch("/api/auth/session", { credentials: "include" });
      const payload = await response.json().catch(() => ({ user: null }));
      return { data: { session: payload.user ? { user: payload.user, access_token: "" } : null }, error: null };
    },
    async getUser() {
      const response = await fetch("/api/auth/session", { credentials: "include" });
      const payload = await response.json().catch(() => ({ user: null }));
      return { data: { user: payload.user || null }, error: null };
    },
    async signOut() {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      return { error: null };
    },
    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { full_name?: string; phone?: string } } }) {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          name: options?.data?.full_name || "Customer",
          phone: options?.data?.phone,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      return {
        data: { user: payload.success ? { email } : null, session: null },
        error: response.ok ? null : new Error(payload.error || payload.message || "Registration failed"),
      };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));
      return {
        data: { user: payload.user || null, session: payload.user ? { user: payload.user, access_token: "" } : null },
        error: response.ok ? null : new Error(payload.error || "Login failed"),
      };
    },
    async signInWithOAuth(_options?: object) {
      void _options;
      return {
        data: null,
        error: new Error("OAuth is not configured for the cPanel MySQL auth backend"),
      };
    },
    async updateUser(_payload?: object) {
      void _payload;
      return {
        data: { user: null },
        error: new Error("Profile password update requires the cPanel account API"),
      };
    },
    async resetPasswordForEmail(..._args: unknown[]) {
      void _args;
      return { error: new Error("Password reset requires email setup on cPanel") };
    },
  },
};
