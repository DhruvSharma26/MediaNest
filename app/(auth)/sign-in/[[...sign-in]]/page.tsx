import { SignIn } from "@clerk/nextjs"; // Import the Clerk sign-in component

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="p-8 bg-white shadow-xl rounded-xl">
        <SignIn />
      </div>
    </div>
  );
}
