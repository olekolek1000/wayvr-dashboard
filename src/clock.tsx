import { useEffect, useState } from "preact/hooks";
import style from "./app.module.scss"

function getTimeString() {
  let date = new Date();
  let options = {
    hour: "2-digit", minute: "2-digit"
  };

  return date.toLocaleTimeString("en-us", options as any)
}

export function Clock({ }: {}) {
  const [time, setTime] = useState(getTimeString());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeString());
    }, 60000 /* roughly every minute */);

    return () => {
      clearInterval(interval);
    }
  }, []);

  return <div className={style.clock}>
    {time}
  </div>
}