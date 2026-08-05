export default function AppLoader({ size = 150 }) {
  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <img
        src="/logo.png"
        alt="Loading"
        style={{ width: size, height: size }}
        className="animate-logo-intro"
      />
    </div>
  );
}