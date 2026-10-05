const Loading = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`${className || "min-h-screen"} flex items-center justify-center`}>
      <div className="loader">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
};

export default Loading;
