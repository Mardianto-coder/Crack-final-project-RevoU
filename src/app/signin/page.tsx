import { signIn } from "@/lib/auth";

export default function SignInPage() {
  return (
    <div className="max-w-sm mx-auto bg-white border rounded-xl p-4">
      <h1 className="text-xl font-semibold mb-2">Sign in</h1>
      <form action={async (formData) => {
        "use server";
        await signIn("credentials", {
          redirectTo: (formData.get("callbackUrl") as string) || "/"
        });
      }}>
        <input className="hidden" name="callbackUrl" />
        <div className="grid gap-2">
          <label className="text-sm">Email</label>
          <input name="email" type="email" required className="border rounded p-2" defaultValue="student@example.com" />
          <label className="text-sm">Password</label>
          <input name="password" type="password" required className="border rounded p-2" defaultValue="password" />
        </div>
        <button className="mt-3 w-full bg-gray-900 text-white rounded p-2">Continue</button>
        <p className="text-xs text-gray-500 mt-2">Demo users are seeded: student@example.com / instructor@example.com (password: password)</p>
      </form>
    </div>
  );
}
