import { useNavigate } from 'react-router-dom';

export default function AdminLoginPage() {

  const navigate = useNavigate();

  const handleLogin = (e) => {

    e.preventDefault();

    const username = e.target.username.value;
    const password = e.target.password.value;

    // Hardcoded Admin Login
    if (username === 'admin' && password === 'jeduthun123') {

      alert('Login Successful');

      // Navigate to products page
      navigate('/products');

    } else {

      alert('Invalid Username or Password');

    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-[#111] border border-yellow-700 rounded-3xl shadow-2xl p-8">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="https://jeduthun.onrender.com/public/logo.png"
            alt="Logo"
            className="w-24 h-24 object-contain"
          />
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-center text-yellow-500 mb-2 tracking-wide">
          Admin Login
        </h1>

        <p className="text-center text-gray-400 mb-8 text-sm">
          Jeduthun Musicals Billing System
        </p>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="block text-yellow-500 mb-2 text-sm font-semibold">
              Username
            </label>

            <input
              type="text"
              name="username"
              placeholder="Enter Username"
              className="w-full bg-black border border-yellow-700 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>

          <div>
            <label className="block text-yellow-500 mb-2 text-sm font-semibold">
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Enter Password"
              className="w-full bg-black border border-yellow-700 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded-xl transition duration-300 shadow-lg"
          >
            Login
          </button>

        </form>

      </div>

    </div>
  );
}