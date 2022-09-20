export class TimeFormat {
  constructor(min, sec, inc) {
    this.min = min;
    this.sec = sec;
    this.mil = 0;
    this.inc = inc;
    this.current_mil = 1000 * (60 * min + sec);
  }
  print() {
    console.log(this.min, this.sec, this.mil, this.inc, this.current_mil);
  }
  printPretty() {
    const m = Math.floor(this.current_mil / 60000);
    const s = Math.floor((this.current_mil / 1000) - m);
    console.log(m + ":" + s);
  }
  updateTime(movetime) {
    this.current_mil -= movetime;
  }
}