import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    storeId?: string | null;
    storeSlug?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      storeId?: string | null;
      storeSlug?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    storeId?: string | null;
    storeSlug?: string | null;
  }
}
