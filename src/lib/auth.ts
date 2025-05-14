import { NextAuthOptions, Session } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { supabase } from "./supabase"
import { getUserByEmail } from "./auth-helpers"
import { ensureUuid } from "./utils"
import { createClient } from '@supabase/supabase-js'
import type { User } from '@/types/next-auth'
import { getToken } from "next-auth/jwt"

// Mark as dynamic to avoid build issues
export const dynamic = 'force-dynamic'

declare module "next-auth" {
  interface Session {
    authenticated?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development', // Enable debug in development mode
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth",
    error: "/auth/error",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
          redirect_uri: process.env.NEXTAUTH_URL + "/api/auth/callback/google"
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        console.log("Credentials authorize called with email:", credentials.email);

        try {
          // First check if user exists in our database
          const dbUser = await getUserByEmail(credentials.email);

          if (!dbUser) {
            console.log("User not found in database:", credentials.email);
          } else {
            console.log("User found in database:", dbUser.id);
          }

          // Use Supabase Auth for authentication
          console.log("Attempting Supabase auth with email:", credentials.email);

          const { data: { user, session }, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error) {
            console.error("Supabase auth error:", error?.message);
            throw new Error(error?.message || "Invalid email or password");
          }

          if (!user) {
            console.error("No user returned from Supabase auth");
            throw new Error("Invalid email or password");
          }

          console.log("Supabase auth successful, user:", user.id);

          // Make sure we use a proper UUID
          const properUuid = ensureUuid(user.id);
          console.log("Proper UUID:", properUuid);

          // Check if user exists in our database
          let userData = dbUser;

          // If user doesn't exist in our database, create it
          if (!userData) {
            console.log("Creating user in database with ID:", properUuid);

            try {
              // Create user in our database
              const { data: newUser, error: createError } = await supabase
                .from("User")
                .insert({
                  id: properUuid,
                  email: user.email || credentials.email,
                  name: user.user_metadata?.name || credentials.email.split('@')[0],
                  image: user.user_metadata?.image,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                })
                .select()
                .single();

              if (createError) {
                console.error("Failed to create user:", createError);
                // Try to fetch the user - it might exist but the insert failed
                const { data: existingUser } = await supabase
                  .from("User")
                  .select("*")
                  .eq("email", credentials.email)
                  .single();

                if (existingUser) {
                  userData = existingUser;
                } else {
                  throw new Error("Failed to create user profile");
                }
              } else {
                userData = newUser;
              }
            } catch (err) {
              console.error("Error creating user:", err);
              throw new Error("Failed to create user profile");
            }
          }

          console.log("Auth successful, returning user:", userData.id);

          return {
            id: properUuid,
            email: userData.email,
            name: userData.name,
            image: userData.image,
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          throw new Error(error.message || "Authentication failed");
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user?.email) {
        console.error("No email provided");
        return false;
      }

      try {
        // Always ensure we use proper UUIDs
        if (user.id) {
          user.id = ensureUuid(user.id);
        }

        // If using OAuth, create user in our database
        if (account?.provider === 'google') {
          // First check if user exists in our database
          let dbUser = await getUserByEmail(user.email);


          if (!dbUser) {
            // Create UUID from user.id
            const properUuid = ensureUuid(user.id);

            // Check if any existing User has this email
            const { data: existingUserData } = await supabase
              .from("User")
              .select("id")
              .eq("email", user.email)
              .single();

            if (existingUserData) {
              // Update existing user with new data
              await supabase
                .from("User")
                .update({
                  name: user.name,
                  image: user.image,
                  updatedAt: new Date().toISOString()
                })
                .eq("id", existingUserData.id);

              return true;
            }

            // Create user with proper UUID format
            const { data: newUser, error: createError } = await supabase
              .from("User")
              .insert({
                id: properUuid,
                email: user.email,
                name: user.name,
                image: user.image,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              })
              .select()
              .single();

            if (createError) {
              console.error("Failed to create user:", createError);
              return false;
            }
          }
        }

        return true;
      } catch (error) {
        console.error('Error during sign in:', error);
        return false;
      }
    },
    async session({ session, token }) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data } = await supabase
        .from('User')
        .select('*')
        .eq('id', token.sub)
        .single()

      // Ensure the session object is properly structured
      if (!session.user) {
        session.user = { id: "" };
      }

      // Ensure we use proper UUID format for the ID
      if (token.sub) {
        session.user.id = ensureUuid(token.sub);
      } else if (token.id) {
        session.user.id = ensureUuid(token.id as string);
      }

      // Set user properties from database or token
      session.user = {
        id: session.user.id,
        email: data?.email || token.email as string,
        name: data?.name || token.name as string,
        image: data?.image || token.picture as string
      };

      // Add validation timestamp and authentication flag
      session.expires = token.exp ? new Date(Number(token.exp) * 1000).toISOString() : "";
      session.authenticated = true;

      console.log("Session callback completed, session:", 
        JSON.stringify({
          userId: session.user?.id,
          authenticated: session.authenticated,
          expires: session.expires
        })
      );

      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // Save the user info to the token
        token.id = ensureUuid(user.id);
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        // Set a proper expiration time (30 minutes)
        const SESSION_MAX_AGE = 30 * 60 
        token.exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
        console.log("JWT created with expiration:", new Date(Number(token.exp) * 1000).toISOString());
      } else if (token.exp) {
        // If token exists but no user data was passed, check expiration
        const expiresAt = token.exp as number;
        const now = Math.floor(Date.now() / 1000);

        if (now > expiresAt) {
          // Token has expired, clear it
          console.log("Token expired, clearing token data");
          token = {
            ...token,
            exp: undefined,
            id: undefined,
            email: undefined,
            name: undefined,
            picture: undefined
          };
        } else {
          // Token is still valid, log remaining time
          const remainingTimeMinutes = Math.floor((expiresAt - now) / 60);
          console.log(`JWT token still valid for ${remainingTimeMinutes} minutes`);
        }
      }

      if (account) {
        token.provider = account.provider;
      }

      return token;
    },
  },
}