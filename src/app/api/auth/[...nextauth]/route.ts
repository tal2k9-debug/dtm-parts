import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "שם משתמש", type: "text" },
        password: { label: "סיסמה", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            return null;
          }

          // Update lastLogin
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email || undefined,
            role: user.role,
            username: user.username,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // Check if user exists by email
          const existingUser = await prisma.user.findFirst({
            where: { email: user.email || "" },
          });

          if (!existingUser) {
            // Create new user from Google account
            await prisma.user.create({
              data: {
                username: user.email || `google_${user.id}`,
                passwordHash: "", // No password for Google users
                name: user.name || "משתמש Google",
                phone: "",
                email: user.email || "",
                role: "CUSTOMER",
                businessType: "private",
              },
            });
          } else {
            // Update lastLogin
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { lastLogin: new Date() },
            });
          }
        } catch (error) {
          console.error("Google sign-in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google") {
        // Fetch the DB user to get role and id
        const dbUser = await prisma.user.findFirst({
          where: { email: token.email || "" },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.id = dbUser.id;
          token.username = dbUser.username;
        }
      } else if (user) {
        token.role = (user as unknown as Record<string, unknown>).role;
        token.id = user.id;
        token.username = (user as unknown as Record<string, unknown>).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).username = token.username;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
