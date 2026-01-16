import LoginFrom from "@/components/form/login";

export default async function LoginPage() {
  // Example: fetch data on the server

  return (
      <div>
            <h1 className="text-3xl font-bold text-center pt-8">User Form</h1>
            <div>
              <LoginFrom />
            </div>
          </div>
      
  );
}