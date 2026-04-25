import { useEffect } from "react";

export default function Toast({ message, onClose }: any) {
  useEffect(() => {
    const t = setTimeout(onClose, 2000);
    return () => clearTimeout(t);
  }, []);

  return <div className="toast">{message}</div>;
}