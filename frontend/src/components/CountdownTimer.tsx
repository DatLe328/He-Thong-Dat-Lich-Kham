import { useEffect, useState } from "react";

type Props = {
  expiresAt: string;
  onExpire?: () => void;
};

function CountdownTimer({ expiresAt, onExpire }: Props) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const expireTime = new Date(expiresAt).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = Math.floor((expireTime - now) / 1000);

      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        onExpire && onExpire();
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="countdown">
      ⏳ {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  );
}

export default CountdownTimer;