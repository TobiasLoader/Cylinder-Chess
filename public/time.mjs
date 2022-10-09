export class TimeFormat {
  constructor(unlimited, min, sec, inc) {
    this.unlimited = unlimited;
    this.min = (min === undefined) ? 0 : min;
    this.sec = (sec === undefined) ? 0 : sec;
    this.mil = 0;
    this.inc = (inc === undefined) ? 0 : inc;
    this.current_mil = 1000 * (60 * min + sec);
  }
}


export function printTimeFormat(t) {
  if (t.unlimited) console.log('unlimited')
  else {
    console.log(t.min, t.sec, t.mil, t.inc, t.current_mil);
  }
}

export function strPrettyTimeFormat(t) {
  if (t.unlimited) return 'unlimited';
  const m = Math.floor(t.current_mil / 60000);
  const strs = (Math.round((t.current_mil / 1000) % 60)/1000).toFixed(3).toString()
  const s = strs.substring(strs.length-2,strs.length);
  return m.toString() + ":" + s.toString();
}

export function updateTimeTimeFormat(t, move_time) {
  if (t.unlimited==false) t.current_mil -= move_time;
  return t;
}

export function updateAfterMove(t, move_time) {
  if (t.unlimited==false) t.current_mil += 1000*t.inc - move_time;
  return t;
}