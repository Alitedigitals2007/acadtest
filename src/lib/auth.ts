import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { email, password, role } = credentials as {
          email: string;
          password: string;
          role: string;
        };

        if (role === "student") {
          const student = await prisma.student.findFirst({
            where: { email },
          });
          if (!student) return null;
          const isValid = await bcrypt.compare(password, student.password);
          if (!isValid) return null;
          return {
            id: student.id,
            email: student.email,
            name: student.fullName,
            role: "student",
            organizationId: student.organizationId,
          };
        }

        if (role === "super_admin") {
          if (email === "admin@acadtest.com" && password === "Admin@123") {
            return {
              id: "super_admin",
              email: "admin@acadtest.com",
              name: "Super Admin",
              role: "super_admin",
            };
          }
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.orgAdminId || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.role = user.role;
        token.organizationId = user.organizationId;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" as const },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
