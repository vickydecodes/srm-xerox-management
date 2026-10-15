export default function AppLoader({ size = 500 }) {
  return (
    <div className="flex items-center justify-center h-screen w-screen">
      <img
        src="/final_logo.svg"
        alt="Loading"
        className="w-[500px] h-auto object-contain animate-logo-intro"
      />
    </div>
  );
}