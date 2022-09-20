export class TimeFormat {
  constructor(min, sec, inc) {
    this.min = min;
    this.sec = sec;
    this.mil = 0;
    this.inc = inc;
    this.current_mil = 1000 * (60 * min + sec);
  }
}

export function printTimeFormat(t) {
  console.log(t);
  console.log(t.min, t.sec, t.mil, t.inc, t.current_mil);
}

export function printPrettyTimeFormat(t) {
  const m = Math.floor(t.current_mil / 60000);
  const s = Math.floor((t.current_mil / 1000) % 60);
  console.log(m + ":" + s);
}

export function updateTimeTimeFormat(t, move_time) {
  t.current_mil -= move_time;
  return t;
}