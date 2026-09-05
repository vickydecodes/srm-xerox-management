export default function AppLoader({ size = 150 }) {
  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <img
        src="/logo1.png"
        alt="Loading"
        style={{ width: size, height: 180 }}
        className="animate-logo-intro"
      />
    </div>
  );
}